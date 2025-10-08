import { OrchestratorService, RouteResponse, ProviderStatus } from './orchestrator.service';
export declare class OrchestratorController {
    private readonly orchestratorService;
    constructor(orchestratorService: OrchestratorService);
    routeRequest(body: {
        userId: string;
        model: string;
        prompt: string;
        expectedTokens?: number;
        budget?: number;
        urgency?: 'low' | 'medium' | 'high';
        quality?: 'standard' | 'premium';
        options?: Record<string, any>;
    }): Promise<RouteResponse>;
    getProviderStatus(providerId: string): Promise<ProviderStatus>;
    getProviders(): Promise<{
        providers: {
            id: string;
            name: string;
            models: string[];
            costPerToken: number;
            maxTokens: number;
            responseTime: number;
            successRate: number;
            isActive: boolean;
            priority: number;
        }[];
    }>;
}
