import { Response } from 'express';
import { query } from 'express-validator';
import { AuthenticatedRequest } from '../types/index.js';
import { statsService } from '../services/stats.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';

export const periodValidation = [
  query('startDate').optional().isISO8601().withMessage('Date de début invalide'),
  query('endDate').optional().isISO8601().withMessage('Date de fin invalide'),
  query('days').optional().isInt({ min: 1, max: 90 }).toInt(),
];

export class StatsController {
  /**
   * GET /api/stats/today
   * Statistiques du jour
   */
  async getTodayStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await statsService.getTodayStats();
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Erreur stats du jour:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * GET /api/stats/queue
   * Statistiques par station
   */
  async getQueueStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await statsService.getQueueStatsByStation();
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Erreur stats file:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * GET /api/stats/doctors
   * Statistiques par médecin
   */
  async getDoctorStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await statsService.getDoctorStats();
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Erreur stats médecins:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * GET /api/stats/trend
   * Tendance sur plusieurs jours
   */
  async getDailyTrend(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const trend = await statsService.getDailyTrend(days);
      sendSuccess(res, trend);
    } catch (error) {
      console.error('Erreur tendance:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * GET /api/stats/period
   * Statistiques sur une période
   */
  async getPeriodStats(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date();
      
      const stats = await statsService.getPeriodStats(startDate, endDate);
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Erreur stats période:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }
}

export const statsController = new StatsController();
