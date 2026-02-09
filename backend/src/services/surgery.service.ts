import prisma from '../lib/prisma.js';
import { AnalysisStatus, AnalysisType, SurgeryStatus, SurgeryType, OperatedEye } from '@prisma/client';

// ============================================
// DTOs
// ============================================

export interface CreateLabAnalysisDto {
  patientId: string;
  consultationId?: string;
  type: AnalysisType;
  customType?: string;
  notes?: string;
}

export interface UpdateLabAnalysisDto {
  status?: AnalysisStatus;
  results?: string;
  resultValue?: number;
  normalRange?: string;
  isNormal?: boolean;
  notes?: string;
}

export interface CreateSurgeryDto {
  patientId: string;
  consultationId?: string;
  surgeonId?: string;
  type: SurgeryType;
  customType?: string;
  operatedEye?: OperatedEye;
  diagnosis?: string;
  anesthesiaType?: string;
  notes?: string;
}

export interface UpdateSurgeryDto {
  surgeonId?: string;
  type?: SurgeryType;
  customType?: string;
  operatedEye?: OperatedEye;
  status?: SurgeryStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  anesthesiaType?: string;
  diagnosis?: string;
  operativeNotes?: string;
  complications?: string;
  consentSigned?: boolean;
  preOpChecklist?: Record<string, boolean>;
  notes?: string;
}

export interface CreateFollowUpDto {
  surgeryId: string;
  dayNumber: number;
  scheduledDate?: string;
  visualAcuity?: string;
  intraocularPressure?: number;
  woundStatus?: string;
  complications?: string;
  treatment?: string;
  notes?: string;
}

export interface UpdateFollowUpDto {
  actualDate?: string;
  visualAcuity?: string;
  intraocularPressure?: number;
  woundStatus?: string;
  complications?: string;
  treatment?: string;
  notes?: string;
  isCompleted?: boolean;
}

// ============================================
// Includes
// ============================================

const analysisInclude = {
  patient: {
    select: { id: true, firstName: true, lastName: true, dateOfBirth: true, phone: true },
  },
  consultation: {
    select: { id: true, diagnosis: true, doctor: { select: { id: true, firstName: true, lastName: true } } },
  },
};

const surgeryInclude = {
  patient: {
    select: { id: true, firstName: true, lastName: true, dateOfBirth: true, phone: true, gender: true },
  },
  consultation: {
    select: { id: true, diagnosis: true },
  },
  surgeon: {
    select: { id: true, firstName: true, lastName: true },
  },
  analysis: true,
  followUps: {
    orderBy: { dayNumber: 'asc' as const },
  },
};

