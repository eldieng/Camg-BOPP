import { Router } from 'express';
import {
  orderController,
  createOrderValidation,
  updateOrderValidation,
} from '../controllers/order.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);

// GET /api/orders/stats - Statistiques
router.get('/stats', authorize('ADMIN'), (req, res) => orderController.getStats(req, res));

// GET /api/orders - Liste des commandes
router.get('/', (req, res) => orderController.findAll(req, res));

// POST /api/orders - Créer une commande
router.post('/', authorize('LUNETTES', 'MEDICAMENTS', 'BLOC', 'ADMIN'), validate(createOrderValidation), (req, res) => orderController.create(req, res));

// GET /api/orders/:id - Détail d'une commande
router.get('/:id', (req, res) => orderController.findById(req, res));

// PUT /api/orders/:id - Mettre à jour une commande
router.put('/:id', validate(updateOrderValidation), (req, res) => orderController.update(req, res));

// POST /api/orders/:id/submit - Soumettre une commande
router.post('/:id/submit', (req, res) => orderController.submit(req, res));

// POST /api/orders/:id/approve - Approuver une commande
router.post('/:id/approve', authorize('ADMIN'), (req, res) => orderController.approve(req, res));

// POST /api/orders/:id/complete - Marquer comme complétée
router.post('/:id/complete', authorize('ADMIN'), (req, res) => orderController.complete(req, res));

// POST /api/orders/:id/cancel - Annuler une commande
router.post('/:id/cancel', (req, res) => orderController.cancel(req, res));

// POST /api/orders/:id/items - Ajouter un article
router.post('/:id/items', (req, res) => orderController.addItem(req, res));

// DELETE /api/orders/:id/items/:itemId - Supprimer un article
router.delete('/:id/items/:itemId', (req, res) => orderController.removeItem(req, res));

export default router;
