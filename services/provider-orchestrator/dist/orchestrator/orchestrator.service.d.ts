import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
export interface Provider {
    id: string;
    name: string;
    baseUrl: string;
    apiKey: string;
    models: string[];
    costPerToken: number;
    maxTokens: number;
    responseTime: number;
    successRate: number;
    isActive: boolean;
    priority: number;
    fallbackOrder: number;
}
export interface RequestAnalysis {
    userId: string;
    model: string;
    prompt: string;
    expectedTokens: number;
    budget?: number;
    urgency: 'low' | 'medium' | 'high';
    quality: 'standard' | 'premium';
    options?: Record<string, any>;
}
export interface RouteResponse {
    success: boolean;
    response?: string;
    provider?: string;
    model?: string;
    cost?: number;
    tokens?: {
        input: number;
        output: number;
        total: number;
    };
    responseTime?: number;
    error?: string;
    fallbackUsed?: boolean;
}
export interface ProviderStatus {
    id: string;
    name: string;
    status: 'operational' | 'degraded' | 'down';
    lastChecked: Date;
    responseTime: number;
    successRate: number;
    errorRate: number;
    message: string;
}
export declare class OrchestratorService {
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    private readonly providers;
    private readonly providerStatuses;
    private healthCheckInterval;
    constructor(configService: ConfigService, httpService: HttpService);
    routeRequest(analysis: RequestAnalysis): Promise<RouteResponse>;
    getProviderStatus(providerId: string): Promise<ProviderStatus>;
    getProviders(): Promise<Provider[]>;
    private initializeProviders;
    private selectOptimalProvider;
    private checkProviderAvailability;
    private routeToProvider;
    private routeToFallbackProvider;
    private attemptFallbackRouting;
    private findFallbackProvider;
    private prepareProviderRequest;
    private extractTokenUsage;
    private calculateCost;
    private updateProviderStats;
    private checkProviderHealth;
    private startHealthMonitoring;
    onModuleDestroy(): void;
}
