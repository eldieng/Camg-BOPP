// Types utilisateur
export type UserRole = 'ACCUEIL' | 'TEST_VUE' | 'MEDECIN' | 'LUNETTES' | 'MEDICAMENTS' | 'BLOC' | 'PORTE' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  assignedRoom?: number | null;
  lastLogin?: string;
  createdAt?: string;
}

// Types authentification
export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  expiresIn: number;
}

// Types API
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

// Types Patient
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
  createdAt: string;
  updatedAt: string;
}

// Types Ticket
export type TicketStatus = 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
export type Priority = 'NORMAL' | 'ELDERLY' | 'PREGNANT' | 'DISABLED' | 'EMERGENCY';

export interface Ticket {
  id: string;
  ticketNumber: string;
  qrCode: string;
  patientId: string;
  patient?: Patient;
  priority: Priority;
  priorityReason?: string;
  status: TicketStatus;
  createdAt: string;
}

// Types File d'attente
export type Station = 'ACCUEIL' | 'TEST_VUE' | 'CONSULTATION' | 'LUNETTES' | 'MEDICAMENTS';
export type QueueStatus = 'WAITING' | 'CALLED' | 'IN_SERVICE' | 'COMPLETED' | 'SKIPPED';

export interface QueueEntry {
  id: string;
  ticketId: string;
  ticket?: Ticket;
  station: Station;
  position: number;
  status: QueueStatus;
  calledAt?: string;
  startedAt?: string;
  completedAt?: string;
}

// Navigation
export interface NavItem {
  label: string;
  path: string;
  icon: string;
  roles: UserRole[];
}
