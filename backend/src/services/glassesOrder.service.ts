import { PrismaClient, GlassesOrderStatus, Priority } from '@prisma/client';

const prisma = new PrismaClient();

export interface CreateGlassesOrderDto {
  patientId: string;
  consultationId: string;
  prescriptionId?: string;
  odSphere?: number;
  odCylinder?: number;
  odAxis?: number;
  odAddition?: number;
  ogSphere?: number;
  ogCylinder?: number;
  ogAxis?: number;
  ogAddition?: number;
  lensType?: string;
  coating?: string;
  frameType?: string;
  frameReference?: string;
  pupillaryDistance?: number;
  priority?: Priority;
  estimatedDate?: string;
  notes?: string;
}

export interface UpdateGlassesOrderDto {
  status?: GlassesOrderStatus;
  lensType?: string;
  coating?: string;
  frameType?: string;
  frameReference?: string;
  pupillaryDistance?: number;
  estimatedDate?: string;
  workshopNotes?: string;
  notes?: string;
  preparedBy?: string;
}

class GlassesOrderService {
  // Générer un numéro de commande unique
  private async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `LUN-${year}-`;
    
    const lastOrder = await prisma.glassesOrder.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastOrder) {
      const lastNumber = parseInt(lastOrder.orderNumber.replace(prefix, ''), 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }

  // Créer une commande de lunettes
  async create(data: CreateGlassesOrderDto, createdBy: string) {
    const orderNumber = await this.generateOrderNumber();

    return prisma.glassesOrder.create({
      data: {
        orderNumber,
        patientId: data.patientId,
        consultationId: data.consultationId,
        prescriptionId: data.prescriptionId,
        odSphere: data.odSphere,
        odCylinder: data.odCylinder,
        odAxis: data.odAxis,
        odAddition: data.odAddition,
        ogSphere: data.ogSphere,
        ogCylinder: data.ogCylinder,
        ogAxis: data.ogAxis,
        ogAddition: data.ogAddition,
        lensType: data.lensType,
        coating: data.coating,
        frameType: data.frameType,
        frameReference: data.frameReference,
        pupillaryDistance: data.pupillaryDistance,
        priority: data.priority || 'NORMAL',
        estimatedDate: data.estimatedDate ? new Date(data.estimatedDate) : undefined,
        notes: data.notes,
        createdBy,
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true, registrationNumber: true },
        },
        consultation: {
          select: { id: true, diagnosis: true, createdAt: true },
        },
      },
    });
  }

  // Récupérer toutes les commandes avec filtres
  async getAll(filters?: {
    status?: GlassesOrderStatus;
    patientId?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.patientId) {
      where.patientId = filters.patientId;
    }
    if (filters?.fromDate || filters?.toDate) {
      where.orderDate = {};
      if (filters.fromDate) where.orderDate.gte = new Date(filters.fromDate);
      if (filters.toDate) where.orderDate.lte = new Date(filters.toDate + 'T23:59:59');
    }

    return prisma.glassesOrder.findMany({
      where,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true, registrationNumber: true },
        },
        consultation: {
          select: { id: true, diagnosis: true, createdAt: true },
        },
      },
      orderBy: [
        { status: 'asc' },
        { priority: 'desc' },
        { orderDate: 'desc' },
      ],
    });
  }

  // Récupérer les commandes en attente (pour l'atelier)
  async getPending() {
    return prisma.glassesOrder.findMany({
      where: {
        status: { in: ['PENDING', 'IN_PROGRESS'] },
      },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true, registrationNumber: true },
        },
        consultation: {
          select: { id: true, diagnosis: true, createdAt: true },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { orderDate: 'asc' },
      ],
    });
  }

  // Récupérer les commandes prêtes (pour la remise)
  async getReady() {
    return prisma.glassesOrder.findMany({
      where: { status: 'READY' },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true, registrationNumber: true },
        },
      },
      orderBy: { readyDate: 'asc' },
    });
  }

  // Récupérer une commande par ID
  async getById(id: string) {
    return prisma.glassesOrder.findUnique({
      where: { id },
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true, registrationNumber: true, dateOfBirth: true },
        },
        consultation: {
          include: {
            doctor: { select: { id: true, firstName: true, lastName: true } },
            prescriptions: true,
          },
        },
      },
    });
  }

  // Mettre à jour une commande
  async update(id: string, data: UpdateGlassesOrderDto) {
    const updateData: any = { ...data };

    // Gérer les dates de statut
    if (data.status === 'READY') {
      updateData.readyDate = new Date();
    } else if (data.status === 'DELIVERED') {
      updateData.deliveredDate = new Date();
    }

    if (data.estimatedDate) {
      updateData.estimatedDate = new Date(data.estimatedDate);
    }

    return prisma.glassesOrder.update({
      where: { id },
      data: updateData,
      include: {
        patient: {
          select: { id: true, firstName: true, lastName: true, phone: true, registrationNumber: true },
        },
      },
    });
  }

  // Démarrer la fabrication
  async startProgress(id: string, preparedBy: string) {
    return prisma.glassesOrder.update({
      where: { id },
      data: {
        status: 'IN_PROGRESS',
        preparedBy,
      },
    });
  }

  // Marquer comme prêt
  async markReady(id: string, workshopNotes?: string) {
    return prisma.glassesOrder.update({
      where: { id },
      data: {
        status: 'READY',
        readyDate: new Date(),
        workshopNotes,
      },
    });
  }

  // Marquer comme livré
  async markDelivered(id: string) {
    return prisma.glassesOrder.update({
      where: { id },
      data: {
        status: 'DELIVERED',
        deliveredDate: new Date(),
      },
    });
  }

  // Annuler une commande
  async cancel(id: string, reason?: string) {
    return prisma.glassesOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        notes: reason,
      },
    });
  }

  // Statistiques
  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pending, inProgress, ready, deliveredToday, total] = await Promise.all([
      prisma.glassesOrder.count({ where: { status: 'PENDING' } }),
      prisma.glassesOrder.count({ where: { status: 'IN_PROGRESS' } }),
      prisma.glassesOrder.count({ where: { status: 'READY' } }),
      prisma.glassesOrder.count({
        where: {
          status: 'DELIVERED',
          deliveredDate: { gte: today },
        },
      }),
      prisma.glassesOrder.count(),
    ]);

    return {
      pending,
      inProgress,
      ready,
      deliveredToday,
      total,
    };
  }

  // Récupérer les commandes d'un patient
  async getByPatient(patientId: string) {
    return prisma.glassesOrder.findMany({
      where: { patientId },
      include: {
        consultation: {
          select: { id: true, diagnosis: true, createdAt: true },
        },
      },
      orderBy: { orderDate: 'desc' },
    });
  }
}

export const glassesOrderService = new GlassesOrderService();
