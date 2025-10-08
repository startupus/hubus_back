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
exports.ProxyController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@ai-aggregator/shared");
const proxy_service_1 = require("./proxy.service");
let ProxyController = class ProxyController {
    proxyService;
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    async chatCompletions(request, userId, provider = 'openai') {
        try {
            if (!request || !request.model) {
                throw new Error('Missing required field: model');
            }
            if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
                throw new Error('Missing or invalid messages array');
            }
            shared_1.LoggerUtil.debug('proxy-service', 'Chat completions request', {
                userId,
                provider,
                model: request.model,
                messageCount: request.messages?.length || 0
            });
            return await this.proxyService.processChatCompletion(request, userId, provider);
        }
        catch (error) {
            shared_1.LoggerUtil.error('proxy-service', 'Chat completions failed', error, {
                userId,
                provider,
                model: request.model
            });
            throw error;
        }
    }
    async getModels(provider, category) {
        try {
            shared_1.LoggerUtil.debug('proxy-service', 'Get models request', { provider, category });
            const models = await this.proxyService.getAvailableModels(provider);
            return {
                success: true,
                message: 'Models retrieved successfully',
                models: models.filter(model => !category || model.category === category),
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('proxy-service', 'Get models failed', error, { provider, category });
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                models: [],
            };
        }
    }
    async getModelInfo(provider, model) {
        try {
            shared_1.LoggerUtil.debug('proxy-service', 'Get model info request', { provider, model });
            const models = await this.proxyService.getAvailableModels(provider);
            const modelInfo = models.find(m => m.id === model);
            if (!modelInfo) {
                return {
                    success: false,
                    message: `Model ${model} not found for provider ${provider}`,
                    model: null,
                };
            }
            return {
                success: true,
                message: 'Model info retrieved successfully',
                model: modelInfo,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('proxy-service', 'Get model info failed', error, { provider, model });
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                model: null,
            };
        }
    }
    async validateRequest(request) {
        try {
            shared_1.LoggerUtil.debug('proxy-service', 'Validate request', {
                model: request.model,
                messageCount: request.messages.length
            });
            const validation = await this.proxyService.validateRequest(request);
            return {
                success: validation.isValid,
                message: validation.isValid ? 'Request is valid' : 'Request validation failed',
                is_valid: validation.isValid,
                errors: validation.errors,
                warnings: validation.warnings,
                estimated_tokens: validation.estimatedTokens,
                estimated_cost: validation.estimatedCost,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('proxy-service', 'Validate request failed', error, {
                model: request.model
            });
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                is_valid: false,
                errors: [error instanceof Error ? error.message : 'Unknown error'],
                warnings: [],
                estimated_tokens: 0,
                estimated_cost: 0,
            };
        }
    }
};
exports.ProxyController = ProxyController;
__decorate([
    (0, common_1.Post)('chat/completions'),
    (0, swagger_1.ApiOperation)({ summary: 'Process chat completion with anonymization' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Chat completion processed successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Query)('user_id')),
    __param(2, (0, common_1.Query)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "chatCompletions", null);
__decorate([
    (0, common_1.Get)('models'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available models' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Models retrieved successfully' }),
    __param(0, (0, common_1.Query)('provider')),
    __param(1, (0, common_1.Query)('category')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "getModels", null);
__decorate([
    (0, common_1.Get)('models/:provider/:model'),
    (0, swagger_1.ApiOperation)({ summary: 'Get model information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Model info retrieved successfully' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Param)('model')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "getModelInfo", null);
__decorate([
    (0, common_1.Post)('validate-request'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate request before processing' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request validated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shared_1.ChatCompletionRequest]),
    __metadata("design:returntype", Promise)
], ProxyController.prototype, "validateRequest", null);
exports.ProxyController = ProxyController = __decorate([
    (0, swagger_1.ApiTags)('Proxy Service'),
    (0, common_1.Controller)('proxy'),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], ProxyController);
//# sourceMappingURL=proxy.controller.js.map