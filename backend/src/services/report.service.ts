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
  // Stats détaillées par station pour le suivi du parcours
  stationFlow: {
    accueil: { tickets: number; completed: number };
    testVue: { total: number; completed: number };
    consultation: { total: number; withPrescriptions: number };
    lunettes: { total: number; completed: number };
    medicaments: { total: number; completed: number };
    blocOperatoire: { surgeries: number; analyses: number; completed: number };
  };
  // Commandes de lunettes
  glassesOrders: {
    total: number;
    pending: number;
    ready: number;
    delivered: number;
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
        SELECT DATE("createdAt") as date, COUNT(*) as count 
        FROM patients 
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        GROUP BY DATE("createdAt")
        ORDER BY date
      `,
      // Daily consultations
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("createdAt") as date, COUNT(*) as count 
        FROM consultations 
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        GROUP BY DATE("createdAt")
        ORDER BY date
      `,
      // Daily vision tests
      prisma.$queryRaw<{ date: string; count: bigint }[]>`
        SELECT DATE("createdAt") as date, COUNT(*) as count 
        FROM vision_tests 
        WHERE "createdAt" >= ${startDate} AND "createdAt" <= ${endDate}
        GROUP BY DATE("createdAt")
        ORDER BY date
      `,
    ]);

    // Stats par station détaillées
    const [
      testVueCompleted,
      lunettesTotal,
      lunettesCompleted,
      medicamentsTotal,
      medicamentsCompleted,
      surgeriesTotal,
      surgeriesCompleted,
      analysesTotal,
      glassesOrdersTotal,
      glassesOrdersPending,
      glassesOrdersReady,
      glassesOrdersDelivered,
    ] = await Promise.all([
      // Test Vue completed
      prisma.queueEntry.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          station: 'TEST_VUE',
          status: 'COMPLETED',
        },
      }),
      // Lunettes total
      prisma.queueEntry.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          station: 'LUNETTES',
        },
      }),
      // Lunettes completed
      prisma.queueEntry.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          station: 'LUNETTES',
          status: 'COMPLETED',
        },
      }),
      // Médicaments total
      prisma.queueEntry.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          station: 'MEDICAMENTS',
        },
      }),
      // Médicaments completed
      prisma.queueEntry.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          station: 'MEDICAMENTS',
          status: 'COMPLETED',
        },
      }),
      // Surgeries total
      prisma.surgery.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Surgeries completed
      prisma.surgery.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'COMPLETED',
        },
      }),
      // Lab analyses total
      prisma.labAnalysis.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Glasses orders total
      prisma.glassesOrder.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
        },
      }),
      // Glasses orders pending
      prisma.glassesOrder.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'PENDING',
        },
      }),
      // Glasses orders ready
      prisma.glassesOrder.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'READY',
        },
      }),
      // Glasses orders delivered
      prisma.glassesOrder.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          status: 'DELIVERED',
        },
      }),
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
      stationFlow: {
        accueil: { tickets: totalTickets, completed: completedTickets },
        testVue: { total: totalVisionTests, completed: testVueCompleted },
        consultation: { total: totalConsultations, withPrescriptions: consultationsWithGlasses },
        lunettes: { total: lunettesTotal, completed: lunettesCompleted },
        medicaments: { total: medicamentsTotal, completed: medicamentsCompleted },
        blocOperatoire: { surgeries: surgeriesTotal, analyses: analysesTotal, completed: surgeriesCompleted },
      },
      glassesOrders: {
        total: glassesOrdersTotal,
        pending: glassesOrdersPending,
        ready: glassesOrdersReady,
        delivered: glassesOrdersDelivered,
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

  /**
   * Statistiques des prescriptions (types de traitements les plus fréquents)
   */
  async getPrescriptionStats(startDate: Date, endDate: Date) {
    // Médicaments les plus prescrits
    const medicationStats = await prisma.prescription.groupBy({
      by: ['medication'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        medication: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    // Types de verres les plus prescrits
    const lensStats = await prisma.prescription.groupBy({
      by: ['lensType'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        lensType: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Diagnostics les plus fréquents
    const diagnosisStats = await prisma.consultation.groupBy({
      by: ['diagnosis'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
        diagnosis: { not: null },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 20,
    });

    // Prescriptions par source (interne vs externe)
    const sourceStats = await prisma.prescription.groupBy({
      by: ['source'],
      where: {
        createdAt: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
    });

    // Total prescriptions
    const totalPrescriptions = await prisma.prescription.count({
      where: { createdAt: { gte: startDate, lte: endDate } },
    });

    // Prescriptions médicamenteuses vs optiques
    const [medicationCount, opticalCount] = await Promise.all([
      prisma.prescription.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          medication: { not: null },
        },
      }),
      prisma.prescription.count({
        where: {
          createdAt: { gte: startDate, lte: endDate },
          OR: [
            { lensType: { not: null } },
            { sphere: { not: null } },
          ],
        },
      }),
    ]);

    return {
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      total: totalPrescriptions,
      byType: {
        medication: medicationCount,
        optical: opticalCount,
      },
      bySource: sourceStats.map(s => ({
        source: s.source,
        count: s._count.id,
        percentage: Math.round((s._count.id / totalPrescriptions) * 100),
      })),
      topMedications: medicationStats.map(m => ({
        name: m.medication,
        count: m._count.id,
      })),
      topLensTypes: lensStats.map(l => ({
        type: l.lensType,
        count: l._count.id,
      })),
      topDiagnoses: diagnosisStats.map(d => ({
        diagnosis: d.diagnosis,
        count: d._count.id,
      })),
    };
  }

  /**
   * Statistiques des services manquants (basé sur les referrals)
   */
  async getMissingServicesStats(startDate: Date, endDate: Date) {
    // Services les plus demandés en externe
    const serviceStats = await prisma.referral.groupBy({
      by: ['serviceNeeded'],
      where: {
        referralDate: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Raisons d'orientation
    const reasonStats = await prisma.referral.groupBy({
      by: ['reason'],
      where: {
        referralDate: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });

    // Structures externes les plus sollicitées
    const clinicStats = await prisma.referral.groupBy({
      by: ['externalClinic'],
      where: {
        referralDate: { gte: startDate, lte: endDate },
      },
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 10,
    });

    // Total et statuts
    const [total, byStatus] = await Promise.all([
      prisma.referral.count({
        where: { referralDate: { gte: startDate, lte: endDate } },
      }),
      prisma.referral.groupBy({
        by: ['status'],
        where: { referralDate: { gte: startDate, lte: endDate } },
        _count: { id: true },
      }),
    ]);

    return {
      period: { start: startDate.toISOString(), end: endDate.toISOString() },
      total,
      byStatus: byStatus.map(s => ({
        status: s.status,
        count: s._count.id,
      })),
      missingServices: serviceStats.map(s => ({
        service: s.serviceNeeded,
        count: s._count.id,
        percentage: total > 0 ? Math.round((s._count.id / total) * 100) : 0,
      })),
      byReason: reasonStats.map(r => ({
        reason: r.reason,
        count: r._count.id,
      })),
      topExternalClinics: clinicStats.map(c => ({
        clinic: c.externalClinic,
        count: c._count.id,
      })),
    };
  }
}

export const reportService = new ReportService();
