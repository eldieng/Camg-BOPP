import { Router } from 'express';
import {
  patientController,
  createPatientValidation,
  updatePatientValidation,
  searchPatientValidation,
} from '../controllers/patient.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * GET /api/patients/search
 * Recherche rapide (autocomplete)
 */
router.get(
  '/search',
  (req, res) => patientController.quickSearch(req, res)
);

/**
 * GET /api/patients
 * Liste des patients avec pagination
 */
router.get(
  '/',
  validate(searchPatientValidation),
  (req, res) => patientController.findAll(req, res)
);

/**
 * POST /api/patients
 * Créer un nouveau patient
 */
router.post(
  '/',
  authorize('ACCUEIL', 'ADMIN'),
  validate(createPatientValidation),
  (req, res) => patientController.create(req, res)
);

/**
 * GET /api/patients/:id
 * Détail d'un patient
 */
router.get(
  '/:id',
  (req, res) => patientController.findById(req, res)
);

/**
 * GET /api/patients/:id/history
 * Historique médical complet
 */
router.get(
  '/:id/history',
  (req, res) => patientController.getHistory(req, res)
);

/**
 * PUT /api/patients/:id
 * Mettre à jour un patient
 */
router.put(
  '/:id',
  authorize('ACCUEIL', 'ADMIN'),
  validate(updatePatientValidation),
  (req, res) => patientController.update(req, res)
);

/**
 * DELETE /api/patients/:id
 * Supprimer un patient
 */
router.delete(
  '/:id',
  authorize('ADMIN'),
  (req, res) => patientController.delete(req, res)
);

export default router;
