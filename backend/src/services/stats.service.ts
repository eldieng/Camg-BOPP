import prisma from '../lib/prisma.js';

export interface DailyStatsData {
  date: string;
  totalPatients: number;
  totalTickets: number;
  completedTickets: number;
  cancelledTickets: number;
  avgWaitTimeMinutes: number;
}

export interface StationStatsData {
  station: string;
  waiting: number;
  inService: number;
  completed: number;
  avgWaitTime: number;
}

export interface DoctorStatsData {
  doctorId: string;
  doctorName: string;
  consultations: number;
  prescriptions: number;
}

export class StatsService {
  /**
   * Statistiques du jour
   */
  async getTodayStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    const [
      totalPatients,
      totalTickets,
      ticketsByStatus,
      visionTests,
      consultations,
      queueStats,
    ] = await Promise.all([
      prisma.patient.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.ticket.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.ticket.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startOfDay } },
        _count: true,
      }),
      prisma.visionTest.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.consultation.count({ where: { createdAt: { gte: startOfDay } } }),
      this.getQueueStatsByStation(),
    ]);

    const statusCounts = ticketsByStatus.reduce((acc, s) => {
      acc[s.status] = s._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      date: today.toISOString().split('T')[0],
      patients: {
        newToday: totalPatients,
      },
      tickets: {
        total: totalTickets,
        waiting: statusCounts['WAITING'] || 0,
        inProgress: statusCounts['IN_PROGRESS'] || 0,
        completed: statusCounts['COMPLETED'] || 0,
        cancelled: statusCounts['CANCELLED'] || 0,
        noShow: statusCounts['NO_SHOW'] || 0,
      },
      visionTests,
      consultations,
      queueStats,
    };
  }

  /**
   * Statistiques par station
   */
  async getQueueStatsByStation(): Promise<StationStatsData[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    const stations = ['ACCUEIL', 'TEST_VUE', 'CONSULTATION_1', 'CONSULTATION_2', 'LUNETTES'] as const;
    const stats: StationStatsData[] = [];

    for (const station of stations) {
      const [waiting, inService, completed] = await Promise.all([
        prisma.queueEntry.count({ where: { station, status: 'WAITING', createdAt: { gte: startOfDay } } }),
        prisma.queueEntry.count({ where: { station, status: 'IN_SERVICE', createdAt: { gte: startOfDay } } }),
        prisma.queueEntry.count({ where: { station, status: 'COMPLETED', createdAt: { gte: startOfDay } } }),
      ]);

      // Calcul temps d'attente moyen
      const completedEntries = await prisma.queueEntry.findMany({
        where: { station, status: 'COMPLETED', startedAt: { not: null }, createdAt: { gte: startOfDay } },
        select: { createdAt: true, startedAt: true },
      });

      let avgWaitTime = 0;
      if (completedEntries.length > 0) {
        const totalWait = completedEntries.reduce((sum, e) => {
          return sum + (e.startedAt!.getTime() - e.createdAt.getTime());
        }, 0);
        avgWaitTime = Math.round(totalWait / completedEntries.length / 60000);
      }

      stats.push({ station, waiting, inService, completed, avgWaitTime });
    }

    return stats;
  }

  /**
   * Statistiques par médecin
   */
  async getDoctorStats(): Promise<DoctorStatsData[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    const consultationsByDoctor = await prisma.consultation.groupBy({
      by: ['doctorId'],
      where: { createdAt: { gte: startOfDay } },
      _count: true,
    });

    const doctorIds = consultationsByDoctor.map(c => c.doctorId);
    const doctors = await prisma.user.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const doctorMap = new Map(doctors.map(d => [d.id, `Dr. ${d.firstName} ${d.lastName}`]));

    // Compter les prescriptions par médecin
    const prescriptionCounts = await prisma.prescription.groupBy({
      by: ['consultationId'],
      _count: true,
    });

    const consultationsWithPrescriptions = await prisma.consultation.findMany({
      where: { id: { in: prescriptionCounts.map(p => p.consultationId) }, createdAt: { gte: startOfDay } },
      select: { id: true, doctorId: true },
    });

    const prescriptionsByDoctor = new Map<string, number>();
    for (const c of consultationsWithPrescriptions) {
      const count = prescriptionCounts.find(p => p.consultationId === c.id)?._count || 0;
      prescriptionsByDoctor.set(c.doctorId, (prescriptionsByDoctor.get(c.doctorId) || 0) + count);
    }

    return consultationsByDoctor.map(c => ({
      doctorId: c.doctorId,
      doctorName: doctorMap.get(c.doctorId) || 'Inconnu',
      consultations: c._count,
      prescriptions: prescriptionsByDoctor.get(c.doctorId) || 0,
    }));
  }

  /**
   * Statistiques sur une période
   */
  async getPeriodStats(startDate: Date, endDate: Date) {
    const [patients, tickets, consultations, visionTests] = await Promise.all([
      prisma.patient.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.ticket.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate, lte: endDate } },
        _count: true,
      }),
      prisma.consultation.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
      prisma.visionTest.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    ]);

    const ticketStats = tickets.reduce((acc, t) => {
      acc[t.status] = t._count;
      acc.total = (acc.total || 0) + t._count;
      return acc;
    }, {} as Record<string, number>);

    return {
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      patients,
      tickets: ticketStats,
      consultations,
      visionTests,
    };
  }

  /**
   * Statistiques quotidiennes pour graphiques
   */
  async getDailyTrend(days: number = 7): Promise<DailyStatsData[]> {
    const result: DailyStatsData[] = [];
    const today = new Date();

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0);
      const endOfDay = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

      const [patients, tickets] = await Promise.all([
        prisma.patient.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
        prisma.ticket.groupBy({
          by: ['status'],
          where: { createdAt: { gte: startOfDay, lte: endOfDay } },
          _count: true,
        }),
      ]);

      const ticketStats = tickets.reduce((acc, t) => {
        acc[t.status] = t._count;
        acc.total = (acc.total || 0) + t._count;
        return acc;
      }, {} as Record<string, number>);

      result.push({
        date: startOfDay.toISOString().split('T')[0],
        totalPatients: patients,
        totalTickets: ticketStats.total || 0,
        completedTickets: ticketStats['COMPLETED'] || 0,
        cancelledTickets: ticketStats['CANCELLED'] || 0,
        avgWaitTimeMinutes: 0,
      });
    }

    return result;
  }
}

export const statsService = new StatsService();
