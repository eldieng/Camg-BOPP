import rateLimit from 'express-rate-limit';

// Rate limiter pour les routes d'authentification (login)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 tentatives par fenêtre
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Ne compte pas les requêtes réussies
});

// Rate limiter général pour l'API
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requêtes par minute
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Trop de requêtes. Veuillez réessayer dans quelques instants.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter pour la création de tickets (éviter les abus)
export const ticketLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 tickets par minute max
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Trop de tickets créés. Veuillez patienter.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});
