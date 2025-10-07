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
exports.ChatController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const axios_1 = require("@nestjs/axios");
const chat_service_1 = require("./chat.service");
const history_service_1 = require("../history/history.service");
const shared_1 = require("@ai-aggregator/shared");
const anonymization_service_1 = require("../anonymization/anonymization.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const config_1 = require("@nestjs/config");
let ChatController = class ChatController {
    chatService;
    historyService;
    anonymizationService;
    configService;
    httpService;
    rabbitmqClient;
    constructor(chatService, historyService, anonymizationService, configService, httpService, rabbitmqClient) {
        this.chatService = chatService;
        this.historyService = historyService;
        this.anonymizationService = anonymizationService;
        this.configService = configService;
        this.httpService = httpService;
        this.rabbitmqClient = rabbitmqClient;
    }
    async createCompletion(request, req, provider = 'openai') {
        const userId = req.user.id;
        const sessionId = req.user.sessionId || null;
        const startTime = Date.now();
        console.log('Chat completion request received:', JSON.stringify(request, null, 2));
        const shouldAnonymize = await this.anonymizationService.shouldAnonymize(provider, request.model || 'gpt-3.5-turbo');
        let requestToSend = request;
        let anonymizationMapping = null;
        if (shouldAnonymize) {
            shared_1.LoggerUtil.info('api-gateway', 'Anonymizing request before sending to AI provider', {
                userId,
                provider,
                model: request.model || 'gpt-3.5-turbo'
            });
            const anonymizedData = this.anonymizationService.anonymizeChatMessages(request.messages);
            requestToSend = {
                ...request,
                messages: anonymizedData.data
            };
            anonymizationMapping = anonymizedData.mapping;
        }
        const historyRecord = await this.historyService.createRequestHistory({
            userId,
            sessionId,
            requestType: shared_1.RequestType.CHAT_COMPLETION,
            provider,
            model: request.model || 'gpt-3.5-turbo',
            requestData: request,
            status: shared_1.RequestStatus.SUCCESS,
        });
        try {
            const response = await this.chatService.createCompletion(requestToSend, userId, provider);
            const responseTime = Date.now() - startTime;
            let finalResponse = response;
            if (shouldAnonymize && anonymizationMapping) {
                shared_1.LoggerUtil.info('api-gateway', 'Restoring anonymized data in response', {
                    userId,
                    provider,
                    model: request.model || 'gpt-3.5-turbo'
                });
                finalResponse = this.restoreAnonymizedResponse(response, anonymizationMapping);
            }
            await this.historyService.updateRequestHistory(historyRecord.id, {
                responseData: response,
                tokensUsed: response.usage?.total_tokens,
                cost: response.usage?.total_tokens ? response.usage.total_tokens * 0.00002 : 0,
                responseTime,
                status: shared_1.RequestStatus.SUCCESS,
            });
            try {
                await this.rabbitmqClient.publishCriticalMessage('analytics.events', {
                    eventType: 'ai_interaction',
                    eventName: 'chat_completion_success',
                    userId,
                    sessionId,
                    service: 'api-gateway',
                    properties: {
                        provider,
                        model: request.model || 'gpt-3.5-turbo',
                        tokensUsed: response.usage?.total_tokens || 0,
                        cost: response.usage?.total_tokens ? response.usage.total_tokens * 0.00002 : 0,
                        responseTime,
                        requestType: shared_1.RequestType.CHAT_COMPLETION,
                        status: shared_1.RequestStatus.SUCCESS
                    },
                    metadata: {
                        historyId: historyRecord.id,
                        requestData: {
                            messages: request.messages?.length || 0,
                            temperature: request.temperature,
                            max_tokens: request.max_tokens
                        }
                    },
                    timestamp: new Date().toISOString()
                });
            }
            catch (rabbitError) {
                shared_1.LoggerUtil.warn('api-gateway', 'Failed to send analytics event', {
                    userId,
                    historyId: historyRecord.id,
                    error: rabbitError instanceof Error ? rabbitError.message : String(rabbitError)
                });
            }
            return finalResponse;
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            await this.historyService.updateRequestHistory(historyRecord.id, {
                responseTime,
                status: shared_1.RequestStatus.ERROR,
                errorMessage: error instanceof Error ? error.message : String(error),
            });
            try {
                await this.rabbitmqClient.publishCriticalMessage('analytics.events', {
                    eventType: 'ai_interaction',
                    eventName: 'chat_completion_error',
                    userId,
                    sessionId,
                    service: 'api-gateway',
                    properties: {
                        provider,
                        model: request.model || 'gpt-3.5-turbo',
                        responseTime,
                        requestType: shared_1.RequestType.CHAT_COMPLETION,
                        status: shared_1.RequestStatus.ERROR,
                        errorMessage: error instanceof Error ? error.message : String(error)
                    },
                    metadata: {
                        historyId: historyRecord.id,
                        requestData: {
                            messages: request.messages?.length || 0,
                            temperature: request.temperature,
                            max_tokens: request.max_tokens
                        }
                    },
                    timestamp: new Date().toISOString()
                });
            }
            catch (rabbitError) {
                shared_1.LoggerUtil.warn('api-gateway', 'Failed to send analytics error event', {
                    userId,
                    historyId: historyRecord.id,
                    error: rabbitError instanceof Error ? rabbitError.message : String(rabbitError)
                });
            }
            throw error;
        }
    }
    restoreAnonymizedResponse(response, mapping) {
        try {
            if (!response.choices || !Array.isArray(response.choices)) {
                return response;
            }
            const reverseMapping = {};
            Object.entries(mapping).forEach(([key, value]) => {
                reverseMapping[value] = key;
            });
            const restoredChoices = response.choices.map((choice) => {
                if (choice.message && choice.message.content) {
                    let restoredContent = choice.message.content;
                    Object.entries(reverseMapping).forEach(([anonymized, original]) => {
                        const regex = new RegExp(anonymized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
                        restoredContent = restoredContent.replace(regex, original);
                    });
                    return {
                        ...choice,
                        message: {
                            ...choice.message,
                            content: restoredContent
                        }
                    };
                }
                return choice;
            });
            return {
                ...response,
                choices: restoredChoices
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to restore anonymized response', error);
            return response;
        }
    }
    async getModels(provider) {
        const models = await this.chatService.getModels(provider);
        return {
            success: true,
            message: 'Models retrieved successfully',
            models
        };
    }
    async getModelInfo(provider, model) {
        const modelInfo = await this.chatService.getModelInfo(provider, model);
        return {
            success: true,
            message: 'Model info retrieved successfully',
            model: modelInfo
        };
    }
    async validateRequest(request) {
        const validation = await this.chatService.validateRequest(request);
        return {
            success: validation.isValid,
            message: validation.isValid ? 'Request is valid' : 'Request validation failed',
            ...validation
        };
    }
    async getRecommendations(req, limit, includeRussian) {
        try {
            const analyticsServiceUrl = this.configService.get('ANALYTICS_SERVICE_URL') || 'http://localhost:3005';
            const url = `${analyticsServiceUrl}/neural-networks/recommendations`;
            const params = new URLSearchParams();
            if (limit)
                params.append('limit', limit.toString());
            if (includeRussian !== undefined)
                params.append('includeRussian', includeRussian.toString());
            const fullUrl = `${url}?${params.toString()}`;
            shared_1.LoggerUtil.info('api-gateway', 'Getting neural network recommendations', {
                userId: req.user?.id,
                url: fullUrl
            });
            const response = await this.httpService.axiosRef.get(fullUrl, {
                headers: {
                    'Authorization': req.headers.authorization,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to get neural network recommendations', error, {
                userId: req.user?.id
            });
            const russianDefaults = [
                {
                    provider: 'yandex',
                    model: 'yandex-gpt',
                    reason: 'russian',
                    score: 100,
                    isDefault: true,
                    description: 'Yandex GPT - российская языковая модель'
                },
                {
                    provider: 'sber',
                    model: 'gigachat',
                    reason: 'russian',
                    score: 95,
                    isDefault: true,
                    description: 'GigaChat - ИИ-модель от Сбера'
                },
                {
                    provider: 'sber',
                    model: 'kandinsky',
                    reason: 'russian',
                    score: 90,
                    isDefault: true,
                    description: 'Kandinsky - генерация изображений от Сбера'
                }
            ];
            return {
                success: true,
                data: {
                    recommendations: russianDefaults.slice(0, limit || 10),
                    total: russianDefaults.length,
                    hasRussianDefaults: true
                }
            };
        }
    }
    async getPopular(limit) {
        try {
            const analyticsServiceUrl = this.configService.get('ANALYTICS_SERVICE_URL') || 'http://localhost:3005';
            const url = `${analyticsServiceUrl}/neural-networks/popular`;
            const params = new URLSearchParams();
            if (limit)
                params.append('limit', limit.toString());
            const fullUrl = `${url}?${params.toString()}`;
            shared_1.LoggerUtil.info('api-gateway', 'Getting popular neural networks', {
                url: fullUrl
            });
            const response = await this.httpService.axiosRef.get(fullUrl);
            return response.data;
        }
        catch (error) {
            shared_1.LoggerUtil.error('api-gateway', 'Failed to get popular neural networks', error);
            return {
                success: true,
                data: []
            };
        }
    }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Post)('completions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create chat completion with anonymization' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Chat completion created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "createCompletion", null);
__decorate([
    (0, common_1.Get)('models'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available models' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Models retrieved successfully' }),
    __param(0, (0, common_1.Query)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getModels", null);
__decorate([
    (0, common_1.Get)('models/:provider/:model'),
    (0, swagger_1.ApiOperation)({ summary: 'Get model information' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Model info retrieved successfully' }),
    __param(0, (0, common_1.Param)('provider')),
    __param(1, (0, common_1.Param)('model')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getModelInfo", null);
__decorate([
    (0, common_1.Post)('validate'),
    (0, swagger_1.ApiOperation)({ summary: 'Validate chat request' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Request validated successfully' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [shared_1.ChatCompletionRequest]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "validateRequest", null);
__decorate([
    (0, common_1.Get)('recommendations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get neural network recommendations',
        description: 'Get personalized recommendations for neural networks based on popularity and usage statistics'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Recommendations retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: {
                    type: 'object',
                    properties: {
                        recommendations: {
                            type: 'array',
                            items: {
                                type: 'object',
                                properties: {
                                    provider: { type: 'string' },
                                    model: { type: 'string' },
                                    reason: { type: 'string' },
                                    score: { type: 'number' },
                                    isDefault: { type: 'boolean' },
                                    stats: {
                                        type: 'object',
                                        properties: {
                                            totalRequests: { type: 'number' },
                                            avgResponseTime: { type: 'number' },
                                            successRate: { type: 'number' }
                                        }
                                    }
                                }
                            }
                        },
                        total: { type: 'number' },
                        hasRussianDefaults: { type: 'boolean' }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('includeRussian')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Boolean]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getRecommendations", null);
__decorate([
    (0, common_1.Get)('popular'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get most popular neural networks',
        description: 'Get the most popular neural networks based on usage statistics'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Popular neural networks retrieved successfully'
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], ChatController.prototype, "getPopular", null);
exports.ChatController = ChatController = __decorate([
    (0, swagger_1.ApiTags)('Chat'),
    (0, common_1.Controller)('chat'),
    __metadata("design:paramtypes", [chat_service_1.ChatService,
        history_service_1.HistoryService,
        anonymization_service_1.AnonymizationService,
        config_1.ConfigService,
        axios_1.HttpService,
        shared_1.RabbitMQClient])
], ChatController);
//# sourceMappingURL=chat.controller.js.map