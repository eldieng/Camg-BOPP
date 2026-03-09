import { Router } from 'express';
import { authController, loginValidation, changePasswordValidation } from '../controllers/auth.controller.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * POST /api/auth/login
 * Connexion utilisateur (avec rate limiting)
 */
router.post(
  '/login',
  authLimiter,
  validate(loginValidation),
  (req, res) => authController.login(req, res)
);

/**
 * POST /api/auth/logout
 * Déconnexion
 */
router.post(
  '/logout',
  authenticate,
  (req, res) => authController.logout(req, res)
);

/**
 * GET /api/auth/me
 * Informations utilisateur connecté
 */
router.get(
  '/me',
  authenticate,
  (req, res) => authController.me(req, res)
);

/**
 * PUT /api/auth/password
 * Changer le mot de passe
 */
router.put(
  '/password',
  authenticate,
  validate(changePasswordValidation),
  (req, res) => authController.changePassword(req, res)
);

/**
 * PUT /api/auth/profile
 * Mettre à jour le profil
 */
router.put(
  '/profile',
  authenticate,
  (req, res) => authController.updateProfile(req, res)
);

/**
 * PUT /api/auth/change-password
 * Alias pour changer le mot de passe (compatibilité frontend)
 */
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordValidation),
  (req, res) => authController.changePassword(req, res)
);

export default router;
