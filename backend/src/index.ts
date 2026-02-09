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

// CORS configuration (AVANT le rate limiter pour que les réponses 429 aient les headers CORS)
const allowedOrigins = [
  'http://localhost:5173',
  'https://camg-bopp.netlify.app',
];

// Ajouter les origines personnalisées depuis CORS_ORIGIN (séparées par des virgules)
if (process.env.CORS_ORIGIN) {
  process.env.CORS_ORIGIN.split(',').forEach((origin) => {
    const trimmed = origin.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(cors({
  origin: (origin, callback) => {
    // Autoriser les requêtes sans origin (Postman, curl, etc.)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`[CORS] Origine bloquée: ${origin}`);
      callback(new Error('Non autorisé par CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));

// Rate limiting global (après CORS)
app.use('/api', apiLimiter);

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
