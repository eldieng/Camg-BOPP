/**
 * Service de blacklist de tokens JWT
 * Stocke les tokens invalidés en mémoire (pour production, utiliser Redis)
 */

interface BlacklistedToken {
  token: string;
  expiresAt: Date;
}

class TokenBlacklistService {
  private blacklist: Map<string, BlacklistedToken> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Nettoyer les tokens expirés toutes les 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  /**
   * Ajouter un token à la blacklist
   */
  add(token: string, expiresAt: Date): void {
    this.blacklist.set(token, { token, expiresAt });
  }

  /**
   * Vérifier si un token est blacklisté
   */
  isBlacklisted(token: string): boolean {
    return this.blacklist.has(token);
  }

  /**
   * Nettoyer les tokens expirés
   */
  private cleanup(): void {
    const now = new Date();
    let cleaned = 0;
    
    for (const [token, data] of this.blacklist.entries()) {
      if (data.expiresAt < now) {
        this.blacklist.delete(token);
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
  size(): number {
    return this.blacklist.size;
  }

  /**
   * Arrêter le service (pour les tests)
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

// Singleton
export const tokenBlacklist = new TokenBlacklistService();
