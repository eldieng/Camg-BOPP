import { Response } from 'express';
import { body, param, query } from 'express-validator';
import { AuthenticatedRequest } from '../types/index.js';
import { referralService } from '../services/referral.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';

export const createReferralValidation = [
  body('patientId').isUUID().withMessage('ID patient invalide'),
  body('reason').isIn(['SERVICE_UNAVAILABLE', 'EQUIPMENT_MISSING', 'SPECIALIST_NEEDED', 'EMERGENCY', 'PATIENT_CHOICE', 'OTHER']).withMessage('Raison invalide'),
  body('serviceNeeded').trim().notEmpty().withMessage('Service requis obligatoire'),
  body('externalClinic').trim().notEmpty().withMessage('Structure externe obligatoire'),
  body('consultationId').optional().isUUID(),
  body('customReason').optional().trim(),
  body('externalDoctor').optional().trim(),
  body('externalPhone').optional().trim(),
  body('externalAddress').optional().trim(),
  body('appointmentDate').optional().isISO8601(),
  body('diagnosis').optional().trim(),
  body('notes').optional().trim(),
];

export const updateReferralValidation = [
  param('id').isUUID().withMessage('ID invalide'),
  body('status').optional().isIn(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'LOST']),
  body('appointmentDate').optional().isISO8601(),
  body('completedDate').optional().isISO8601(),
  body('treatmentNotes').optional().trim(),
  body('followUpNeeded').optional().isBoolean(),
  body('followUpDate').optional().isISO8601(),
  body('notes').optional().trim(),
];

export class ReferralController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const referral = await referralService.create({
        ...req.body,
        referredBy: req.user!.id,
      });
      sendSuccess(res, referral, 201, 'Orientation créée');
    } catch (error) {
      console.error('Erreur création orientation:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la création', 500);
    }
  }

  async findAll(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as any,
        reason: req.query.reason as any,
        patientId: req.query.patientId as string,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };
      const referrals = await referralService.findAll(filters);
      sendSuccess(res, referrals);
    } catch (error) {
      console.error('Erreur liste orientations:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const referral = await referralService.findById(req.params.id);
      if (!referral) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Orientation non trouvée', 404);
        return;
      }
      sendSuccess(res, referral);
    } catch (error) {
      console.error('Erreur détail orientation:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const referral = await referralService.update(req.params.id, req.body);
      sendSuccess(res, referral, 200, 'Orientation mise à jour');
    } catch (error) {
      console.error('Erreur mise à jour orientation:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour', 500);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { status, notes } = req.body;
      const referral = await referralService.updateStatus(req.params.id, status, notes);
      sendSuccess(res, referral, 200, 'Statut mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour', 500);
    }
  }

  async getPendingFollowUps(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const followUps = await referralService.getPendingFollowUps();
      sendSuccess(res, followUps);
    } catch (error) {
      console.error('Erreur suivis en attente:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const stats = await referralService.getStats(startDate, endDate);
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Erreur stats orientations:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }
}

export const referralController = new ReferralController();
