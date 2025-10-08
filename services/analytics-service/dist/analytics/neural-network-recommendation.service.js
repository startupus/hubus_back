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
var NeuralNetworkRecommendationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NeuralNetworkRecommendationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const shared_1 = require("@ai-aggregator/shared");
let NeuralNetworkRecommendationService = NeuralNetworkRecommendationService_1 = class NeuralNetworkRecommendationService {
    prisma;
    logger = new common_1.Logger(NeuralNetworkRecommendationService_1.name);
    russianDefaults = [
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
    constructor(prisma) {
        this.prisma = prisma;
    }
    async updateNeuralNetworkStats(data) {
        try {
            const { provider, model, requests = 1, tokens = 0, cost = 0, responseTime = 0, success = true, userId } = data;
            await this.prisma.neuralNetworkStats.upsert({
                where: {
                    provider_model: {
                        provider,
                        model
                    }
                },
                update: {
                    totalRequests: { increment: requests },
                    totalTokens: { increment: tokens },
                    totalCost: { increment: cost },
                    lastUsed: new Date(),
                    avgResponseTime: {
                        set: await this.calculateAverageResponseTime(provider, model, responseTime)
                    },
                    successRate: {
                        set: await this.calculateSuccessRate(provider, model, success)
                    }
                },
                create: {
                    provider,
                    model,
                    totalRequests: requests,
                    totalTokens: tokens,
                    totalCost: cost,
                    uniqueUsers: userId ? 1 : 0,
                    avgResponseTime: responseTime,
                    successRate: success ? 100 : 0,
                    lastUsed: new Date()
                }
            });
            if (userId) {
                await this.updateUniqueUsersCount(provider, model);
            }
            shared_1.LoggerUtil.info('analytics-service', 'Neural network stats updated', {
                provider,
                model,
                requests,
                tokens,
                cost,
                userId
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to update neural network stats', error, {
                provider: data.provider,
                model: data.model
            });
        }
    }
    async getRecommendations(request = {}) {
        try {
            const { userId, limit = 10, includeRussian = true } = request;
            shared_1.LoggerUtil.info('analytics-service', 'Getting neural network recommendations', {
                userId,
                limit,
                includeRussian
            });
            const stats = await this.prisma.neuralNetworkStats.findMany({
                where: {
                    totalRequests: { gt: 0 }
                },
                orderBy: [
                    { totalRequests: 'desc' },
                    { successRate: 'desc' },
                    { avgResponseTime: 'asc' }
                ],
                take: limit * 2
            });
            let personalRecommendations = [];
            if (userId) {
                const rawRecommendations = await this.prisma.neuralNetworkRecommendation.findMany({
                    where: {
                        userId,
                        isActive: true
                    },
                    orderBy: { score: 'desc' }
                });
                personalRecommendations = rawRecommendations.map(rec => ({
                    ...rec,
                    score: Number(rec.score)
                }));
            }
            const recommendations = this.buildRecommendationsFromStats(stats, personalRecommendations, limit);
            let hasRussianDefaults = false;
            if (includeRussian && recommendations.length < limit) {
                const russianRecs = await this.getRussianDefaults(limit - recommendations.length);
                recommendations.push(...russianRecs);
                hasRussianDefaults = russianRecs.length > 0;
            }
            shared_1.LoggerUtil.info('analytics-service', 'Neural network recommendations generated', {
                userId,
                total: recommendations.length,
                hasRussianDefaults
            });
            return {
                recommendations: recommendations.slice(0, limit),
                total: recommendations.length,
                hasRussianDefaults
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get recommendations', error, {
                userId: request.userId
            });
            return this.getRussianDefaultsResponse(request.limit || 3);
        }
    }
    async getTopPopular(limit = 10) {
        try {
            const stats = await this.prisma.neuralNetworkStats.findMany({
                where: {
                    totalRequests: { gt: 0 }
                },
                orderBy: [
                    { totalRequests: 'desc' },
                    { successRate: 'desc' }
                ],
                take: limit
            });
            return stats.map(stat => ({
                id: stat.id,
                provider: stat.provider,
                model: stat.model,
                totalRequests: stat.totalRequests,
                totalTokens: stat.totalTokens,
                totalCost: Number(stat.totalCost),
                uniqueUsers: stat.uniqueUsers,
                avgResponseTime: stat.avgResponseTime,
                successRate: Number(stat.successRate),
                lastUsed: stat.lastUsed,
                createdAt: stat.createdAt,
                updatedAt: stat.updatedAt
            }));
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get top popular neural networks', error);
            return [];
        }
    }
    async getProviderStats(provider) {
        try {
            const stats = await this.prisma.neuralNetworkStats.findMany({
                where: { provider },
                orderBy: { totalRequests: 'desc' }
            });
            return stats.map(stat => ({
                id: stat.id,
                provider: stat.provider,
                model: stat.model,
                totalRequests: stat.totalRequests,
                totalTokens: stat.totalTokens,
                totalCost: Number(stat.totalCost),
                uniqueUsers: stat.uniqueUsers,
                avgResponseTime: stat.avgResponseTime,
                successRate: Number(stat.successRate),
                lastUsed: stat.lastUsed,
                createdAt: stat.createdAt,
                updatedAt: stat.updatedAt
            }));
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to get provider stats', error, {
                provider
            });
            return [];
        }
    }
    async createPersonalRecommendation(data) {
        try {
            const recommendation = await this.prisma.neuralNetworkRecommendation.create({
                data: {
                    userId: data.userId,
                    provider: data.provider,
                    model: data.model,
                    reason: data.reason,
                    score: data.score,
                    isDefault: false
                }
            });
            shared_1.LoggerUtil.info('analytics-service', 'Personal recommendation created', {
                userId: data.userId,
                provider: data.provider,
                model: data.model
            });
            return {
                id: recommendation.id,
                userId: recommendation.userId,
                provider: recommendation.provider,
                model: recommendation.model,
                reason: recommendation.reason,
                score: Number(recommendation.score),
                isDefault: recommendation.isDefault,
                isActive: recommendation.isActive,
                createdAt: recommendation.createdAt,
                updatedAt: recommendation.updatedAt
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to create personal recommendation', error, {
                userId: data.userId,
                provider: data.provider,
                model: data.model
            });
            throw error;
        }
    }
    async initializeRussianDefaults() {
        try {
            for (const russian of this.russianDefaults) {
                await this.prisma.neuralNetworkRecommendation.upsert({
                    where: {
                        id: `${russian.provider}-${russian.model}-default`
                    },
                    update: {
                        reason: russian.reason,
                        score: russian.score,
                        isDefault: true,
                        isActive: true
                    },
                    create: {
                        provider: russian.provider,
                        model: russian.model,
                        reason: russian.reason,
                        score: russian.score,
                        isDefault: true,
                        isActive: true
                    }
                });
            }
            shared_1.LoggerUtil.info('analytics-service', 'Russian neural networks initialized', {
                count: this.russianDefaults.length
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-service', 'Failed to initialize Russian defaults', error);
        }
    }
    async calculateAverageResponseTime(provider, model, newResponseTime) {
        try {
            const existing = await this.prisma.neuralNetworkStats.findUnique({
                where: {
                    provider_model: { provider, model }
                }
            });
            if (!existing)
                return newResponseTime;
            const alpha = 0.1;
            return Math.round(existing.avgResponseTime * (1 - alpha) + newResponseTime * alpha);
        }
        catch (error) {
            return newResponseTime;
        }
    }
    async calculateSuccessRate(provider, model, success) {
        try {
            const existing = await this.prisma.neuralNetworkStats.findUnique({
                where: {
                    provider_model: { provider, model }
                }
            });
            if (!existing)
                return success ? 100 : 0;
            const alpha = 0.1;
            const successValue = success ? 100 : 0;
            return Number((Number(existing.successRate) * (1 - alpha) + successValue * alpha).toFixed(2));
        }
        catch (error) {
            return success ? 100 : 0;
        }
    }
    async updateUniqueUsersCount(provider, model) {
        try {
            const uniqueUsers = await this.prisma.analyticsEvent.count({
                where: {
                    eventType: 'ai_interaction',
                    eventName: 'chat_completion_success',
                    properties: {
                        path: ['provider'],
                        equals: provider
                    }
                },
            });
            await this.prisma.neuralNetworkStats.update({
                where: {
                    provider_model: { provider, model }
                },
                data: {
                    uniqueUsers
                }
            });
        }
        catch (error) {
            shared_1.LoggerUtil.warn('analytics-service', 'Failed to update unique users count', {
                provider,
                model,
                error: error instanceof Error ? error.message : String(error)
            });
        }
    }
    buildRecommendationsFromStats(stats, personalRecommendations, limit) {
        const recommendations = [];
        for (const personal of personalRecommendations) {
            if (recommendations.length >= limit)
                break;
            recommendations.push({
                provider: personal.provider,
                model: personal.model,
                reason: personal.reason,
                score: personal.score,
                isDefault: personal.isDefault
            });
        }
        for (const stat of stats) {
            if (recommendations.length >= limit)
                break;
            const alreadyExists = personalRecommendations.some(p => p.provider === stat.provider && p.model === stat.model);
            if (alreadyExists)
                continue;
            const score = this.calculateRecommendationScore(stat);
            recommendations.push({
                provider: stat.provider,
                model: stat.model,
                reason: 'popular',
                score,
                isDefault: false,
                stats: {
                    totalRequests: stat.totalRequests,
                    avgResponseTime: stat.avgResponseTime,
                    successRate: Number(stat.successRate)
                }
            });
        }
        return recommendations;
    }
    calculateRecommendationScore(stat) {
        const popularityScore = Math.min(stat.totalRequests / 100, 50);
        const speedScore = Math.max(0, 30 - stat.avgResponseTime / 1000);
        const reliabilityScore = Number(stat.successRate) * 0.2;
        return Math.round(popularityScore + speedScore + reliabilityScore);
    }
    async getRussianDefaults(limit) {
        return this.russianDefaults.slice(0, limit).map(russian => ({
            provider: russian.provider,
            model: russian.model,
            reason: russian.reason,
            score: russian.score,
            isDefault: true
        }));
    }
    getRussianDefaultsResponse(limit) {
        const russianRecs = this.russianDefaults.slice(0, limit).map(russian => ({
            provider: russian.provider,
            model: russian.model,
            reason: russian.reason,
            score: russian.score,
            isDefault: true
        }));
        return {
            recommendations: russianRecs,
            total: russianRecs.length,
            hasRussianDefaults: true
        };
    }
};
exports.NeuralNetworkRecommendationService = NeuralNetworkRecommendationService;
exports.NeuralNetworkRecommendationService = NeuralNetworkRecommendationService = NeuralNetworkRecommendationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], NeuralNetworkRecommendationService);
//# sourceMappingURL=neural-network-recommendation.service.js.map