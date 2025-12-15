import prisma from '../lib/prisma.js';

export interface ReportStats {
  period: {
    start: string;
    end: string;
  };
  patients: {
    total: number;
    new: number;
    returning: number;
  };
  tickets: {
    total: number;
    completed: number;
    cancelled: number;
  };
  visionTests: {
    total: number;
  };
  consultations: {
    total: number;
    withPrescriptions: number;
  };
  queues: {
    averageWaitTime: number; // en minutes
    byStation: {
      station: string;
      total: number;
      completed: number;
    }[];
  };
  dailyStats: {
    date: string;
    patients: number;
    consultations: number;
    visionTests: number;
  }[];
}

export interface PatientReport {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone?: string;
    address?: string;
    isPregnant: boolean;
    isDisabled: boolean;
  };
  visionTests: {
    id: string;
    date: string;
    technician: string;
    rightEye: {
      acuity?: string;
      sphere?: number;
      cylinder?: number;
      axis?: number;
      addition?: number;
    };
    leftEye: {
      acuity?: string;
      sphere?: number;
      cylinder?: number;
      axis?: number;
      addition?: number;
    };
    pupillaryDistance?: number;
    notes?: string;
  }[];
  consultations: {
    id: string;
    date: string;
    doctor: string;
    chiefComplaint?: string;
    diagnosis?: string;
    notes?: string;
    intraocularPressureOD?: number;
    intraocularPressureOG?: number;
    prescriptions: {
      medication?: string;
      dosage?: string;
      duration?: string;
      eyeType: string;
      sphere?: number;
      cylinder?: number;
      axis?: number;
      addition?: number;
    }[];
  }[];
}

