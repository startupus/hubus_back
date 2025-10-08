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
var OrchestratorCacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OrchestratorCacheService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
const shared_2 = require("@ai-aggregator/shared");
let OrchestratorCacheService = OrchestratorCacheService_1 = class OrchestratorCacheService {
    redisClient;
    logger = new common_1.Logger(OrchestratorCacheService_1.name);
    PROVIDER_PREFIX = 'orchestrator:provider:';
    METRICS_PREFIX = 'orchestrator:metrics:';
    ROUTING_PREFIX = 'orchestrator:routing:';
    CONFIG_PREFIX = 'orchestrator:config:';
    constructor(redisClient) {
        this.redisClient = redisClient;
    }
    async cacheProviderStatus(providerId, status, ttl = 300) {
        try {
            const key = `${this.PROVIDER_PREFIX}status:${providerId}`;
            const data = {
                ...status,
                lastChecked: status.lastChecked.toISOString(),
                cachedAt: new Date().toISOString()
            };
            const success = await this.redisClient.set(key, data, ttl);
            if (success) {
                shared_2.LoggerUtil.debug('provider-orchestrator', 'Provider status cached successfully', {
                    providerId,
                    status: status.status
                });
            }
            return success;
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to cache provider status', error, { providerId });
            return false;
        }
    }
    async getProviderStatus(providerId) {
        try {
            const key = `${this.PROVIDER_PREFIX}status:${providerId}`;
            const data = await this.redisClient.get(key);
            if (data) {
                shared_2.LoggerUtil.debug('provider-orchestrator', 'Provider status retrieved from cache', {
                    providerId,
                    status: data.status
                });
            }
            return data;
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to get provider status', error, { providerId });
            return null;
        }
    }
    async cachePerformanceMetrics(providerId, metrics, ttl = 1800) {
        try {
            const key = `${this.METRICS_PREFIX}${providerId}`;
            const data = {
                ...metrics,
                timestamp: metrics.timestamp.toISOString(),
                cachedAt: new Date().toISOString()
            };
            const success = await this.redisClient.set(key, data, ttl);
            if (success) {
                shared_2.LoggerUtil.debug('provider-orchestrator', 'Performance metrics cached successfully', {
                    providerId,
                    averageResponseTime: metrics.averageResponseTime,
                    successRate: metrics.successRate
                });
            }
            return success;
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to cache performance metrics', error, { providerId });
            return false;
        }
    }
    async getPerformanceMetrics(providerId) {
        try {
            const key = `${this.METRICS_PREFIX}${providerId}`;
            const data = await this.redisClient.get(key);
            if (data) {
                shared_2.LoggerUtil.debug('provider-orchestrator', 'Performance metrics retrieved from cache', {
                    providerId,
                    averageResponseTime: data.averageResponseTime
                });
            }
            return data;
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to get performance metrics', error, { providerId });
            return null;
        }
    }
    async cacheRoutingResult(requestHash, result, ttl = 600) {
        try {
            const key = `${this.ROUTING_PREFIX}${requestHash}`;
            const data = {
                ...result,
                cachedAt: new Date().toISOString()
            };
            const success = await this.redisClient.set(key, data, ttl);
            if (success) {
                shared_2.LoggerUtil.debug('provider-orchestrator', 'Routing result cached successfully', {
                    requestHash,
                    selectedProvider: result.selectedProvider
                });
            }
            return success;
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to cache routing result', error, { requestHash });
            return false;
        }
    }
    async getRoutingResult(requestHash) {
        try {
            const key = `${this.ROUTING_PREFIX}${requestHash}`;
            const data = await this.redisClient.get(key);
            if (data) {
                shared_2.LoggerUtil.debug('provider-orchestrator', 'Routing result retrieved from cache', {
                    requestHash,
                    selectedProvider: data.selectedProvider
                });
            }
            return data;
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to get routing result', error, { requestHash });
            return null;
        }
    }
    async cacheProviderConfig(providerId, config, ttl = 3600) {
        try {
            const key = `${this.CONFIG_PREFIX}${providerId}`;
            const data = {
                ...config,
                cachedAt: new Date().toISOString()
            };
            const success = await this.redisClient.set(key, data, ttl);
            if (success) {
                shared_2.LoggerUtil.debug('provider-orchestrator', 'Provider config cached successfully', {
                    providerId,
                    name: config.name,
                    isActive: config.isActive
                });
            }
            return success;
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to cache provider config', error, { providerId });
            return false;
        }
    }
    async getProviderConfig(providerId) {
        try {
            const key = `${this.CONFIG_PREFIX}${providerId}`;
            const data = await this.redisClient.get(key);
            if (data) {
                shared_2.LoggerUtil.debug('provider-orchestrator', 'Provider config retrieved from cache', {
                    providerId,
                    name: data.name
                });
            }
            return data;
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to get provider config', error, { providerId });
            return null;
        }
    }
    async cacheAllProviders(providers, ttl = 1800) {
        try {
            const key = `${this.CONFIG_PREFIX}all`;
            const data = {
                providers,
                cachedAt: new Date().toISOString()
            };
            const success = await this.redisClient.set(key, data, ttl);
            if (success) {
                shared_2.LoggerUtil.debug('provider-orchestrator', 'All providers cached successfully', {
                    count: providers.length
                });
            }
            return success;
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to cache all providers', error);
            return false;
        }
    }
    async getAllProviders() {
        try {
            const key = `${this.CONFIG_PREFIX}all`;
            const data = await this.redisClient.get(key);
            if (data) {
                shared_2.LoggerUtil.debug('provider-orchestrator', 'All providers retrieved from cache', {
                    count: data.providers.length
                });
            }
            return data;
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to get all providers', error);
            return null;
        }
    }
    async clearProviderCache(providerId) {
        try {
            const keys = [
                `${this.PROVIDER_PREFIX}status:${providerId}`,
                `${this.METRICS_PREFIX}${providerId}`,
                `${this.CONFIG_PREFIX}${providerId}`
            ];
            const deleted = await this.redisClient.mdelete(keys);
            shared_2.LoggerUtil.info('provider-orchestrator', 'Provider cache cleared', {
                providerId,
                deletedKeys: deleted
            });
            return deleted > 0;
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to clear provider cache', error, { providerId });
            return false;
        }
    }
    async clearAllCache() {
        try {
            const patterns = [
                `${this.PROVIDER_PREFIX}*`,
                `${this.METRICS_PREFIX}*`,
                `${this.ROUTING_PREFIX}*`,
                `${this.CONFIG_PREFIX}*`
            ];
            let totalDeleted = 0;
            for (const pattern of patterns) {
                const deleted = await this.redisClient.clearPattern(pattern);
                totalDeleted += deleted;
            }
            shared_2.LoggerUtil.info('provider-orchestrator', 'All orchestrator cache cleared', {
                totalDeleted
            });
            return totalDeleted > 0;
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to clear all cache', error);
            return false;
        }
    }
    async getCacheStats() {
        try {
            const providerKeys = await this.redisClient.keys(`${this.PROVIDER_PREFIX}*`);
            const metricsKeys = await this.redisClient.keys(`${this.METRICS_PREFIX}*`);
            const routingKeys = await this.redisClient.keys(`${this.ROUTING_PREFIX}*`);
            const configKeys = await this.redisClient.keys(`${this.CONFIG_PREFIX}*`);
            return {
                totalProviders: providerKeys.length,
                totalMetrics: metricsKeys.length,
                totalRoutingResults: routingKeys.length,
                totalConfigs: configKeys.length
            };
        }
        catch (error) {
            shared_2.LoggerUtil.error('provider-orchestrator', 'Failed to get cache stats', error);
            return {
                totalProviders: 0,
                totalMetrics: 0,
                totalRoutingResults: 0,
                totalConfigs: 0
            };
        }
    }
};
exports.OrchestratorCacheService = OrchestratorCacheService;
exports.OrchestratorCacheService = OrchestratorCacheService = OrchestratorCacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [shared_1.RedisClient])
], OrchestratorCacheService);
//# sourceMappingURL=orchestrator-cache.service.js.map