import { Router } from 'express';
import {
  referralController,
  createReferralValidation,
  updateReferralValidation,
} from '../controllers/referral.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);

// GET /api/referrals/stats - Statistiques
router.get('/stats', authorize('MEDECIN', 'ADMIN'), (req, res) => referralController.getStats(req, res));

// GET /api/referrals/follow-ups - Suivis en attente
router.get('/follow-ups', authorize('MEDECIN', 'ADMIN'), (req, res) => referralController.getPendingFollowUps(req, res));

// GET /api/referrals - Liste des orientations
router.get('/', authorize('MEDECIN', 'ADMIN'), (req, res) => referralController.findAll(req, res));

// POST /api/referrals - Créer une orientation
router.post('/', authorize('MEDECIN', 'ADMIN'), validate(createReferralValidation), (req, res) => referralController.create(req, res));

// GET /api/referrals/:id - Détail d'une orientation
router.get('/:id', authorize('MEDECIN', 'ADMIN'), (req, res) => referralController.findById(req, res));

// PUT /api/referrals/:id - Mettre à jour une orientation
router.put('/:id', authorize('MEDECIN', 'ADMIN'), validate(updateReferralValidation), (req, res) => referralController.update(req, res));

// PATCH /api/referrals/:id/status - Mettre à jour le statut
router.patch('/:id/status', authorize('MEDECIN', 'ADMIN'), (req, res) => referralController.updateStatus(req, res));

export default router;
