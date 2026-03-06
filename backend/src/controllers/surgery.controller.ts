import { Response } from 'express';
import { body, param, query } from 'express-validator';
import { AuthenticatedRequest } from '../types/index.js';
import { surgeryService } from '../services/surgery.service.js';
import { sendSuccess, sendError, ErrorCodes } from '../utils/response.js';

// ============================================
// Validations - Analyses
// ============================================

export const createAnalysisValidation = [
  body('patientId').isUUID().withMessage('ID patient invalide'),
  body('consultationId').optional().isUUID().withMessage('ID consultation invalide'),
  body('type')
    .notEmpty().withMessage('Le type d\'analyse est requis')
    .isIn(['GLYCEMIE', 'TENSION_ARTERIELLE', 'RADIOLOGIE', 'ECHOGRAPHIE', 'BILAN_SANGUIN', 'NFS', 'GROUPE_SANGUIN', 'BIOCHIMIE', 'AUTRE'])
    .withMessage('Type d\'analyse invalide'),
  body('customType').optional().trim(),
  body('notes').optional().trim(),
];

export const createMultipleAnalysesValidation = [
  body('patientId').isUUID().withMessage('ID patient invalide'),
  body('consultationId').optional().isUUID().withMessage('ID consultation invalide'),
  body('types').isArray({ min: 1 }).withMessage('Au moins un type d\'analyse est requis'),
];

