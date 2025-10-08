export declare class CacheService {
    private readonly logger;
    private readonly cache;
    private readonly defaultTTL;
    get<T>(key: string): T | null;
    set<T>(key: string, value: T, ttl?: number): void;
    delete(key: string): boolean;
    clear(): void;
    size(): number;
    getStats(): {
        size: number;
        keys: string[];
    };
    cleanup(): void;
    cacheUserBalance(userId: string, balance: any): void;
    getCachedUserBalance(userId: string): any | null;
    invalidateUserBalance(userId: string): void;
    cachePricingRules(service: string, resource: string, rules: any[]): void;
    getCachedPricingRules(service: string, resource: string): any[] | null;
    cacheCurrencyRate(from: string, to: string, rate: number): void;
    getCachedCurrencyRate(from: string, to: string): number | null;
}
