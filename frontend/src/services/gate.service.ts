import api from './api';
import { ApiResponse } from '../types';

export interface GateEntry {
  id: string;
  patientId?: string;
  appointmentId?: string;
  firstName: string;
  lastName: string;
  phone?: string;
  priority: 'NORMAL' | 'ELDERLY' | 'PREGNANT' | 'DISABLED' | 'EMERGENCY';
  status: 'EXPECTED' | 'ARRIVED' | 'SENT_TO_ACCUEIL' | 'REGISTERED' | 'NO_SHOW';
  arrivedAt?: string;
  sentAt?: string;
  notes?: string;
  isWalkIn: boolean;
  date: string;
  createdAt: string;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    dateOfBirth: string;
    gender: string;
    isPregnant: boolean;
    isDisabled: boolean;
  };
  appointment?: {
    id: string;
    scheduledDate: string;
    scheduledTime: string;
    reason?: string;
    status: string;
  };
}

export interface GateStats {
  total: number;
  expected: number;
  arrived: number;
  sentToAccueil: number;
  registered: number;
  noShow: number;
}

export const gateStatusLabels: Record<GateEntry['status'], string> = {
  EXPECTED: 'Attendu',
  ARRIVED: 'Arrivé',
  SENT_TO_ACCUEIL: 'Envoyé à l\'accueil',
  REGISTERED: 'Enregistré',
  NO_SHOW: 'Absent',
};

export const gateStatusColors: Record<GateEntry['status'], string> = {
  EXPECTED: 'bg-gray-100 text-gray-700',
  ARRIVED: 'bg-green-100 text-green-700',
  SENT_TO_ACCUEIL: 'bg-blue-100 text-blue-700',
  REGISTERED: 'bg-indigo-100 text-indigo-700',
  NO_SHOW: 'bg-red-100 text-red-700',
};

export const priorityLabels: Record<GateEntry['priority'], string> = {
  NORMAL: 'Normal',
  ELDERLY: '3ème âge',
  PREGNANT: 'Femme enceinte',
  DISABLED: 'PMR',
  EMERGENCY: 'Urgence',
};

export const priorityColors: Record<GateEntry['priority'], string> = {
  NORMAL: '',
  ELDERLY: 'bg-amber-100 text-amber-800',
  PREGNANT: 'bg-pink-100 text-pink-800',
  DISABLED: 'bg-purple-100 text-purple-800',
  EMERGENCY: 'bg-red-100 text-red-800',
};

export const priorityIcons: Record<GateEntry['priority'], string> = {
  NORMAL: '',
  ELDERLY: '👴',
  PREGNANT: '🤰',
  DISABLED: '♿',
  EMERGENCY: '🚨',
};

export const gateService = {
  async getTodayList(): Promise<{ entries: GateEntry[]; stats: GateStats }> {
    const response = await api.get<ApiResponse<{ entries: GateEntry[]; stats: GateStats }>>('/gate/today');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async markArrived(id: string): Promise<GateEntry> {
    const response = await api.patch<ApiResponse<GateEntry>>(`/gate/${id}/arrived`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async sendToAccueil(id: string): Promise<GateEntry> {
    const response = await api.patch<ApiResponse<GateEntry>>(`/gate/${id}/send`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async markNoShow(id: string): Promise<GateEntry> {
    const response = await api.patch<ApiResponse<GateEntry>>(`/gate/${id}/no-show`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async markRegistered(id: string): Promise<GateEntry> {
    const response = await api.patch<ApiResponse<GateEntry>>(`/gate/${id}/registered`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async addWalkIn(data: {
    firstName: string;
    lastName: string;
    phone?: string;
    priority?: GateEntry['priority'];
    notes?: string;
    patientId?: string;
  }): Promise<GateEntry> {
    const response = await api.post<ApiResponse<GateEntry>>('/gate/walk-in', data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getArrivedForAccueil(): Promise<GateEntry[]> {
    const response = await api.get<ApiResponse<GateEntry[]>>('/gate/arrived');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },
};
