import api from './api';
import { LoginCredentials, AuthResponse, User, ApiResponse } from '../types';

export const authService = {
  /**
   * Connexion utilisateur
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', credentials);
    
    if (response.data.success && response.data.data) {
      const { token, user } = response.data.data;
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Erreur de connexion');
  },

  /**
   * Déconnexion
   */
  async logout(): Promise<void> {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  },

  /**
   * Récupérer l'utilisateur connecté
   */
  async getCurrentUser(): Promise<User> {
    const response = await api.get<ApiResponse<User>>('/auth/me');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.error?.message || 'Erreur lors de la récupération de l\'utilisateur');
  },

  /**
   * Changer le mot de passe
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    const response = await api.put<ApiResponse>('/auth/password', {
      currentPassword,
      newPassword,
    });
    
    if (!response.data.success) {
      throw new Error(response.data.error?.message || 'Erreur lors du changement de mot de passe');
    }
  },

  /**
   * Vérifier si l'utilisateur est connecté
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('token');
  },

  /**
   * Récupérer l'utilisateur stocké localement
   */
  getStoredUser(): User | null {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as User;
      } catch {
        return null;
      }
    }
    return null;
  },

  /**
   * Récupérer le token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  },
};

export default authService;
