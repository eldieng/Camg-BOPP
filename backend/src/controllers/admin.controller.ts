import { Response } from 'express';
import { body, param } from 'express-validator';
import { AuthenticatedRequest } from '../types/index.js';
import { adminService } from '../services/admin.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';

export const createUserValidation = [
  body('email').isEmail().withMessage('Email invalide'),
  body('password').isLength({ min: 6 }).withMessage('Mot de passe trop court (min 6)'),
  body('firstName').trim().notEmpty().withMessage('Prénom requis'),
  body('lastName').trim().notEmpty().withMessage('Nom requis'),
  body('role').isIn(['ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'ADMIN']).withMessage('Rôle invalide'),
];

export const updateUserValidation = [
  param('id').isUUID().withMessage('ID invalide'),
  body('email').optional().isEmail().withMessage('Email invalide'),
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('role').optional().isIn(['ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'ADMIN']),
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
}

export const adminController = new AdminController();
