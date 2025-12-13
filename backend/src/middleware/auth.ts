import { Response, NextFunction } from 'express';
import { UserRole } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt.js';
import { sendError, ErrorCodes } from '../utils/response.js';

/**
 * Middleware d'authentification
 * Vérifie la présence et la validité du token JWT
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractTokenFromHeader(req.headers.authorization);

  if (!token) {
    sendError(res, ErrorCodes.UNAUTHORIZED, 'Token d\'authentification requis', 401);
    return;
  }

  const payload = verifyToken(token);

  if (!payload) {
    sendError(res, ErrorCodes.UNAUTHORIZED, 'Token invalide ou expiré', 401);
    return;
  }

  req.user = payload;
  next();
}

/**
 * Middleware d'autorisation par rôle
 * Vérifie que l'utilisateur a l'un des rôles autorisés
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Non authentifié', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        ErrorCodes.FORBIDDEN,
        'Accès refusé. Vous n\'avez pas les permissions nécessaires.',
        403
      );
      return;
    }

    next();
  };
}

/**
 * Middleware combiné: authentification + autorisation
 */
export function requireRole(...roles: UserRole[]) {
  return [authenticate, authorize(...roles)];
}
