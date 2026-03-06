import { Router } from 'express';
import { glassesOrderController, glassesOrderValidation } from '../controllers/glassesOrder.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticate);

// Statistiques (accessible par tous les rôles autorisés)
router.get('/stats', authorize('MEDECIN', 'LUNETTES', 'ADMIN'), glassesOrderController.getStats);

// Commandes en attente (pour l'atelier)
router.get('/pending', authorize('LUNETTES', 'ADMIN'), glassesOrderController.getPending);

// Commandes prêtes (pour la remise)
router.get('/ready', authorize('LUNETTES', 'ADMIN'), glassesOrderController.getReady);

// Commandes d'un patient
router.get('/patient/:patientId', authorize('MEDECIN', 'LUNETTES', 'ADMIN'), glassesOrderController.getByPatient);

// CRUD
router.get('/', authorize('MEDECIN', 'LUNETTES', 'ADMIN'), glassesOrderController.getAll);
router.get('/:id', authorize('MEDECIN', 'LUNETTES', 'ADMIN'), glassesOrderController.getById);
router.post('/', authorize('MEDECIN', 'ADMIN'), glassesOrderValidation.create, glassesOrderController.create);
router.put('/:id', authorize('MEDECIN', 'LUNETTES', 'ADMIN'), glassesOrderValidation.update, glassesOrderController.update);

// Actions de workflow
router.post('/:id/start', authorize('LUNETTES', 'ADMIN'), glassesOrderController.startProgress);
router.post('/:id/ready', authorize('LUNETTES', 'ADMIN'), glassesOrderController.markReady);
router.post('/:id/deliver', authorize('LUNETTES', 'ADMIN'), glassesOrderController.markDelivered);
router.post('/:id/cancel', authorize('MEDECIN', 'LUNETTES', 'ADMIN'), glassesOrderController.cancel);

export default router;
