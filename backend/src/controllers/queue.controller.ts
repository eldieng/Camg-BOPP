import { Response } from 'express';
import { param, body } from 'express-validator';
import { AuthenticatedRequest } from '../types/index.js';
import { queueService } from '../services/queue.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';
import { Station } from '@prisma/client';

export const stationValidation = [
  param('station')
    .isIn(['ACCUEIL', 'TEST_VUE', 'CONSULTATION', 'LUNETTES'])
    .withMessage('Station invalide'),
];

export const entryIdValidation = [
  param('entryId').isUUID().withMessage('ID entrée invalide'),
];

export const completeServiceValidation = [
  param('entryId').isUUID().withMessage('ID entrée invalide'),
  body('nextStation')
    .optional()
    .isIn(['ACCUEIL', 'TEST_VUE', 'CONSULTATION', 'LUNETTES'])
    .withMessage('Station invalide'),
];

export class QueueController {
  /**
   * GET /api/queue/:station
   * File d'attente d'une station
   */
  async getQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const station = req.params.station as Station;
      const queue = await queueService.getQueueByStation(station);
      const stats = await queueService.getStationStats(station);
      sendSuccess(res, { queue, stats });
    } catch (error) {
      console.error('Erreur file d\'attente:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * POST /api/queue/:station/call-next
   * Appeler le prochain patient
   * Body: { roomNumber?: number } - Numéro de salle spécifique pour CONSULTATION
   */
  async callNext(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const station = req.params.station as Station;
      const userId = req.user!.id;
      const roomNumber = req.body.roomNumber as number | undefined;
      
      const entry = await queueService.callNext(station, userId, roomNumber);
      
      if (!entry) {
        sendSuccess(res, null, 200, 'Aucun patient en attente');
        return;
      }
      
      sendSuccess(res, entry, 200, 'Patient appelé');
    } catch (error) {
      console.error('Erreur appel patient:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de l\'appel', 500);
    }
  }

  /**
   * POST /api/queue/:entryId/start
   * Démarrer le service
   */
  async startService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { entryId } = req.params;
      const userId = req.user!.id;
      
      const entry = await queueService.startService(entryId, userId);
      sendSuccess(res, entry, 200, 'Service démarré');
    } catch (error) {
      console.error('Erreur démarrage service:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors du démarrage', 500);
    }
  }

  /**
   * POST /api/queue/:entryId/complete
   * Terminer le service
   */
  async completeService(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { entryId } = req.params;
      const nextStation = req.body.nextStation as Station | undefined;
      
      const entry = await queueService.completeService(entryId, nextStation);
      sendSuccess(res, entry, 200, nextStation ? 'Patient transféré' : 'Service terminé');
    } catch (error) {
      console.error('Erreur fin service:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la fin du service', 500);
    }
  }

  /**
   * POST /api/queue/:entryId/no-show
   * Marquer comme absent
   */
  async markNoShow(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { entryId } = req.params;
      const entry = await queueService.markNoShow(entryId);
      sendSuccess(res, entry, 200, 'Patient marqué absent');
    } catch (error) {
      console.error('Erreur marquage absent:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors du marquage', 500);
    }
  }

  /**
   * GET /api/queue/:station/stats
   * Statistiques d'une station
   */
  async getStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const station = req.params.station as Station;
      const stats = await queueService.getStationStats(station);
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Erreur stats:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }
}

export const queueController = new QueueController();
