import { HttpService } from '@nestjs/axios';
export declare class ConcurrentOrchestratorService {
    private readonly httpService;
    private readonly logger;
    private readonly providerStatusCache;
    private readonly routingCache;
    private readonly metricsCache;
    private readonly totalRequests;
    private readonly successfulRequests;
    private readonly failedRequests;
    private readonly totalResponseTime;
    private readonly routingQueue;
    private readonly providerLocks;
    private readonly providers;
    constructor(httpService: HttpService);
    private initializeProviders;
    routeRequest(userId: string, model: string, prompt: string, expectedTokens: number, priority?: number): Promise<{
        success: boolean;
        selectedProvider: string;
        estimatedCost: number;
        estimatedTime: number;
        alternatives: string[];
        error?: string;
    }>;
    routeBatchRequests(requests: Array<{
        userId: string;
        model: string;
        prompt: string;
        expectedTokens: number;
        priority?: number;
    }>): Promise<Array<{
        success: boolean;
        selectedProvider: string;
        estimatedCost: number;
        estimatedTime: number;
        alternatives: string[];
        error?: string;
    }>>;
    getProviderStatus(providerId: string): Promise<{
        status: 'operational' | 'degraded' | 'down';
        responseTime: number;
        successRate: number;
        lastChecked: Date;
        message: string;
    }>;
    getAllProvidersStatus(): Promise<Array<{
        id: string;
        name: string;
        status: 'operational' | 'degraded' | 'down';
        responseTime: number;
        successRate: number;
        lastChecked: Date;
        message: string;
    }>>;
    private selectOptimalProvider;
    private getAlternativeProviders;
    private performHealthCheck;
    private calculateCost;
    private estimateResponseTime;
    private startRoutingProcessor;
    private startHealthMonitoring;
    private createRequestHash;
    private generateRequestId;
    getStats(): {
        totalRequests: number;
        successfulRequests: number;
        failedRequests: number;
        averageResponseTime: number;
        queueSize: number;
        cacheStats: {
            providerStatusCache: number;
            routingCache: number;
            metricsCache: number;
        };
    };
    clearCache(): Promise<void>;
}
