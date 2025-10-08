export declare class AuthCacheService {
    private readonly logger;
    cacheToken(token: string, userId: string, expiresIn: number): Promise<boolean>;
    getTokenData(token: string): Promise<{
        userId: string;
        issuedAt: string;
        expiresAt: string;
    } | null>;
    invalidateToken(token: string): Promise<boolean>;
    cacheApiKey(apiKey: string, userId: string, permissions: string[], expiresIn: number): Promise<boolean>;
    getApiKeyData(apiKey: string): Promise<{
        userId: string;
        permissions: string[];
        createdAt: string;
        expiresAt: string;
    } | null>;
    invalidateApiKey(apiKey: string): Promise<boolean>;
    cacheUserSession(sessionId: string, userId: string, data: any, expiresIn: number): Promise<boolean>;
    getUserSession(sessionId: string): Promise<{
        userId: string;
        data: any;
        createdAt: string;
        expiresAt: string;
    } | null>;
    invalidateUserSession(sessionId: string): Promise<boolean>;
    checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<{
        allowed: boolean;
        remaining: number;
        resetTime: number;
    }>;
    clearUserCache(userId: string): Promise<boolean>;
    getCacheStats(): Promise<{
        totalTokens: number;
        totalApiKeys: number;
        totalSessions: number;
        totalRateLimits: number;
    }>;
}
