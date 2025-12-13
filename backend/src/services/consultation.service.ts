import prisma from '../lib/prisma.js';
import { Consultation, Prescription, EyeType } from '@prisma/client';

export interface CreatePrescriptionDto {
  eyeType: EyeType;
  sphere?: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  lensType?: string;
  coating?: string;
  medication?: string;
  dosage?: string;
  duration?: string;
  notes?: string;
}

export interface CreateConsultationDto {
  patientId: string;
  doctorId: string;
  chiefComplaint?: string;
  diagnosis?: string;
  notes?: string;
  intraocularPressureOD?: number;
  intraocularPressureOG?: number;
  prescriptions?: CreatePrescriptionDto[];
}

export interface ConsultationWithDetails extends Consultation {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  prescriptions: Prescription[];
}

const includeDetails = {
  patient: {
    select: { id: true, firstName: true, lastName: true, dateOfBirth: true },
  },
  doctor: {
    select: { id: true, firstName: true, lastName: true },
  },
  prescriptions: true,
};

export class ConsultationService {
  async create(data: CreateConsultationDto): Promise<ConsultationWithDetails> {
    const { prescriptions, ...consultationData } = data;

    return prisma.consultation.create({
      data: {
        ...consultationData,
        prescriptions: prescriptions ? {
          create: prescriptions,
        } : undefined,
      },
      include: includeDetails,
    }) as Promise<ConsultationWithDetails>;
  }

  async findById(id: string): Promise<ConsultationWithDetails | null> {
    return prisma.consultation.findUnique({
      where: { id },
      include: includeDetails,
    }) as Promise<ConsultationWithDetails | null>;
  }

  async findByPatient(patientId: string): Promise<ConsultationWithDetails[]> {
    return prisma.consultation.findMany({
      where: { patientId },
      include: includeDetails,
      orderBy: { createdAt: 'desc' },
    }) as Promise<ConsultationWithDetails[]>;
  }

  async getTodayConsultations(): Promise<ConsultationWithDetails[]> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    return prisma.consultation.findMany({
      where: { createdAt: { gte: startOfDay } },
      include: includeDetails,
      orderBy: { createdAt: 'desc' },
    }) as Promise<ConsultationWithDetails[]>;
  }

  async update(id: string, data: Partial<CreateConsultationDto>): Promise<ConsultationWithDetails> {
    const { prescriptions, ...consultationData } = data;

    // Supprimer les anciennes prescriptions si de nouvelles sont fournies
    if (prescriptions) {
      await prisma.prescription.deleteMany({ where: { consultationId: id } });
    }

    return prisma.consultation.update({
      where: { id },
      data: {
        ...consultationData,
        prescriptions: prescriptions ? {
          create: prescriptions,
        } : undefined,
      },
      include: includeDetails,
    }) as Promise<ConsultationWithDetails>;
  }

  async addPrescription(consultationId: string, prescription: CreatePrescriptionDto): Promise<Prescription> {
    return prisma.prescription.create({
      data: {
        consultationId,
        ...prescription,
      },
    });
  }

  async getTodayStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);

    const [total, byDoctor] = await Promise.all([
      prisma.consultation.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.consultation.groupBy({
        by: ['doctorId'],
        where: { createdAt: { gte: startOfDay } },
        _count: true,
      }),
    ]);

    const doctorIds = byDoctor.map(d => d.doctorId);
    const doctors = await prisma.user.findMany({
      where: { id: { in: doctorIds } },
      select: { id: true, firstName: true, lastName: true },
    });

    const doctorMap = new Map(doctors.map(d => [d.id, `Dr. ${d.firstName} ${d.lastName}`]));

    return {
      total,
      byDoctor: byDoctor.map(d => ({
        name: doctorMap.get(d.doctorId) || 'Inconnu',
        count: d._count,
      })),
    };
  }

  async getPatientHistory(patientId: string) {
    const [patient, consultations, visionTests] = await Promise.all([
      prisma.patient.findUnique({
        where: { id: patientId },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          dateOfBirth: true,
          gender: true,
          phone: true,
          isPregnant: true,
          isDisabled: true,
        },
      }),
      prisma.consultation.findMany({
        where: { patientId },
        include: {
          doctor: { select: { firstName: true, lastName: true } },
          prescriptions: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.visionTest.findMany({
        where: { patientId },
        include: {
          technician: { select: { firstName: true, lastName: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return { patient, consultations, visionTests };
  }
}

export const consultationService = new ConsultationService();
