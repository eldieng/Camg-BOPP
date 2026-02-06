import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// Instance Axios configurée
export const api = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60s timeout pour gérer le cold start de Render
  headers: {
    'Content-Type': 'application/json',
  },
});

// Warm-up : ping le backend au chargement pour le réveiller
let isServerWarm = false;

export async function warmUpServer(): Promise<boolean> {
  if (isServerWarm) return true;
  try {
    await axios.get(`${API_URL}/health`, { timeout: 60000 });
    isServerWarm = true;
    return true;
  } catch {
    return false;
  }
}

// Lancer le warm-up immédiatement au chargement du module
warmUpServer();

// Intercepteur pour ajouter le token
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    if (error.response?.status === 401) {
      // Token expiré ou invalide
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
