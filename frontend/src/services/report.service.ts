import api from './api';
import { ApiResponse } from '../types';

export interface ReportStats {
  period: {
    start: string;
    end: string;
  };
  patients: {
    total: number;
    new: number;
    returning: number;
  };
  tickets: {
    total: number;
    completed: number;
    cancelled: number;
  };
  visionTests: {
    total: number;
  };
  consultations: {
    total: number;
    withPrescriptions: number;
  };
  queues: {
    averageWaitTime: number;
    byStation: {
      station: string;
      total: number;
      completed: number;
    }[];
  };
  stationFlow: {
    accueil: { tickets: number; completed: number };
    testVue: { total: number; completed: number };
    consultation: { total: number; withPrescriptions: number };
    lunettes: { total: number; completed: number };
    medicaments: { total: number; completed: number };
    blocOperatoire: { surgeries: number; analyses: number; completed: number };
  };
  glassesOrders: {
    total: number;
    pending: number;
    ready: number;
    delivered: number;
  };
  dailyStats: {
    date: string;
    patients: number;
    consultations: number;
    visionTests: number;
  }[];
}

export interface PatientReport {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone?: string;
    address?: string;
    isPregnant: boolean;
    isDisabled: boolean;
  };
  visionTests: {
    id: string;
    date: string;
    technician: string;
    rightEye: {
      acuity?: string;
      sphere?: number;
      cylinder?: number;
      axis?: number;
      addition?: number;
    };
    leftEye: {
      acuity?: string;
      sphere?: number;
      cylinder?: number;
      axis?: number;
      addition?: number;
    };
    pupillaryDistance?: number;
    notes?: string;
  }[];
  consultations: {
    id: string;
    date: string;
    doctor: string;
    chiefComplaint?: string;
    diagnosis?: string;
    notes?: string;
    intraocularPressureOD?: number;
    intraocularPressureOG?: number;
    prescriptions: {
      medication?: string;
      dosage?: string;
      duration?: string;
      eyeType: string;
      sphere?: number;
      cylinder?: number;
      axis?: number;
      addition?: number;
    }[];
  }[];
}

export const reportService = {
  async getStats(startDate?: string, endDate?: string): Promise<ReportStats> {
    const params = new URLSearchParams();
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const url = params.toString() ? `/reports/stats?${params}` : '/reports/stats';
    const response = await api.get<ApiResponse<ReportStats>>(url);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getPatientReport(patientId: string): Promise<PatientReport> {
    const response = await api.get<ApiResponse<PatientReport>>(`/reports/patient/${patientId}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },
};

export default reportService;
