import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerUtil } from '../utils/logger.util';

export interface ApiMetrics {
  endpoint: string;
  method: string;
  responseTime: number;
  statusCode: number;
  timestamp: Date;
  userId?: string;
  error?: string;
}

export interface ServiceHealth {
  serviceName: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  memoryUsage: NodeJS.MemoryUsage;
  responseTime: number;
  lastCheck: Date;
  dependencies: {
    database: boolean;
    redis: boolean;
    rabbitmq: boolean;
  };
}

@Injectable()
export class ApiMonitorService {
  private readonly logger = new Logger(ApiMonitorService.name);
  private metrics: ApiMetrics[] = [];
  private readonly maxMetrics = 1000; // Keep last 1000 metrics
  private healthChecks = new Map<string, ServiceHealth>();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Record API metrics
   */
  recordMetric(metric: Omit<ApiMetrics, 'timestamp'>): void {
    const fullMetric: ApiMetrics = {
      ...metric,
      timestamp: new Date(),
    };

    this.metrics.push(fullMetric);

    // Keep only last maxMetrics entries
    if (this.metrics.length > this.maxMetrics) {
      this.metrics = this.metrics.slice(-this.maxMetrics);
    }

    // Log performance issues
    if (metric.responseTime > 5000) {
      LoggerUtil.warn('api-monitor', 'Slow API response detected', {
        endpoint: metric.endpoint,
        method: metric.method,
        responseTime: metric.responseTime,
        statusCode: metric.statusCode,
      } as any);
    }

    // Log errors
    if (metric.statusCode >= 400) {
      LoggerUtil.error('api-monitor', 'API error detected', {
        endpoint: metric.endpoint,
        method: metric.method,
        statusCode: metric.statusCode,
        error: metric.error,
      } as any);
    }
  }

  /**
   * Get API metrics for a specific time range
   */
  getMetrics(
    startTime?: Date,
    endTime?: Date,
    endpoint?: string
  ): ApiMetrics[] {
    let filteredMetrics = this.metrics;

    if (startTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp >= startTime);
    }

    if (endTime) {
      filteredMetrics = filteredMetrics.filter(m => m.timestamp <= endTime);
    }

    if (endpoint) {
      filteredMetrics = filteredMetrics.filter(m => m.endpoint === endpoint);
    }

    return filteredMetrics;
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(
    startTime?: Date,
    endTime?: Date,
    endpoint?: string
  ): {
    totalRequests: number;
    averageResponseTime: number;
    errorRate: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    statusCodeDistribution: Record<number, number>;
  } {
    const metrics = this.getMetrics(startTime, endTime, endpoint);

    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        errorRate: 0,
        p95ResponseTime: 0,
        p99ResponseTime: 0,
        statusCodeDistribution: {},
      };
    }

    const responseTimes = metrics.map(m => m.responseTime).sort((a, b) => a - b);
    const errorCount = metrics.filter(m => m.statusCode >= 400).length;
    const statusCodeDistribution = metrics.reduce((acc, m) => {
      acc[m.statusCode] = (acc[m.statusCode] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    return {
      totalRequests: metrics.length,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      errorRate: (errorCount / metrics.length) * 100,
      p95ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.95)],
      p99ResponseTime: responseTimes[Math.floor(responseTimes.length * 0.99)],
      statusCodeDistribution,
    };
  }

  /**
   * Update service health
   */
  updateServiceHealth(serviceName: string, health: ServiceHealth): void {
    this.healthChecks.set(serviceName, health);

    if (health.status === 'unhealthy') {
      LoggerUtil.error('api-monitor', 'Service health check failed', {
        serviceName,
        status: health.status,
        uptime: health.uptime,
        memoryUsage: health.memoryUsage,
      } as any);
    }
  }

  /**
   * Get all service health statuses
   */
  getAllServiceHealth(): ServiceHealth[] {
    return Array.from(this.healthChecks.values());
  }

  /**
   * Get service health by name
   */
  getServiceHealth(serviceName: string): ServiceHealth | undefined {
    return this.healthChecks.get(serviceName);
  }

  /**
   * Check if any services are unhealthy
   */
  hasUnhealthyServices(): boolean {
    return Array.from(this.healthChecks.values()).some(
      health => health.status === 'unhealthy'
    );
  }

  /**
   * Get system overview
   */
  getSystemOverview(): {
    totalServices: number;
    healthyServices: number;
    degradedServices: number;
    unhealthyServices: number;
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    recentMetrics: {
      totalRequests: number;
      averageResponseTime: number;
      errorRate: number;
    };
  } {
    const services = this.getAllServiceHealth();
    const healthyCount = services.filter(s => s.status === 'healthy').length;
    const degradedCount = services.filter(s => s.status === 'degraded').length;
    const unhealthyCount = services.filter(s => s.status === 'unhealthy').length;

    let overallStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (unhealthyCount > 0) {
      overallStatus = 'unhealthy';
    } else if (degradedCount > 0) {
      overallStatus = 'degraded';
    }

    // Get metrics from last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentStats = this.getPerformanceStats(oneHourAgo);

    return {
      totalServices: services.length,
      healthyServices: healthyCount,
      degradedServices: degradedCount,
      unhealthyServices: unhealthyCount,
      overallStatus,
      recentMetrics: {
        totalRequests: recentStats.totalRequests,
        averageResponseTime: recentStats.averageResponseTime,
        errorRate: recentStats.errorRate,
      },
    };
  }

  /**
   * Clear old metrics
   */
  clearOldMetrics(olderThanHours: number = 24): void {
    const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);
    const initialLength = this.metrics.length;
    
    this.metrics = this.metrics.filter(m => m.timestamp > cutoffTime);
    
    const removedCount = initialLength - this.metrics.length;
    if (removedCount > 0) {
      LoggerUtil.info('api-monitor', 'Cleared old metrics', {
        removedCount,
        remainingCount: this.metrics.length,
      });
    }
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): {
    metrics: ApiMetrics[];
    healthChecks: ServiceHealth[];
    systemOverview: any;
  } {
    return {
      metrics: this.metrics,
      healthChecks: this.getAllServiceHealth(),
      systemOverview: this.getSystemOverview(),
    };
  }
}
