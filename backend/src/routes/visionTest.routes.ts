import { Router } from 'express';
import {
  visionTestController,
  createVisionTestValidation,
} from '../controllers/visionTest.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);

// GET /api/vision-tests/today
router.get(
  '/today',
  authorize('TEST_VUE', 'MEDECIN', 'ADMIN'),
  (req, res) => visionTestController.getTodayTests(req, res)
);

// POST /api/vision-tests
router.post(
  '/',
  authorize('TEST_VUE', 'ADMIN'),
  validate(createVisionTestValidation),
  (req, res) => visionTestController.create(req, res)
);

// GET /api/vision-tests/patient/:patientId
router.get(
  '/patient/:patientId',
  (req, res) => visionTestController.findByPatient(req, res)
);

// GET /api/vision-tests/:id
router.get(
  '/:id',
  authorize('TEST_VUE', 'MEDECIN', 'ADMIN'),
  (req, res) => visionTestController.findById(req, res)
);

// PUT /api/vision-tests/:id
router.put(
  '/:id',
  authorize('TEST_VUE', 'ADMIN'),
  validate(createVisionTestValidation),
  (req, res) => visionTestController.update(req, res)
);

export default router;
