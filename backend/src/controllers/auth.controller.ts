import { Response } from 'express';
import { body } from 'express-validator';
import { AuthenticatedRequest } from '../types/index.js';
import { authService, LoginError } from '../services/auth.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';
import { tokenBlacklist } from '../services/tokenBlacklist.service.js';
import { auditLog } from '../services/auditLog.service.js';

/**
 * Validations pour le login
 */
export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Format email invalide')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Le mot de passe est requis'),
];

/**
 * Validations pour le changement de mot de passe
 */
export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Le mot de passe actuel est requis'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('Le nouveau mot de passe doit contenir au moins 6 caractères'),
];

/**
 * Contrôleur d'authentification
 */
export class AuthController {
  /**
   * POST /auth/login
   * Connexion utilisateur
   */
  async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.socket.remoteAddress;

    const result = await authService.login(email, password);

    // Vérifier si c'est une erreur
    if ('code' in result) {
      const error = result as LoginError;
      
      // Log de tentative échouée
      await auditLog.log({
        action: 'LOGIN_FAILED',
        entity: 'AUTH',
        details: { email, reason: error.message },
        ipAddress,
      });
      
      sendError(res, error.code, error.message, 401);
      return;
    }

    // Log de connexion réussie
    await auditLog.log({
      action: 'LOGIN',
      userId: result.user.id,
      entity: 'AUTH',
      details: { email },
      ipAddress,
    });

    sendSuccess(res, result, 200, 'Connexion réussie');
  }

  /**
   * POST /auth/logout
   * Déconnexion - blackliste le token JWT
   */
  async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    const token = (req as any).token;
    const ipAddress = req.ip || req.socket.remoteAddress;
    
    if (token && req.user) {
      // Calculer l'expiration du token (24h par défaut)
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);
      
      // Ajouter le token à la blacklist
      tokenBlacklist.add(token, expiresAt);
      
      // Log de déconnexion
      await auditLog.log({
        action: 'LOGOUT',
        userId: req.user.userId,
        entity: 'AUTH',
        ipAddress,
      });
    }
    
    sendSuccess(res, null, 200, 'Déconnexion réussie');
  }

  /**
   * GET /auth/me
   * Informations de l'utilisateur connecté
   */
  async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Non authentifié', 401);
      return;
    }

    const user = await authService.getCurrentUser(req.user.userId);

    if (!user) {
      sendError(res, ErrorCodes.NOT_FOUND, 'Utilisateur non trouvé', 404);
      return;
    }

    sendSuccess(res, user);
  }

  /**
   * PUT /auth/password
   * Changer le mot de passe
   */
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      sendError(res, ErrorCodes.UNAUTHORIZED, 'Non authentifié', 401);
      return;
    }

    const { currentPassword, newPassword } = req.body;

    const result = await authService.changePassword(
      req.user.userId,
      currentPassword,
      newPassword
    );

    if (!result.success) {
      sendError(res, ErrorCodes.VALIDATION_ERROR, result.message, 400);
      return;
    }

    sendSuccess(res, null, 200, result.message);
  }
}

export const authController = new AuthController();
