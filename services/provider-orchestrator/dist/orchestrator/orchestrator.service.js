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
var OrchestratorService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = require("@nestjs/axios");
const shared_1 = require("@ai-aggregator/shared");
const rxjs_1 = require("rxjs");
let OrchestratorService = OrchestratorService_1 = class OrchestratorService {
    configService;
    httpService;
    logger = new common_1.Logger(OrchestratorService_1.name);
    providers = new Map();
    providerStatuses = new Map();
    healthCheckInterval;
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
        this.initializeProviders();
        this.startHealthMonitoring();
    }
    async routeRequest(analysis) {
        try {
            shared_1.LoggerUtil.info('provider-orchestrator', 'Starting request routing', {
                userId: analysis.userId,
                model: analysis.model,
                urgency: analysis.urgency,
                quality: analysis.quality
            });
            const selectedProvider = await this.selectOptimalProvider(analysis);
            if (!selectedProvider) {
                throw new Error('No available providers found');
            }
            const availability = await this.checkProviderAvailability(selectedProvider.id);
            if (!availability.isAvailable) {
                shared_1.LoggerUtil.warn('provider-orchestrator', 'Primary provider unavailable, using fallback', {
                    primaryProvider: selectedProvider.id,
                    fallbackProvider: availability.fallbackProvider
                });
                return await this.routeToFallbackProvider(analysis, availability.fallbackProvider);
            }
            return await this.routeToProvider(selectedProvider, analysis);
        }
        catch (error) {
            shared_1.LoggerUtil.error('provider-orchestrator', 'Request routing failed', error, {
                userId: analysis.userId,
                model: analysis.model
            });
            return await this.attemptFallbackRouting(analysis);
        }
    }
    async getProviderStatus(providerId) {
        const provider = this.providers.get(providerId);
        if (!provider) {
            throw new Error(`Provider ${providerId} not found`);
        }
        const status = this.providerStatuses.get(providerId) || await this.checkProviderHealth(provider);
        return status;
    }
    async getProviders() {
        return Array.from(this.providers.values()).map(provider => ({
            ...provider,
            apiKey: '***'
        }));
    }
    initializeProviders() {
        const providersConfig = this.configService.get('providers', {});
        this.providers.set('openai', {
            id: 'openai',
            name: 'OpenAI',
            baseUrl: 'https://api.openai.com/v1',
            apiKey: this.configService.get('OPENAI_API_KEY', ''),
            models: ['gpt-4', 'gpt-4-turbo', 'gpt-3.5-turbo'],
            costPerToken: 0.00003,
            maxTokens: 4096,
            responseTime: 2000,
            successRate: 0.98,
            isActive: true,
            priority: 1,
            fallbackOrder: 1
        });
        this.providers.set('openrouter', {
            id: 'openrouter',
            name: 'OpenRouter',
            baseUrl: 'https://openrouter.ai/api/v1',
            apiKey: this.configService.get('OPENROUTER_API_KEY', ''),
            models: ['gpt-4', 'claude-3-sonnet', 'claude-3-haiku'],
            costPerToken: 0.00002,
            maxTokens: 4096,
            responseTime: 1500,
            successRate: 0.95,
            isActive: true,
            priority: 2,
            fallbackOrder: 2
        });
        this.providers.set('yandex', {
            id: 'yandex',
            name: 'Yandex GPT',
            baseUrl: 'https://llm.api.cloud.yandex.net/foundationModels/v1',
            apiKey: this.configService.get('YANDEX_API_KEY', ''),
            models: ['yandexgpt', 'yandexgpt-lite'],
            costPerToken: 0.00001,
            maxTokens: 2048,
            responseTime: 3000,
            successRate: 0.92,
            isActive: true,
            priority: 3,
            fallbackOrder: 3
        });
        shared_1.LoggerUtil.info('provider-orchestrator', 'Providers initialized', {
            count: this.providers.size,
            providers: Array.from(this.providers.keys())
        });
    }
    async selectOptimalProvider(analysis) {
        const availableProviders = Array.from(this.providers.values())
            .filter(provider => provider.isActive && provider.models.includes(analysis.model));
        if (availableProviders.length === 0) {
            return null;
        }
        const scoredProviders = availableProviders.map(provider => {
            let score = 0;
            if (analysis.budget) {
                const estimatedCost = analysis.expectedTokens * provider.costPerToken;
                if (estimatedCost <= analysis.budget) {
                    score += 100 - (estimatedCost / analysis.budget) * 50;
                }
            }
            else {
                score += (1 - provider.costPerToken / 0.0001) * 30;
            }
            if (analysis.urgency === 'high') {
                score += (1 - provider.responseTime / 5000) * 40;
            }
            if (analysis.quality === 'premium') {
                score += provider.successRate * 20;
            }
            score += provider.successRate * 30;
            score += (4 - provider.priority) * 10;
            return { provider, score };
        });
        scoredProviders.sort((a, b) => b.score - a.score);
        const selected = scoredProviders[0];
        shared_1.LoggerUtil.debug('provider-orchestrator', 'Provider selected', {
            provider: selected.provider.id,
            score: selected.score,
            criteria: {
                cost: analysis.budget ? 'budget-optimized' : 'cost-optimized',
                speed: analysis.urgency,
                quality: analysis.quality
            }
        });
        return selected.provider;
    }
    async checkProviderAvailability(providerId) {
        const status = this.providerStatuses.get(providerId);
        if (!status || status.status === 'down') {
            const fallbackProvider = await this.findFallbackProvider(providerId);
            return {
                isAvailable: false,
                fallbackProvider: fallbackProvider?.id
            };
        }
        return { isAvailable: status.status === 'operational' };
    }
    async routeToProvider(provider, analysis) {
        const startTime = Date.now();
        try {
            shared_1.LoggerUtil.debug('provider-orchestrator', 'Routing to provider', {
                provider: provider.id,
                model: analysis.model,
                userId: analysis.userId
            });
            const requestPayload = this.prepareProviderRequest(provider, analysis);
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.post(`${provider.baseUrl}/chat/completions`, requestPayload, {
                headers: {
                    'Authorization': `Bearer ${provider.apiKey}`,
                    'Content-Type': 'application/json'
                },
                timeout: 30000
            }));
            const responseTime = Date.now() - startTime;
            const tokens = this.extractTokenUsage(response.data);
            const cost = this.calculateCost(provider, tokens);
            await this.updateProviderStats(provider.id, responseTime, true);
            return {
                success: true,
                response: response.data.choices[0]?.message?.content || '',
                provider: provider.id,
                model: analysis.model,
                cost,
                tokens,
                responseTime
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            await this.updateProviderStats(provider.id, responseTime, false);
            shared_1.LoggerUtil.error('provider-orchestrator', 'Provider request failed', error, {
                provider: provider.id,
                userId: analysis.userId
            });
            throw error;
        }
    }
    async routeToFallbackProvider(analysis, fallbackProviderId) {
        const fallbackProvider = fallbackProviderId
            ? this.providers.get(fallbackProviderId)
            : await this.findFallbackProvider();
        if (!fallbackProvider) {
            throw new Error('No fallback providers available');
        }
        shared_1.LoggerUtil.warn('provider-orchestrator', 'Using fallback provider', {
            fallbackProvider: fallbackProvider.id,
            userId: analysis.userId
        });
        return await this.routeToProvider(fallbackProvider, analysis);
    }
    async attemptFallbackRouting(analysis) {
        const fallbackProvider = await this.findFallbackProvider();
        if (!fallbackProvider) {
            return {
                success: false,
                error: 'All providers are unavailable',
                fallbackUsed: false
            };
        }
        try {
            const result = await this.routeToProvider(fallbackProvider, analysis);
            return {
                ...result,
                fallbackUsed: true
            };
        }
        catch (error) {
            return {
                success: false,
                error: 'Fallback routing also failed',
                fallbackUsed: true
            };
        }
    }
    async findFallbackProvider(excludeId) {
        const availableProviders = Array.from(this.providers.values())
            .filter(provider => provider.isActive &&
            provider.id !== excludeId &&
            this.providerStatuses.get(provider.id)?.status !== 'down')
            .sort((a, b) => a.fallbackOrder - b.fallbackOrder);
        return availableProviders[0] || null;
    }
    prepareProviderRequest(provider, analysis) {
        const baseRequest = {
            model: analysis.model,
            messages: [
                { role: 'user', content: analysis.prompt }
            ],
            max_tokens: Math.min(provider.maxTokens, analysis.expectedTokens * 2),
            temperature: analysis.options?.temperature || 0.7,
            stream: false
        };
        switch (provider.id) {
            case 'yandex':
                return {
                    ...baseRequest,
                    folderId: this.configService.get('YANDEX_FOLDER_ID'),
                    completionOptions: {
                        stream: false,
                        temperature: baseRequest.temperature,
                        maxTokens: baseRequest.max_tokens
                    }
                };
            default:
                return baseRequest;
        }
    }
    extractTokenUsage(responseData) {
        const usage = responseData.usage || {};
        return {
            input: usage.prompt_tokens || 0,
            output: usage.completion_tokens || 0,
            total: usage.total_tokens || 0
        };
    }
    calculateCost(provider, tokens) {
        return tokens.total * provider.costPerToken;
    }
    async updateProviderStats(providerId, responseTime, success) {
        const currentStatus = this.providerStatuses.get(providerId);
        const provider = this.providers.get(providerId);
        if (!provider)
            return;
        const newStatus = {
            id: providerId,
            name: provider.name,
            status: success ? 'operational' : 'degraded',
            lastChecked: new Date(),
            responseTime: responseTime,
            successRate: success ? Math.min(1, (currentStatus?.successRate || 0.9) + 0.01) : Math.max(0, (currentStatus?.successRate || 0.9) - 0.05),
            errorRate: success ? Math.max(0, (currentStatus?.errorRate || 0.1) - 0.01) : Math.min(1, (currentStatus?.errorRate || 0.1) + 0.05),
            message: success ? 'Provider is operational' : 'Provider experiencing issues'
        };
        this.providerStatuses.set(providerId, newStatus);
    }
    async checkProviderHealth(provider) {
        const startTime = Date.now();
        try {
            const response = await (0, rxjs_1.firstValueFrom)(this.httpService.get(`${provider.baseUrl}/models`, {
                headers: { 'Authorization': `Bearer ${provider.apiKey}` },
                timeout: 5000
            }));
            const responseTime = Date.now() - startTime;
            return {
                id: provider.id,
                name: provider.name,
                status: 'operational',
                lastChecked: new Date(),
                responseTime,
                successRate: 1.0,
                errorRate: 0.0,
                message: 'Provider is operational'
            };
        }
        catch (error) {
            const responseTime = Date.now() - startTime;
            return {
                id: provider.id,
                name: provider.name,
                status: 'down',
                lastChecked: new Date(),
                responseTime,
                successRate: 0.0,
                errorRate: 1.0,
                message: `Provider is down: ${error instanceof Error ? error.message : 'Unknown error'}`
            };
        }
    }
    startHealthMonitoring() {
        this.healthCheckInterval = setInterval(async () => {
            shared_1.LoggerUtil.debug('provider-orchestrator', 'Running health checks');
            for (const [providerId, provider] of this.providers) {
                if (provider.isActive) {
                    try {
                        const healthStatus = await this.checkProviderHealth(provider);
                        this.providerStatuses.set(providerId, healthStatus);
                    }
                    catch (error) {
                        shared_1.LoggerUtil.error('provider-orchestrator', 'Health check failed', error, { providerId });
                    }
                }
            }
        }, 60000);
    }
    onModuleDestroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
        }
    }
};
exports.OrchestratorService = OrchestratorService;
exports.OrchestratorService = OrchestratorService = OrchestratorService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], OrchestratorService);
//# sourceMappingURL=orchestrator.service.js.map