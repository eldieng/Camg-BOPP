import api from './api';
import { ApiResponse } from '../types';

export interface VisionTest {
  id: string;
  patientId: string;
  technicianId: string;
  rightEye_sphere?: number;
  rightEye_cylinder?: number;
  rightEye_axis?: number;
  rightEye_acuity?: string;
  rightEye_addition?: number;
  leftEye_sphere?: number;
  leftEye_cylinder?: number;
  leftEye_axis?: number;
  leftEye_acuity?: string;
  leftEye_addition?: number;
  pupillaryDistance?: number;
  notes?: string;
  createdAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
  };
  technician: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateVisionTestDto {
  patientId: string;
  queueEntryId?: string;
  rightEye_sphere?: number;
  rightEye_cylinder?: number;
  rightEye_axis?: number;
  rightEye_acuity?: string;
  rightEye_addition?: number;
  leftEye_sphere?: number;
  leftEye_cylinder?: number;
  leftEye_axis?: number;
  leftEye_acuity?: string;
  leftEye_addition?: number;
  pupillaryDistance?: number;
  notes?: string;
}

export const visionTestService = {
  async create(data: CreateVisionTestDto): Promise<VisionTest> {
    const response = await api.post<ApiResponse<VisionTest>>('/vision-tests', data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getTodayTests(): Promise<{ tests: VisionTest[]; stats: { total: number } }> {
    const response = await api.get<ApiResponse<{ tests: VisionTest[]; stats: { total: number } }>>('/vision-tests/today');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getById(id: string): Promise<VisionTest> {
    const response = await api.get<ApiResponse<VisionTest>>(`/vision-tests/${id}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getByPatient(patientId: string): Promise<VisionTest[]> {
    const response = await api.get<ApiResponse<VisionTest[]>>(`/vision-tests/patient/${patientId}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },
};

export default visionTestService;
