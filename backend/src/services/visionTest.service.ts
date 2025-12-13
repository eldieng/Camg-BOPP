import prisma from '../lib/prisma.js';
import { VisionTest } from '@prisma/client';

export interface CreateVisionTestDto {
  patientId: string;
  technicianId: string;
  rightEye_sphere?: number;
  rightEye_cylinder?: number;
  rightEye_axis?: number;
  rightEye_acuity?: string;
  rightEye_addition?: number;
  leftEye_sphere?: number;
  leftEye_cylinder?: number;
  leftEye_axis?: number;
  leftEye_acuity?: string;
  leftEye_addition?: number;
  pupillaryDistance?: number;
  notes?: string;
}

export interface VisionTestWithDetails extends VisionTest {
  patient: { id: string; firstName: string; lastName: string; dateOfBirth: Date; };
  technician: { id: string; firstName: string; lastName: string; };
}

const includeDetails = {
  patient: { select: { id: true, firstName: true, lastName: true, dateOfBirth: true } },
  technician: { select: { id: true, firstName: true, lastName: true } },
};

export class VisionTestService {
  async create(data: CreateVisionTestDto): Promise<VisionTestWithDetails> {
    return prisma.visionTest.create({
      data: {
        patient: { connect: { id: data.patientId } },
        technician: { connect: { id: data.technicianId } },
        rightEye_sphere: data.rightEye_sphere ? Number(data.rightEye_sphere) : null,
        rightEye_cylinder: data.rightEye_cylinder ? Number(data.rightEye_cylinder) : null,
        rightEye_axis: data.rightEye_axis ? Number(data.rightEye_axis) : null,
        rightEye_acuity: data.rightEye_acuity || null,
        rightEye_addition: data.rightEye_addition ? Number(data.rightEye_addition) : null,
        leftEye_sphere: data.leftEye_sphere ? Number(data.leftEye_sphere) : null,
        leftEye_cylinder: data.leftEye_cylinder ? Number(data.leftEye_cylinder) : null,
        leftEye_axis: data.leftEye_axis ? Number(data.leftEye_axis) : null,
        leftEye_acuity: data.leftEye_acuity || null,
        leftEye_addition: data.leftEye_addition ? Number(data.leftEye_addition) : null,
        pupillaryDistance: data.pupillaryDistance ? Number(data.pupillaryDistance) : null,
        notes: data.notes || null,
      },
      include: includeDetails,
    }) as Promise<VisionTestWithDetails>;
  }

  async findById(id: string) {
    return prisma.visionTest.findUnique({ where: { id }, include: includeDetails });
  }

  async findByPatient(patientId: string) {
    return prisma.visionTest.findMany({ where: { patientId }, include: includeDetails, orderBy: { createdAt: 'desc' } });
  }

  async getTodayTests() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    return prisma.visionTest.findMany({ where: { createdAt: { gte: startOfDay } }, include: includeDetails, orderBy: { createdAt: 'desc' } });
  }

  async update(id: string, data: Partial<CreateVisionTestDto>) {
    return prisma.visionTest.update({ where: { id }, data, include: includeDetails });
  }

  async getTodayStats() {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const total = await prisma.visionTest.count({ where: { createdAt: { gte: startOfDay } } });
    return { total };
  }
}

export const visionTestService = new VisionTestService();
