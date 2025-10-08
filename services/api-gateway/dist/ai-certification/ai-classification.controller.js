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
const ai_classification_service_1 = require("./ai-classification.service");
let AIClassificationController = class AIClassificationController {
    classificationService;
    constructor(classificationService) {
        this.classificationService = classificationService;
    }
    async classifyModel(request) {
        return this.classificationService.classifyModel(request);
    }
    async getCategories() {
        return this.classificationService.getCategories();
    }
    async getCategoryInfo(category) {
        return this.classificationService.getCategoryInfo(category);
    }
    async getModelClassification(modelId) {
        return this.classificationService.getModelClassification(modelId);
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