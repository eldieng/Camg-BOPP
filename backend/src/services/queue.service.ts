import prisma from '../lib/prisma.js';
import { Station, QueueStatus, QueueEntry, TicketStatus, Priority } from '@prisma/client';

// Ordre de priorité (plus petit = plus prioritaire)
const PRIORITY_ORDER: Record<Priority, number> = {
  EMERGENCY: 1,
  DISABLED: 2,
  PREGNANT: 3,
  ELDERLY: 4,
  NORMAL: 5,
};

export interface QueueEntryWithDetails extends QueueEntry {
  ticket: {
    id: string;
    ticketNumber: string;
    priority: string;
    status: TicketStatus;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      dateOfBirth: Date;
    };
  };
}

export interface StationStats {
  station: Station;
  waiting: number;
  inService: number;
  completed: number;
  avgWaitTime: number;
}

export class QueueService {
  /**
   * Récupérer la file d'attente d'une station
   */
  async getQueueByStation(station: Station): Promise<QueueEntryWithDetails[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    const entries = await prisma.queueEntry.findMany({
      where: {
        station,
        createdAt: { gte: startOfDay },
        status: { in: ['WAITING', 'CALLED', 'IN_SERVICE'] },
      },
      include: {
        ticket: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
              },
            },
          },
        },
      },
    });

    // Tri personnalisé: statut (IN_SERVICE > CALLED > WAITING), puis priorité, puis position, puis numéro de ticket
    const statusOrder: Record<QueueStatus, number> = { IN_SERVICE: 1, CALLED: 2, WAITING: 3, COMPLETED: 4, SKIPPED: 5 };
    entries.sort((a, b) => {
      if (statusOrder[a.status] !== statusOrder[b.status]) return statusOrder[a.status] - statusOrder[b.status];
      const priorityA = PRIORITY_ORDER[a.ticket.priority as Priority] || 5;
      const priorityB = PRIORITY_ORDER[b.ticket.priority as Priority] || 5;
      if (priorityA !== priorityB) return priorityA - priorityB;
      if (a.position !== b.position) return a.position - b.position;
      // En dernier recours, trier par numéro de ticket
      return a.ticket.ticketNumber.localeCompare(b.ticket.ticketNumber);
    });

    return entries as QueueEntryWithDetails[];
  }

  /**
   * Appeler le prochain patient
   * @param roomNumber - Numéro de salle spécifique (pour CONSULTATION)
   */
  async callNext(station: Station, userId: string, roomNumber?: number): Promise<QueueEntryWithDetails | null> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    // Trouver tous les patients en attente et trier par priorité
    const waitingEntries = await prisma.queueEntry.findMany({
      where: {
        station,
        status: 'WAITING',
        createdAt: { gte: startOfDay },
      },
      include: {
        ticket: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
              },
            },
          },
        },
      },
    });

    // Trier par priorité puis par position puis par numéro de ticket
    waitingEntries.sort((a, b) => {
      const priorityA = PRIORITY_ORDER[a.ticket.priority as Priority] || 5;
      const priorityB = PRIORITY_ORDER[b.ticket.priority as Priority] || 5;
      if (priorityA !== priorityB) return priorityA - priorityB;
      if (a.position !== b.position) return a.position - b.position;
      // En dernier recours, trier par numéro de ticket
      return a.ticket.ticketNumber.localeCompare(b.ticket.ticketNumber);
    });

    const nextEntry = waitingEntries[0] || null;

    if (!nextEntry) return null;

    // Pour la station CONSULTATION, utiliser le numéro de salle fourni ou assigner automatiquement
    let assignedRoom: number | null = null;
    if (station === 'CONSULTATION') {
      assignedRoom = roomNumber || await this.getLeastBusyRoomNumber();
    }

    // Mettre à jour le statut
    const updated = await prisma.queueEntry.update({
      where: { id: nextEntry.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
        roomNumber: assignedRoom,
      },
      include: {
        ticket: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
              },
            },
          },
        },
      },
    });

    return updated as QueueEntryWithDetails;
  }

  /**
   * Démarrer le service pour un patient
   */
  async startService(entryId: string, _userId: string): Promise<QueueEntryWithDetails> {
    const entry = await prisma.queueEntry.update({
      where: { id: entryId },
      data: {
        status: 'IN_SERVICE',
        startedAt: new Date(),
      },
      include: {
        ticket: {
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                dateOfBirth: true,
              },
            },
          },
        },
      },
    });

    // Mettre à jour le statut du ticket
    await prisma.ticket.update({
      where: { id: entry.ticketId },
      data: { status: 'IN_PROGRESS' },
    });

    return entry as QueueEntryWithDetails;
  }

  /**
   * Terminer le service et transférer vers la prochaine station
   */
  async completeService(entryId: string, nextStation?: Station): Promise<QueueEntryWithDetails> {
    const entry = await prisma.queueEntry.findUnique({
      where: { id: entryId },
      include: { ticket: true },
    });

    if (!entry) throw new Error('Entrée non trouvée');

    // Si une prochaine station est spécifiée, transférer l'entrée
    if (nextStation) {
      const position = await this.getNextPosition(nextStation);
      
      // Mettre à jour l'entrée existante pour la nouvelle station
      const updatedEntry = await prisma.queueEntry.update({
        where: { id: entryId },
        data: {
          station: nextStation,
          position,
          status: 'WAITING',
          calledAt: null,
          startedAt: null,
          completedAt: null,
        },
        include: {
          ticket: {
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true,
                },
              },
            },
          },
        },
      });

      return updatedEntry as QueueEntryWithDetails;
    } else {
      // Pas de prochaine station = ticket terminé
      await prisma.queueEntry.update({
        where: { id: entryId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      await prisma.ticket.update({
        where: { id: entry.ticketId },
        data: { status: 'COMPLETED' },
      });

      return prisma.queueEntry.findUnique({
        where: { id: entryId },
        include: {
          ticket: {
            include: {
              patient: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  dateOfBirth: true,
                },
              },
            },
          },
        },
      }) as Promise<QueueEntryWithDetails>;
    }
  }

  /**
   * Marquer un patient comme absent (no-show)
   */
  async markNoShow(entryId: string): Promise<QueueEntry> {
    const entry = await prisma.queueEntry.update({
      where: { id: entryId },
      data: { status: 'SKIPPED' },
    });

    await prisma.ticket.update({
      where: { id: entry.ticketId },
      data: { status: 'NO_SHOW' },
    });

    return entry;
  }

  /**
   * Obtenir la prochaine position pour une station
   */
  private async getNextPosition(station: Station): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    const count = await prisma.queueEntry.count({
      where: {
        station,
        createdAt: { gte: startOfDay },
      },
    });

    return count + 1;
  }

  /**
   * Trouver le numéro de salle de consultation la moins chargée (1 ou 2)
   */
  async getLeastBusyRoomNumber(): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    const [inRoom1, inRoom2] = await Promise.all([
      prisma.queueEntry.count({
        where: { 
          station: 'CONSULTATION' as Station, 
          roomNumber: 1,
          status: { in: ['CALLED', 'IN_SERVICE'] }, 
          createdAt: { gte: startOfDay } 
        },
      }),
      prisma.queueEntry.count({
        where: { 
          station: 'CONSULTATION' as Station, 
          roomNumber: 2,
          status: { in: ['CALLED', 'IN_SERVICE'] }, 
          createdAt: { gte: startOfDay } 
        },
      }),
    ]);

    // Retourner la salle avec le moins de patients en cours
    return inRoom1 <= inRoom2 ? 1 : 2;
  }

  /**
   * Statistiques d'une station
   */
  async getStationStats(station: Station): Promise<StationStats> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    const dateFilter = { station, createdAt: { gte: startOfDay } };

    const [waiting, inService, completed] = await Promise.all([
      prisma.queueEntry.count({ where: { ...dateFilter, status: 'WAITING' } }),
      prisma.queueEntry.count({ where: { ...dateFilter, status: 'IN_SERVICE' } }),
      prisma.queueEntry.count({ where: { ...dateFilter, status: 'COMPLETED' } }),
    ]);

    // Calculer le temps d'attente moyen
    const completedEntries = await prisma.queueEntry.findMany({
      where: { ...dateFilter, status: 'COMPLETED', startedAt: { not: null } },
      select: { createdAt: true, startedAt: true },
    });

    let avgWaitTime = 0;
    if (completedEntries.length > 0) {
      const totalWait = completedEntries.reduce((sum, e) => {
        if (e.startedAt) {
          return sum + (e.startedAt.getTime() - e.createdAt.getTime());
        }
        return sum;
      }, 0);
      avgWaitTime = Math.round(totalWait / completedEntries.length / 60000); // en minutes
    }

    return { station, waiting, inService, completed, avgWaitTime };
  }
}

export const queueService = new QueueService();
