import crypto from 'crypto';

/**
 * Service de chiffrement pour les données médicales sensibles
 * Utilise AES-256-GCM pour le chiffrement authentifié
 */

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

// Clé de chiffrement (doit être 32 bytes pour AES-256)
function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    console.warn('[Encryption] ENCRYPTION_KEY non définie - chiffrement désactivé');
    return Buffer.alloc(0);
  }
  
  // Si la clé est en base64, la décoder
  const keyBuffer = Buffer.from(key, 'base64');
  
  if (keyBuffer.length !== 32) {
    console.warn('[Encryption] ENCRYPTION_KEY doit faire 32 bytes - chiffrement désactivé');
    return Buffer.alloc(0);
  }
  
  return keyBuffer;
}

class EncryptionService {
  private key: Buffer;
  private enabled: boolean;

  constructor() {
    this.key = getEncryptionKey();
    this.enabled = this.key.length === 32;
    
    if (this.enabled) {
      console.log('[Encryption] Service de chiffrement activé');
    } else {
      console.log('[Encryption] Service de chiffrement désactivé (clé non configurée)');
    }
  }

  /**
   * Vérifie si le chiffrement est activé
   */
  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Chiffre une chaîne de caractères
   * Retourne: iv:authTag:encryptedData (en base64)
   */
  encrypt(plaintext: string): string {
    if (!this.enabled || !plaintext) {
      return plaintext;
    }

    try {
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(ALGORITHM, this.key, iv);
      
      let encrypted = cipher.update(plaintext, 'utf8', 'base64');
      encrypted += cipher.final('base64');
      
      const authTag = cipher.getAuthTag();
      
      // Format: iv:authTag:encryptedData (tout en base64)
      return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted}`;
    } catch (error) {
      console.error('[Encryption] Erreur de chiffrement:', error);
      return plaintext;
    }
  }

  /**
   * Déchiffre une chaîne de caractères
   */
  decrypt(ciphertext: string): string {
    if (!this.enabled || !ciphertext) {
      return ciphertext;
    }

    // Vérifier si c'est un texte chiffré (format iv:authTag:data)
    const parts = ciphertext.split(':');
    if (parts.length !== 3) {
      // Pas chiffré, retourner tel quel
      return ciphertext;
    }

    try {
      const [ivBase64, authTagBase64, encryptedData] = parts;
      
      const iv = Buffer.from(ivBase64, 'base64');
      const authTag = Buffer.from(authTagBase64, 'base64');
      
      const decipher = crypto.createDecipheriv(ALGORITHM, this.key, iv);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encryptedData, 'base64', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error('[Encryption] Erreur de déchiffrement:', error);
      // En cas d'erreur, retourner le texte original (peut-être pas chiffré)
      return ciphertext;
    }
  }

  /**
   * Chiffre un objet JSON (pour les champs details des logs, etc.)
   */
  encryptObject(obj: Record<string, any>): Record<string, any> {
    if (!this.enabled || !obj) {
      return obj;
    }

    const encrypted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        encrypted[key] = this.encrypt(value);
      } else if (typeof value === 'object' && value !== null) {
        encrypted[key] = this.encryptObject(value);
      } else {
        encrypted[key] = value;
      }
    }
    
    return encrypted;
  }

  /**
   * Déchiffre un objet JSON
   */
  decryptObject(obj: Record<string, any>): Record<string, any> {
    if (!this.enabled || !obj) {
      return obj;
    }

    const decrypted: Record<string, any> = {};
    
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        decrypted[key] = this.decrypt(value);
      } else if (typeof value === 'object' && value !== null) {
        decrypted[key] = this.decryptObject(value);
      } else {
        decrypted[key] = value;
      }
    }
    
    return decrypted;
  }
}

// Singleton
export const encryptionService = new EncryptionService();
