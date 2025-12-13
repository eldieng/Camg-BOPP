import api from './api';
import { ApiResponse } from '../types';

export interface TodayStats {
  date: string;
  patients: { newToday: number };
  tickets: {
    total: number;
    waiting: number;
    inProgress: number;
    completed: number;
    cancelled: number;
    noShow: number;
  };
  visionTests: number;
  consultations: number;
  queueStats: StationStats[];
}

export interface StationStats {
  station: string;
  waiting: number;
  inService: number;
  completed: number;
  avgWaitTime: number;
}

export interface DoctorStats {
  doctorId: string;
  doctorName: string;
  consultations: number;
  prescriptions: number;
}

export interface DailyTrend {
  date: string;
  totalPatients: number;
  totalTickets: number;
  completedTickets: number;
  cancelledTickets: number;
  avgWaitTimeMinutes: number;
}

export const statsService = {
  async getTodayStats(): Promise<TodayStats> {
    const response = await api.get<ApiResponse<TodayStats>>('/stats/today');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getQueueStats(): Promise<StationStats[]> {
    const response = await api.get<ApiResponse<StationStats[]>>('/stats/queue');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getDoctorStats(): Promise<DoctorStats[]> {
    const response = await api.get<ApiResponse<DoctorStats[]>>('/stats/doctors');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getDailyTrend(days: number = 7): Promise<DailyTrend[]> {
    const response = await api.get<ApiResponse<DailyTrend[]>>('/stats/trend', { params: { days } });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },
};

export default statsService;
