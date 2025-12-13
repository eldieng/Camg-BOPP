import { Router } from 'express';
import {
  ticketController,
  createTicketValidation,
  updateStatusValidation,
} from '../controllers/ticket.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

/**
 * GET /api/tickets/today
 * Tickets du jour
 */
router.get(
  '/today',
  (req, res) => ticketController.getTodayTickets(req, res)
);

/**
 * GET /api/tickets/summary
 * Résumé des tickets du jour
 */
router.get(
  '/summary',
  (req, res) => ticketController.getTodaySummary(req, res)
);

/**
 * POST /api/tickets
 * Créer un nouveau ticket
 */
router.post(
  '/',
  authorize('ACCUEIL', 'ADMIN'),
  validate(createTicketValidation),
  (req, res) => ticketController.create(req, res)
);

/**
 * GET /api/tickets/qr/:qrCode
 * Rechercher par QR code
 */
router.get(
  '/qr/:qrCode',
  (req, res) => ticketController.findByQRCode(req, res)
);

/**
 * GET /api/tickets/:id
 * Détail d'un ticket
 */
router.get(
  '/:id',
  (req, res) => ticketController.findById(req, res)
);

/**
 * PUT /api/tickets/:id/status
 * Mettre à jour le statut
 */
router.put(
  '/:id/status',
  authorize('ACCUEIL', 'TEST_VUE', 'MEDECIN', 'ADMIN'),
  validate(updateStatusValidation),
  (req, res) => ticketController.updateStatus(req, res)
);

/**
 * POST /api/tickets/:id/cancel
 * Annuler un ticket
 */
router.post(
  '/:id/cancel',
  authorize('ACCUEIL', 'ADMIN'),
  (req, res) => ticketController.cancel(req, res)
);

export default router;
