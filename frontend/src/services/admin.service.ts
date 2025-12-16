import api from './api';
import { ApiResponse } from '../types';

export type UserRole = 'ACCUEIL' | 'TEST_VUE' | 'MEDECIN' | 'LUNETTES' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

export interface CreateUserDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface UpdateUserDto {
  email?: string;
  firstName?: string;
  lastName?: string;
  role?: UserRole;
  isActive?: boolean;
}

export interface UserStats {
  total: number;
  active: number;
  inactive: number;
  byRole: { role: UserRole; count: number }[];
}

export const adminService = {
  async getAllUsers(): Promise<User[]> {
    const response = await api.get<ApiResponse<User[]>>('/admin/users');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async getUserById(id: string): Promise<User> {
    const response = await api.get<ApiResponse<User>>(`/admin/users/${id}`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async createUser(data: CreateUserDto): Promise<User> {
    const response = await api.post<ApiResponse<User>>('/admin/users', data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async updateUser(id: string, data: UpdateUserDto): Promise<User> {
    const response = await api.put<ApiResponse<User>>(`/admin/users/${id}`, data);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async resetPassword(id: string, password: string): Promise<void> {
    const response = await api.post<ApiResponse>(`/admin/users/${id}/reset-password`, { password });
    if (!response.data.success) throw new Error(response.data.error?.message || 'Erreur');
  },

  async toggleStatus(id: string): Promise<User> {
    const response = await api.post<ApiResponse<User>>(`/admin/users/${id}/toggle-status`);
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  async deleteUser(id: string): Promise<void> {
    const response = await api.delete<ApiResponse>(`/admin/users/${id}`);
    if (!response.data.success) throw new Error(response.data.error?.message || 'Erreur');
  },

  async getUserStats(): Promise<UserStats> {
    const response = await api.get<ApiResponse<UserStats>>('/admin/users/stats');
    if (response.data.success && response.data.data) return response.data.data;
    throw new Error(response.data.error?.message || 'Erreur');
  },

  getRoleLabel: (r: UserRole) => ({ ACCUEIL: 'Accueil', TEST_VUE: 'Test Vue', MEDECIN: 'Médecin', LUNETTES: 'Lunettes', ADMIN: 'Admin' }[r]),
  getRoleColor: (r: UserRole) => ({ ACCUEIL: 'bg-blue-100 text-blue-800', TEST_VUE: 'bg-purple-100 text-purple-800', MEDECIN: 'bg-green-100 text-green-800', LUNETTES: 'bg-orange-100 text-orange-800', ADMIN: 'bg-red-100 text-red-800' }[r]),
};

export default adminService;
