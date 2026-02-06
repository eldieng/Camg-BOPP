import { Router } from 'express';
import {
  adminController,
  createUserValidation,
  updateUserValidation,
  resetPasswordValidation,
} from '../controllers/admin.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);
router.use(authorize('ADMIN'));

// GET /api/admin/users/stats
router.get('/users/stats', (req, res) => adminController.getUserStats(req, res));

// GET /api/admin/users
router.get('/users', (req, res) => adminController.getAllUsers(req, res));

// POST /api/admin/users
router.post('/users', validate(createUserValidation), (req, res) => adminController.createUser(req, res));

// GET /api/admin/users/:id
router.get('/users/:id', (req, res) => adminController.getUserById(req, res));

// PUT /api/admin/users/:id
router.put('/users/:id', validate(updateUserValidation), (req, res) => adminController.updateUser(req, res));

// POST /api/admin/users/:id/reset-password
router.post('/users/:id/reset-password', validate(resetPasswordValidation), (req, res) => adminController.resetPassword(req, res));

// POST /api/admin/users/:id/toggle-status
router.post('/users/:id/toggle-status', (req, res) => adminController.toggleStatus(req, res));

// DELETE /api/admin/users/:id
router.delete('/users/:id', (req, res) => adminController.deleteUser(req, res));

// ============================================
// Routes de gestion de la base de données
// ============================================

// GET /api/admin/database/stats - Statistiques de la base de données
router.get('/database/stats', (req, res) => adminController.getDatabaseStats(req, res));

// POST /api/admin/database/archive - Lancer l'archivage manuel
router.post('/database/archive', (req, res) => adminController.runArchiving(req, res));

// ============================================
// Routes de sécurité et audit
// ============================================

// GET /api/admin/audit-logs - Logs d'audit avec pagination
router.get('/audit-logs', (req, res) => adminController.getAuditLogs(req, res));

// GET /api/admin/security/failed-logins - Tentatives de connexion échouées
router.get('/security/failed-logins', (req, res) => adminController.getFailedLogins(req, res));

export default router;
