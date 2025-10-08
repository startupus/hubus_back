import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AIClassificationRequest, AIClassificationResponse, AICategory, AIClassification } from '@ai-aggregator/shared';
export declare class AIClassificationService {
    private readonly httpService;
    private readonly configService;
    private readonly classificationServiceUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    classifyModel(request: AIClassificationRequest): Promise<AIClassificationResponse>;
    getCategories(): Promise<{
        categories: AICategory[];
    }>;
    getCategoryInfo(category: string): Promise<{
        category: AICategory;
        description: string;
        useCases: string[];
    }>;
    getModelClassification(modelId: string): Promise<AIClassification | null>;
}
