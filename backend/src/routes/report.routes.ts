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

// Statistiques des prescriptions
router.get('/prescriptions', authorize('ADMIN', 'MEDECIN'), reportController.getPrescriptionStats);

// Statistiques des services manquants (basé sur les orientations)
router.get('/missing-services', authorize('ADMIN'), reportController.getMissingServicesStats);

export default router;
