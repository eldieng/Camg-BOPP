import prisma from '../lib/prisma.js';
import { ReferralStatus, ReferralReason } from '@prisma/client';

export interface CreateReferralDto {
  patientId: string;
  consultationId?: string;
  referredBy: string;
  reason: ReferralReason;
  customReason?: string;
  serviceNeeded: string;
  externalClinic: string;
  externalDoctor?: string;
  externalPhone?: string;
  externalAddress?: string;
  appointmentDate?: Date;
  diagnosis?: string;
  notes?: string;
}

export interface UpdateReferralDto {
  status?: ReferralStatus;
  appointmentDate?: Date;
  completedDate?: Date;
  treatmentNotes?: string;
  followUpNeeded?: boolean;
  followUpDate?: Date;
  notes?: string;
}

export class ReferralService {
  /**
   * Créer une nouvelle orientation
   */
  async create(data: CreateReferralDto) {
    return prisma.referral.create({
      data: {
        patientId: data.patientId,
        consultationId: data.consultationId,
        referredBy: data.referredBy,
        reason: data.reason,
        customReason: data.customReason,
        serviceNeeded: data.serviceNeeded,
        externalClinic: data.externalClinic,
        externalDoctor: data.externalDoctor,
        externalPhone: data.externalPhone,
        externalAddress: data.externalAddress,
        appointmentDate: data.appointmentDate,
        diagnosis: data.diagnosis,
        notes: data.notes,
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, registrationNumber: true },
        },
      },
    });
  }

  /**
   * Récupérer toutes les orientations avec filtres
   */
  async findAll(filters: {
    status?: ReferralStatus;
    reason?: ReferralReason;
    patientId?: string;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const where: any = {};
    
    if (filters.status) where.status = filters.status;
    if (filters.reason) where.reason = filters.reason;
    if (filters.patientId) where.patientId = filters.patientId;
    if (filters.startDate || filters.endDate) {
      where.referralDate = {};
      if (filters.startDate) where.referralDate.gte = filters.startDate;
      if (filters.endDate) where.referralDate.lte = filters.endDate;
    }

    return prisma.referral.findMany({
      where,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, registrationNumber: true, phone: true },
        },
      },
      orderBy: { referralDate: 'desc' },
    });
  }

  /**
   * Récupérer une orientation par ID
   */
  async findById(id: string) {
    return prisma.referral.findUnique({
      where: { id },
      include: {
        patient: true,
        consultation: {
          include: {
            doctor: { select: { firstName: true, lastName: true } },
          },
        },
      },
    });
  }

  /**
   * Mettre à jour une orientation
   */
  async update(id: string, data: UpdateReferralDto) {
    return prisma.referral.update({
      where: { id },
      data,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, registrationNumber: true },
        },
      },
    });
  }

  /**
   * Mettre à jour le statut
   */
  async updateStatus(id: string, status: ReferralStatus, notes?: string) {
    const updateData: any = { status };
    
    if (status === 'COMPLETED') {
      updateData.completedDate = new Date();
    }
    if (notes) {
      updateData.notes = notes;
    }

    return prisma.referral.update({
      where: { id },
      data: updateData,
    });
  }

  /**
   * Récupérer les orientations nécessitant un suivi
   */
  async getPendingFollowUps() {
    const today = new Date();
    return prisma.referral.findMany({
      where: {
        followUpNeeded: true,
        status: 'COMPLETED',
        followUpDate: { lte: today },
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true },
        },
      },
      orderBy: { followUpDate: 'asc' },
    });
  }

  /**
   * Statistiques des orientations
   */
  async getStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.referralDate = {};
      if (startDate) where.referralDate.gte = startDate;
      if (endDate) where.referralDate.lte = endDate;
    }

    const [total, byStatus, byReason, byService] = await Promise.all([
      prisma.referral.count({ where }),
      prisma.referral.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.referral.groupBy({
        by: ['reason'],
        where,
        _count: { id: true },
      }),
      prisma.referral.groupBy({
        by: ['serviceNeeded'],
        where,
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map(s => ({ status: s.status, count: s._count.id })),
      byReason: byReason.map(r => ({ reason: r.reason, count: r._count.id })),
      topServices: byService.map(s => ({ service: s.serviceNeeded, count: s._count.id })),
    };
  }
}

export const referralService = new ReferralService();
