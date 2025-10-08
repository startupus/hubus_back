import { ProxyService } from '../proxy/proxy.service';
export declare class HttpController {
    private readonly proxyService;
    constructor(proxyService: ProxyService);
    proxyRequest(data: any): Promise<{
        success: boolean;
        message: string;
        responseText: string;
        inputTokens: number;
        outputTokens: number;
        cost: number;
        currency: string;
        responseTime: number;
        provider: string;
        model: string;
        finishReason: string;
        metadata: {
            errors: string[];
            warnings: string[];
            estimatedTokens?: undefined;
            estimatedCost?: undefined;
        };
    } | {
        success: boolean;
        message: string;
        responseText: any;
        inputTokens: any;
        outputTokens: any;
        cost: number;
        currency: string;
        responseTime: any;
        provider: any;
        model: any;
        finishReason: any;
        metadata: {
            estimatedTokens: number;
            estimatedCost: number;
            errors?: undefined;
            warnings?: undefined;
        };
    } | {
        success: boolean;
        message: string;
        responseText: string;
        inputTokens: number;
        outputTokens: number;
        cost: number;
        currency: string;
        responseTime: number;
        provider: string;
        model: string;
        finishReason: string;
        metadata: {
            errors?: undefined;
            warnings?: undefined;
            estimatedTokens?: undefined;
            estimatedCost?: undefined;
        };
    }>;
    getModels(): Promise<{
        success: boolean;
        message: string;
        models: any[];
    }>;
    getModel(provider: string, model: string): Promise<{
        id: string;
        name: string;
        provider: string;
        description: string;
        capabilities: string[];
        pricing: {
            input: number;
            output: number;
            currency: string;
        };
    }>;
    validateRequest(data: any): Promise<{
        valid: boolean;
        message: string;
        estimatedCost: number;
        estimatedTokens: number;
    }>;
    proxyOpenAI(data: any): Promise<{
        id: string;
        object: string;
        created: number;
        model: any;
        choices: {
            index: number;
            message: {
                role: string;
                content: string;
            };
            finish_reason: string;
        }[];
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }>;
    proxyOpenRouter(data: any): Promise<{
        id: string;
        object: string;
        created: number;
        model: any;
        choices: {
            index: number;
            message: {
                role: string;
                content: string;
            };
            finish_reason: string;
        }[];
        usage: {
            prompt_tokens: number;
            completion_tokens: number;
            total_tokens: number;
        };
    }>;
}
