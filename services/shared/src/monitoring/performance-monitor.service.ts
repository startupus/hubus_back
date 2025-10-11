import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '../index';

/**
 * Performance Monitor Service для отслеживания производительности
 * 
 * Обеспечивает:
 * - Метрики производительности в реальном времени
 * - Отслеживание медленных операций
 * - Статистику использования ресурсов
 * - Алерты при превышении лимитов
 */
@Injectable()
export class PerformanceMonitorService {
  private readonly logger = new Logger(PerformanceMonitorService.name);
  private readonly metrics = new Map<string, any>();
  private readonly slowOperationThreshold = 1000; // 1 секунда
  private readonly memoryThreshold = 100 * 1024 * 1024; // 100 MB
  private readonly cpuThreshold = 80; // 80%

  // Метрики производительности
  private readonly responseTimes = new Map<string, number[]>();
  private readonly errorRates = new Map<string, number>();
  private readonly requestCounts = new Map<string, number>();
  private readonly memoryUsage = new Map<string, number[]>();
  private readonly cpuUsage = new Map<string, number[]>();

  /**
   * Записать метрику времени отклика
   */
  recordResponseTime(operation: string, responseTime: number): void {
    try {
      if (!this.responseTimes.has(operation)) {
        this.responseTimes.set(operation, []);
      }

      const times = this.responseTimes.get(operation)!;
      times.push(responseTime);

      // Храним только последние 1000 записей
      if (times.length > 1000) {
        times.shift();
      }

      // Проверяем на медленную операцию
      if (responseTime > this.slowOperationThreshold) {
        LoggerUtil.warn('performance-monitor', 'Slow operation detected', {
          operation,
          responseTime,
          threshold: this.slowOperationThreshold,
        });
      }

      LoggerUtil.debug('performance-monitor', 'Response time recorded', {
        operation,
        responseTime,
      });
    } catch (error) {
      LoggerUtil.error('performance-monitor', 'Failed to record response time', error as Error);
    }
  }

  /**
   * Записать метрику ошибки
   */
  recordError(operation: string, error: Error): void {
    try {
      const currentErrors = this.errorRates.get(operation) || 0;
      this.errorRates.set(operation, currentErrors + 1);

      LoggerUtil.error('performance-monitor', 'Error recorded', {
        operation,
        error: error.message,
        stack: error.stack,
      });
    } catch (err) {
      LoggerUtil.error('performance-monitor', 'Failed to record error', err as Error);
    }
  }

  /**
   * Записать метрику запроса
   */
  recordRequest(operation: string): void {
    try {
      const currentCount = this.requestCounts.get(operation) || 0;
      this.requestCounts.set(operation, currentCount + 1);

      LoggerUtil.debug('performance-monitor', 'Request recorded', {
        operation,
        count: currentCount + 1,
      });
    } catch (error) {
      LoggerUtil.error('performance-monitor', 'Failed to record request', error as Error);
    }
  }

  /**
   * Записать метрику использования памяти
   */
  recordMemoryUsage(operation: string, memoryUsage: number): void {
    try {
      if (!this.memoryUsage.has(operation)) {
        this.memoryUsage.set(operation, []);
      }

      const usage = this.memoryUsage.get(operation)!;
      usage.push(memoryUsage);

      // Храним только последние 100 записей
      if (usage.length > 100) {
        usage.shift();
      }

      // Проверяем на превышение лимита памяти
      if (memoryUsage > this.memoryThreshold) {
        LoggerUtil.warn('performance-monitor', 'High memory usage detected', {
          operation,
          memoryUsage: `${Math.round(memoryUsage / 1024 / 1024)} MB`,
          threshold: `${Math.round(this.memoryThreshold / 1024 / 1024)} MB`,
        });
      }

      LoggerUtil.debug('performance-monitor', 'Memory usage recorded', {
        operation,
        memoryUsage: `${Math.round(memoryUsage / 1024 / 1024)} MB`,
      });
    } catch (error) {
      LoggerUtil.error('performance-monitor', 'Failed to record memory usage', error as Error);
    }
  }

  /**
   * Записать метрику использования CPU
   */
  recordCpuUsage(operation: string, cpuUsage: number): void {
    try {
      if (!this.cpuUsage.has(operation)) {
        this.cpuUsage.set(operation, []);
      }

      const usage = this.cpuUsage.get(operation)!;
      usage.push(cpuUsage);

      // Храним только последние 100 записей
      if (usage.length > 100) {
        usage.shift();
      }

      // Проверяем на превышение лимита CPU
      if (cpuUsage > this.cpuThreshold) {
        LoggerUtil.warn('performance-monitor', 'High CPU usage detected', {
          operation,
          cpuUsage: `${cpuUsage}%`,
          threshold: `${this.cpuThreshold}%`,
        });
      }

      LoggerUtil.debug('performance-monitor', 'CPU usage recorded', {
        operation,
        cpuUsage: `${cpuUsage}%`,
      });
    } catch (error) {
      LoggerUtil.error('performance-monitor', 'Failed to record CPU usage', error as Error);
    }
  }

