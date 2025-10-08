export declare class HttpController {
    constructor();
    routeRequest(data: any): Promise<{
        success: boolean;
        message: string;
        provider: any;
        model: any;
        estimatedCost: number;
        estimatedTokens: number;
    }>;
    getProviderStatus(providerId: string): Promise<{
        provider: string;
        status: string;
        responseTime: number;
        successRate: number;
        errorRate: number;
        message: string;
    }>;
    getProviders(): Promise<{
        providers: {
            id: string;
            name: string;
            status: string;
            models: string[];
        }[];
    }>;
    getModels(): Promise<{
        models: {
            id: string;
            name: string;
            provider: string;
            status: string;
            costPerToken: number;
        }[];
    }>;
}
