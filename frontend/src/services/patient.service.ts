import api from './api';
import { ApiResponse } from '../types';

export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  address?: string;
  phone?: string;
  emergencyContact?: string;
  isPregnant: boolean;
  isDisabled: boolean;
  notes?: string;
  age?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePatientDto {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE';
  address?: string;
  phone?: string;
  emergencyContact?: string;
  isPregnant?: boolean;
  isDisabled?: boolean;
  notes?: string;
}

export interface PaginatedPatients {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PatientSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export const patientService = {
  /**
   * Créer un nouveau patient
   */
  async create(data: CreatePatientDto): Promise<Patient> {
    const response = await api.post<ApiResponse<Patient>>('/patients', data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Erreur lors de la création');
  },

  /**
   * Récupérer tous les patients
   */
  async getAll(params: PatientSearchParams = {}): Promise<PaginatedPatients> {
    const response = await api.get<ApiResponse<PaginatedPatients>>('/patients', { params });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Erreur lors de la récupération');
  },

  /**
   * Recherche rapide (autocomplete)
   */
  async quickSearch(query: string, limit: number = 10): Promise<Patient[]> {
    const response = await api.get<ApiResponse<Patient[]>>('/patients/search', {
      params: { q: query, limit },
    });
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Erreur lors de la recherche');
  },

  /**
   * Récupérer un patient par ID
   */
  async getById(id: string): Promise<Patient> {
    const response = await api.get<ApiResponse<Patient>>(`/patients/${id}`);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Patient non trouvé');
  },

  /**
   * Mettre à jour un patient
   */
  async update(id: string, data: Partial<CreatePatientDto>): Promise<Patient> {
    const response = await api.put<ApiResponse<Patient>>(`/patients/${id}`, data);
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    throw new Error(response.data.error?.message || 'Erreur lors de la mise à jour');
  },

  /**
   * Supprimer un patient
   */
  async delete(id: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/patients/${id}`);
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Erreur lors de la suppression');
    }
  },
};

export default patientService;