export class ReportService {
  /**
   * Obtenir les statistiques pour une période donnée
   */
  async getStats(startDate: Date, endDate: Date): Promise<ReportStats> {
    const [
      totalPatients,
      newPatients,
      totalTickets,
      completedTickets,
      cancelledTickets,
      totalVisionTests,
      totalConsultations,
      consultationsWithGlasses,
      queueStats,
      dailyPatients,
      dailyConsultations,
      dailyVisionTests,
    ] = await Promise.all([
      // Total patients
      prisma.patient.count(),
      // New patients in period
      prisma.patient.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Total tickets in period
      prisma.ticket.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Completed tickets
      prisma.ticket.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
        },
      }),
      // Cancelled tickets
      prisma.ticket.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'CANCELLED',
        },
      }),
      // Vision tests
      prisma.visionTest.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Consultations
      prisma.consultation.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Consultations with prescriptions
      prisma.consultation.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          prescriptions: { some: {} },
        },
      }),
      // Queue stats by station
      prisma.queueEntry.groupBy({
        by: ['station'],
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      }),
      // Daily patients
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM patients 
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
      // Daily consultations
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM consultations 
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
      // Daily vision tests
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE(created_at) as date, COUNT(*) as count 
        FROM vision_tests 
        WHERE created_at >= ${startDate} AND created_at <= ${endDate}
        GROUP BY DATE(created_at)
        ORDER BY date
      `,
    ]);

    // Calculate average wait time
    const waitTimes = await prisma.queueEntry.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate },
        startedAt: { not: null },
      },
      select: {
        createdAt: true,
        startedAt: true,
      },
    });

    let averageWaitTime = 0;
    if (waitTimes.length > 0) {
      const totalWait = waitTimes.reduce((sum, entry) => {
        if (entry.startedAt) {
          return sum + (entry.startedAt.getTime() - entry.createdAt.getTime());
        }
        return sum;
      }, 0);
      averageWaitTime = Math.round(totalWait / waitTimes.length / 60000); // Convert to minutes
    }

    // Completed queue entries by station
    const completedByStation = await prisma.queueEntry.groupBy({
      by: ['station'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        status: 'COMPLETED',
      },
      _count: { id: true },
    });

    // Build daily stats
    const dateMap = new Map<string, { patients: number; consultations: number; visionTests: number }>();
    
    dailyPatients.forEach((d: { date: string; count: bigint }) => {
      const dateStr = new Date(d.date).toISOString().split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { patients: 0, consultations: 0, visionTests: 0 });
      }
      dateMap.get(dateStr)!.patients = Number(d.count);
    });

    dailyConsultations.forEach((d: { date: string; count: bigint }) => {
      const dateStr = new Date(d.date).toISOString().split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { patients: 0, consultations: 0, visionTests: 0 });
      }
      dateMap.get(dateStr)!.consultations = Number(d.count);
    });

    dailyVisionTests.forEach((d: { date: string; count: bigint }) => {
      const dateStr = new Date(d.date).toISOString().split('T')[0];
      if (!dateMap.has(dateStr)) {
        dateMap.set(dateStr, { patients: 0, consultations: 0, visionTests: 0 });
      }
      dateMap.get(dateStr)!.visionTests = Number(d.count);
    });

    const dailyStats = Array.from(dateMap.entries())
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: {
        start: startDate.toISOString(),
        end: endDate.toISOString(),
      },
      patients: {
        total: totalPatients,
        new: newPatients,
        returning: totalPatients - newPatients,
      },
      tickets: {
        total: totalTickets,
        completed: completedTickets,
        cancelled: cancelledTickets,
      },
      visionTests: {
        total: totalVisionTests,
      },
      consultations: {
        total: totalConsultations,
        withPrescriptions: consultationsWithGlasses,
      },
      queues: {
        averageWaitTime,
        byStation: queueStats.map((s) => ({
          station: s.station,
          total: s._count.id,
          completed: completedByStation.find((c) => c.station === s.station)?._count.id || 0,
        })),
      },
      dailyStats,
    };
  }

  /**
   * Obtenir le rapport complet d'un patient
   */
  async getPatientReport(patientId: string): Promise<PatientReport> {
    const patient = await prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient) {
      throw new Error('Patient non trouvé');
    }

    const visionTests = await prisma.visionTest.findMany({
      where: { patientId },
      include: {
        technician: {
          select: { firstName: true, lastName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const consultations = await prisma.consultation.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: { firstName: true, lastName: true },
        },
        prescriptions: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      patient: {
        id: patient.id,
        firstName: patient.firstName,
        lastName: patient.lastName,
        dateOfBirth: patient.dateOfBirth.toISOString(),
        phone: patient.phone || undefined,
        address: patient.address || undefined,
        isPregnant: patient.isPregnant,
        isDisabled: patient.isDisabled,
      },
      visionTests: visionTests.map((vt) => ({
        id: vt.id,
        date: vt.createdAt.toISOString(),
        technician: `${vt.technician.firstName} ${vt.technician.lastName}`,
        rightEye: {
          acuity: vt.rightEye_acuity || undefined,
          sphere: vt.rightEye_sphere || undefined,
          cylinder: vt.rightEye_cylinder || undefined,
          axis: vt.rightEye_axis || undefined,
          addition: vt.rightEye_addition || undefined,
        },
        leftEye: {
          acuity: vt.leftEye_acuity || undefined,
          sphere: vt.leftEye_sphere || undefined,
          cylinder: vt.leftEye_cylinder || undefined,
          axis: vt.leftEye_axis || undefined,
          addition: vt.leftEye_addition || undefined,
        },
        pupillaryDistance: vt.pupillaryDistance || undefined,
        notes: vt.notes || undefined,
      })),
      consultations: consultations.map((c) => ({
        id: c.id,
        date: c.createdAt.toISOString(),
        doctor: `${c.doctor.firstName} ${c.doctor.lastName}`,
        chiefComplaint: c.chiefComplaint || undefined,
        diagnosis: c.diagnosis || undefined,
        notes: c.notes || undefined,
        intraocularPressureOD: c.intraocularPressureOD || undefined,
        intraocularPressureOG: c.intraocularPressureOG || undefined,
        prescriptions: c.prescriptions.map((p) => ({
          medication: p.medication || undefined,
          dosage: p.dosage || undefined,
          duration: p.duration || undefined,
          eyeType: p.eyeType,
          sphere: p.sphere || undefined,
          cylinder: p.cylinder || undefined,
          axis: p.axis || undefined,
          addition: p.addition || undefined,
        })),
      })),
    };
  }
}

export const reportService = new ReportService();
