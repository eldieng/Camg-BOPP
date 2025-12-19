import { Router } from 'express';
import {
  queueController,
  stationValidation,
  entryIdValidation,
  completeServiceValidation,
} from '../controllers/queue.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Routes PUBLIQUES (pour l'écran d'affichage sans authentification)
// GET /api/queue/display/:station - File d'attente publique pour affichage
router.get(
  '/display/:station',
  validate(stationValidation),
  (req, res) => queueController.getQueue(req, res)
);

// Routes PROTÉGÉES (nécessitent authentification)
router.use(authenticate);

// Routes statiques AVANT les routes dynamiques
// GET /api/queue/missed-calls - Tous les appels manqués
router.get(
  '/missed-calls',
  authorize('ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'MEDICAMENTS', 'ADMIN'),
  (req, res) => queueController.getMissedCalls(req, res)
);

// GET /api/queue/missed-calls/:station - Appels manqués d'une station
router.get(
  '/missed-calls/:station',
  authorize('ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'MEDICAMENTS', 'ADMIN'),
  validate(stationValidation),
  (req, res) => queueController.getMissedCalls(req, res)
);

// GET /api/queue/:station - File d'attente d'une station
router.get(
  '/:station',
  validate(stationValidation),
  (req, res) => queueController.getQueue(req, res)
);

// GET /api/queue/:station/stats - Statistiques
router.get(
  '/:station/stats',
  validate(stationValidation),
  (req, res) => queueController.getStats(req, res)
);

// POST /api/queue/:station/call-next - Appeler le prochain
router.post(
  '/:station/call-next',
  authorize('ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'MEDICAMENTS', 'ADMIN'),
  validate(stationValidation),
  (req, res) => queueController.callNext(req, res)
);

// POST /api/queue/:entryId/start - Démarrer le service
router.post(
  '/:entryId/start',
  authorize('ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'MEDICAMENTS', 'ADMIN'),
  validate(entryIdValidation),
  (req, res) => queueController.startService(req, res)
);

// POST /api/queue/:entryId/complete - Terminer le service
router.post(
  '/:entryId/complete',
  authorize('ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'MEDICAMENTS', 'ADMIN'),
  validate(completeServiceValidation),
  (req, res) => queueController.completeService(req, res)
);

// POST /api/queue/:entryId/no-show - Marquer absent
router.post(
  '/:entryId/no-show',
  authorize('ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'MEDICAMENTS', 'ADMIN'),
  validate(entryIdValidation),
  (req, res) => queueController.markNoShow(req, res)
);

// POST /api/queue/:entryId/recall - Rappeler un patient absent
router.post(
  '/:entryId/recall',
  authorize('ACCUEIL', 'TEST_VUE', 'MEDECIN', 'LUNETTES', 'MEDICAMENTS', 'ADMIN'),
  validate(entryIdValidation),
  (req, res) => queueController.recallPatient(req, res)
);

export default router;
