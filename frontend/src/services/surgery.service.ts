import api from './api';
import { ApiResponse } from '../types';

// ============================================
// Types
// ============================================

export type AnalysisType = 'GLYCEMIE' | 'TENSION_ARTERIELLE' | 'RADIOLOGIE' | 'ECHOGRAPHIE' | 'BILAN_SANGUIN' | 'NFS' | 'GROUPE_SANGUIN' | 'BIOCHIMIE' | 'AUTRE';
export type AnalysisStatus = 'PRESCRIBED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
export type SurgeryType = 'CATARACTE' | 'GLAUCOME' | 'PTERYGION' | 'STRABISME' | 'DECOLLEMENT_RETINE' | 'GREFFE_CORNEE' | 'LASER' | 'AUTRE';
export type SurgeryStatus = 'WAITING_ANALYSIS' | 'ANALYSIS_COMPLETE' | 'ELIGIBLE' | 'NOT_ELIGIBLE' | 'SCHEDULED' | 'PRE_OP' | 'IN_SURGERY' | 'POST_OP' | 'COMPLETED' | 'CANCELLED';
export type OperatedEye = 'OD' | 'OG' | 'LES_DEUX';

export interface LabAnalysis {
  id: string;
  patientId: string;
  consultationId?: string;
  type: AnalysisType;
  customType?: string;
  status: AnalysisStatus;
  prescribedDate: string;
  completedDate?: string;
  results?: string;
  resultValue?: number;
  normalRange?: string;
  isNormal?: boolean;
  notes?: string;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone?: string;
  };
  consultation?: {
    id: string;
    diagnosis?: string;
    doctor: { id: string; firstName: string; lastName: string };
  };
}

export interface Surgery {
  id: string;
  patientId: string;
  consultationId?: string;
  surgeonId?: string;
  type: SurgeryType;
  customType?: string;
  operatedEye?: OperatedEye;
  status: SurgeryStatus;
  scheduledDate?: string;
  scheduledTime?: string;
  actualStartTime?: string;
  actualEndTime?: string;
  anesthesiaType?: string;
  diagnosis?: string;
  operativeNotes?: string;
  complications?: string;
  consentSigned: boolean;
  preOpChecklist?: Record<string, boolean>;
  analysisId?: string;
  notes?: string;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    phone?: string;
    gender: string;
  };
  consultation?: { id: string; diagnosis?: string };
  surgeon?: { id: string; firstName: string; lastName: string };
  analysis?: LabAnalysis;
  followUps: PostOpFollowUp[];
}

export interface PostOpFollowUp {
  id: string;
  surgeryId: string;
  dayNumber: number;
  scheduledDate?: string;
  actualDate?: string;
  visualAcuity?: string;
  intraocularPressure?: number;
  woundStatus?: string;
  complications?: string;
  treatment?: string;
  notes?: string;
  isCompleted: boolean;
  surgery?: {
    id: string;
    type: SurgeryType;
    operatedEye?: OperatedEye;
    patient: { id: string; firstName: string; lastName: string };
  };
}

export interface BlocStats {
  totalSurgeries: number;
  todaySurgeries: number;
  waitingList: number;
  pendingAnalyses: number;
  pendingFollowUps: number;
  byStatus: { status: string; count: number }[];
  byType: { type: string; count: number }[];
}

// ============================================
// Labels
// ============================================

export const analysisTypeLabels: Record<AnalysisType, string> = {
  GLYCEMIE: 'Glycémie',
  TENSION_ARTERIELLE: 'Tension artérielle',
  RADIOLOGIE: 'Radiologie',
  ECHOGRAPHIE: 'Échographie',
  BILAN_SANGUIN: 'Bilan sanguin',
  NFS: 'NFS (Numération)',
  GROUPE_SANGUIN: 'Groupe sanguin',
  BIOCHIMIE: 'Biochimie',
  AUTRE: 'Autre',
};

