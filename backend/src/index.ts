import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import routes from './routes/index.js';
import { startQueueCleanupJob } from './jobs/queueCleanup.job.js';

// Charger les variables d'environnement
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
  console.log('═══════════════════════════════════════════════════════');
});

export default app;