export const updateAnalysisValidation = [
  param('id').isUUID().withMessage('ID analyse invalide'),
  body('status').optional().isIn(['PRESCRIBED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).withMessage('Statut invalide'),
  body('results').optional().trim(),
  body('resultValue').optional().isFloat().withMessage('Valeur numérique invalide'),
  body('normalRange').optional().trim(),
  body('isNormal').optional().isBoolean().withMessage('isNormal doit être un booléen'),
  body('notes').optional().trim(),
];

// ============================================
// Validations - Surgeries
// ============================================

export const createSurgeryValidation = [
  body('patientId').isUUID().withMessage('ID patient invalide'),
  body('consultationId').optional().isUUID().withMessage('ID consultation invalide'),
  body('surgeonId').optional().isUUID().withMessage('ID chirurgien invalide'),
  body('type')
    .notEmpty().withMessage('Le type d\'opération est requis')
    .isIn(['CATARACTE', 'GLAUCOME', 'PTERYGION', 'STRABISME', 'DECOLLEMENT_RETINE', 'GREFFE_CORNEE', 'LASER', 'AUTRE'])
    .withMessage('Type d\'opération invalide'),
  body('customType').optional().trim(),
  body('operatedEye').optional().isIn(['OD', 'OG', 'LES_DEUX']).withMessage('Œil opéré invalide'),
  body('diagnosis').optional().trim(),
  body('anesthesiaType').optional().trim(),
  body('notes').optional().trim(),
];

export const updateSurgeryValidation = [
  param('id').isUUID().withMessage('ID chirurgie invalide'),
  body('surgeonId').optional().isUUID(),
  body('type').optional().isIn(['CATARACTE', 'GLAUCOME', 'PTERYGION', 'STRABISME', 'DECOLLEMENT_RETINE', 'GREFFE_CORNEE', 'LASER', 'AUTRE']),
  body('operatedEye').optional().isIn(['OD', 'OG', 'LES_DEUX']),
  body('status').optional().isIn(['WAITING_ANALYSIS', 'ANALYSIS_COMPLETE', 'ELIGIBLE', 'NOT_ELIGIBLE', 'SCHEDULED', 'PRE_OP', 'IN_SURGERY', 'POST_OP', 'COMPLETED', 'CANCELLED']),
  body('scheduledDate').optional().isISO8601(),
  body('scheduledTime').optional().trim(),
  body('anesthesiaType').optional().trim(),
  body('diagnosis').optional().trim(),
  body('operativeNotes').optional().trim(),
  body('complications').optional().trim(),
  body('consentSigned').optional().isBoolean(),
  body('notes').optional().trim(),
];

// ============================================
// Validations - Follow-ups
// ============================================

export const createFollowUpValidation = [
  body('surgeryId').isUUID().withMessage('ID chirurgie invalide'),
  body('dayNumber').isInt({ min: 1 }).withMessage('Numéro de jour invalide'),
  body('scheduledDate').optional().isISO8601(),
  body('visualAcuity').optional().trim(),
  body('intraocularPressure').optional().isFloat(),
  body('woundStatus').optional().trim(),
  body('complications').optional().trim(),
  body('treatment').optional().trim(),
  body('notes').optional().trim(),
];

export const updateFollowUpValidation = [
  param('id').isUUID().withMessage('ID suivi invalide'),
  body('actualDate').optional().isISO8601(),
  body('visualAcuity').optional().trim(),
  body('intraocularPressure').optional().isFloat(),
  body('woundStatus').optional().trim(),
  body('complications').optional().trim(),
  body('treatment').optional().trim(),
  body('notes').optional().trim(),
  body('isCompleted').optional().isBoolean(),
];

// ============================================
// Controller
// ============================================

export class SurgeryController {
  // ---- ANALYSES ----

  async createAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const analysis = await surgeryService.createAnalysis(req.body);
      sendSuccess(res, analysis, 201, 'Analyse prescrite avec succès');
    } catch (error) {
      console.error('Erreur création analyse:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la prescription de l\'analyse', 500);
    }
  }

  async createMultipleAnalyses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { patientId, consultationId, types } = req.body;
      const analyses = await surgeryService.createMultipleAnalyses(patientId, consultationId, types);
      sendSuccess(res, analyses, 201, `${analyses.length} analyses prescrites`);
    } catch (error) {
      console.error('Erreur création analyses multiples:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la prescription des analyses', 500);
    }
  }

  async getAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const analysis = await surgeryService.getAnalysisById(req.params.id);
      if (!analysis) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Analyse non trouvée', 404);
        return;
      }
      sendSuccess(res, analysis);
    } catch (error) {
      console.error('Erreur récupération analyse:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async updateAnalysis(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const analysis = await surgeryService.updateAnalysis(req.params.id, req.body);
      sendSuccess(res, analysis, 200, 'Analyse mise à jour');
    } catch (error) {
      console.error('Erreur mise à jour analyse:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour', 500);
    }
  }

  async getPatientAnalyses(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const analyses = await surgeryService.getAnalysesByPatient(req.params.patientId);
      sendSuccess(res, analyses);
    } catch (error) {
      console.error('Erreur récupération analyses patient:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async getPendingAnalyses(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const analyses = await surgeryService.getPendingAnalyses();
      sendSuccess(res, analyses);
    } catch (error) {
      console.error('Erreur récupération analyses en attente:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  // ---- SURGERIES ----

  async createSurgery(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const surgery = await surgeryService.createSurgery(req.body);
      sendSuccess(res, surgery, 201, 'Opération créée avec succès');
    } catch (error) {
      console.error('Erreur création chirurgie:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la création', 500);
    }
  }

  async getSurgery(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const surgery = await surgeryService.getSurgeryById(req.params.id);
      if (!surgery) {
        sendError(res, ErrorCodes.NOT_FOUND, 'Opération non trouvée', 404);
        return;
      }
      sendSuccess(res, surgery);
    } catch (error) {
      console.error('Erreur récupération chirurgie:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async updateSurgery(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const surgery = await surgeryService.updateSurgery(req.params.id, req.body);
      sendSuccess(res, surgery, 200, 'Opération mise à jour');
    } catch (error) {
      console.error('Erreur mise à jour chirurgie:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour', 500);
    }
  }

  async getPatientSurgeries(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const surgeries = await surgeryService.getSurgeriesByPatient(req.params.patientId);
      sendSuccess(res, surgeries);
    } catch (error) {
      console.error('Erreur récupération chirurgies patient:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async getScheduledSurgeries(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const date = req.query.date as string | undefined;
      const surgeries = await surgeryService.getScheduledSurgeries(date);
      sendSuccess(res, surgeries);
    } catch (error) {
      console.error('Erreur récupération planning:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async getWaitingList(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const surgeries = await surgeryService.getWaitingList();
      sendSuccess(res, surgeries);
    } catch (error) {
      console.error('Erreur récupération liste d\'attente:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async getAllSurgeries(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const params = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        status: req.query.status as string | undefined,
      };
      const result = await surgeryService.getAllSurgeries(params);
      sendSuccess(res, result);
    } catch (error) {
      console.error('Erreur récupération chirurgies:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  // ---- FOLLOW-UPS ----

  async createFollowUp(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const followUp = await surgeryService.createFollowUp(req.body);
      sendSuccess(res, followUp, 201, 'Suivi post-opératoire créé');
    } catch (error) {
      console.error('Erreur création suivi:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la création', 500);
    }
  }

  async createDefaultFollowUps(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { surgeryId, surgeryDate } = req.body;
      const followUps = await surgeryService.createDefaultFollowUps(surgeryId, new Date(surgeryDate));
      sendSuccess(res, followUps, 201, 'Suivis post-opératoires créés (J+1, J+7, J+30)');
    } catch (error) {
      console.error('Erreur création suivis par défaut:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la création', 500);
    }
  }

  async updateFollowUp(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const followUp = await surgeryService.updateFollowUp(req.params.id, req.body);
      sendSuccess(res, followUp, 200, 'Suivi mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour suivi:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour', 500);
    }
  }

  async getSurgeryFollowUps(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const followUps = await surgeryService.getFollowUpsBySurgery(req.params.surgeryId);
      sendSuccess(res, followUps);
    } catch (error) {
      console.error('Erreur récupération suivis:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async getPendingFollowUps(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const followUps = await surgeryService.getPendingFollowUps();
      sendSuccess(res, followUps);
    } catch (error) {
      console.error('Erreur récupération suivis en attente:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  // ---- PRE-OP MATERIALS ----

  async getMaterials(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const materials = await surgeryService.getMaterials(req.params.surgeryId);
      sendSuccess(res, materials);
    } catch (error) {
      console.error('Erreur récupération matériel:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }

  async addMaterial(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const material = await surgeryService.addMaterial(req.params.surgeryId, req.body);
      sendSuccess(res, material, 201, 'Matériel ajouté');
    } catch (error) {
      console.error('Erreur ajout matériel:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de l\'ajout', 500);
    }
  }

  async updateMaterial(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const material = await surgeryService.updateMaterial(req.params.id, req.body);
      sendSuccess(res, material, 200, 'Matériel mis à jour');
    } catch (error) {
      console.error('Erreur mise à jour matériel:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la mise à jour', 500);
    }
  }

  async deleteMaterial(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      await surgeryService.deleteMaterial(req.params.id);
      sendSuccess(res, null, 200, 'Matériel supprimé');
    } catch (error) {
      console.error('Erreur suppression matériel:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la suppression', 500);
    }
  }

  async addDefaultMaterials(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { surgeryType } = req.body;
      const materials = await surgeryService.addDefaultMaterials(req.params.surgeryId, surgeryType);
      sendSuccess(res, materials, 201, 'Matériel par défaut ajouté');
    } catch (error) {
      console.error('Erreur ajout matériel par défaut:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de l\'ajout', 500);
    }
  }

  // ---- STATS ----

  async getBlocStats(_req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const stats = await surgeryService.getBlocStats();
      sendSuccess(res, stats);
    } catch (error) {
      console.error('Erreur récupération stats bloc:', error);
      sendError(res, ErrorCodes.INTERNAL_ERROR, 'Erreur lors de la récupération', 500);
    }
  }
}

export const surgeryController = new SurgeryController();
