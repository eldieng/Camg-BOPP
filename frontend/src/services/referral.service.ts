import api from './api';
import { ApiResponse } from '../types';

export type ReferralStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'LOST';
export type ReferralReason = 'SERVICE_UNAVAILABLE' | 'EQUIPMENT_MISSING' | 'SPECIALIST_NEEDED' | 'EMERGENCY' | 'PATIENT_CHOICE' | 'OTHER';

export interface Referral {
  id: string;
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
  status: ReferralStatus;
  referralDate: string;
  appointmentDate?: string;
  completedDate?: string;
  diagnosis?: string;
  treatmentNotes?: string;
  followUpNeeded: boolean;
  followUpDate?: string;
  notes?: string;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    registrationNumber: string;
    phone?: string;
  };
}

export interface CreateReferralDto {
  patientId: string;
  consultationId?: string;
  reason: ReferralReason;
  customReason?: string;
  serviceNeeded: string;
  externalClinic: string;
  externalDoctor?: string;
  externalPhone?: string;
  externalAddress?: string;
  appointmentDate?: string;
  diagnosis?: string;
  notes?: string;
}

export interface UpdateReferralDto {
  status?: ReferralStatus;
  appointmentDate?: string;
  completedDate?: string;
  treatmentNotes?: string;
  followUpNeeded?: boolean;
  followUpDate?: string;
  notes?: string;
}

export const referralReasonLabels: Record<ReferralReason, string> = {
  SERVICE_UNAVAILABLE: 'Service non disponible',
  EQUIPMENT_MISSING: 'Équipement manquant',
  SPECIALIST_NEEDED: 'Spécialiste requis',
  EMERGENCY: 'Urgence',
  PATIENT_CHOICE: 'Choix du patient',
  OTHER: 'Autre',
};

export const referralStatusLabels: Record<ReferralStatus, string> = {
  PENDING: 'En attente',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminé',
  CANCELLED: 'Annulé',
  LOST: 'Perdu de vue',
};

export const referralStatusColors: Record<ReferralStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
  LOST: 'bg-red-100 text-red-800',
};

export const referralService = {
  async create(data: CreateReferralDto): Promise<Referral> {
    const response = await api.post<ApiResponse<Referral>>('/referrals', data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getAll(filters?: {
    status?: ReferralStatus;
    reason?: ReferralReason;
    patientId?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Referral[]> {
    const response = await api.get<ApiResponse<Referral[]>>('/referrals', { params: filters });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getById(id: string): Promise<Referral> {
    const response = await api.get<ApiResponse<Referral>>(`/referrals/${id}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async update(id: string, data: UpdateReferralDto): Promise<Referral> {
    const response = await api.put<ApiResponse<Referral>>(`/referrals/${id}`, data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async updateStatus(id: string, status: ReferralStatus, notes?: string): Promise<Referral> {
    const response = await api.patch<ApiResponse<Referral>>(`/referrals/${id}/status`, { status, notes });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getPendingFollowUps(): Promise<Referral[]> {
    const response = await api.get<ApiResponse<Referral[]>>('/referrals/follow-ups');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getStats(startDate?: string, endDate?: string) {
    const response = await api.get<ApiResponse<{
      total: number;
      byStatus: { status: ReferralStatus; count: number }[];
      byReason: { reason: ReferralReason; count: number }[];
      topServices: { service: string; count: number }[];
    }>>('/referrals/stats', { params: { startDate, endDate } });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },
};

export default referralService;
