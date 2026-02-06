import { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';

/**
 * Middleware pour forcer HTTPS en production
 */
export function forceHttps(req: Request, res: Response, next: NextFunction): void {
  if (process.env.FORCE_HTTPS === 'true' && process.env.NODE_ENV === 'production') {
    // Vérifier si la requête est en HTTPS
    const isHttps = req.secure || req.headers['x-forwarded-proto'] === 'https';
    
    if (!isHttps) {
      // Rediriger vers HTTPS
      const httpsUrl = `https://${req.headers.host}${req.url}`;
      res.redirect(301, httpsUrl);
      return;
    }
  }
  next();
}

/**
 * Configuration Helmet pour la sécurité des headers HTTP
 */
export const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", 'data:', 'blob:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false, // Désactivé pour permettre les images externes si nécessaire
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true,
  },
});

/**
 * Middleware pour ajouter des headers de sécurité supplémentaires
 */
export function additionalSecurityHeaders(req: Request, res: Response, next: NextFunction): void {
  // Empêcher le caching des données sensibles
  if (req.path.includes('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  // Header pour indiquer que le contenu ne doit pas être sniffé
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // Empêcher le clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  
  // XSS Protection (pour les anciens navigateurs)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  
  next();
}
