import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { ChatCompletionRequest } from '@ai-aggregator/shared';
import { AnonymizationService } from '../anonymization/anonymization.service';
export declare class ProxyService {
    private readonly httpService;
    private readonly configService;
    private readonly anonymizationService;
    private readonly openaiApiKey;
    private readonly openrouterApiKey;
    private readonly yandexApiKey;
    private readonly yandexFolderId;
    private readonly openaiBaseUrl;
    private readonly openrouterBaseUrl;
    private readonly yandexBaseUrl;
    constructor(httpService: HttpService, configService: ConfigService, anonymizationService: AnonymizationService);
    processChatCompletion(request: any, userId: string, provider?: 'openai' | 'openrouter' | 'yandex'): Promise<any>;
    private sendToProvider;
    private deanonymizeResponse;
    sendBillingEvent(billingData: any): Promise<void>;
    getAvailableModels(provider?: 'openai' | 'openrouter' | 'yandex'): Promise<any[]>;
    private getOpenAIModels;
    private getOpenRouterModels;
    private getYandexModels;
    validateRequest(request: ChatCompletionRequest): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
        estimatedTokens: number;
        estimatedCost: number;
    }>;
    private estimateTokens;
    private createMockResponse;
}
