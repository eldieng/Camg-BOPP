import { Response } from 'express';
import { ApiResponse, ApiError, ValidationError } from '../types/index.js';

/**
 * Envoie une réponse de succès
 */
export function sendSuccess<T>(
  res: Response,
  data: T,
  statusCode: number = 200,
  message?: string
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
}

/**
 * Envoie une réponse d'erreur
 */
export function sendError(
  res: Response,
  code: string,
  message: string,
  statusCode: number = 400,
  details?: ValidationError[]
): void {
  const error: ApiError = {
    code,
    message,
    details,
  };
  const response: ApiResponse = {
    success: false,
    error,
  };
  res.status(statusCode).json(response);
}

// Codes d'erreur standards
export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
