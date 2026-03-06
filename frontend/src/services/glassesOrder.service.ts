import api from './api';
import { ApiResponse } from '../types';

export type GlassesOrderStatus = 'PENDING' | 'IN_PROGRESS' | 'READY' | 'DELIVERED' | 'CANCELLED';

export interface GlassesOrder {
  id: string;
  orderNumber: string;
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
  status: GlassesOrderStatus;
  priority: string;
  orderDate: string;
  estimatedDate?: string;
  readyDate?: string;
  deliveredDate?: string;
  notes?: string;
  workshopNotes?: string;
  createdBy: string;
  preparedBy?: string;
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    registrationNumber: string;
  };
  consultation?: {
    id: string;
    diagnosis?: string;
    createdAt: string;
  };
}

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
  priority?: string;
  estimatedDate?: string;
  notes?: string;
}

export interface GlassesOrderStats {
  pending: number;
  inProgress: number;
  ready: number;
  deliveredToday: number;
  total: number;
}

export const glassesOrderStatusLabels: Record<GlassesOrderStatus, string> = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En fabrication',
  READY: 'Prêt',
  DELIVERED: 'Livré',
  CANCELLED: 'Annulé',
};

export const glassesOrderStatusColors: Record<GlassesOrderStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  READY: 'bg-green-100 text-green-800',
  DELIVERED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export const lensTypeOptions = [
  { value: 'SIMPLE', label: 'Verre simple' },
  { value: 'BIFOCAL', label: 'Bifocal' },
  { value: 'PROGRESSIF', label: 'Progressif' },
  { value: 'DEGRESSIF', label: 'Dégressif' },
];

export const coatingOptions = [
  { value: 'ANTI_REFLET', label: 'Anti-reflet' },
  { value: 'PHOTOCHROMIQUE', label: 'Photochromique' },
  { value: 'BLEU_FILTER', label: 'Filtre lumière bleue' },
  { value: 'TEINTE', label: 'Teinté' },
  { value: 'POLARISE', label: 'Polarisé' },
];

export const glassesOrderService = {
  async create(data: CreateGlassesOrderDto): Promise<GlassesOrder> {
    const response = await api.post<ApiResponse<GlassesOrder>>('/glasses-orders', data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur lors de la création');
  },

  async getAll(filters?: { status?: GlassesOrderStatus; patientId?: string; fromDate?: string; toDate?: string }): Promise<GlassesOrder[]> {
    const response = await api.get<ApiResponse<GlassesOrder[]>>('/glasses-orders', { params: filters });
    if (response.data.success) return response.data.data || [];
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getPending(): Promise<GlassesOrder[]> {
    const response = await api.get<ApiResponse<GlassesOrder[]>>('/glasses-orders/pending');
    if (response.data.success) return response.data.data || [];
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getReady(): Promise<GlassesOrder[]> {
    const response = await api.get<ApiResponse<GlassesOrder[]>>('/glasses-orders/ready');
    if (response.data.success) return response.data.data || [];
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getById(id: string): Promise<GlassesOrder> {
    const response = await api.get<ApiResponse<GlassesOrder>>(`/glasses-orders/${id}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getByPatient(patientId: string): Promise<GlassesOrder[]> {
    const response = await api.get<ApiResponse<GlassesOrder[]>>(`/glasses-orders/patient/${patientId}`);
    if (response.data.success) return response.data.data || [];
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async update(id: string, data: Partial<GlassesOrder>): Promise<GlassesOrder> {
    const response = await api.put<ApiResponse<GlassesOrder>>(`/glasses-orders/${id}`, data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async startProgress(id: string): Promise<GlassesOrder> {
    const response = await api.post<ApiResponse<GlassesOrder>>(`/glasses-orders/${id}/start`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async markReady(id: string, workshopNotes?: string): Promise<GlassesOrder> {
    const response = await api.post<ApiResponse<GlassesOrder>>(`/glasses-orders/${id}/ready`, { workshopNotes });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async markDelivered(id: string): Promise<GlassesOrder> {
    const response = await api.post<ApiResponse<GlassesOrder>>(`/glasses-orders/${id}/deliver`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async cancel(id: string, reason?: string): Promise<GlassesOrder> {
    const response = await api.post<ApiResponse<GlassesOrder>>(`/glasses-orders/${id}/cancel`, { reason });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getStats(): Promise<GlassesOrderStats> {
    const response = await api.get<ApiResponse<GlassesOrderStats>>('/glasses-orders/stats');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },
};

export default glassesOrderService;
