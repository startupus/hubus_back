/**
 * Cryptographic utilities
 */
export declare class CryptoUtil {
    private static readonly SALT_ROUNDS;
    private static readonly JWT_SECRET;
    /**
     * Hash a password using bcrypt
     */
    static hashPassword(password: string): Promise<string>;
    /**
     * Compare a password with its hash
     */
    static comparePassword(password: string, hash: string): Promise<boolean>;
    /**
     * Generate a JWT token
     */
    static generateToken(payload: Record<string, unknown>, expiresIn?: string): string;
    /**
     * Verify a JWT token
     */
    static verifyToken(token: string): Record<string, unknown> | null;
    /**
     * Generate a secure random string
     */
    static generateSecureString(length?: number): string;
    /**
     * Generate a UUID v4
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