import prisma from '../lib/prisma.js';
import { OrderStatus, Priority, Station } from '@prisma/client';

export interface OrderItemDto {
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

export interface CreateOrderDto {
  requestedBy: string;
  station: Station;
  priority?: Priority;
  neededByDate?: Date;
  notes?: string;
  items: OrderItemDto[];
}

export interface UpdateOrderDto {
  status?: OrderStatus;
  priority?: Priority;
  neededByDate?: Date;
  notes?: string;
}

export class OrderService {
  /**
   * Générer un numéro de commande unique
   */
  async generateOrderNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `BC-${year}-`;
    
    const lastOrder = await prisma.internalOrder.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
    });

    let nextNumber = 1;
    if (lastOrder?.orderNumber) {
      const lastNumber = parseInt(lastOrder.orderNumber.split('-')[2], 10);
      nextNumber = lastNumber + 1;
    }

    return `${prefix}${nextNumber.toString().padStart(5, '0')}`;
  }

  /**
   * Créer une nouvelle commande
   */
  async create(data: CreateOrderDto) {
    const orderNumber = await this.generateOrderNumber();
    
    return prisma.internalOrder.create({
      data: {
        orderNumber,
        requestedBy: data.requestedBy,
        station: data.station,
        priority: data.priority || 'NORMAL',
        neededByDate: data.neededByDate,
        notes: data.notes,
        items: {
          create: data.items.map(item => ({
            itemName: item.itemName,
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            notes: item.notes,
          })),
        },
      },
      include: { items: true },
    });
  }

  /**
   * Récupérer toutes les commandes avec filtres
   */
  async findAll(filters: {
    station?: Station;
    status?: OrderStatus;
    startDate?: Date;
    endDate?: Date;
  } = {}) {
    const where: any = {};
    
    if (filters.station) where.station = filters.station;
    if (filters.status) where.status = filters.status;
    if (filters.startDate || filters.endDate) {
      where.requestDate = {};
      if (filters.startDate) where.requestDate.gte = filters.startDate;
      if (filters.endDate) where.requestDate.lte = filters.endDate;
    }

    return prisma.internalOrder.findMany({
      where,
      include: { items: true },
      orderBy: { requestDate: 'desc' },
    });
  }

  /**
   * Récupérer une commande par ID
   */
  async findById(id: string) {
    return prisma.internalOrder.findUnique({
      where: { id },
      include: { items: true },
    });
  }

  /**
   * Mettre à jour une commande
   */
  async update(id: string, data: UpdateOrderDto) {
    return prisma.internalOrder.update({
      where: { id },
      data,
      include: { items: true },
    });
  }

  /**
   * Soumettre une commande (passer de DRAFT à SUBMITTED)
   */
  async submit(id: string) {
    return prisma.internalOrder.update({
      where: { id },
      data: { status: 'SUBMITTED' },
      include: { items: true },
    });
  }

  /**
   * Approuver une commande
   */
  async approve(id: string, approvedBy: string) {
    return prisma.internalOrder.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy,
        approvedDate: new Date(),
      },
      include: { items: true },
    });
  }

  /**
   * Marquer une commande comme complétée
   */
  async complete(id: string) {
    return prisma.internalOrder.update({
      where: { id },
      data: {
        status: 'COMPLETED',
        completedDate: new Date(),
      },
      include: { items: true },
    });
  }

  /**
   * Annuler une commande
   */
  async cancel(id: string) {
    return prisma.internalOrder.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: { items: true },
    });
  }

  /**
   * Ajouter un article à une commande existante
   */
  async addItem(orderId: string, item: OrderItemDto) {
    return prisma.orderItem.create({
      data: {
        orderId,
        itemName: item.itemName,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit,
        notes: item.notes,
      },
    });
  }

  /**
   * Supprimer un article d'une commande
   */
  async removeItem(itemId: string) {
    return prisma.orderItem.delete({
      where: { id: itemId },
    });
  }

  /**
   * Statistiques des commandes
   */
  async getStats(startDate?: Date, endDate?: Date) {
    const where: any = {};
    if (startDate || endDate) {
      where.requestDate = {};
      if (startDate) where.requestDate.gte = startDate;
      if (endDate) where.requestDate.lte = endDate;
    }

    const [total, byStatus, byStation] = await Promise.all([
      prisma.internalOrder.count({ where }),
      prisma.internalOrder.groupBy({
        by: ['status'],
        where,
        _count: { id: true },
      }),
      prisma.internalOrder.groupBy({
        by: ['station'],
        where,
        _count: { id: true },
      }),
    ]);

    return {
      total,
      byStatus: byStatus.map((s: any) => ({ status: s.status, count: s._count.id })),
      byStation: byStation.map((s: any) => ({ station: s.station, count: s._count.id })),
    };
  }
}

export const orderService = new OrderService();
