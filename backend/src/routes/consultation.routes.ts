import { Router } from 'express';
import {
  consultationController,
  createConsultationValidation,
} from '../controllers/consultation.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);

// GET /api/consultations/today
router.get(
  '/today',
  authorize('MEDECIN', 'ADMIN'),
  (req, res) => consultationController.getTodayConsultations(req, res)
);

// POST /api/consultations
router.post(
  '/',
  authorize('MEDECIN', 'ADMIN'),
  validate(createConsultationValidation),
  (req, res) => consultationController.create(req, res)
);

// GET /api/consultations/patient/:patientId
router.get(
  '/patient/:patientId',
  (req, res) => consultationController.findByPatient(req, res)
);

// GET /api/consultations/patient/:patientId/history
router.get(
  '/patient/:patientId/history',
  (req, res) => consultationController.getPatientHistory(req, res)
);

// GET /api/consultations/:id
router.get(
  '/:id',
  authorize('MEDECIN', 'ADMIN'),
  (req, res) => consultationController.findById(req, res)
);

// PUT /api/consultations/:id
router.put(
  '/:id',
  authorize('MEDECIN', 'ADMIN'),
  validate(createConsultationValidation),
  (req, res) => consultationController.update(req, res)
);

export default router;
