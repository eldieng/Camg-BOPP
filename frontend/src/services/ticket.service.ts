import api from './api';
import { ApiResponse } from '../types';
import { Patient } from './patient.service';

export type Priority = 'NORMAL' | 'ELDERLY' | 'PREGNANT' | 'DISABLED' | 'EMERGENCY';
export type TicketStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface Ticket {
  id: string;
  ticketNumber: string;
  qrCode: string;
  patientId: string;
  patient: Pick<Patient, 'id' | 'firstName' | 'lastName' | 'dateOfBirth' | 'registrationNumber' | 'isVIP' | 'vipReason'>;
  priority: Priority;
  priorityReason?: string;
  status: TicketStatus;
  queueEntry?: { position: number; station: string; status: string };
  qrCodeImage?: string;
  estimatedWaitTime?: number;
  createdAt: string;
}

export interface TicketsSummary {
  total: number;
  waiting: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export const ticketService = {
  async create(data: { patientId: string; priority?: Priority }): Promise<Ticket> {
    const response = await api.post<ApiResponse<Ticket>>('/tickets', data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getTodayTickets(status?: TicketStatus) {
    const response = await api.get<ApiResponse<{ tickets: Ticket[]; summary: TicketsSummary }>>('/tickets/today', { params: status ? { status } : {} });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async cancel(id: string): Promise<Ticket> {
    const response = await api.post<ApiResponse<Ticket>>(`/tickets/${id}/cancel`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  getPriorityLabel: (p: Priority) => ({ NORMAL: 'Normal', ELDERLY: 'Personne âgée', PREGNANT: 'Femme enceinte', DISABLED: 'Handicapé', EMERGENCY: 'Urgence' }[p]),
  getPriorityColor: (p: Priority) => ({ NORMAL: 'bg-gray-100 text-gray-800', ELDERLY: 'bg-blue-100 text-blue-800', PREGNANT: 'bg-pink-100 text-pink-800', DISABLED: 'bg-purple-100 text-purple-800', EMERGENCY: 'bg-red-100 text-red-800' }[p]),
  getStatusLabel: (s: TicketStatus) => ({ WAITING: 'En attente', IN_PROGRESS: 'En cours', COMPLETED: 'Terminé', CANCELLED: 'Annulé', NO_SHOW: 'Absent' }[s]),
  getStatusColor: (s: TicketStatus) => ({ WAITING: 'bg-yellow-100 text-yellow-800', IN_PROGRESS: 'bg-blue-100 text-blue-800', COMPLETED: 'bg-green-100 text-green-800', CANCELLED: 'bg-gray-100 text-gray-800', NO_SHOW: 'bg-red-100 text-red-800' }[s]),
};

export default ticketService;
