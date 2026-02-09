import { Router } from 'express';
import {
  surgeryController,
  createAnalysisValidation,
  createMultipleAnalysesValidation,
  updateAnalysisValidation,
  createSurgeryValidation,
  updateSurgeryValidation,
  createFollowUpValidation,
  updateFollowUpValidation,
} from '../controllers/surgery.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// ============================================
// ANALYSES
// ============================================

/**
 * GET /api/surgery/analyses/pending
 * Analyses en attente de résultats
 */
router.get(
  '/analyses/pending',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  (req, res) => surgeryController.getPendingAnalyses(req, res)
);

/**
 * GET /api/surgery/analyses/patient/:patientId
 * Analyses d'un patient
 */
router.get(
  '/analyses/patient/:patientId',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  (req, res) => surgeryController.getPatientAnalyses(req, res)
);

/**
 * POST /api/surgery/analyses
 * Prescrire une analyse
 */
router.post(
  '/analyses',
  authorize('MEDECIN', 'ADMIN'),
  validate(createAnalysisValidation),
  (req, res) => surgeryController.createAnalysis(req, res)
);

/**
 * POST /api/surgery/analyses/batch
 * Prescrire plusieurs analyses
 */
router.post(
  '/analyses/batch',
  authorize('MEDECIN', 'ADMIN'),
  validate(createMultipleAnalysesValidation),
  (req, res) => surgeryController.createMultipleAnalyses(req, res)
);

/**
 * GET /api/surgery/analyses/:id
 * Détail d'une analyse
 */
router.get(
  '/analyses/:id',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  (req, res) => surgeryController.getAnalysis(req, res)
);

/**
 * PUT /api/surgery/analyses/:id
 * Mettre à jour une analyse (saisir résultats)
 */
router.put(
  '/analyses/:id',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  validate(updateAnalysisValidation),
  (req, res) => surgeryController.updateAnalysis(req, res)
);

// ============================================
// CHIRURGIES
// ============================================

/**
 * GET /api/surgery/waiting-list
 * Liste d'attente opératoire
 */
router.get(
  '/waiting-list',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  (req, res) => surgeryController.getWaitingList(req, res)
);

/**
 * GET /api/surgery/scheduled
 * Planning des opérations (optionnel: ?date=YYYY-MM-DD)
 */
router.get(
  '/scheduled',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  (req, res) => surgeryController.getScheduledSurgeries(req, res)
);

/**
 * GET /api/surgery/stats
 * Statistiques du bloc opératoire
 */
router.get(
  '/stats',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  (req, res) => surgeryController.getBlocStats(req, res)
);

/**
 * GET /api/surgery/patient/:patientId
 * Chirurgies d'un patient
 */
router.get(
  '/patient/:patientId',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  (req, res) => surgeryController.getPatientSurgeries(req, res)
);

/**
 * GET /api/surgery
 * Liste de toutes les chirurgies avec pagination
 */
router.get(
  '/',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  (req, res) => surgeryController.getAllSurgeries(req, res)
);

/**
 * POST /api/surgery
 * Créer une chirurgie
 */
router.post(
  '/',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  validate(createSurgeryValidation),
  (req, res) => surgeryController.createSurgery(req, res)
);

/**
 * GET /api/surgery/:id
 * Détail d'une chirurgie
 */
router.get(
  '/:id',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  (req, res) => surgeryController.getSurgery(req, res)
);

/**
 * PUT /api/surgery/:id
 * Mettre à jour une chirurgie
 */
router.put(
  '/:id',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  validate(updateSurgeryValidation),
  (req, res) => surgeryController.updateSurgery(req, res)
);

// ============================================
// SUIVIS POST-OPÉRATOIRES
// ============================================

/**
 * GET /api/surgery/follow-ups/pending
 * Suivis en attente
 */
router.get(
  '/follow-ups/pending',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  (req, res) => surgeryController.getPendingFollowUps(req, res)
);

/**
 * GET /api/surgery/:surgeryId/follow-ups
 * Suivis d'une chirurgie
 */
router.get(
  '/:surgeryId/follow-ups',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  (req, res) => surgeryController.getSurgeryFollowUps(req, res)
);

/**
 * POST /api/surgery/follow-ups
 * Créer un suivi
 */
router.post(
  '/follow-ups',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  validate(createFollowUpValidation),
  (req, res) => surgeryController.createFollowUp(req, res)
);

/**
 * POST /api/surgery/follow-ups/default
 * Créer les suivis par défaut (J+1, J+7, J+30)
 */
router.post(
  '/follow-ups/default',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  (req, res) => surgeryController.createDefaultFollowUps(req, res)
);

/**
 * PUT /api/surgery/follow-ups/:id
 * Mettre à jour un suivi
 */
router.put(
  '/follow-ups/:id',
  authorize('MEDECIN', 'BLOC', 'ADMIN'),
  validate(updateFollowUpValidation),
  (req, res) => surgeryController.updateFollowUp(req, res)
);

export default router;
