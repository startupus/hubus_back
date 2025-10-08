"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIClassificationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const ai_certification_1 = require("../types/ai-certification");
const ai_classification_service_1 = require("../services/ai-classification.service");
let AIClassificationController = class AIClassificationController {
    classificationService;
    constructor(classificationService) {
        this.classificationService = classificationService;
    }
    async classifyModel(request) {
        return this.classificationService.classifyModel(request);
    }
    async getCategories() {
        return {
            categories: Object.values(ai_certification_1.AICategory)
        };
    }
    async getCategoryInfo(category) {
        const categoryInfo = this.getCategoryDescription(category);
        return {
            category: category,
            description: categoryInfo.description,
            useCases: categoryInfo.useCases
        };
    }
    async getModelClassification(modelId) {
        // В реальной реализации здесь был бы запрос к базе данных
        return null;
    }
    getCategoryDescription(category) {
        const descriptions = {
            [ai_certification_1.AICategory.TEXT_GENERATION]: {
                description: 'Models that generate human-like text content',
                useCases: ['Content creation', 'Creative writing', 'Article generation']
            },
            [ai_certification_1.AICategory.CODE_GENERATION]: {
                description: 'Models that generate programming code',
                useCases: ['Software development', 'Code completion', 'Bug fixing']
            },
            [ai_certification_1.AICategory.IMAGE_GENERATION]: {
                description: 'Models that generate images from text descriptions',
                useCases: ['Digital art', 'Product visualization', 'Marketing materials']
            },
            [ai_certification_1.AICategory.CONVERSATION]: {
                description: 'Models designed for interactive conversations',
                useCases: ['Customer support', 'Virtual assistants', 'Chatbots']
            },
            [ai_certification_1.AICategory.TRANSLATION]: {
                description: 'Models that translate text between languages',
                useCases: ['Document translation', 'Real-time communication', 'Content localization']
            },
            [ai_certification_1.AICategory.SUMMARIZATION]: {
                description: 'Models that create summaries of longer texts',
                useCases: ['News summarization', 'Document analysis', 'Research assistance']
            },
            [ai_certification_1.AICategory.QUESTION_ANSWERING]: {
                description: 'Models that answer questions based on knowledge',
                useCases: ['Educational support', 'Customer service', 'Research assistance']
            },
            [ai_certification_1.AICategory.SENTIMENT_ANALYSIS]: {
                description: 'Models that analyze emotional tone in text',
                useCases: ['Social media monitoring', 'Customer feedback analysis', 'Market research']
            },
            [ai_certification_1.AICategory.CLASSIFICATION]: {
                description: 'Models that categorize or classify data',
                useCases: ['Content moderation', 'Email filtering', 'Document organization']
            },
            [ai_certification_1.AICategory.EMBEDDING]: {
                description: 'Models that create vector representations of text',
                useCases: ['Semantic search', 'Recommendation systems', 'Similarity matching']
            },
            [ai_certification_1.AICategory.REASONING]: {
                description: 'Models that perform logical reasoning tasks',
                useCases: ['Problem solving', 'Decision support', 'Analytical tasks']
            },
            [ai_certification_1.AICategory.CREATIVE_WRITING]: {
                description: 'Models specialized in creative content generation',
                useCases: ['Story writing', 'Poetry', 'Screenplay writing']
            },
            [ai_certification_1.AICategory.TECHNICAL_WRITING]: {
                description: 'Models for technical documentation and writing',
                useCases: ['API documentation', 'Technical manuals', 'User guides']
            },
            [ai_certification_1.AICategory.EDUCATION]: {
                description: 'Models designed for educational purposes',
                useCases: ['Tutoring', 'Learning assistance', 'Educational content']
            },
            [ai_certification_1.AICategory.RESEARCH]: {
                description: 'Models for research and scientific tasks',
                useCases: ['Literature review', 'Hypothesis generation', 'Data analysis']
            },
            [ai_certification_1.AICategory.BUSINESS]: {
                description: 'Models for business applications',
                useCases: ['Business analysis', 'Strategy planning', 'Market research']
            },
            [ai_certification_1.AICategory.MEDICAL]: {
                description: 'Models for medical and healthcare applications',
                useCases: ['Medical diagnosis', 'Drug discovery', 'Health monitoring']
            },
            [ai_certification_1.AICategory.LEGAL]: {
                description: 'Models for legal applications',
                useCases: ['Legal research', 'Contract analysis', 'Compliance checking']
            },
            [ai_certification_1.AICategory.FINANCIAL]: {
                description: 'Models for financial applications',
                useCases: ['Risk assessment', 'Fraud detection', 'Investment analysis']
            },
            [ai_certification_1.AICategory.OTHER]: {
                description: 'Models that don\'t fit into specific categories',
                useCases: ['General purpose', 'Experimental', 'Specialized tasks']
            }
        };
        return descriptions[category] || {
            description: 'Unknown category',
            useCases: []
        };
    }
};
exports.AIClassificationController = AIClassificationController;
__decorate([
    (0, common_1.Post)('classify'),
    (0, swagger_1.ApiOperation)({ summary: 'Classify AI model' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Model classified successfully' }),
    (0, swagger_1.ApiResponse)({ status: 400, description: 'Invalid request' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AIClassificationController.prototype, "classifyModel", null);
__decorate([
    (0, common_1.Get)('categories'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available AI categories' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Categories retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AIClassificationController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('categories/:category'),
    (0, swagger_1.ApiOperation)({ summary: 'Get category information' }),
    (0, swagger_1.ApiParam)({ name: 'category', description: 'Category name' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Category info retrieved successfully' }),
    __param(0, (0, common_1.Param)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AIClassificationController.prototype, "getCategoryInfo", null);
__decorate([
    (0, common_1.Get)('models/:modelId/classification'),
    (0, swagger_1.ApiOperation)({ summary: 'Get model classification' }),
    (0, swagger_1.ApiParam)({ name: 'modelId', description: 'Model ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Classification retrieved successfully' }),
    __param(0, (0, common_1.Param)('modelId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AIClassificationController.prototype, "getModelClassification", null);
exports.AIClassificationController = AIClassificationController = __decorate([
    (0, swagger_1.ApiTags)('AI Classification'),
    (0, common_1.Controller)('ai/classification'),
    __metadata("design:paramtypes", [ai_classification_service_1.AIClassificationService])
], AIClassificationController);
//# sourceMappingURL=ai-classification.controller.js.map