const followUpInclude = {
  surgery: {
    select: {
      id: true,
      type: true,
      operatedEye: true,
      patient: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
  },
};

// ============================================
// Service
// ============================================

export class SurgeryService {
  // ---- LAB ANALYSES ----

  async createAnalysis(data: CreateLabAnalysisDto) {
    return prisma.labAnalysis.create({
      data: {
        patientId: data.patientId,
        consultationId: data.consultationId,
        type: data.type,
        customType: data.customType,
        notes: data.notes,
      },
      include: analysisInclude,
    });
  }

  async createMultipleAnalyses(patientId: string, consultationId: string | undefined, types: AnalysisType[]) {
    const analyses = await prisma.$transaction(
      types.map((type) =>
        prisma.labAnalysis.create({
          data: { patientId, consultationId, type },
          include: analysisInclude,
        })
      )
    );
    return analyses;
  }

  async getAnalysisById(id: string) {
    return prisma.labAnalysis.findUnique({
      where: { id },
      include: analysisInclude,
    });
  }

  async updateAnalysis(id: string, data: UpdateLabAnalysisDto) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.status === 'COMPLETED') {
      updateData.completedDate = new Date();
    }
    return prisma.labAnalysis.update({
      where: { id },
      data: updateData,
      include: analysisInclude,
    });
  }

  async getAnalysesByPatient(patientId: string) {
    return prisma.labAnalysis.findMany({
      where: { patientId },
      include: analysisInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getPendingAnalyses() {
    return prisma.labAnalysis.findMany({
      where: { status: { in: ['PRESCRIBED', 'IN_PROGRESS'] } },
      include: analysisInclude,
      orderBy: { prescribedDate: 'asc' },
    });
  }

  async getCompletedAnalyses(patientId: string) {
    return prisma.labAnalysis.findMany({
      where: { patientId, status: 'COMPLETED' },
      include: analysisInclude,
      orderBy: { completedDate: 'desc' },
    });
  }

  // ---- SURGERIES ----

  async createSurgery(data: CreateSurgeryDto) {
    return prisma.surgery.create({
      data: {
        patientId: data.patientId,
        consultationId: data.consultationId,
        surgeonId: data.surgeonId,
        type: data.type,
        customType: data.customType,
        operatedEye: data.operatedEye,
        diagnosis: data.diagnosis,
        anesthesiaType: data.anesthesiaType,
        notes: data.notes,
        status: 'WAITING_ANALYSIS',
      },
      include: surgeryInclude,
    });
  }

  async getSurgeryById(id: string) {
    return prisma.surgery.findUnique({
      where: { id },
      include: surgeryInclude,
    });
  }

  async updateSurgery(id: string, data: UpdateSurgeryDto) {
    const updateData: Record<string, unknown> = {};

    // Copy simple fields
    const fields = ['surgeonId', 'type', 'customType', 'operatedEye', 'status',
      'scheduledTime', 'anesthesiaType', 'diagnosis', 'operativeNotes',
      'complications', 'consentSigned', 'preOpChecklist', 'notes'] as const;

    for (const field of fields) {
      if (data[field] !== undefined) {
        updateData[field] = data[field];
      }
    }

    if (data.scheduledDate) {
      updateData.scheduledDate = new Date(data.scheduledDate);
    }

    // Auto-set timestamps based on status changes
    if (data.status === 'IN_SURGERY') {
      updateData.actualStartTime = new Date();
    }
    if (data.status === 'COMPLETED' || data.status === 'POST_OP') {
      updateData.actualEndTime = new Date();
    }

    return prisma.surgery.update({
      where: { id },
      data: updateData,
      include: surgeryInclude,
    });
  }

  async getSurgeriesByPatient(patientId: string) {
    return prisma.surgery.findMany({
      where: { patientId },
      include: surgeryInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSurgeriesByStatus(status: SurgeryStatus) {
    return prisma.surgery.findMany({
      where: { status },
      include: surgeryInclude,
      orderBy: { scheduledDate: 'asc' },
    });
  }

  async getScheduledSurgeries(date?: string) {
    const where: Record<string, unknown> = {
      status: { in: ['SCHEDULED', 'PRE_OP', 'IN_SURGERY'] },
    };

    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      where.scheduledDate = { gte: startOfDay, lte: endOfDay };
    }

    return prisma.surgery.findMany({
      where,
      include: surgeryInclude,
      orderBy: [{ scheduledDate: 'asc' }, { scheduledTime: 'asc' }],
    });
  }

  async getWaitingList() {
    return prisma.surgery.findMany({
      where: {
        status: { in: ['WAITING_ANALYSIS', 'ANALYSIS_COMPLETE', 'ELIGIBLE'] },
      },
      include: surgeryInclude,
      orderBy: { createdAt: 'asc' },
    });
  }

  async getAllSurgeries(params: { page?: number; limit?: number; status?: string }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const where: Record<string, unknown> = {};

    if (params.status) {
      where.status = params.status;
    }

    const [surgeries, total] = await Promise.all([
      prisma.surgery.findMany({
        where,
        include: surgeryInclude,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.surgery.count({ where }),
    ]);

    return {
      surgeries,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  // ---- FOLLOW-UPS ----

  async createFollowUp(data: CreateFollowUpDto) {
    return prisma.postOpFollowUp.create({
      data: {
        surgeryId: data.surgeryId,
        dayNumber: data.dayNumber,
        scheduledDate: data.scheduledDate ? new Date(data.scheduledDate) : undefined,
        visualAcuity: data.visualAcuity,
        intraocularPressure: data.intraocularPressure,
        woundStatus: data.woundStatus,
        complications: data.complications,
        treatment: data.treatment,
        notes: data.notes,
      },
      include: followUpInclude,
    });
  }

  async createDefaultFollowUps(surgeryId: string, surgeryDate: Date) {
    const days = [1, 7, 30];
    const followUps = days.map((dayNumber) => {
      const scheduledDate = new Date(surgeryDate);
      scheduledDate.setDate(scheduledDate.getDate() + dayNumber);
      return prisma.postOpFollowUp.create({
        data: { surgeryId, dayNumber, scheduledDate },
      });
    });
    return prisma.$transaction(followUps);
  }

  async updateFollowUp(id: string, data: UpdateFollowUpDto) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.actualDate) {
      updateData.actualDate = new Date(data.actualDate);
    }
    return prisma.postOpFollowUp.update({
      where: { id },
      data: updateData,
      include: followUpInclude,
    });
  }

  async getFollowUpsBySurgery(surgeryId: string) {
    return prisma.postOpFollowUp.findMany({
      where: { surgeryId },
      include: followUpInclude,
      orderBy: { dayNumber: 'asc' },
    });
  }

  async getPendingFollowUps() {
    const today = new Date();
    today.setHours(23, 59, 59, 999);

    return prisma.postOpFollowUp.findMany({
      where: {
        isCompleted: false,
        scheduledDate: { lte: today },
      },
      include: followUpInclude,
      orderBy: { scheduledDate: 'asc' },
    });
  }

  // ---- STATS ----

  async getBlocStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());

    const [totalSurgeries, todaySurgeries, waitingList, pendingAnalyses, pendingFollowUps, byStatus, byType] =
      await Promise.all([
        prisma.surgery.count(),
        prisma.surgery.count({ where: { scheduledDate: { gte: startOfDay } } }),
        prisma.surgery.count({ where: { status: { in: ['WAITING_ANALYSIS', 'ANALYSIS_COMPLETE', 'ELIGIBLE'] } } }),
        prisma.labAnalysis.count({ where: { status: { in: ['PRESCRIBED', 'IN_PROGRESS'] } } }),
        prisma.postOpFollowUp.count({ where: { isCompleted: false, scheduledDate: { lte: today } } }),
        prisma.surgery.groupBy({ by: ['status'], _count: true }),
        prisma.surgery.groupBy({ by: ['type'], _count: true }),
      ]);

    return {
      totalSurgeries,
      todaySurgeries,
      waitingList,
      pendingAnalyses,
      pendingFollowUps,
      byStatus: byStatus.map((s) => ({ status: s.status, count: s._count })),
      byType: byType.map((t) => ({ type: t.type, count: t._count })),
    };
  }
}

export const surgeryService = new SurgeryService();
