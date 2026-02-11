import { Router } from 'express';
import { gateController, GateController } from '../controllers/gate.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Toutes les routes nécessitent l'authentification
router.use(authenticate);

// GET /api/gate/today - Liste du jour (porte + accueil + admin)
router.get(
  '/today',
  authorize('PORTE', 'ACCUEIL', 'ADMIN'),
  gateController.getToday.bind(gateController)
);

// GET /api/gate/arrived - Patients envoyés à l'accueil (accueil + admin)
router.get(
  '/arrived',
  authorize('ACCUEIL', 'ADMIN'),
  gateController.getArrivedForAccueil.bind(gateController)
);

// POST /api/gate/walk-in - Ajouter un walk-in (porte + accueil + admin)
router.post(
  '/walk-in',
  authorize('PORTE', 'ACCUEIL', 'ADMIN'),
  validate(GateController.walkInValidation),
  gateController.addWalkIn.bind(gateController)
);

// PATCH /api/gate/:id/arrived - Cocher comme arrivé
router.patch(
  '/:id/arrived',
  authorize('PORTE', 'ACCUEIL', 'ADMIN'),
  gateController.markArrived.bind(gateController)
);

// PATCH /api/gate/:id/send - Envoyer à l'accueil
router.patch(
  '/:id/send',
  authorize('PORTE', 'ACCUEIL', 'ADMIN'),
  gateController.sendToAccueil.bind(gateController)
);

// PATCH /api/gate/:id/no-show - Marquer absent
router.patch(
  '/:id/no-show',
  authorize('PORTE', 'ACCUEIL', 'ADMIN'),
  gateController.markNoShow.bind(gateController)
);

// PATCH /api/gate/:id/registered - Marquer comme enregistré
router.patch(
  '/:id/registered',
  authorize('ACCUEIL', 'ADMIN'),
  gateController.markRegistered.bind(gateController)
);

export default router;
