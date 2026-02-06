import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { startQueueCleanupJob } from './jobs/queueCleanup.job.js';
import { startArchivingJob } from './jobs/archiving.job.js';
import { startKeepAliveJob } from './jobs/keepAlive.job.js';
import { forceHttps, securityHeaders, additionalSecurityHeaders } from './middleware/security.js';
import { apiLimiter } from './middleware/rateLimiter.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Middlewares de sécurité (en premier)
app.use(forceHttps);
if (isProduction) {
  app.use(securityHeaders);
}
app.use(additionalSecurityHeaders);

// Rate limiting global
app.use('/api', apiLimiter);

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || 'http://localhost:5173';
app.use(cors({
  origin: isProduction ? corsOrigin : true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Routes API
app.use('/api', routes);

// Route racine
app.get('/', (_req, res) => {
  res.json({
    name: 'CAMG-BOPP API',
    version: '1.0.0',
    description: 'Système de gestion des patients et files d\'attente',
    documentation: '/api/health',
  });
});

// Gestion des erreurs 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: 'Route non trouvée',
    },
  });
});

// Gestion des erreurs globales
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erreur:', err);
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: process.env.NODE_ENV === 'development' ? err.message : 'Erreur interne du serveur',
    },
  });
});

// Démarrage du serveur
app.listen(PORT, () => {
  startQueueCleanupJob();
  startArchivingJob();
  startKeepAliveJob();
  console.log('');
  console.log('🏥 ═══════════════════════════════════════════════════');
  console.log('   CAMG-BOPP - Système de Gestion des Patients');
  console.log('   Dispensaire Ophtalmologique');
  console.log('═══════════════════════════════════════════════════════');
  console.log('');
  console.log(`🚀 Serveur démarré sur http://localhost:${PORT}`);
  console.log(`📡 API disponible sur http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
  console.log('');
  console.log(`📋 Mode: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔒 Sécurité: ${isProduction ? 'Production (HTTPS forcé)' : 'Développement'}`);
  console.log('═══════════════════════════════════════════════════════');
});

export default app;
