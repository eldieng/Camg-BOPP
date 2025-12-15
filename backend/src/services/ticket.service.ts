import prisma from '../lib/prisma.js';
import { Priority, TicketStatus, Station, QueueStatus, Ticket } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import QRCode from 'qrcode';
import { patientService } from './patient.service.js';

export interface CreateTicketDto {
  patientId: string;
  priority?: Priority;
  priorityReason?: string;
}

export interface TicketWithPatient extends Ticket {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
  };
  queueEntry?: {
    position: number;
    station: Station;
    status: QueueStatus;
  } | null;
}

export interface TodayTicketsSummary {
  total: number;
  waiting: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export class TicketService {
  /**
   * Générer un numéro de ticket unique pour aujourd'hui
   * Format: YYYYMMDD-XXX (ex: 20241209-001)
   */
  private async generateTicketNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    
    // Compter les tickets d'aujourd'hui
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));
    
    const count = await prisma.ticket.count({
      where: {
        createdAt: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });
    
    const ticketNum = (count + 1).toString().padStart(3, '0');
    return `${dateStr}-${ticketNum}`;
  }

  /**
   * Générer un code QR unique
   */
  private generateQRCode(): string {
    return `CAMG-${uuidv4().slice(0, 8).toUpperCase()}`;
  }

  /**
   * Déterminer automatiquement la priorité du patient
   */
  private async determinePriority(patientId: string, manualPriority?: Priority): Promise<{ priority: Priority; reason?: string }> {
    // Si une priorité manuelle est spécifiée (urgence), l'utiliser
    if (manualPriority === 'EMERGENCY') {
      return { priority: 'EMERGENCY', reason: 'Urgence médicale' };
    }

    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      return { priority: 'NORMAL' };
    }

    // Vérifier les critères de priorité
    if (patient.isDisabled) {
      return { priority: 'DISABLED', reason: 'Personne en situation de handicap' };
    }

    if (patient.isPregnant) {
      return { priority: 'PREGNANT', reason: 'Femme enceinte' };
    }

    if (patientService.isElderly(patient.dateOfBirth)) {
      return { priority: 'ELDERLY', reason: 'Personne âgée (65+)' };
    }

    return { priority: manualPriority || 'NORMAL' };
  }

  /**
   * Calculer la position dans la file d'attente
   */
  private async calculateQueuePosition(priority: Priority): Promise<number> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    
    // Compter les entrées en attente avec priorité égale ou supérieure
    const priorityOrder: Priority[] = ['EMERGENCY', 'DISABLED', 'PREGNANT', 'ELDERLY', 'NORMAL'];
    const currentPriorityIndex = priorityOrder.indexOf(priority);
    const higherPriorities = priorityOrder.slice(0, currentPriorityIndex + 1);

    const waitingCount = await prisma.queueEntry.count({
      where: {
        status: { in: ['WAITING', 'CALLED'] },
        createdAt: { gte: startOfDay },
        ticket: {
          priority: { in: higherPriorities },
        },
      },
    });

    return waitingCount + 1;
  }

  /**
   * Créer un nouveau ticket
   */
  async create(data: CreateTicketDto): Promise<TicketWithPatient> {
    // Vérifier que le patient existe
    const patient = await prisma.patient.findUnique({
      where: { id: data.patientId },
    });

    if (!patient) {
      throw new Error('Patient non trouvé');
    }

    // Déterminer la priorité
    const { priority, reason } = await this.determinePriority(data.patientId, data.priority);
    console.log(`[TICKET] Patient ${patient.firstName} ${patient.lastName} - isPregnant: ${patient.isPregnant}, isDisabled: ${patient.isDisabled} => Priority: ${priority}`);

    // Générer le numéro de ticket et le QR code
    const ticketNumber = await this.generateTicketNumber();
    const qrCode = this.generateQRCode();

    // Calculer la position dans la file
    const position = await this.calculateQueuePosition(priority);

    // Créer le ticket avec l'entrée dans la file d'attente
    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber,
        qrCode,
        patientId: data.patientId,
        priority,
        priorityReason: reason || data.priorityReason,
        status: 'WAITING',
        queueEntry: {
          create: {
            station: 'TEST_VUE',
            position,
            status: 'WAITING',
          },
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
        queueEntry: {
          select: {
            position: true,
            station: true,
            status: true,
          },
        },
      },
    });

    return ticket as TicketWithPatient;
  }

  /**
   * Générer l'image QR Code en base64
   */
  async generateQRCodeImage(qrCode: string): Promise<string> {
    try {
      return await QRCode.toDataURL(qrCode, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#ffffff',
        },
      });
    } catch {
      throw new Error('Erreur lors de la génération du QR code');
    }
  }

  /**
   * Récupérer les tickets du jour
   */
  async getTodayTickets(status?: TicketStatus): Promise<TicketWithPatient[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const where: any = {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    if (status) {
      where.status = status;
    }

    return prisma.ticket.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
        queueEntry: {
          select: {
            position: true,
            station: true,
            status: true,
          },
        },
      },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'asc' },
      ],
    }) as Promise<TicketWithPatient[]>;
  }

  /**
   * Récupérer le résumé des tickets du jour
   */
  async getTodaySummary(): Promise<TodayTicketsSummary> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59);

    const dateFilter = {
      createdAt: {
        gte: startOfDay,
        lte: endOfDay,
      },
    };

    const [total, waiting, inProgress, completed, cancelled] = await Promise.all([
      prisma.ticket.count({ where: dateFilter }),
      prisma.ticket.count({ where: { ...dateFilter, status: 'WAITING' } }),
      prisma.ticket.count({ where: { ...dateFilter, status: 'IN_PROGRESS' } }),
      prisma.ticket.count({ where: { ...dateFilter, status: 'COMPLETED' } }),
      prisma.ticket.count({ where: { ...dateFilter, status: 'CANCELLED' } }),
    ]);

    return { total, waiting, inProgress, completed, cancelled };
  }

  /**
   * Récupérer un ticket par ID
   */
  async findById(id: string): Promise<TicketWithPatient | null> {
    return prisma.ticket.findUnique({
      where: { id },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
        queueEntry: {
          select: {
            position: true,
            station: true,
            status: true,
          },
        },
      },
    }) as Promise<TicketWithPatient | null>;
  }

  /**
   * Récupérer un ticket par QR code
   */
  async findByQRCode(qrCode: string): Promise<TicketWithPatient | null> {
    return prisma.ticket.findUnique({
      where: { qrCode },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
          },
        },
        queueEntry: {
          select: {
            position: true,
            station: true,
            status: true,
          },
        },
      },
    }) as Promise<TicketWithPatient | null>;
  }

  /**
   * Mettre à jour le statut d'un ticket
   */
  async updateStatus(id: string, status: TicketStatus): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id },
      data: { status },
    });
  }

  /**
   * Annuler un ticket
   */
  async cancel(id: string): Promise<Ticket> {
    return prisma.$transaction(async (tx) => {
      // Mettre à jour le ticket
      const ticket = await tx.ticket.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      // Mettre à jour l'entrée dans la file
      await tx.queueEntry.updateMany({
        where: { ticketId: id },
        data: { status: 'SKIPPED' },
      });

      return ticket;
    });
  }

  /**
   * Estimer le temps d'attente (en minutes)
   */
  async estimateWaitTime(position: number): Promise<number> {
    // Temps moyen par patient (à ajuster selon les données réelles)
    const avgTimePerPatient = 8; // minutes
    return position * avgTimePerPatient;
  }
}

export const ticketService = new TicketService();
