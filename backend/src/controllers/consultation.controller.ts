import { Response } from 'express';
import { body, param } from 'express-validator';
import { AuthenticatedRequest } from '../types/index.js';
import { consultationService } from '../services/consultation.service.js';
import { queueService } from '../services/queue.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';

export const createConsultationValidation = [
  body('patientId').isUUID().withMessage('ID patient invalide'),
  body('queueEntryId').optional().isUUID().withMessage('ID entrée invalide'),
  body('chiefComplaint').optional().trim(),
  body('diagnosis').optional().trim(),
  body('notes').optional().trim(),
  body('intraocularPressureOD').optional().isFloat().withMessage('Valeur invalide'),
  body('intraocularPressureOG').optional().isFloat().withMessage('Valeur invalide'),
  body('prescriptions').optional().isArray(),
  body('prescriptions.*.eyeType').optional().isIn(['OD', 'OG']).withMessage('Type œil invalide'),
  body('prescriptions.*.sphere').optional().isFloat(),
  body('prescriptions.*.cylinder').optional().isFloat(),
  body('prescriptions.*.axis').optional().isInt({ min: 0, max: 180 }),
  body('prescriptions.*.addition').optional().isFloat(),
];

export class ConsultationController {
  async create(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const doctorId = req.user?.userId;
      const { queueEntryId, ...consultationData } = req.body;

      const consultation = await consultationService.create({
        ...consultationData,
        doctorId,
      });

      // Note: Le frontend gère maintenant completeService séparément
      // pour permettre l'envoi vers la station Lunettes

      sendSuccess(res, consultation, 201, 'Consultation enregistrée');
    } catch (error) {
      console.error('Erreur création consultation:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de l\'enregistrement', 500);
    }
  }

  async getTodayConsultations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const [consultations, stats] = await Promise.all([
        consultationService.getTodayConsultations(),
        consultationService.getTodayStats(),
      ]);
      sendSuccess(res, { consultations, stats });
    } catch (error) {
      console.error('Erreur consultations du jour:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async findById(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const consultation = await consultationService.findById(req.params.id);
      if (!consultation) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Consultation non trouvée', 404);
        return;
      }
      sendSuccess(res, consultation);
    } catch (error) {
      console.error('Erreur détail consultation:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async findByPatient(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const consultations = await consultationService.findByPatient(req.params.patientId);
      sendSuccess(res, consultations);
    } catch (error) {
      console.error('Erreur consultations patient:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async getPatientHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const history = await consultationService.getPatientHistory(req.params.patientId);
      if (!history.patient) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Patient non trouvé', 404);
        return;
      }
      sendSuccess(res, history);
    } catch (error) {
      console.error('Erreur historique patient:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async update(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const consultation = await consultationService.findById(req.params.id);
      if (!consultation) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Consultation non trouvée', 404);
        return;
      }

      const updated = await consultationService.update(req.params.id, req.body);
      sendSuccess(res, updated, 200, 'Consultation mise à jour');
    } catch (error) {
      console.error('Erreur mise à jour consultation:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour', 500);
    }
  }
}

export const consultationController = new ConsultationController();
