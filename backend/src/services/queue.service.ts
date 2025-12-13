import prisma from '../lib/prisma.js';
import { Station, QueueStatus, QueueEntry, TicketStatus } from '@prisma/client';

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

    return prisma.queueEntry.findMany({
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
      orderBy: [
        { status: 'asc' }, // IN_SERVICE first, then CALLED, then WAITING
        { ticket: { priority: 'asc' } },
        { position: 'asc' },
      ],
    }) as Promise<QueueEntryWithDetails[]>;
  }

  /**
   * Appeler le prochain patient
   */
  async callNext(station: Station, userId: string): Promise<QueueEntryWithDetails | null> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    // Trouver le prochain en attente
    const nextEntry = await prisma.queueEntry.findFirst({
      where: {
        station,
        status: 'WAITING',
        createdAt: { gte: startOfDay },
      },
      orderBy: [
        { ticket: { priority: 'asc' } },
        { position: 'asc' },
      ],
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

    if (!nextEntry) return null;

    // Mettre à jour le statut
    const updated = await prisma.queueEntry.update({
      where: { id: nextEntry.id },
      data: {
        status: 'CALLED',
        calledAt: new Date(),
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
