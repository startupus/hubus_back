import { ConfigService } from '@nestjs/config';
export declare class RedisCacheService {
    private readonly configService;
    private readonly logger;
    private readonly redisClient;
    private readonly keyPrefix;
    private readonly defaultTTL;
    constructor(configService: ConfigService);
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<boolean>;
    delete(key: string): Promise<boolean>;
    deleteMany(keys: string[]): Promise<number>;
    clear(): Promise<boolean>;
    size(): Promise<number>;
    getStats(): Promise<{
        size: number;
        memoryUsage: string;
        hitRate?: number;
        keys: string[];
    }>;
    cacheCompanyBalance(companyId: string, balance: any): Promise<boolean>;
    getCachedCompanyBalance(companyId: string): Promise<any | null>;
    invalidateCompanyBalance(companyId: string): Promise<boolean>;
    cachePricingRules(service: string, resource: string, rules: any[]): Promise<boolean>;
    getCachedPricingRules(service: string, resource: string): Promise<any[] | null>;
    cacheCurrencyRate(from: string, to: string, rate: number): Promise<boolean>;
    getCachedCurrencyRate(from: string, to: string): Promise<number | null>;
    cacheCompanyTransactions(companyId: string, transactions: any[], page?: number): Promise<boolean>;
    getCachedCompanyTransactions(companyId: string, page?: number): Promise<any[] | null>;
    invalidateCompanyTransactions(companyId: string): Promise<boolean>;
    isConnected(): Promise<boolean>;
    disconnect(): Promise<void>;
}
