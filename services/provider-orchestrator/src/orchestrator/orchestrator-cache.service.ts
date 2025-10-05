import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@ai-aggregator/shared';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * Orchestrator Cache Service для кэширования данных провайдеров
 * 
 * Кэширует:
 * - Статус провайдеров
 * - Метрики производительности
 * - Результаты маршрутизации
 * - Конфигурацию провайдеров
 */
@Injectable()
export class OrchestratorCacheService {
  private readonly logger = new Logger(OrchestratorCacheService.name);
  private readonly PROVIDER_PREFIX = 'orchestrator:provider:';
  private readonly METRICS_PREFIX = 'orchestrator:metrics:';
  private readonly ROUTING_PREFIX = 'orchestrator:routing:';
  private readonly CONFIG_PREFIX = 'orchestrator:config:';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Кэширование статуса провайдера
   */
  async cacheProviderStatus(providerId: string, status: {
    status: 'operational' | 'degraded' | 'down';
    lastChecked: Date;
    responseTime: number;
    successRate: number;
    errorRate: number;
    message: string;
  }, ttl: number = 300): Promise<boolean> {
    try {
      const key = `${this.PROVIDER_PREFIX}status:${providerId}`;
      const data = {
        ...status,
        lastChecked: status.lastChecked.toISOString(),
        cachedAt: new Date().toISOString()
      };

      const success = await this.redisService.set(key, data, ttl);
      
      if (success) {
        LoggerUtil.debug('provider-orchestrator', 'Provider status cached successfully', { 
          providerId, 
          status: status.status 
        });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to cache provider status', error as Error, { providerId });
      return false;
    }
  }

  /**
   * Получение статуса провайдера из кэша
   */
  async getProviderStatus(providerId: string): Promise<{
    status: 'operational' | 'degraded' | 'down';
    lastChecked: string;
    responseTime: number;
    successRate: number;
    errorRate: number;
    message: string;
    cachedAt: string;
  } | null> {
    try {
      const key = `${this.PROVIDER_PREFIX}status:${providerId}`;
      const data = await this.redisService.get<any>(key);
      
      if (data) {
        LoggerUtil.debug('provider-orchestrator', 'Provider status retrieved from cache', { 
          providerId, 
          status: data.status 
        });
      }
      
      return data;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to get provider status', error as Error, { providerId });
      return null;
    }
  }

  /**
   * Кэширование метрик производительности
   */
  async cachePerformanceMetrics(providerId: string, metrics: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    totalRequests: number;
    lastHourRequests: number;
    timestamp: Date;
  }, ttl: number = 1800): Promise<boolean> {
    try {
      const key = `${this.METRICS_PREFIX}${providerId}`;
      const data = {
        ...metrics,
        timestamp: metrics.timestamp.toISOString(),
        cachedAt: new Date().toISOString()
      };

      const success = await this.redisService.set(key, data, ttl);
      
      if (success) {
        LoggerUtil.debug('provider-orchestrator', 'Performance metrics cached successfully', { 
          providerId,
          averageResponseTime: metrics.averageResponseTime,
          successRate: metrics.successRate
        });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to cache performance metrics', error as Error, { providerId });
      return false;
    }
  }

  /**
   * Получение метрик производительности из кэша
   */
  async getPerformanceMetrics(providerId: string): Promise<{
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    totalRequests: number;
    lastHourRequests: number;
    timestamp: string;
    cachedAt: string;
  } | null> {
    try {
      const key = `${this.METRICS_PREFIX}${providerId}`;
      const data = await this.redisService.get<any>(key);
      
      if (data) {
        LoggerUtil.debug('provider-orchestrator', 'Performance metrics retrieved from cache', { 
          providerId,
          averageResponseTime: data.averageResponseTime
        });
      }
      
      return data;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to get performance metrics', error as Error, { providerId });
      return null;
    }
  }

  /**
   * Кэширование результата маршрутизации
   */
  async cacheRoutingResult(requestHash: string, result: {
    selectedProvider: string;
    reason: string;
    estimatedCost: number;
    estimatedTime: number;
    alternatives: string[];
  }, ttl: number = 600): Promise<boolean> {
    try {
      const key = `${this.ROUTING_PREFIX}${requestHash}`;
      const data = {
        ...result,
        cachedAt: new Date().toISOString()
      };

      const success = await this.redisService.set(key, data, ttl);
      
      if (success) {
        LoggerUtil.debug('provider-orchestrator', 'Routing result cached successfully', { 
          requestHash,
          selectedProvider: result.selectedProvider
        });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to cache routing result', error as Error, { requestHash });
      return false;
    }
  }

  /**
   * Получение результата маршрутизации из кэша
   */
  async getRoutingResult(requestHash: string): Promise<{
    selectedProvider: string;
    reason: string;
    estimatedCost: number;
    estimatedTime: number;
    alternatives: string[];
    cachedAt: string;
  } | null> {
    try {
      const key = `${this.ROUTING_PREFIX}${requestHash}`;
      const data = await this.redisService.get<any>(key);
      
      if (data) {
        LoggerUtil.debug('provider-orchestrator', 'Routing result retrieved from cache', { 
          requestHash,
          selectedProvider: data.selectedProvider
        });
      }
      
      return data;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to get routing result', error as Error, { requestHash });
      return null;
    }
  }

  /**
   * Кэширование конфигурации провайдера
   */
  async cacheProviderConfig(providerId: string, config: {
    name: string;
    apiUrl: string;
    models: string[];
    costPerToken: number;
    maxTokens: number;
    priority: number;
    isActive: boolean;
  }, ttl: number = 3600): Promise<boolean> {
    try {
      const key = `${this.CONFIG_PREFIX}${providerId}`;
      const data = {
        ...config,
        cachedAt: new Date().toISOString()
      };

      const success = await this.redisService.set(key, data, ttl);
      
      if (success) {
        LoggerUtil.debug('provider-orchestrator', 'Provider config cached successfully', { 
          providerId,
          name: config.name,
          isActive: config.isActive
        });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to cache provider config', error as Error, { providerId });
      return false;
    }
  }

  /**
   * Получение конфигурации провайдера из кэша
   */
  async getProviderConfig(providerId: string): Promise<{
    name: string;
    apiUrl: string;
    models: string[];
    costPerToken: number;
    maxTokens: number;
    priority: number;
    isActive: boolean;
    cachedAt: string;
  } | null> {
    try {
      const key = `${this.CONFIG_PREFIX}${providerId}`;
      const data = await this.redisService.get<any>(key);
      
      if (data) {
        LoggerUtil.debug('provider-orchestrator', 'Provider config retrieved from cache', { 
          providerId,
          name: data.name
        });
      }
      
      return data;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to get provider config', error as Error, { providerId });
      return null;
    }
  }

  /**
   * Кэширование списка всех провайдеров
   */
  async cacheAllProviders(providers: any[], ttl: number = 1800): Promise<boolean> {
    try {
      const key = `${this.CONFIG_PREFIX}all`;
      const data = {
        providers,
        cachedAt: new Date().toISOString()
      };

      const success = await this.redisService.set(key, data, ttl);
      
      if (success) {
        LoggerUtil.debug('provider-orchestrator', 'All providers cached successfully', { 
          count: providers.length
        });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to cache all providers', error as Error);
      return false;
    }
  }

  /**
   * Получение списка всех провайдеров из кэша
   */
  async getAllProviders(): Promise<{
    providers: any[];
    cachedAt: string;
  } | null> {
    try {
      const key = `${this.CONFIG_PREFIX}all`;
      const data = await this.redisService.get<any>(key);
      
      if (data) {
        LoggerUtil.debug('provider-orchestrator', 'All providers retrieved from cache', { 
          count: data.providers.length
        });
      }
      
      return data;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to get all providers', error as Error);
      return null;
    }
  }

  /**
   * Очистка кэша провайдера
   */
  async clearProviderCache(providerId: string): Promise<boolean> {
    try {
      const keys = [
        `${this.PROVIDER_PREFIX}status:${providerId}`,
        `${this.METRICS_PREFIX}${providerId}`,
        `${this.CONFIG_PREFIX}${providerId}`
      ];

      const deleted = await this.redisService.mdelete(keys);
      
      LoggerUtil.info('provider-orchestrator', 'Provider cache cleared', { 
        providerId,
        deletedKeys: deleted
      });
      
      return deleted > 0;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to clear provider cache', error as Error, { providerId });
      return false;
    }
  }

  /**
   * Очистка всего кэша оркестратора
   */
  async clearAllCache(): Promise<boolean> {
    try {
      const patterns = [
        `${this.PROVIDER_PREFIX}*`,
        `${this.METRICS_PREFIX}*`,
        `${this.ROUTING_PREFIX}*`,
        `${this.CONFIG_PREFIX}*`
      ];

      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await this.redisService.clearPattern(pattern);
        totalDeleted += deleted;
      }

      LoggerUtil.info('provider-orchestrator', 'All orchestrator cache cleared', { 
        totalDeleted
      });
      
      return totalDeleted > 0;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to clear all cache', error as Error);
      return false;
    }
  }

  /**
   * Получение статистики кэша
   */
  async getCacheStats(): Promise<{
    totalProviders: number;
    totalMetrics: number;
    totalRoutingResults: number;
    totalConfigs: number;
  }> {
    try {
      const providerKeys = await this.redisService.keys(`${this.PROVIDER_PREFIX}*`);
      const metricsKeys = await this.redisService.keys(`${this.METRICS_PREFIX}*`);
      const routingKeys = await this.redisService.keys(`${this.ROUTING_PREFIX}*`);
      const configKeys = await this.redisService.keys(`${this.CONFIG_PREFIX}*`);

      return {
        totalProviders: providerKeys.length,
        totalMetrics: metricsKeys.length,
        totalRoutingResults: routingKeys.length,
        totalConfigs: configKeys.length
      };
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to get cache stats', error as Error);
      return {
        totalProviders: 0,
        totalMetrics: 0,
        totalRoutingResults: 0,
        totalConfigs: 0
      };
    }
  }
}
