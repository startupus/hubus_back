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
exports.ChatService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const rxjs_1 = require("rxjs");
const shared_1 = require("@ai-aggregator/shared");
let ChatService = class ChatService {
    httpService;
    configService;
    proxyServiceUrl;
    constructor(httpService, configService) {
        this.httpService = httpService;
        this.configService = configService;
        this.proxyServiceUrl = this.configService.get('PROXY_SERVICE_URL', 'http://proxy-service:3003');
    }
    async createCompletion(request, userId, provider = 'openai') {
        try {
            shared_1.LoggerUtil.info('api-gateway', 'Creating chat completion', {
                userId,
                provider,
                model: request.model,
                messageCount: request.messages.length,
                request: JSON.stringify(request, null, 2)
            });
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.proxyServiceUrl}/proxy/chat/completions?user_id=${userId}&provider=${provider}`, request));
            shared_1.LoggerUtil.info('api-gateway', 'Chat completion created successfully', {
                userId,
                provider,
                model: request.model,
                processingTimeMs: response.data.processing_time_ms
            });
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Chat completion failed', error, {
                userId,
                provider,
                model: request.model
            });
            if (error.response?.status) {
                throw new common_1.HttpException(error.response.data?.message || 'Proxy service error', error.response.status);
            }
            throw new common_1.HttpException('Failed to create chat completion', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getModels(provider) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.proxyServiceUrl}/proxy/models`, {
                params: provider ? { provider } : {}
            }));
            if (!response.data.success) {
                throw new common_1.HttpException('Failed to get models', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return response.data.models;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get models failed', error, { provider });
            throw new common_1.HttpException('Failed to get models', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getModelInfo(provider, model) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${this.proxyServiceUrl}/proxy/models/${provider}/${model}`));
            if (!response.data.success) {
                throw new common_1.HttpException('Failed to get model info', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
            return response.data.model;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Get model info failed', error, { provider, model });
            throw new common_1.HttpException('Failed to get model info', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async validateRequest(request) {
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${this.proxyServiceUrl}/proxy/validate-request`, request));
            return {
                isValid: response.data.is_valid,
                errors: response.data.errors,
                warnings: response.data.warnings,
                estimatedTokens: response.data.estimated_tokens,
                estimatedCost: response.data.estimated_cost,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Validate request failed', error);
            throw new common_1.HttpException('Failed to validate request', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.ChatService = ChatService;
exports.ChatService = ChatService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService,
        config_1.ConfigService])
], ChatService);
//# sourceMappingURL=chat.service.js.map