import { ChatService } from './chat.service';
import { ChatCompletionRequest } from '@ai-aggregator/shared';
export declare class ChatController {
    private readonly chatService;
    constructor(chatService: ChatService);
    createCompletion(request: any, userId: string, provider?: 'openai' | 'openrouter' | 'yandex'): Promise<any>;
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
}
