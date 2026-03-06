import api from './api';
import { ApiResponse } from '../types';

export type OrderStatus = 'DRAFT' | 'SUBMITTED' | 'APPROVED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type Station = 'ACCUEIL' | 'TEST_VUE' | 'CONSULTATION' | 'LUNETTES' | 'MEDICAMENTS' | 'BLOC_OPERATOIRE';

export interface OrderItem {
  id: string;
  orderId: string;
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

export interface InternalOrder {
  id: string;
  orderNumber: string;
  requestedBy: string;
  station: Station;
  status: OrderStatus;
  priority: string;
  requestDate: string;
  neededByDate?: string;
  approvedDate?: string;
  approvedBy?: string;
  completedDate?: string;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
}

export interface CreateOrderItemDto {
  itemName: string;
  description?: string;
  quantity: number;
  unit?: string;
  notes?: string;
}

export interface CreateOrderDto {
  station: Station;
  priority?: string;
  neededByDate?: string;
  notes?: string;
  items: CreateOrderItemDto[];
}

export interface UpdateOrderDto {
  priority?: string;
  neededByDate?: string;
  notes?: string;
}

export const orderStatusLabels: Record<OrderStatus, string> = {
  DRAFT: 'Brouillon',
  SUBMITTED: 'Soumis',
  APPROVED: 'Approuvé',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Livré',
  CANCELLED: 'Annulé',
};

export const orderStatusColors: Record<OrderStatus, string> = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SUBMITTED: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-blue-100 text-blue-800',
  IN_PROGRESS: 'bg-purple-100 text-purple-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const stationLabels: Record<Station, string> = {
  ACCUEIL: 'Accueil',
  TEST_VUE: 'Test de vue',
  CONSULTATION: 'Consultation',
  LUNETTES: 'Salle lunettes',
  MEDICAMENTS: 'Pharmacie',
  BLOC_OPERATOIRE: 'Bloc opératoire',
};

export const orderService = {
  async create(data: CreateOrderDto): Promise<InternalOrder> {
    const response = await api.post<ApiResponse<InternalOrder>>('/orders', data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getAll(filters?: {
    station?: Station;
    status?: OrderStatus;
    startDate?: string;
    endDate?: string;
  }): Promise<InternalOrder[]> {
    const response = await api.get<ApiResponse<InternalOrder[]>>('/orders', { params: filters });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getById(id: string): Promise<InternalOrder> {
    const response = await api.get<ApiResponse<InternalOrder>>(`/orders/${id}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async update(id: string, data: UpdateOrderDto): Promise<InternalOrder> {
    const response = await api.put<ApiResponse<InternalOrder>>(`/orders/${id}`, data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async submit(id: string): Promise<InternalOrder> {
    const response = await api.post<ApiResponse<InternalOrder>>(`/orders/${id}/submit`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async approve(id: string): Promise<InternalOrder> {
    const response = await api.post<ApiResponse<InternalOrder>>(`/orders/${id}/approve`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async complete(id: string): Promise<InternalOrder> {
    const response = await api.post<ApiResponse<InternalOrder>>(`/orders/${id}/complete`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async cancel(id: string): Promise<InternalOrder> {
    const response = await api.post<ApiResponse<InternalOrder>>(`/orders/${id}/cancel`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async addItem(orderId: string, item: CreateOrderItemDto): Promise<OrderItem> {
    const response = await api.post<ApiResponse<OrderItem>>(`/orders/${orderId}/items`, item);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async removeItem(orderId: string, itemId: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/orders/${orderId}/items/${itemId}`);
    if (!response.data.success) throw new Error(response.data.error?.message || 'Erreur');
  },

  async getStats(startDate?: string, endDate?: string) {
    const response = await api.get<ApiResponse<{
      total: number;
      byStatus: { status: OrderStatus; count: number }[];
      byStation: { station: Station; count: number }[];
    }>>('/orders/stats', { params: { startDate, endDate } });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },
};

export default orderService;
