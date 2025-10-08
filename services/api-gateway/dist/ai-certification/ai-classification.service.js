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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIClassificationService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const shared_1 = require("@ai-aggregator/shared");
let AIClassificationService = class AIClassificationService {
    httpService;
    configService;
    classificationServiceUrl;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.classificationServiceUrl = this.configService.get('CLASSIFICATION_SERVICE_URL', 'http://classification-service:3006');
    }
    async classifyModel(request) {
        try {
            shared_1.LoggerUtil.info('api-gateway', 'Classifying AI model', {
                modelId: request.modelId,
                provider: request.provider,
                modelName: request.modelName
            });
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.classificationServiceUrl}/ai/classification/classify`, request));
            shared_1.LoggerUtil.info('api-gateway', 'Model classification completed', {
                modelId: request.modelId,
                success: response.data.success
            });
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Model classification failed', error, {
                modelId: request.modelId,
                provider: request.provider
            });
            if (error.response?.status) {
                throw new common_1.HttpException(error.response.data?.message || 'Classification service error', error.response.status);
            }
            throw new common_1.HttpException('Failed to classify model', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCategories() {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.classificationServiceUrl}/ai/classification/categories`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get categories failed', error);
            throw new common_1.HttpException('Failed to get categories', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCategoryInfo(category) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.classificationServiceUrl}/ai/classification/categories/${category}`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get category info failed', error, { category });
            throw new common_1.HttpException('Failed to get category info', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getModelClassification(modelId) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.classificationServiceUrl}/ai/classification/models/${modelId}/classification`));
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get model classification failed', error, { modelId });
            throw new common_1.HttpException('Failed to get model classification', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.AIClassificationService = AIClassificationService;
exports.AIClassificationService = AIClassificationService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], AIClassificationService);
//# sourceMappingURL=ai-classification.service.js.map