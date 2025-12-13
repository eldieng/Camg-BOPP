import api from './api';
import { ApiResponse } from '../types';

export type EyeType = 'OD' | 'OG';

export interface Prescription {
  id: string;
  eyeType: EyeType;
  sphere?: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  lensType?: string;
  coating?: string;
  medication?: string;
  dosage?: string;
  duration?: string;
  notes?: string;
}

export interface Consultation {
  id: string;
  patientId: string;
  doctorId: string;
  chiefComplaint?: string;
  diagnosis?: string;
  notes?: string;
  intraocularPressureOD?: number;
  intraocularPressureOG?: number;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  doctor: {
    id: string;
    firstName: string;
    lastName: string;
  };
  prescriptions: Prescription[];
}

export interface CreatePrescriptionDto {
  eyeType: EyeType;
  sphere?: number;
  cylinder?: number;
  axis?: number;
  addition?: number;
  lensType?: string;
  coating?: string;
  medication?: string;
  dosage?: string;
  duration?: string;
  notes?: string;
}

export interface CreateConsultationDto {
  patientId: string;
  queueEntryId?: string;
  chiefComplaint?: string;
  diagnosis?: string;
  notes?: string;
  intraocularPressureOD?: number;
  intraocularPressureOG?: number;
  prescriptions?: CreatePrescriptionDto[];
}

export interface PatientHistory {
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    phone?: string;
    isPregnant: boolean;
    isDisabled: boolean;
  };
  consultations: Consultation[];
  visionTests: any[];
}

export const consultationService = {
  async create(data: CreateConsultationDto): Promise<Consultation> {
    const response = await api.post<ApiResponse<Consultation>>('/consultations', data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getTodayConsultations(): Promise<{ consultations: Consultation[]; stats: { total: number; byDoctor: { name: string; count: number }[] } }> {
    const response = await api.get<ApiResponse<{ consultations: Consultation[]; stats: any }>>('/consultations/today');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getById(id: string): Promise<Consultation> {
    const response = await api.get<ApiResponse<Consultation>>(`/consultations/${id}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getByPatient(patientId: string): Promise<Consultation[]> {
    const response = await api.get<ApiResponse<Consultation[]>>(`/consultations/patient/${patientId}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getPatientHistory(patientId: string): Promise<PatientHistory> {
    const response = await api.get<ApiResponse<PatientHistory>>(`/consultations/patient/${patientId}/history`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },
};

export default consultationService;
