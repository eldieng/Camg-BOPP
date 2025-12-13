import jwt from 'jsonwebtoken';
import { JwtPayload } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'default_secret_change_in_production';

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
