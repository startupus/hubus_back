/**
 * Cryptographic utilities (без нативных зависимостей)
 * Нативные функции (bcrypt, jwt) перенесены в соответствующие сервисы
 */
export declare class CryptoUtil {
    /**
     * Generate a secure random string
     */
    static generateSecureString(length?: number): string;
    /**
     * Generate a UUID v4 (простая реализация без внешних зависимостей)
     */
    static generateId(): string;
    /**
     * Generate an API key
     */
    static generateApiKey(): string;
    /**
     * Generate a refresh token
     */
    static generateRefreshToken(): string;
    /**
     * Generate a password reset token
     */
    static generatePasswordResetToken(): string;
    /**
     * Generate an email verification token
     */
    static generateEmailVerificationToken(): string;
    /**
     * Create a hash for rate limiting
     */
    static createRateLimitHash(identifier: string, window: string): string;
    /**
     * Simple hash function for non-cryptographic purposes
     */
    private static simpleHash;
}
//# sourceMappingURL=crypto.util.d.ts.map