  /**
   * Получить статистику производительности
   */
  getPerformanceStats(): {
    operations: Array<{
      name: string;
      avgResponseTime: number;
      maxResponseTime: number;
      minResponseTime: number;
      errorRate: number;
      requestCount: number;
      avgMemoryUsage: number;
      avgCpuUsage: number;
    }>;
    system: {
      totalMemory: number;
      freeMemory: number;
      usedMemory: number;
      memoryUsagePercent: number;
      uptime: number;
      nodeVersion: string;
    };
  } {
    try {
      const operations = Array.from(this.responseTimes.keys()).map(operation => {
        const responseTimes = this.responseTimes.get(operation) || [];
        const errorCount = this.errorRates.get(operation) || 0;
        const requestCount = this.requestCounts.get(operation) || 0;
        const memoryUsages = this.memoryUsage.get(operation) || [];
        const cpuUsages = this.cpuUsage.get(operation) || [];

        const avgResponseTime = responseTimes.length > 0 
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
          : 0;

        const maxResponseTime = responseTimes.length > 0 
          ? Math.max(...responseTimes) 
          : 0;

        const minResponseTime = responseTimes.length > 0 
          ? Math.min(...responseTimes) 
          : 0;

        const errorRate = requestCount > 0 
          ? (errorCount / requestCount) * 100 
          : 0;

        const avgMemoryUsage = memoryUsages.length > 0 
          ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length 
          : 0;

        const avgCpuUsage = cpuUsages.length > 0 
          ? cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length 
          : 0;

        return {
          name: operation,
          avgResponseTime: Math.round(avgResponseTime * 100) / 100,
          maxResponseTime,
          minResponseTime,
          errorRate: Math.round(errorRate * 100) / 100,
          requestCount,
          avgMemoryUsage: Math.round(avgMemoryUsage / 1024 / 1024 * 100) / 100,
          avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
        };
      });

      const memUsage = process.memoryUsage();
      const totalMemory = memUsage.heapTotal;
      const usedMemory = memUsage.heapUsed;
      const freeMemory = totalMemory - usedMemory;
      const memoryUsagePercent = (usedMemory / totalMemory) * 100;

      return {
        operations,
        system: {
          totalMemory: Math.round(totalMemory / 1024 / 1024 * 100) / 100,
          freeMemory: Math.round(freeMemory / 1024 / 1024 * 100) / 100,
          usedMemory: Math.round(usedMemory / 1024 / 1024 * 100) / 100,
          memoryUsagePercent: Math.round(memoryUsagePercent * 100) / 100,
          uptime: Math.round(process.uptime()),
          nodeVersion: process.version,
        },
      };
    } catch (error) {
      LoggerUtil.error('performance-monitor', 'Failed to get performance stats', error as Error);
      return {
        operations: [],
        system: {
          totalMemory: 0,
          freeMemory: 0,
          usedMemory: 0,
          memoryUsagePercent: 0,
          uptime: 0,
          nodeVersion: 'unknown',
        },
      };
    }
  }

  /**
   * Очистить метрики
   */
  clearMetrics(): void {
    try {
      this.responseTimes.clear();
      this.errorRates.clear();
      this.requestCounts.clear();
      this.memoryUsage.clear();
      this.cpuUsage.clear();

      LoggerUtil.info('performance-monitor', 'Performance metrics cleared');
    } catch (error) {
      LoggerUtil.error('performance-monitor', 'Failed to clear metrics', error as Error);
    }
  }

  /**
   * Получить метрики для конкретной операции
   */
  getOperationMetrics(operation: string): {
    avgResponseTime: number;
    maxResponseTime: number;
    minResponseTime: number;
    errorRate: number;
    requestCount: number;
    avgMemoryUsage: number;
    avgCpuUsage: number;
  } | null {
    try {
      const responseTimes = this.responseTimes.get(operation) || [];
      const errorCount = this.errorRates.get(operation) || 0;
      const requestCount = this.requestCounts.get(operation) || 0;
      const memoryUsages = this.memoryUsage.get(operation) || [];
      const cpuUsages = this.cpuUsage.get(operation) || [];

      if (responseTimes.length === 0 && requestCount === 0) {
        return null;
      }

      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

      const maxResponseTime = responseTimes.length > 0 
        ? Math.max(...responseTimes) 
        : 0;

      const minResponseTime = responseTimes.length > 0 
        ? Math.min(...responseTimes) 
        : 0;

      const errorRate = requestCount > 0 
        ? (errorCount / requestCount) * 100 
        : 0;

      const avgMemoryUsage = memoryUsages.length > 0 
        ? memoryUsages.reduce((a, b) => a + b, 0) / memoryUsages.length 
        : 0;

      const avgCpuUsage = cpuUsages.length > 0 
        ? cpuUsages.reduce((a, b) => a + b, 0) / cpuUsages.length 
        : 0;

      return {
        avgResponseTime: Math.round(avgResponseTime * 100) / 100,
        maxResponseTime,
        minResponseTime,
        errorRate: Math.round(errorRate * 100) / 100,
        requestCount,
        avgMemoryUsage: Math.round(avgMemoryUsage / 1024 / 1024 * 100) / 100,
        avgCpuUsage: Math.round(avgCpuUsage * 100) / 100,
      };
    } catch (error) {
      LoggerUtil.error('performance-monitor', 'Failed to get operation metrics', error as Error);
      return null;
    }
  }
}
