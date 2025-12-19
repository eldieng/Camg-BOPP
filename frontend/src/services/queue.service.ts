import api from './api';
import { ApiResponse } from '../types';

export type Station = 'ACCUEIL' | 'TEST_VUE' | 'CONSULTATION' | 'LUNETTES' | 'MEDICAMENTS';
export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'COMPLETED' | 'SKIPPED';

export interface QueueEntry {
  id: string;
  ticketId: string;
  station: Station;
  position: number;
  status: QueueStatus;
  roomNumber?: number;  // Numéro de salle assigné (1 ou 2 pour consultation)
  calledAt?: string;
  startedAt?: string;
  ticket: {
    id: string;
    ticketNumber: string;
    priority: string;
    status: string;
    patient: {
      id: string;
      firstName: string;
      lastName: string;
      dateOfBirth: string;
    };
  };
}

export interface StationStats {
  station: Station;
  waiting: number;
  inService: number;
  completed: number;
  avgWaitTime: number;
}

export const queueService = {
  async getQueue(station: Station): Promise<{ queue: QueueEntry[]; stats: StationStats }> {
    const response = await api.get<ApiResponse<{ queue: QueueEntry[]; stats: StationStats }>>(`/queue/${station}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async callNext(station: Station, roomNumber?: number): Promise<QueueEntry | null> {
    const response = await api.post<ApiResponse<QueueEntry>>(`/queue/${station}/call-next`, { roomNumber });
    if (response.data.success) return response.data.data || null;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async startService(entryId: string): Promise<QueueEntry> {
    const response = await api.post<ApiResponse<QueueEntry>>(`/queue/${entryId}/start`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async completeService(entryId: string, nextStation?: Station): Promise<QueueEntry> {
    const response = await api.post<ApiResponse<QueueEntry>>(`/queue/${entryId}/complete`, { nextStation });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async markNoShow(entryId: string): Promise<QueueEntry> {
    const response = await api.post<ApiResponse<QueueEntry>>(`/queue/${entryId}/no-show`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getMissedCalls(station?: Station): Promise<QueueEntry[]> {
    const url = station ? `/queue/missed-calls/${station}` : '/queue/missed-calls';
    const response = await api.get<ApiResponse<QueueEntry[]>>(url);
    if (response.data.success) return response.data.data || [];
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async recallPatient(entryId: string): Promise<QueueEntry> {
    const response = await api.post<ApiResponse<QueueEntry>>(`/queue/${entryId}/recall`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  getStatusLabel: (s: QueueStatus) => ({ WAITING: 'En attente', CALLED: 'Appelé', IN_SERVICE: 'En service', COMPLETED: 'Terminé', SKIPPED: 'Absent' }[s]),
  getStatusColor: (s: QueueStatus) => ({ WAITING: 'bg-yellow-100 text-yellow-800', CALLED: 'bg-orange-100 text-orange-800', IN_SERVICE: 'bg-blue-100 text-blue-800', COMPLETED: 'bg-green-100 text-green-800', SKIPPED: 'bg-gray-100 text-gray-800' }[s]),
};

export default queueService;
