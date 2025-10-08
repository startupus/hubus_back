export declare class CryptoUtil {
    static hashPassword(password: string): Promise<string>;
    static hashApiKey(apiKey: string): Promise<string>;
    static comparePassword(password: string, hash: string): Promise<boolean>;
    static generateApiKey(): string;
    static generateToken(): string;
    static generatePasswordResetToken(): string;
    static generateRefreshToken(): string;
}
