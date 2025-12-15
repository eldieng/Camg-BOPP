import { Router } from 'express';
import { reportController } from '../controllers/report.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Statistiques (admin seulement)
router.get('/stats', authorize('ADMIN'), reportController.getStats);

// Rapport patient (médecin et admin)
router.get('/patient/:patientId', authorize('ADMIN', 'MEDECIN'), reportController.getPatientReport);

export default router;
