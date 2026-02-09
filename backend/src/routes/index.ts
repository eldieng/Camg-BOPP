import { Router } from 'express';
import authRoutes from './auth.routes.js';
import patientRoutes from './patient.routes.js';
import ticketRoutes from './ticket.routes.js';
import queueRoutes from './queue.routes.js';
import visionTestRoutes from './visionTest.routes.js';
import consultationRoutes from './consultation.routes.js';
import statsRoutes from './stats.routes.js';
import adminRoutes from './admin.routes.js';
import appointmentRoutes from './appointment.routes.js';
import reportRoutes from './report.routes.js';
import surgeryRoutes from './surgery.routes.js';

const router = Router();

// Routes d'authentification
router.use('/auth', authRoutes);

// Routes patients
router.use('/patients', patientRoutes);

// Routes tickets
router.use('/tickets', ticketRoutes);

// Routes file d'attente
router.use('/queue', queueRoutes);

// Routes tests de vue
router.use('/vision-tests', visionTestRoutes);

// Routes consultations
router.use('/consultations', consultationRoutes);

// Routes statistiques
router.use('/stats', statsRoutes);

// Routes administration
router.use('/admin', adminRoutes);

// Routes rendez-vous
router.use('/appointments', appointmentRoutes);

// Routes rapports
router.use('/reports', reportRoutes);

// Routes bloc opératoire
router.use('/surgery', surgeryRoutes);

// Route de santé
router.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'API CAMG-BOPP opérationnelle',
    timestamp: new Date().toISOString(),
  });
});

export default router;
