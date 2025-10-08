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
var ConcurrentOrchestratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrentOrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
const shared_2 = require("@ai-aggregator/shared");
const axios_1 = require("@nestjs/axios");
const rxjs_1 = require("rxjs");
let ConcurrentOrchestratorService = ConcurrentOrchestratorService_1 = class ConcurrentOrchestratorService {
    httpService;
    logger = new common_1.Logger(ConcurrentOrchestratorService_1.name);
    providerStatusCache = new shared_2.ConcurrentCache();
    routingCache = new shared_2.ConcurrentCache();
    metricsCache = new shared_2.ConcurrentCache();
    totalRequests = new shared_2.AtomicCounter(0);
    successfulRequests = new shared_2.AtomicCounter(0);
    failedRequests = new shared_2.AtomicCounter(0);
    totalResponseTime = new shared_2.AtomicCounter(0);
    routingQueue = new shared_2.ConcurrentQueue();
    providerLocks = new shared_2.ConcurrentMap();
    providers = new shared_2.ConcurrentMap();
    constructor(httpService) {
        this.httpService = httpService;
        this.initializeProviders();
        this.startRoutingProcessor();
        this.startHealthMonitoring();
    }
    initializeProviders() {
        this.providers.set('openai', {
            id: 'openai',
            name: 'OpenAI',
            apiUrl: 'https://api.openai.com/v1/chat/completions',
            apiKey: process.env.OPENAI_API_KEY || 'mock_key',
            models: ['gpt-4', 'gpt-3.5-turbo'],
            costPerToken: 0.00003,
            maxTokens: 4096,
            priority: 1,
            isActive: true
        });
        this.providers.set('openrouter', {
            id: 'openrouter',
            name: 'OpenRouter',
            apiUrl: 'https://openrouter.ai/api/v1/chat/completions',
            apiKey: process.env.OPENROUTER_API_KEY || 'mock_key',
            models: ['gpt-4', 'claude-3'],
            costPerToken: 0.00002,
            maxTokens: 8192,
            priority: 2,
            isActive: true
        });
        this.providers.set('yandex', {
            id: 'yandex',
            name: 'YandexGPT',
            apiUrl: 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion',
            apiKey: process.env.YANDEX_API_KEY || 'mock_key',
            models: ['yandexgpt-lite', 'yandexgpt-pro'],
            costPerToken: 0.00001,
            maxTokens: 2048,
            priority: 3,
            isActive: true
        });
    }
    async routeRequest(userId, model, prompt, expectedTokens, priority = 0) {
        try {
            const requestId = this.generateRequestId();
            const requestHash = this.createRequestHash(userId, model, prompt, expectedTokens);
            const cached = this.routingCache.get(requestHash);
            if (cached && (Date.now() - cached.lastChecked.getTime()) < 300000) {
                shared_1.LoggerUtil.debug('provider-orchestrator', 'Routing result retrieved from cache', { requestId });
                return {
                    success: true,
                    selectedProvider: cached.selectedProvider,
                    estimatedCost: cached.estimatedCost,
                    estimatedTime: cached.estimatedTime,
                    alternatives: cached.alternatives
                };
            }
            const selectedProvider = await this.selectOptimalProvider(model, expectedTokens);
            if (!selectedProvider) {
                throw new Error('No suitable provider found');
            }
            const alternatives = await this.getAlternativeProviders(model, selectedProvider.id);
            const estimatedCost = this.calculateCost(selectedProvider, expectedTokens);
            const estimatedTime = this.estimateResponseTime(selectedProvider);
            this.routingCache.set(requestHash, {
                selectedProvider: selectedProvider.id,
                reason: 'Optimal provider selected',
                estimatedCost,
                estimatedTime,
                alternatives: alternatives.map(p => p.id)
            });
            this.totalRequests.increment();
            shared_1.LoggerUtil.info('provider-orchestrator', 'Request routed successfully', {
                requestId,
                userId,
                model,
                selectedProvider: selectedProvider.id,
                estimatedCost,
                estimatedTime
            });
            return {
                success: true,
                selectedProvider: selectedProvider.id,
                estimatedCost,
                estimatedTime,
                alternatives: alternatives.map(p => p.id)
            };
        }
        catch (error) {
            this.failedRequests.increment();
            shared_1.LoggerUtil.error('provider-orchestrator', 'Failed to route request', error, { userId, model });
            return {
                success: false,
                selectedProvider: '',
                estimatedCost: 0,
                estimatedTime: 0,
                alternatives: [],
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async routeBatchRequests(requests) {
        try {
            const tasks = requests.map(request => () => this.routeRequest(request.userId, request.model, request.prompt, request.expectedTokens, request.priority || 0));
            const results = await Promise.all(tasks.map(task => task()));
            return results;
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'Failed to route batch requests', error);
            return requests.map(() => ({
                success: false,
                selectedProvider: '',
                estimatedCost: 0,
                estimatedTime: 0,
                alternatives: [],
                error: 'Batch routing failed'
            }));
        }
    }
    async getProviderStatus(providerId) {
        try {
            const cached = this.providerStatusCache.get(providerId);
            if (cached && (Date.now() - cached.lastChecked.getTime()) < 60000) {
                shared_1.LoggerUtil.debug('provider-orchestrator', 'Provider status retrieved from cache', { providerId });
                return {
                    ...cached,
                    message: `Provider ${providerId} is ${cached.status}`
                };
            }
            const provider = this.providers.get(providerId);
            if (!provider) {
                throw new Error(`Provider not found: ${providerId}`);
            }
            const healthCheck = await this.performHealthCheck(provider);
            this.providerStatusCache.set(providerId, {
                status: healthCheck.status,
                responseTime: healthCheck.responseTime,
                successRate: healthCheck.successRate,
                lastChecked: new Date()
            });
            shared_1.LoggerUtil.info('provider-orchestrator', 'Provider status checked', {
                providerId,
                status: healthCheck.status,
                responseTime: healthCheck.responseTime
            });
            return {
                ...healthCheck,
                lastChecked: new Date(),
                message: `Provider ${providerId} is ${healthCheck.status}`
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'Failed to get provider status', error, { providerId });
            return {
                status: 'down',
                responseTime: 0,
                successRate: 0,
                lastChecked: new Date(),
                message: `Provider ${providerId} is down: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    async getAllProvidersStatus() {
        try {
            const providerIds = Array.from(this.providers.keys());
            const tasks = providerIds.map(providerId => () => this.getProviderStatus(providerId));
            const results = await Promise.all(tasks.map(task => task()));
            return results.map((result, index) => ({
                id: providerIds[index],
                name: this.providers.get(providerIds[index])?.name || 'Unknown',
                ...result
            }));
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'Failed to get all providers status', error);
            return [];
        }
    }
    async selectOptimalProvider(model, expectedTokens) {
        try {
            const availableProviders = Array.from(this.providers.values())
                .filter((provider) => provider.isActive &&
                provider.models.includes(model));
            if (availableProviders.length === 0) {
                return null;
            }
            availableProviders.sort((a, b) => {
                if (a.priority !== b.priority) {
                    return a.priority - b.priority;
                }
                return a.costPerToken - b.costPerToken;
            });
            return availableProviders[0];
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'Failed to select optimal provider', error);
            return null;
        }
    }
    async getAlternativeProviders(model, excludeProviderId) {
        try {
            return Array.from(this.providers.values())
                .filter((provider) => provider.isActive &&
                provider.models.includes(model) &&
                provider.id !== excludeProviderId)
                .sort((a, b) => a.priority - b.priority);
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'Failed to get alternative providers', error);
            return [];
        }
    }
    async performHealthCheck(provider) {
        const startTime = Date.now();
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(provider.apiUrl, {
                timeout: 5000,
                headers: {
                    'Authorization': `Bearer ${provider.apiKey}`
                }
            }));
            const responseTime = Date.now() - startTime;
            const successRate = response.status === 200 ? 1.0 : 0.0;
            return {
                status: responseTime < 1000 ? 'operational' : 'degraded',
                responseTime,
                successRate,
                lastChecked: new Date()
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                status: 'down',
                responseTime,
                successRate: 0.0,
                lastChecked: new Date()
            };
        }
    }
    calculateCost(provider, expectedTokens) {
        return provider.costPerToken * expectedTokens;
    }
    estimateResponseTime(provider) {
        const baseTime = provider.id === 'openai' ? 1000 :
            provider.id === 'openrouter' ? 1200 : 1500;
        return baseTime + (Math.random() * 500);
    }
    startRoutingProcessor() {
        const processRoutingRequests = async () => {
            while (true) {
                try {
                    const request = this.routingQueue.dequeueBlocking(1000);
                    if (!request) {
                        continue;
                    }
                    const result = await this.routeRequest(request.userId, request.model, request.prompt, request.expectedTokens, request.priority);
                    request.resolve(result);
                }
                catch (error) {
                    shared_1.LoggerUtil.error('provider-orchestrator', 'Failed to process routing request', error);
                }
            }
        };
        setImmediate(processRoutingRequests);
    }
    startHealthMonitoring() {
        const monitorHealth = async () => {
            while (true) {
                try {
                    await this.getAllProvidersStatus();
                    await new Promise(resolve => setTimeout(resolve, 30000));
                }
                catch (error) {
                    shared_1.LoggerUtil.error('provider-orchestrator', 'Health monitoring error', error);
                }
            }
        };
        setImmediate(monitorHealth);
    }
    createRequestHash(userId, model, prompt, expectedTokens) {
        const crypto = require('crypto');
        return crypto.createHash('md5')
            .update(`${userId}:${model}:${prompt}:${expectedTokens}`)
            .digest('hex');
    }
    generateRequestId() {
        return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getStats() {
        const totalRequests = this.totalRequests.get();
        const successfulRequests = this.successfulRequests.get();
        const failedRequests = this.failedRequests.get();
        const totalResponseTime = this.totalResponseTime.get();
        return {
            totalRequests,
            successfulRequests,
            failedRequests,
            averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
            queueSize: this.routingQueue.size(),
            cacheStats: {
                providerStatusCache: this.providerStatusCache.size(),
                routingCache: this.routingCache.size(),
                metricsCache: this.metricsCache.size()
            }
        };
    }
    async clearCache() {
        try {
            this.providerStatusCache.cleanup();
            this.routingCache.cleanup();
            this.metricsCache.cleanup();
            shared_1.LoggerUtil.info('provider-orchestrator', 'Cache cleared successfully');
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'Failed to clear cache', error);
        }
    }
};
exports.ConcurrentOrchestratorService = ConcurrentOrchestratorService;
exports.ConcurrentOrchestratorService = ConcurrentOrchestratorService = ConcurrentOrchestratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [axios_1.HttpService])
], ConcurrentOrchestratorService);
//# sourceMappingURL=concurrent-orchestrator.service.js.map