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
exports.NeuralNetworkRecommendationController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const neural_network_recommendation_service_1 = require("./neural-network-recommendation.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const shared_1 = require("@ai-aggregator/shared");
let NeuralNetworkRecommendationController = class NeuralNetworkRecommendationController {
    recommendationService;
    constructor(recommendationService) {
        this.recommendationService = recommendationService;
    }
    async getRecommendations(req, limit, includeRussian) {
        try {
            const userId = req.user?.id;
            const request = {
                userId,
                limit: limit || 10,
                includeRussian: includeRussian !== false
            };
            shared_1.LoggerUtil.info('analytics-service', 'Getting neural network recommendations', {
                userId,
                limit: request.limit,
                includeRussian: request.includeRussian
            });
            const recommendations = await this.recommendationService.getRecommendations(request);
            return {
                success: true,
                data: recommendations
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get recommendations', error, {
                userId: req.user?.id
            });
            throw new common_1.HttpException('Failed to get recommendations', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getPopular(limit) {
        try {
            const popular = await this.recommendationService.getTopPopular(limit || 10);
            return {
                success: true,
                data: popular
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get popular neural networks', error);
            throw new common_1.HttpException('Failed to get popular neural networks', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getProviderStats(req, provider) {
        try {
            if (!provider) {
                throw new common_1.HttpException('Provider parameter is required', common_1.HttpStatus.BAD_REQUEST);
            }
            const stats = await this.recommendationService.getProviderStats(provider);
            return {
                success: true,
                data: stats
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get provider stats', error, {
                provider: req.query.provider
            });
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException('Failed to get provider statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getRussianDefaults() {
        try {
            const russianDefaults = [
                {
                    provider: 'yandex',
                    model: 'yandex-gpt',
                    reason: 'russian',
                    score: 100,
                    description: 'Yandex GPT - российская языковая модель'
                },
                {
                    provider: 'sber',
                    model: 'gigachat',
                    reason: 'russian',
                    score: 95,
                    description: 'GigaChat - ИИ-модель от Сбера'
                },
                {
                    provider: 'sber',
                    model: 'kandinsky',
                    reason: 'russian',
                    score: 90,
                    description: 'Kandinsky - генерация изображений от Сбера'
                }
            ];
            return {
                success: true,
                data: russianDefaults
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get Russian defaults', error);
            throw new common_1.HttpException('Failed to get Russian defaults', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
};
exports.NeuralNetworkRecommendationController = NeuralNetworkRecommendationController;
__decorate([
    (0, common_1.Get)('recommendations'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get neural network recommendations',
        description: 'Get personalized recommendations for neural networks based on popularity and user preferences'
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
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Maximum number of recommendations (default: 10)' }),
    (0, swagger_1.ApiQuery)({ name: 'includeRussian', required: false, type: Boolean, description: 'Include Russian neural networks (default: true)' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('includeRussian')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Number, Boolean]),
    __metadata("design:returntype", Promise)
], NeuralNetworkRecommendationController.prototype, "getRecommendations", null);
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
        description: 'Popular neural networks retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            provider: { type: 'string' },
                            model: { type: 'string' },
                            totalRequests: { type: 'number' },
                            totalTokens: { type: 'number' },
                            totalCost: { type: 'number' },
                            uniqueUsers: { type: 'number' },
                            avgResponseTime: { type: 'number' },
                            successRate: { type: 'number' },
                            lastUsed: { type: 'string', format: 'date-time' }
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number, description: 'Maximum number of results (default: 10)' }),
    __param(0, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], NeuralNetworkRecommendationController.prototype, "getPopular", null);
__decorate([
    (0, common_1.Get)('stats/:provider'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Get neural network statistics by provider',
        description: 'Get detailed statistics for all models of a specific provider'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Provider statistics retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            id: { type: 'string' },
                            provider: { type: 'string' },
                            model: { type: 'string' },
                            totalRequests: { type: 'number' },
                            totalTokens: { type: 'number' },
                            totalCost: { type: 'number' },
                            uniqueUsers: { type: 'number' },
                            avgResponseTime: { type: 'number' },
                            successRate: { type: 'number' },
                            lastUsed: { type: 'string', format: 'date-time' }
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 401, description: 'Unauthorized' }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], NeuralNetworkRecommendationController.prototype, "getProviderStats", null);
__decorate([
    (0, common_1.Get)('russian-defaults'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get Russian neural networks by default',
        description: 'Get the default Russian neural networks that are recommended when no statistics are available'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Russian defaults retrieved successfully',
        schema: {
            type: 'object',
            properties: {
                success: { type: 'boolean' },
                data: {
                    type: 'array',
                    items: {
                        type: 'object',
                        properties: {
                            provider: { type: 'string' },
                            model: { type: 'string' },
                            reason: { type: 'string' },
                            score: { type: 'number' },
                            description: { type: 'string' }
                        }
                    }
                }
            }
        }
    }),
    (0, swagger_1.ApiResponse)({ status: 500, description: 'Internal server error' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], NeuralNetworkRecommendationController.prototype, "getRussianDefaults", null);
exports.NeuralNetworkRecommendationController = NeuralNetworkRecommendationController = __decorate([
    (0, swagger_1.ApiTags)('Neural Network Recommendations'),
    (0, common_1.Controller)('neural-networks'),
    __metadata("design:paramtypes", [neural_network_recommendation_service_1.NeuralNetworkRecommendationService])
], NeuralNetworkRecommendationController);
//# sourceMappingURL=neural-network-recommendation.controller.js.map