import { Response } from 'express';
import { body } from 'express-validator';
import { gateService } from '../services/gate.service.js';
import { AuthenticatedRequest } from '../types/index.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';

export class GateController {
  // Validation rules
  static walkInValidation = [
    body('firstName').notEmpty().withMessage('Prénom requis'),
    body('lastName').notEmpty().withMessage('Nom requis'),
    body('phone').optional().isString(),
    body('priority').optional().isIn(['NORMAL', 'ELDERLY', 'PREGNANT', 'DISABLED', 'EMERGENCY']),
    body('notes').optional().isString(),
    body('patientId').optional().isUUID(),
  ];

  /**
   * GET /api/gate/today
   * Liste du jour : RDV attendus + arrivés + walk-ins
   */
  async getToday(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const result = await gateService.getTodayList();
      sendSuccess(res, result);
    } catch (error) {
      console.error('Erreur getTodayList:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors du chargement de la liste', 500);
    }
  }

  /**
   * PATCH /api/gate/:id/arrived
   * Cocher un patient comme arrivé
   */
  async markArrived(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const entry = await gateService.markArrived(req.params.id);
      sendSuccess(res, entry);
    } catch (error) {
      console.error('Erreur markArrived:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors du pointage', 500);
    }
  }

  /**
   * PATCH /api/gate/:id/send
   * Envoyer le patient à l'accueil
   */
  async sendToAccueil(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const entry = await gateService.sendToAccueil(req.params.id);
      sendSuccess(res, entry);
    } catch (error) {
      console.error('Erreur sendToAccueil:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de l\'envoi', 500);
    }
  }

  /**
   * PATCH /api/gate/:id/no-show
   * Marquer absent
   */
  async markNoShow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const entry = await gateService.markNoShow(req.params.id);
      sendSuccess(res, entry);
    } catch (error) {
      console.error('Erreur markNoShow:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors du marquage absent', 500);
    }
  }

  /**
   * PATCH /api/gate/:id/registered
   * Marquer comme enregistré (ticket créé)
   */
  async markRegistered(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const entry = await gateService.markRegistered(req.params.id);
      sendSuccess(res, entry);
    } catch (error) {
      console.error('Erreur markRegistered:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour', 500);
    }
  }

  /**
   * POST /api/gate/walk-in
   * Ajouter un patient sans RDV
   */
  async addWalkIn(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const entry = await gateService.addWalkIn(req.body);
      sendSuccess(res, entry, 201);
    } catch (error) {
      console.error('Erreur addWalkIn:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de l\'ajout', 500);
    }
  }

  /**
   * GET /api/gate/arrived
   * Patients arrivés et envoyés à l'accueil (pour la page Accueil)
   */
  async getArrivedForAccueil(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const entries = await gateService.getArrivedForAccueil();
      sendSuccess(res, entries);
    } catch (error) {
      console.error('Erreur getArrivedForAccueil:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors du chargement', 500);
    }
  }
}

export const gateController = new GateController();