export const analysisStatusLabels: Record<AnalysisStatus, string> = {
  PRESCRIBED: 'Prescrite',
  IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export const analysisStatusColors: Record<AnalysisStatus, string> = {
  PRESCRIBED: 'bg-yellow-100 text-yellow-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export const surgeryTypeLabels: Record<SurgeryType, string> = {
  CATARACTE: 'Cataracte',
  GLAUCOME: 'Glaucome',
  PTERYGION: 'Ptérygion',
  STRABISME: 'Strabisme',
  DECOLLEMENT_RETINE: 'Décollement rétine',
  GREFFE_CORNEE: 'Greffe cornée',
  LASER: 'Laser',
  AUTRE: 'Autre',
};

export const surgeryStatusLabels: Record<SurgeryStatus, string> = {
  WAITING_ANALYSIS: 'En attente d\'analyses',
  ANALYSIS_COMPLETE: 'Analyses terminées',
  ELIGIBLE: 'Éligible',
  NOT_ELIGIBLE: 'Non éligible',
  SCHEDULED: 'Programmée',
  PRE_OP: 'Pré-opératoire',
  IN_SURGERY: 'En cours d\'opération',
  POST_OP: 'Post-opératoire',
  COMPLETED: 'Terminée',
  CANCELLED: 'Annulée',
};

export const surgeryStatusColors: Record<SurgeryStatus, string> = {
  WAITING_ANALYSIS: 'bg-yellow-100 text-yellow-800',
  ANALYSIS_COMPLETE: 'bg-blue-100 text-blue-800',
  ELIGIBLE: 'bg-green-100 text-green-800',
  NOT_ELIGIBLE: 'bg-red-100 text-red-800',
  SCHEDULED: 'bg-indigo-100 text-indigo-800',
  PRE_OP: 'bg-orange-100 text-orange-800',
  IN_SURGERY: 'bg-purple-100 text-purple-800',
  POST_OP: 'bg-teal-100 text-teal-800',
  COMPLETED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};

export const eyeLabels: Record<OperatedEye, string> = {
  OD: 'Œil droit',
  OG: 'Œil gauche',
  LES_DEUX: 'Les deux yeux',
};

// ============================================
// Service
// ============================================

export const surgeryService = {
  // ---- ANALYSES ----

  async createAnalysis(data: { patientId: string; consultationId?: string; type: AnalysisType; customType?: string; notes?: string }): Promise<LabAnalysis> {
    const response = await api.post<ApiResponse<LabAnalysis>>('/surgery/analyses', data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async createMultipleAnalyses(data: { patientId: string; consultationId?: string; types: AnalysisType[] }): Promise<LabAnalysis[]> {
    const response = await api.post<ApiResponse<LabAnalysis[]>>('/surgery/analyses/batch', data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getAnalysis(id: string): Promise<LabAnalysis> {
    const response = await api.get<ApiResponse<LabAnalysis>>(`/surgery/analyses/${id}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async updateAnalysis(id: string, data: Partial<LabAnalysis>): Promise<LabAnalysis> {
    const response = await api.put<ApiResponse<LabAnalysis>>(`/surgery/analyses/${id}`, data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getPatientAnalyses(patientId: string): Promise<LabAnalysis[]> {
    const response = await api.get<ApiResponse<LabAnalysis[]>>(`/surgery/analyses/patient/${patientId}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getPendingAnalyses(): Promise<LabAnalysis[]> {
    const response = await api.get<ApiResponse<LabAnalysis[]>>('/surgery/analyses/pending');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  // ---- SURGERIES ----

  async createSurgery(data: {
    patientId: string; consultationId?: string; surgeonId?: string;
    type: SurgeryType; customType?: string; operatedEye?: OperatedEye;
    diagnosis?: string; anesthesiaType?: string; notes?: string;
  }): Promise<Surgery> {
    const response = await api.post<ApiResponse<Surgery>>('/surgery', data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getSurgery(id: string): Promise<Surgery> {
    const response = await api.get<ApiResponse<Surgery>>(`/surgery/${id}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async updateSurgery(id: string, data: Record<string, unknown>): Promise<Surgery> {
    const response = await api.put<ApiResponse<Surgery>>(`/surgery/${id}`, data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getPatientSurgeries(patientId: string): Promise<Surgery[]> {
    const response = await api.get<ApiResponse<Surgery[]>>(`/surgery/patient/${patientId}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getScheduledSurgeries(date?: string): Promise<Surgery[]> {
    const params = date ? { date } : {};
    const response = await api.get<ApiResponse<Surgery[]>>('/surgery/scheduled', { params });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getWaitingList(): Promise<Surgery[]> {
    const response = await api.get<ApiResponse<Surgery[]>>('/surgery/waiting-list');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getAllSurgeries(params?: { page?: number; limit?: number; status?: string }): Promise<{ surgeries: Surgery[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    const response = await api.get<ApiResponse<{ surgeries: Surgery[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>>('/surgery', { params });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  // ---- FOLLOW-UPS ----

  async createFollowUp(data: { surgeryId: string; dayNumber: number; scheduledDate?: string }): Promise<PostOpFollowUp> {
    const response = await api.post<ApiResponse<PostOpFollowUp>>('/surgery/follow-ups', data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async createDefaultFollowUps(surgeryId: string, surgeryDate: string): Promise<PostOpFollowUp[]> {
    const response = await api.post<ApiResponse<PostOpFollowUp[]>>('/surgery/follow-ups/default', { surgeryId, surgeryDate });
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async updateFollowUp(id: string, data: Partial<PostOpFollowUp>): Promise<PostOpFollowUp> {
    const response = await api.put<ApiResponse<PostOpFollowUp>>(`/surgery/follow-ups/${id}`, data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getSurgeryFollowUps(surgeryId: string): Promise<PostOpFollowUp[]> {
    const response = await api.get<ApiResponse<PostOpFollowUp[]>>(`/surgery/${surgeryId}/follow-ups`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getPendingFollowUps(): Promise<PostOpFollowUp[]> {
    const response = await api.get<ApiResponse<PostOpFollowUp[]>>('/surgery/follow-ups/pending');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  // ---- STATS ----

  async getBlocStats(): Promise<BlocStats> {
    const response = await api.get<ApiResponse<BlocStats>>('/surgery/stats');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },
};
