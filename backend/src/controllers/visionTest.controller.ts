import { Response } from 'express';
import { body } from 'express-validator';
import { Station } from '@prisma/client';
import { AuthenticatedRequest } from '../types/index.js';
import { visionTestService } from '../services/visionTest.service.js';
import { queueService } from '../services/queue.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';

export const createVisionTestValidation = [
  body('patientId').isUUID().withMessage('ID patient invalide'),
  body('queueEntryId').optional().isUUID().withMessage('ID entrée invalide'),
  body('rightEye_sphere').optional(),
  body('rightEye_cylinder').optional(),
  body('rightEye_axis').optional(),
  body('rightEye_acuity').optional().trim(),
  body('rightEye_addition').optional(),
  body('leftEye_sphere').optional(),
  body('leftEye_cylinder').optional(),
  body('leftEye_axis').optional(),
  body('leftEye_acuity').optional().trim(),
  body('leftEye_addition').optional(),
  body('pupillaryDistance').optional(),
  body('notes').optional().trim(),
];

export class VisionTestController {
  /**
   * POST /api/vision-tests
   * Créer un test de vue
   */
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const technicianId = req.user!.userId;
      const { queueEntryId, ...testData } = req.body;

      const visionTest = await visionTestService.create({
        ...testData,
        technicianId,
      });

      // Si une entrée de file est fournie, terminer et transférer vers la consultation la moins chargée
      if (queueEntryId) {
        const leastBusyConsultation = await queueService.getLeastBusyConsultation();
        await queueService.completeService(queueEntryId, leastBusyConsultation);
      }

      sendSuccess(res, visionTest, 201, 'Test de vue enregistré');
    } catch (error) {
      console.error('Erreur création test:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de l\'enregistrement', 500);
    }
  }

  /**
   * GET /api/vision-tests/today
   * Tests du jour
   */
  async getTodayTests(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [tests, stats] = await Promise.all([
        visionTestService.getTodayTests(),
        visionTestService.getTodayStats(),
      ]);
      sendSuccess(res, { tests, stats });
    } catch (error) {
      console.error('Erreur tests du jour:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * GET /api/vision-tests/:id
   * Détail d'un test
   */
  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const test = await visionTestService.findById(req.params.id);
      if (!test) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Test non trouvé', 404);
        return;
      }
      sendSuccess(res, test);
    } catch (error) {
      console.error('Erreur détail test:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * GET /api/vision-tests/patient/:patientId
   * Tests d'un patient
   */
  async findByPatient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const tests = await visionTestService.findByPatient(req.params.patientId);
      sendSuccess(res, tests);
    } catch (error) {
      console.error('Erreur tests patient:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  /**
   * PUT /api/vision-tests/:id
   * Mettre à jour un test
   */
  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const test = await visionTestService.findById(req.params.id);
      if (!test) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Test non trouvé', 404);
        return;
      }

      const updated = await visionTestService.update(req.params.id, req.body);
      sendSuccess(res, updated, 200, 'Test mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour test:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour', 500);
    }
  }
}

export const visionTestController = new VisionTestController();
