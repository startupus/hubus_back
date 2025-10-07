import { HttpService } from '@nestjs/axios';
import { ChatService } from './chat.service';
import { HistoryService } from '../history/history.service';
import { ChatCompletionRequest, RabbitMQClient } from '@ai-aggregator/shared';
import { AnonymizationService } from '../anonymization/anonymization.service';
import { ConfigService } from '@nestjs/config';
export declare class ChatController {
    private readonly chatService;
    private readonly historyService;
    private readonly anonymizationService;
    private readonly configService;
    private readonly httpService;
    private readonly rabbitmqClient;
    constructor(chatService: ChatService, historyService: HistoryService, anonymizationService: AnonymizationService, configService: ConfigService, httpService: HttpService, rabbitmqClient: RabbitMQClient);
    createCompletion(request: any, req: any, provider?: 'openai' | 'openrouter' | 'yandex'): Promise<any>;
    private restoreAnonymizedResponse;
    getModels(provider?: 'openai' | 'openrouter' | 'yandex'): Promise<{
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
        isValid: boolean;
        errors: string[];
        warnings: string[];
        estimatedTokens: number;
        estimatedCost: number;
        success: boolean;
        message: string;
    }>;
    getRecommendations(req: any, limit?: number, includeRussian?: boolean): Promise<any>;
    getPopular(limit?: number): Promise<any>;
}
