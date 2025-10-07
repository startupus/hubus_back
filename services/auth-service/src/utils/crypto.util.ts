/**
 * Cryptographic utilities for Auth Service
 * Локальные криптографические функции для auth-service
 */

import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

export class CryptoUtil {
  private static readonly SALT_ROUNDS = 12;
  private static readonly JWT_SECRET = process.env['JWT_SECRET'] || 'default-secret';

  /**
   * Hash a password using bcrypt
   */
  static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, this.SALT_ROUNDS);
  }

  /**
   * Compare a password with its hash
   */
  static async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a JWT token
   */
  static generateToken(payload: Record<string, unknown>, expiresIn: string = '24h'): string {
    return jwt.sign(payload, this.JWT_SECRET, { expiresIn } as any);
  }

  /**
   * Verify a JWT token
   */
  static verifyToken(token: string): Record<string, unknown> | null {
    try {
      return jwt.verify(token, this.JWT_SECRET) as Record<string, unknown>;
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate a UUID v4
   */
  static generateId(): string {
    return uuidv4();
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
   * Generate a secure random string
   */
  private static generateSecureString(length: number = 32): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
