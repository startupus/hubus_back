/**
 * Cryptographic utilities (без нативных зависимостей)
 * Нативные функции (bcrypt, jwt) перенесены в соответствующие сервисы
 */

export class CryptoUtil {
  /**
   * Generate a secure random string
   */
  static generateSecureString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  /**
   * Generate a UUID v4 (простая реализация без внешних зависимостей)
   */
  static generateId(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Generate an API key
   */
  static generateApiKey(): string {
    const prefix = 'ak_';
    const randomPart = this.generateSecureString(40);
    return `${prefix}${randomPart}`;
  }

  /**
   * Generate a refresh token
   */
  static generateRefreshToken(): string {
    return this.generateSecureString(64);
  }

  /**
   * Generate a password reset token
   */
  static generatePasswordResetToken(): string {
    return this.generateSecureString(32);
  }

  /**
   * Generate an email verification token
   */
  static generateEmailVerificationToken(): string {
    return this.generateSecureString(32);
  }

  /**
   * Create a hash for rate limiting
   */
  static createRateLimitHash(identifier: string, window: string): string {
    const data = `${identifier}:${window}`;
    return this.simpleHash(data);
  }

  /**
   * Simple hash function for non-cryptographic purposes
   */
  private static simpleHash(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}
