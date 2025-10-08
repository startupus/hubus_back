export declare class CryptoUtil {
    private static readonly SALT_ROUNDS;
    private static readonly JWT_SECRET;
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hash: string): Promise<boolean>;
    static generateToken(payload: Record<string, unknown>, expiresIn?: string): string;
    static verifyToken(token: string): Record<string, unknown> | null;
    static generateId(): string;
    static generateApiKey(): string;
    static generateRefreshToken(): string;
    static generatePasswordResetToken(): string;
    static generateEmailVerificationToken(): string;
    private static generateSecureString;
}
