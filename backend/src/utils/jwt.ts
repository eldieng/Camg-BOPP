import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/index.js';

// Vérification de sécurité du JWT_SECRET
const JWT_SECRET: string = process.env.JWT_SECRET || '';

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET est requis. Définissez-le dans le fichier .env');
}

if (process.env.NODE_ENV === 'production') {
  if (JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET doit faire au moins 32 caractères en production');
  }
  if (JWT_SECRET.includes('CHANGEZ_MOI') || JWT_SECRET.includes('default')) {
    throw new Error('JWT_SECRET par défaut détecté. Changez-le en production!');
  }
}

/**
 * Génère un token JWT
 */
export function generateToken(payload: JwtPayload): string {
  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (jwt.sign as any)({ ...payload }, JWT_SECRET, { expiresIn });
}

/**
 * Vérifie et décode un token JWT
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    return decoded;
  } catch {
    return null;
  }
}

/**
 * Extrait le token du header Authorization
 */
export function extractTokenFromHeader(authHeader: string | undefined): string | null {
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  return authHeader.substring(7);
}
