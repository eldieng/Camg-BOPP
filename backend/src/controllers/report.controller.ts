import { Request, Response } from 'express';
import { reportService } from '../services/report.service.js';

export class ReportController {
  /**
   * Obtenir les statistiques pour une période
   */
  async getStats(req: Request, res: Response) {
    try {
      const { startDate, endDate } = req.query;

      let start: Date;
      let end: Date;

      if (startDate && endDate) {
        start = new Date(startDate as string);
        end = new Date(endDate as string);
        end.setHours(23, 59, 59, 999);
      } else {
        // Par défaut: mois en cours
        const now = new Date();
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      }

      const stats = await reportService.getStats(start, end);

      res.json({
        success: true,
        data: stats,
      });
    } catch (error) {
      console.error('Erreur getStats:', error);
      res.status(500).json({
        success: false,
        error: { message: 'Erreur lors de la récupération des statistiques' },
      });
    }
  }

  /**
   * Obtenir le rapport complet d'un patient
   */
  async getPatientReport(req: Request, res: Response) {
    try {
      const { patientId } = req.params;

      if (!patientId) {
        return res.status(400).json({
          success: false,
          error: { message: 'ID patient requis' },
        });
      }

      const report = await reportService.getPatientReport(patientId);

      res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      console.error('Erreur getPatientReport:', error);
      const message = error instanceof Error ? error.message : 'Erreur lors de la récupération du rapport';
      res.status(500).json({
        success: false,
        error: { message },
      });
    }
  }
}

export const reportController = new ReportController();
