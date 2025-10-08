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
const proxy_service_1 = require("../proxy/proxy.service");
let HttpController = class HttpController {
    proxyService;
    constructor(proxyService) {
        this.proxyService = proxyService;
    }
    async proxyRequest(data) {
        try {
            shared_1.LoggerUtil.debug('proxy-service', 'HTTP ProxyRequest called', {
                user_id: data.userId,
                provider: data.provider,
                model: data.model
            });
            const validation = await this.proxyService.validateRequest({
                model: data.model,
                messages: data.messages || [{ role: 'user', content: data.prompt || 'Hello' }],
                temperature: data.temperature,
                max_tokens: data.max_tokens
            });
            if (!validation.isValid) {
                return {
                    success: false,
                    message: `Validation failed: ${validation.errors.join(', ')}`,
                    responseText: '',
                    inputTokens: 0,
                    outputTokens: 0,
                    cost: 0,
                    currency: 'USD',
                    responseTime: 0,
                    provider: '',
                    model: '',
                    finishReason: 'error',
                    metadata: { errors: validation.errors, warnings: validation.warnings },
                };
            }
            const response = await this.proxyService.processChatCompletion({
                model: data.model,
                messages: data.messages || [{ role: 'user', content: data.prompt || 'Hello' }],
                temperature: data.temperature,
                max_tokens: data.max_tokens
            }, data.userId, data.provider || 'openai');
            try {
                await this.proxyService.sendBillingEvent({
                    userId: data.userId,
                    service: 'ai-chat',
                    resource: data.model,
                    tokens: (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0),
                    cost: (response.usage?.prompt_tokens || 0) * 0.00003 + (response.usage?.completion_tokens || 0) * 0.00006,
                    provider: response.provider || data.provider || 'openai',
                    model: response.model || data.model,
                    timestamp: new Date().toISOString()
                });
            }
            catch (rabbitError) {
                shared_1.LoggerUtil.warn('proxy-service', 'Failed to send billing event', { error: rabbitError });
            }
            return {
                success: true,
                message: 'Request processed successfully',
                responseText: response.choices[0]?.message?.content || 'No response',
                inputTokens: response.usage?.prompt_tokens || 0,
                outputTokens: response.usage?.completion_tokens || 0,
                cost: (response.usage?.prompt_tokens || 0) * 0.00003 + (response.usage?.completion_tokens || 0) * 0.00006,
                currency: 'USD',
                responseTime: response.processing_time_ms || 0,
                provider: response.provider || data.provider || 'openai',
                model: response.model || data.model,
                finishReason: response.choices[0]?.finish_reason || 'stop',
                metadata: {
                    estimatedTokens: validation.estimatedTokens,
                    estimatedCost: validation.estimatedCost
                },
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('proxy-service', 'HTTP ProxyRequest failed', error);
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                responseText: '',
                inputTokens: 0,
                outputTokens: 0,
                cost: 0,
                currency: 'USD',
                responseTime: 0,
                provider: '',
                model: '',
                finishReason: 'error',
                metadata: {},
            };
        }
    }
    async getModels() {
        try {
            shared_1.LoggerUtil.debug('proxy-service', 'HTTP GetModels called');
            const models = await this.proxyService.getAvailableModels();
            return {
                success: true,
                message: 'Models retrieved successfully',
                models,
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('proxy-service', 'HTTP GetModels failed', error);
            throw error;
        }
    }
    async getModel(provider, model) {
        try {
            shared_1.LoggerUtil.debug('proxy-service', 'HTTP GetModel called', { provider, model });
            return {
                id: model,
                name: model,
                provider: provider,
                description: `Model ${model} from ${provider}`,
                capabilities: ['text_generation', 'conversation'],
                pricing: {
                    input: 0.001,
                    output: 0.002,
                    currency: 'USD'
                }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('proxy-service', 'HTTP GetModel failed', error);
            throw error;
        }
    }
    async validateRequest(data) {
        try {
            shared_1.LoggerUtil.debug('proxy-service', 'HTTP ValidateRequest called', {
                user_id: data.userId,
                provider: data.provider,
                model: data.model
            });
            return {
                valid: true,
                message: 'Request is valid',
                estimatedCost: 0.05,
                estimatedTokens: 30
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('proxy-service', 'HTTP ValidateRequest failed', error);
            return {
                valid: false,
                message: error instanceof Error ? error.message : 'Unknown error',
                estimatedCost: 0,
                estimatedTokens: 0
            };
        }
    }
    async proxyOpenAI(data) {
        try {
            shared_1.LoggerUtil.debug('proxy-service', 'HTTP ProxyOpenAI called', {
                model: data.model,
                messages_count: data.messages?.length
            });
            return {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: data.model || 'gpt-3.5-turbo',
                choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: 'Mock response from OpenAI via proxy service'
                        },
                        finish_reason: 'stop'
                    }],
                usage: {
                    prompt_tokens: 10,
                    completion_tokens: 20,
                    total_tokens: 30
                }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('proxy-service', 'HTTP ProxyOpenAI failed', error);
            throw error;
        }
    }
    async proxyOpenRouter(data) {
        try {
            shared_1.LoggerUtil.debug('proxy-service', 'HTTP ProxyOpenRouter called', {
                model: data.model,
                messages_count: data.messages?.length
            });
            return {
                id: `chatcmpl-${Date.now()}`,
                object: 'chat.completion',
                created: Math.floor(Date.now() / 1000),
                model: data.model || 'gpt-3.5-turbo',
                choices: [{
                        index: 0,
                        message: {
                            role: 'assistant',
                            content: 'Mock response from OpenRouter via proxy service'
                        },
                        finish_reason: 'stop'
                    }],
                usage: {
                    prompt_tokens: 10,
                    completion_tokens: 20,
                    total_tokens: 30
                }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('proxy-service', 'HTTP ProxyOpenRouter failed', error);
            throw error;
        }
    }
};
exports.HttpController = HttpController;
__decorate([
    (0, common_1.Post)('request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Proxy request to AI provider' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                userId: { type: 'string' },
                provider: { type: 'string' },
                model: { type: 'string' },
                prompt: { type: 'string' },
                messages: { type: 'array', items: { type: 'object' } }
            },
            required: ['userId', 'provider', 'model']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request processed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "proxyRequest", null);
__decorate([
    (0, common_1.Get)('models'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available models' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Models list retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getModels", null);
__decorate([
    (0, common_1.Get)('models/:provider/:model'),
    (0, swagger_1.ApiOperation)({ summary: 'Get specific model information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Model information retrieved successfully' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Param)('model')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "getModel", null);
__decorate([
    (0, common_1.Post)('validate-request'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Validate request before processing' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                userId: { type: 'string' },
                provider: { type: 'string' },
                model: { type: 'string' },
                prompt: { type: 'string' }
            },
            required: ['userId', 'provider', 'model']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request validation result' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "validateRequest", null);
__decorate([
    (0, common_1.Post)('openai/chat/completions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Proxy request to OpenAI' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                model: { type: 'string' },
                messages: { type: 'array', items: { type: 'object' } },
                temperature: { type: 'number' },
                max_tokens: { type: 'number' }
            },
            required: ['model', 'messages']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OpenAI request processed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "proxyOpenAI", null);
__decorate([
    (0, common_1.Post)('openrouter/chat/completions'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Proxy request to OpenRouter' }),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                model: { type: 'string' },
                messages: { type: 'array', items: { type: 'object' } },
                temperature: { type: 'number' },
                max_tokens: { type: 'number' }
            },
            required: ['model', 'messages']
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'OpenRouter request processed successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], HttpController.prototype, "proxyOpenRouter", null);
exports.HttpController = HttpController = __decorate([
    (0, swagger_1.ApiTags)('proxy'),
    (0, common_1.Controller)('proxy'),
    __metadata("design:paramtypes", [proxy_service_1.ProxyService])
], HttpController);
//# sourceMappingURL=http.controller.js.map