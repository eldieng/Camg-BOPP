import { Router } from 'express';
import { statsController, periodValidation } from '../controllers/stats.controller.js';
import { authenticate, authorize } from '../middleware/auth.js';
import { validate } from '../middleware/validation.js';

const router = Router();

router.use(authenticate);

// GET /api/stats/today
router.get('/today', (req, res) => statsController.getTodayStats(req, res));

// GET /api/stats/queue
router.get('/queue', (req, res) => statsController.getQueueStats(req, res));

// GET /api/stats/doctors
router.get('/doctors', authorize('ADMIN'), (req, res) => statsController.getDoctorStats(req, res));

// GET /api/stats/trend
router.get('/trend', validate(periodValidation), (req, res) => statsController.getDailyTrend(req, res));

// GET /api/stats/period
router.get('/period', authorize('ADMIN'), validate(periodValidation), (req, res) => statsController.getPeriodStats(req, res));

export default router;
