import Redis from 'ioredis';

/**
 * Service de blacklist de tokens JWT
 * Utilise Redis en production, mémoire en développement
 */

interface BlacklistedToken {
  token: string;
  expiresAt: Date;
}

class TokenBlacklistService {
  private memoryBlacklist: Map<string, BlacklistedToken> = new Map();
  private redis: Redis | null = null;
  private useRedis: boolean = false;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.initRedis();
    
    // Nettoyer les tokens expirés toutes les 5 minutes (pour le mode mémoire)
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Initialiser la connexion Redis si disponible
   */
  private async initRedis(): Promise<void> {
    const redisUrl = process.env.REDIS_URL;
    
    if (!redisUrl) {
      console.log('[TokenBlacklist] Redis non configuré - utilisation de la mémoire');
      return;
    }

    try {
      this.redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
      });

      await this.redis.connect();
      this.useRedis = true;
      console.log('[TokenBlacklist] Connecté à Redis');
    } catch (error) {
      console.warn('[TokenBlacklist] Impossible de se connecter à Redis, utilisation de la mémoire:', error);
      this.redis = null;
      this.useRedis = false;
    }
  }

  /**
   * Ajouter un token à la blacklist
   */
  async add(token: string, expiresAt: Date): Promise<void> {
    const ttlSeconds = Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000));
    
    if (this.useRedis && this.redis) {
      try {
        // Stocker dans Redis avec TTL automatique
        await this.redis.setex(`blacklist:${token}`, ttlSeconds, '1');
        return;
      } catch (error) {
        console.error('[TokenBlacklist] Erreur Redis, fallback mémoire:', error);
      }
    }
    
    // Fallback mémoire
    this.memoryBlacklist.set(token, { token, expiresAt });
  }

  /**
   * Vérifier si un token est blacklisté
   */
  async isBlacklisted(token: string): Promise<boolean> {
    if (this.useRedis && this.redis) {
      try {
        const exists = await this.redis.exists(`blacklist:${token}`);
        return exists === 1;
      } catch (error) {
        console.error('[TokenBlacklist] Erreur Redis, fallback mémoire:', error);
      }
    }
    
    // Fallback mémoire
    return this.memoryBlacklist.has(token);
  }

  /**
   * Nettoyer les tokens expirés (mémoire uniquement, Redis gère via TTL)
   */
  private cleanup(): void {
    if (this.useRedis) return; // Redis gère automatiquement l'expiration
    
    const now = new Date();
    let cleaned = 0;
    
    for (const [token, data] of this.memoryBlacklist.entries()) {
      if (data.expiresAt < now) {
        this.memoryBlacklist.delete(token);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[TokenBlacklist] Nettoyé ${cleaned} tokens expirés`);
    }
  }

  /**
   * Obtenir le nombre de tokens blacklistés
   */
  async size(): Promise<number> {
    if (this.useRedis && this.redis) {
      try {
        const keys = await this.redis.keys('blacklist:*');
        return keys.length;
      } catch (error) {
        console.error('[TokenBlacklist] Erreur Redis:', error);
      }
    }
    
    return this.memoryBlacklist.size;
  }

  /**
   * Arrêter le service
   */
  async stop(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    
    if (this.redis) {
      await this.redis.quit();
      this.redis = null;
    }
  }

  /**
   * Vérifier si Redis est utilisé
   */
  isUsingRedis(): boolean {
    return this.useRedis;
  }
}

// Singleton
export const tokenBlacklist = new TokenBlacklistService();
