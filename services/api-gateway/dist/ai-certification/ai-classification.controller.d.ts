import { AIClassificationRequest, AIClassificationResponse, AICategory, AIClassification } from '@ai-aggregator/shared';
import { AIClassificationService } from './ai-classification.service';
export declare class AIClassificationController {
    private readonly classificationService;
    constructor(classificationService: AIClassificationService);
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
