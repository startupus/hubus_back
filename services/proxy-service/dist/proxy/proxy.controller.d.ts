import { ChatCompletionRequest } from '@ai-aggregator/shared';
import { ProxyService } from './proxy.service';
export declare class ProxyController {
    private readonly proxyService;
    constructor(proxyService: ProxyService);
    chatCompletions(request: any, userId: string, provider?: 'openai' | 'openrouter' | 'yandex'): Promise<any>;
    getModels(provider?: 'openai' | 'openrouter' | 'yandex', category?: string): Promise<{
        success: boolean;
        message: string;
        models: any[];
    }>;
    getModelInfo(provider: 'openai' | 'openrouter' | 'yandex', model: string): Promise<{
        success: boolean;
        message: string;
        model: any;
    }>;
    validateRequest(request: ChatCompletionRequest): Promise<{
        success: boolean;
        message: string;
        is_valid: boolean;
        errors: string[];
        warnings: string[];
        estimated_tokens: number;
        estimated_cost: number;
    }>;
}
