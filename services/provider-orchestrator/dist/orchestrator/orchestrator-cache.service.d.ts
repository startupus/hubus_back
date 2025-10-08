import { RedisClient } from '@ai-aggregator/shared';
export declare class OrchestratorCacheService {
    private readonly redisClient;
    private readonly logger;
    private readonly PROVIDER_PREFIX;
    private readonly METRICS_PREFIX;
    private readonly ROUTING_PREFIX;
    private readonly CONFIG_PREFIX;
    constructor(redisClient: RedisClient);
    cacheProviderStatus(providerId: string, status: {
        status: 'operational' | 'degraded' | 'down';
        lastChecked: Date;
        responseTime: number;
        successRate: number;
        errorRate: number;
        message: string;
    }, ttl?: number): Promise<boolean>;
    getProviderStatus(providerId: string): Promise<{
        status: 'operational' | 'degraded' | 'down';
        lastChecked: string;
        responseTime: number;
        successRate: number;
        errorRate: number;
        message: string;
        cachedAt: string;
    } | null>;
    cachePerformanceMetrics(providerId: string, metrics: {
        averageResponseTime: number;
        successRate: number;
        errorRate: number;
        totalRequests: number;
        lastHourRequests: number;
        timestamp: Date;
    }, ttl?: number): Promise<boolean>;
    getPerformanceMetrics(providerId: string): Promise<{
        averageResponseTime: number;
        successRate: number;
        errorRate: number;
        totalRequests: number;
        lastHourRequests: number;
        timestamp: string;
        cachedAt: string;
    } | null>;
    cacheRoutingResult(requestHash: string, result: {
        selectedProvider: string;
        reason: string;
        estimatedCost: number;
        estimatedTime: number;
        alternatives: string[];
    }, ttl?: number): Promise<boolean>;
    getRoutingResult(requestHash: string): Promise<{
        selectedProvider: string;
        reason: string;
        estimatedCost: number;
        estimatedTime: number;
        alternatives: string[];
        cachedAt: string;
    } | null>;
    cacheProviderConfig(providerId: string, config: {
        name: string;
        apiUrl: string;
        models: string[];
        costPerToken: number;
        maxTokens: number;
        priority: number;
        isActive: boolean;
    }, ttl?: number): Promise<boolean>;
    getProviderConfig(providerId: string): Promise<{
        name: string;
        apiUrl: string;
        models: string[];
        costPerToken: number;
        maxTokens: number;
        priority: number;
        isActive: boolean;
        cachedAt: string;
    } | null>;
    cacheAllProviders(providers: any[], ttl?: number): Promise<boolean>;
    getAllProviders(): Promise<{
        providers: any[];
        cachedAt: string;
    } | null>;
    clearProviderCache(providerId: string): Promise<boolean>;
    clearAllCache(): Promise<boolean>;
    getCacheStats(): Promise<{
        totalProviders: number;
        totalMetrics: number;
        totalRoutingResults: number;
        totalConfigs: number;
    }>;
}
