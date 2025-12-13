import { UserRole } from '@prisma/client';
import { Request } from 'express';

// Types pour l'authentification
export interface JwtPayload {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

// Types pour les réponses API
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: ApiError;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// Types pour la pagination
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Types pour les statistiques
export interface DashboardStats {
  patients: {
    total: number;
    new: number;
    returning: number;
  };
  tickets: {
    total: number;
    waiting: number;
    inProgress: number;
    completed: number;
    cancelled: number;
  };
  waitTime: {
    average: number;
    min: number;
    max: number;
  };
}

// Types pour la file d'attente
export interface QueueDisplayData {
  currentNumbers: Record<string, string | null>;
  nextNumbers: string[];
  announcement?: {
    ticketNumber: string;
    station: string;
    message: string;
  };
}
