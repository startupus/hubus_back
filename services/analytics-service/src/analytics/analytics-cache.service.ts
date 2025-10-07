import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil, RedisClient } from '@ai-aggregator/shared';

/**
 * Analytics Cache Service для кэширования данных аналитики
 * 
 * Кэширует:
 * - Дашборд метрики
 * - Отчеты и агрегации
 * - Пользовательские сессии
 * - Системные метрики
 */
@Injectable()
export class AnalyticsCacheService {
  private readonly logger = new Logger(AnalyticsCacheService.name);
  private readonly DASHBOARD_PREFIX = 'analytics:dashboard:';
  private readonly REPORT_PREFIX = 'analytics:report:';
  private readonly METRICS_PREFIX = 'analytics:metrics:';
  private readonly SESSION_PREFIX = 'analytics:session:';

  constructor(private readonly redisService: RedisClient) {}

  /**
   * Кэширование дашборд метрик
   */
  async cacheDashboardMetrics(metrics: {
    totalUsers: number;
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    topServices: Array<{ service: string; requests: number }>;
    topUsers: Array<{ userId: string; requests: number }>;
    timeRange: string;
  }, ttl: number = 300): Promise<boolean> {
    try {
      const key = `${this.DASHBOARD_PREFIX}${metrics.timeRange}`;
      const data = {
        ...metrics,
        cachedAt: new Date().toISOString()
      };

      const success = await this.redisService.set(key, data, ttl);
      
      if (success) {
        LoggerUtil.debug('analytics-service', 'Dashboard metrics cached successfully', { 
          timeRange: metrics.timeRange,
          totalUsers: metrics.totalUsers,
          totalRequests: metrics.totalRequests
        });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to cache dashboard metrics', error as Error, { 
        timeRange: metrics.timeRange 
      });
      return false;
    }
  }

  /**
   * Получение дашборд метрик из кэша
   */
  async getDashboardMetrics(timeRange: string): Promise<{
    totalUsers: number;
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    topServices: Array<{ service: string; requests: number }>;
    topUsers: Array<{ userId: string; requests: number }>;
    timeRange: string;
    cachedAt: string;
  } | null> {
    try {
      const key = `${this.DASHBOARD_PREFIX}${timeRange}`;
      const data = await this.redisService.get<any>(key);
      
      if (data) {
        LoggerUtil.debug('analytics-service', 'Dashboard metrics retrieved from cache', { 
          timeRange,
          totalUsers: data.totalUsers
        });
      }
      
      return data;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get dashboard metrics', error as Error, { timeRange });
      return null;
    }
  }

  /**
   * Кэширование отчета
   */
  async cacheReport(reportId: string, report: {
    type: string;
    data: any;
    filters: any;
    generatedAt: Date;
    expiresAt: Date;
  }, ttl: number = 3600): Promise<boolean> {
    try {
      const key = `${this.REPORT_PREFIX}${reportId}`;
      const data = {
        ...report,
        generatedAt: report.generatedAt.toISOString(),
        expiresAt: report.expiresAt.toISOString(),
        cachedAt: new Date().toISOString()
      };

      const success = await this.redisService.set(key, data, ttl);
      
      if (success) {
        LoggerUtil.debug('analytics-service', 'Report cached successfully', { 
          reportId,
          type: report.type
        });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to cache report', error as Error, { reportId });
      return false;
    }
  }

  /**
   * Получение отчета из кэша
   */
  async getReport(reportId: string): Promise<{
    type: string;
    data: any;
    filters: any;
    generatedAt: string;
    expiresAt: string;
    cachedAt: string;
  } | null> {
    try {
      const key = `${this.REPORT_PREFIX}${reportId}`;
      const data = await this.redisService.get<any>(key);
      
      if (data) {
        LoggerUtil.debug('analytics-service', 'Report retrieved from cache', { 
          reportId,
          type: data.type
        });
      }
      
      return data;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get report', error as Error, { reportId });
      return null;
    }
  }

  /**
   * Кэширование системных метрик
   */
  async cacheSystemMetrics(metrics: {
    service: string;
    endpoint: string;
    responseTime: number;
    statusCode: number;
    memoryUsage: number;
    cpuUsage: number;
    timestamp: Date;
  }, ttl: number = 1800): Promise<boolean> {
    try {
      const key = `${this.METRICS_PREFIX}${metrics.service}:${metrics.endpoint}:${Math.floor(metrics.timestamp.getTime() / 60000)}`;
      const data = {
        ...metrics,
        timestamp: metrics.timestamp.toISOString(),
        cachedAt: new Date().toISOString()
      };

      const success = await this.redisService.set(key, data, ttl);
      
      if (success) {
        LoggerUtil.debug('analytics-service', 'System metrics cached successfully', { 
          service: metrics.service,
          endpoint: metrics.endpoint,
          responseTime: metrics.responseTime
        });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to cache system metrics', error as Error, { 
        service: metrics.service 
      });
      return false;
    }
  }

  /**
   * Получение системных метрик из кэша
   */
  async getSystemMetrics(service: string, endpoint: string, timeWindow: number = 60): Promise<Array<{
    service: string;
    endpoint: string;
    responseTime: number;
    statusCode: number;
    memoryUsage: number;
    cpuUsage: number;
    timestamp: string;
    cachedAt: string;
  }>> {
    try {
      const pattern = `${this.METRICS_PREFIX}${service}:${endpoint}:*`;
      const keys = await this.redisService.keys(pattern);
      
      if (keys.length === 0) {
        return [];
      }

      const metrics = await this.redisService.mget<any>(keys);
      const now = Date.now();
      const cutoff = now - (timeWindow * 60 * 1000);

      return metrics
        .filter(metric => metric && new Date(metric.timestamp).getTime() > cutoff)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get system metrics', error as Error, { 
        service, 
        endpoint 
      });
      return [];
    }
  }

  /**
   * Кэширование пользовательской сессии аналитики
   */
  async cacheUserSession(sessionId: string, session: {
    userId: string;
    startTime: Date;
    endTime?: Date;
    events: number;
    services: string[];
    metadata: any;
  }, ttl: number = 7200): Promise<boolean> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      const data = {
        ...session,
        startTime: session.startTime.toISOString(),
        endTime: session.endTime?.toISOString(),
        cachedAt: new Date().toISOString()
      };

      const success = await this.redisService.set(key, data, ttl);
      
      if (success) {
        LoggerUtil.debug('analytics-service', 'User session cached successfully', { 
          sessionId,
          userId: session.userId,
          events: session.events
        });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to cache user session', error as Error, { 
        sessionId, 
        userId: session.userId 
      });
      return false;
    }
  }

  /**
   * Получение пользовательской сессии из кэша
   */
  async getUserSession(sessionId: string): Promise<{
    userId: string;
    startTime: string;
    endTime?: string;
    events: number;
    services: string[];
    metadata: any;
    cachedAt: string;
  } | null> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      const data = await this.redisService.get<any>(key);
      
      if (data) {
        LoggerUtil.debug('analytics-service', 'User session retrieved from cache', { 
          sessionId,
          userId: data.userId
        });
      }
      
      return data;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get user session', error as Error, { sessionId });
      return null;
    }
  }

  /**
   * Кэширование агрегированных данных
   */
  async cacheAggregatedData(aggregationKey: string, data: {
    type: string;
    timeRange: string;
    dimensions: string[];
    metrics: any;
    generatedAt: Date;
  }, ttl: number = 1800): Promise<boolean> {
    try {
      const key = `${this.METRICS_PREFIX}aggregated:${aggregationKey}`;
      const cacheData = {
        ...data,
        generatedAt: data.generatedAt.toISOString(),
        cachedAt: new Date().toISOString()
      };

      const success = await this.redisService.set(key, cacheData, ttl);
      
      if (success) {
        LoggerUtil.debug('analytics-service', 'Aggregated data cached successfully', { 
          aggregationKey,
          type: data.type,
          timeRange: data.timeRange
        });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to cache aggregated data', error as Error, { 
        aggregationKey 
      });
      return false;
    }
  }

  /**
   * Получение агрегированных данных из кэша
   */
  async getAggregatedData(aggregationKey: string): Promise<{
    type: string;
    timeRange: string;
    dimensions: string[];
    metrics: any;
    generatedAt: string;
    cachedAt: string;
  } | null> {
    try {
      const key = `${this.METRICS_PREFIX}aggregated:${aggregationKey}`;
      const data = await this.redisService.get<any>(key);
      
      if (data) {
        LoggerUtil.debug('analytics-service', 'Aggregated data retrieved from cache', { 
          aggregationKey,
          type: data.type
        });
      }
      
      return data;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get aggregated data', error as Error, { 
        aggregationKey 
      });
      return null;
    }
  }

  /**
   * Очистка кэша по паттерну
   */
  async clearCacheByPattern(pattern: string): Promise<number> {
    try {
      const deleted = await this.redisService.clearPattern(pattern);
      
      LoggerUtil.info('analytics-service', 'Cache cleared by pattern', { 
        pattern,
        deleted
      });
      
      return deleted;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to clear cache by pattern', error as Error, { pattern });
      return 0;
    }
  }

  /**
   * Очистка всего кэша аналитики
   */
  async clearAllCache(): Promise<boolean> {
    try {
      const patterns = [
        `${this.DASHBOARD_PREFIX}*`,
        `${this.REPORT_PREFIX}*`,
        `${this.METRICS_PREFIX}*`,
        `${this.SESSION_PREFIX}*`
      ];

      let totalDeleted = 0;
      for (const pattern of patterns) {
        const deleted = await this.redisService.clearPattern(pattern);
        totalDeleted += deleted;
      }

      LoggerUtil.info('analytics-service', 'All analytics cache cleared', { 
        totalDeleted
      });
      
      return totalDeleted > 0;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to clear all cache', error as Error);
      return false;
    }
  }

  /**
   * Получение статистики кэша
   */
  async getCacheStats(): Promise<{
    totalDashboards: number;
    totalReports: number;
    totalMetrics: number;
    totalSessions: number;
  }> {
    try {
      const dashboardKeys = await this.redisService.keys(`${this.DASHBOARD_PREFIX}*`);
      const reportKeys = await this.redisService.keys(`${this.REPORT_PREFIX}*`);
      const metricsKeys = await this.redisService.keys(`${this.METRICS_PREFIX}*`);
      const sessionKeys = await this.redisService.keys(`${this.SESSION_PREFIX}*`);

      return {
        totalDashboards: dashboardKeys.length,
        totalReports: reportKeys.length,
        totalMetrics: metricsKeys.length,
        totalSessions: sessionKeys.length
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get cache stats', error as Error);
      return {
        totalDashboards: 0,
        totalReports: 0,
        totalMetrics: 0,
        totalSessions: 0
      };
    }
  }
}
