import * as crypto from 'crypto';

export class CryptoUtil {
  static async hashPassword(password: string): Promise<string> {
    return crypto.createHash('sha256').update(password).digest('hex');
  }

  static async hashApiKey(apiKey: string): Promise<string> {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }

  static async comparePassword(password: string, hash: string): Promise<boolean> {
    const hashedPassword = await this.hashPassword(password);
    return hashedPassword === hash;
  }

  static generateApiKey(): string {
    const prefix = 'ak_';
    const randomPart = crypto.randomBytes(32).toString('hex');
    return `${prefix}${randomPart}`;
  }

  static generateToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generatePasswordResetToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  static generateRefreshToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }
}
