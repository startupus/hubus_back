export declare class CryptoUtil {
    static generateSecureString(length?: number): string;
    static generateId(): string;
    static generateApiKey(): string;
    static generateRefreshToken(): string;
    static generatePasswordResetToken(): string;
    static generateEmailVerificationToken(): string;
    static createRateLimitHash(identifier: string, window: string): string;
    private static simpleHash;
}
