import { Response } from 'express';
import { body, param } from 'express-validator';
import { AuthenticatedRequest } from '../types/index.js';
import { adminService } from '../services/admin.service.js';
import { archivingService } from '../services/archiving.service.js';
import { auditLog } from '../services/auditLog.service.js';
import { tokenBlacklist } from '../services/tokenBlacklist.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';

export const createUserValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court (min 6)'),
  body('firstName').trim().notEmpty().withMessage('Prénom requis'),
  body('lastName').trim().notEmpty().withMessage('Nom requis'),
  body('role').isIn(['ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'MEDICAMENTS', 'BLOC', 'PORTE', 'ADMIN']).withMessage('Rôle invalide'),
];

export const updateUserValidation = [
  param('id').isUUID().withMessage('ID invalide'),
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('role').optional().isIn(['ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'MEDICAMENTS', 'BLOC', 'PORTE', 'ADMIN']),
  body('isActive').optional().isBoolean(),
];

export const resetPasswordValidation = [
  param('id').isUUID().withMessage('ID invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court'),
];

export class AdminController {
  /**
   * GET /api/admin/users
   */
  async getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const users = await adminService.getAllUsers();
      sendSuccess(res, users);
    } catch (error) {
      console.error('Erreur liste utilisateurs:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * GET /api/admin/users/:id
   */
  async getUserById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await adminService.getUserById(req.params.id);
      if (!user) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Utilisateur non trouvé', 404);
        return;
      }
      sendSuccess(res, user);
    } catch (error) {
      console.error('Erreur détail utilisateur:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * POST /api/admin/users
   */
  async createUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await adminService.createUser(req.body);
      sendSuccess(res, user, 201, 'Utilisateur créé avec succès');
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      if (error instanceof Error && error.message.includes('existe déjà')) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, error.message, 400);
        return;
      }
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la création', 500);
    }
  }

  /**
   * PUT /api/admin/users/:id
   */
  async updateUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await adminService.updateUser(req.params.id, req.body);
      sendSuccess(res, user, 200, 'Utilisateur mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour utilisateur:', error);
      if (error instanceof Error && error.message.includes('existe déjà')) {
        sendError(res, ErrorCodes.VALIDATION_ERROR, error.message, 400);
        return;
      }
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour', 500);
    }
  }

  /**
   * POST /api/admin/users/:id/reset-password
   */
  async resetPassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await adminService.resetPassword(req.params.id, req.body.password);
      sendSuccess(res, null, 200, 'Mot de passe réinitialisé');
    } catch (error) {
      console.error('Erreur reset password:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la réinitialisation', 500);
    }
  }

  /**
   * POST /api/admin/users/:id/toggle-status
   */
  async toggleStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const user = await adminService.toggleUserStatus(req.params.id);
      sendSuccess(res, user, 200, `Utilisateur ${user.isActive ? 'activé' : 'désactivé'}`);
    } catch (error) {
      console.error('Erreur toggle status:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors du changement de statut', 500);
    }
  }

  /**
   * DELETE /api/admin/users/:id
   */
  async deleteUser(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await adminService.deleteUser(req.params.id);
      sendSuccess(res, null, 200, 'Utilisateur supprimé');
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la suppression', 500);
    }
  }

  /**
   * GET /api/admin/users/stats
   */
  async getUserStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await adminService.getUserStats();
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Erreur stats utilisateurs:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * GET /api/admin/database/stats
   * Statistiques de la base de données
   */
  async getDatabaseStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await archivingService.getDatabaseStats();
      const auditLogsByPeriod = await archivingService.getAuditLogsByPeriod();
      const blacklistSize = await tokenBlacklist.size();
      
      sendSuccess(res, {
        tables: stats,
        auditLogsByPeriod,
        security: {
          blacklistedTokens: blacklistSize,
          usingRedis: tokenBlacklist.isUsingRedis(),
        },
      });
    } catch (error) {
      console.error('Erreur stats DB:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * POST /api/admin/database/archive
   * Lancer l'archivage manuel
   */
  async runArchiving(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // Log l'action
      await auditLog.log({
        action: 'USER_UPDATE',
        userId: req.user?.id,
        entity: 'SYSTEM',
        details: { action: 'MANUAL_ARCHIVING' },
      });

      const results = await archivingService.runFullArchive();
      sendSuccess(res, results, 200, 'Archivage terminé');
    } catch (error) {
      console.error('Erreur archivage:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de l\'archivage', 500);
    }
  }

  /**
   * GET /api/admin/audit-logs
   * Récupérer les logs d'audit avec pagination
   */
  async getAuditLogs(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { userId, action, startDate, endDate, limit = '100', offset = '0' } = req.query;
      
      const result = await auditLog.getLogs({
        userId: userId as string,
        action: action as any,
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        limit: parseInt(limit as string, 10),
        offset: parseInt(offset as string, 10),
      });
      
      sendSuccess(res, result);
    } catch (error) {
      console.error('Erreur audit logs:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * GET /api/admin/security/failed-logins
   * Récupérer les tentatives de connexion échouées
   */
  async getFailedLogins(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const hours = parseInt(req.query.hours as string, 10) || 24;
      const failedLogins = await auditLog.getFailedLogins(hours);
      sendSuccess(res, failedLogins);
    } catch (error) {
      console.error('Erreur failed logins:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }
}

export const adminController = new AdminController();
