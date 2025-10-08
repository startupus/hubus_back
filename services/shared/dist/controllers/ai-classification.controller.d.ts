import { AIClassificationRequest, AIClassificationResponse, AICategory, AIClassification } from '../types/ai-certification';
import { AIClassificationService } from '../services/ai-classification.service';
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
    private getCategoryDescription;
}
//# sourceMappingURL=ai-classification.controller.d.ts.map