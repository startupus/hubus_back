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
exports.HttpController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const shared_1 = require("@ai-aggregator/shared");
let HttpController = class HttpController {
    constructor() { }
    async routeRequest(data) {
        try {
            shared_1.LoggerUtil.debug('provider-orchestrator', 'HTTP RouteRequest called', {
                userId: data.userId,
                model: data.model
            });
            return {
                success: true,
                message: 'Request routed successfully',
                provider: data.provider || 'openai',
                model: data.model || 'gpt-3.5-turbo',
                estimatedCost: 0.05,
                estimatedTokens: 30
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'HTTP RouteRequest failed', error);
            throw error;
        }
    }
    async getProviderStatus(providerId) {
        try {
            shared_1.LoggerUtil.debug('provider-orchestrator', 'HTTP GetProviderStatus called', {
                provider_id: providerId
            });
            return {
                provider: providerId,
                status: 'operational',
                responseTime: 100,
                successRate: 99.5,
                errorRate: 0.5,
                message: 'Provider is operational'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'HTTP GetProviderStatus failed', error);
            throw error;
        }
    }
    async getProviders() {
        try {
            shared_1.LoggerUtil.debug('provider-orchestrator', 'HTTP GetProviders called');
            return {
                providers: [
                    {
                        id: 'openai',
                        name: 'OpenAI',
                        status: 'operational',
                        models: ['gpt-4', 'gpt-3.5-turbo']
                    },
                    {
                        id: 'openrouter',
                        name: 'OpenRouter',
                        status: 'operational',
                        models: ['gpt-4', 'claude-3']
                    }
                ]
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'HTTP GetProviders failed', error);
            throw error;
        }
    }
    async getModels() {
        try {
            shared_1.LoggerUtil.debug('provider-orchestrator', 'HTTP GetModels called');
            return {
                models: [
                    {
                        id: 'gpt-4',
                        name: 'GPT-4',
                        provider: 'OpenAI',
                        status: 'available',
                        costPerToken: 0.00003
                    },
                    {
                        id: 'gpt-3.5-turbo',
                        name: 'GPT-3.5 Turbo',
                        provider: 'OpenAI',
                        status: 'available',
                        costPerToken: 0.00002
                    }
                ]
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'HTTP GetModels failed', error);
            throw error;
        }
    }
};
exports.HttpController = HttpController;
__decorate([
    (0, common_1.Post)('route-request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Route request to appropriate provider' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                userId: { type: 'string' },
                model: { type: 'string' },
                prompt: { type: 'string' },
                provider: { type: 'string' }
            },
            required: ['userId', 'model']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request routed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "routeRequest", null);
__decorate([
    (0, common_1.Get)('provider-status/:providerId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get provider status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Provider status retrieved successfully' }),
    __param(0, (0, common_1.Param)('providerId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getProviderStatus", null);
__decorate([
    (0, common_1.Get)('providers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of available providers' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Providers list retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getProviders", null);
__decorate([
    (0, common_1.Get)('models'),
    (0, swagger_1.ApiOperation)({ summary: 'Get list of available models' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Models list retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getModels", null);
exports.HttpController = HttpController = __decorate([
    (0, swagger_1.ApiTags)('orchestrator'),
    (0, common_1.Controller)('orchestrator'),
    __metadata("design:paramtypes", [])
], HttpController);
//# sourceMappingURL=http.controller.js.map