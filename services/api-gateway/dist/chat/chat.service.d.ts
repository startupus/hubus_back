import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ChatCompletionRequest } from '@ai-aggregator/shared';
export declare class ChatService {
    private readonly httpService;
    private readonly configService;
    private readonly proxyServiceUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    createCompletion(request: any, userId: string, provider?: 'openai' | 'openrouter' | 'yandex'): Promise<any>;
    getModels(provider?: 'openai' | 'openrouter' | 'yandex'): Promise<any[]>;
    getModelInfo(provider: 'openai' | 'openrouter' | 'yandex', model: string): Promise<any>;
    validateRequest(request: ChatCompletionRequest): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
        estimatedTokens: number;
        estimatedCost: number;
    }>;
}
