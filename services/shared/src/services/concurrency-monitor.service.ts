import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { LoggerUtil } from '../utils/logger.util';

/**
 * Concurrency Monitor Service для мониторинга многопоточности
 * 
 * Обеспечивает:
 * - Мониторинг производительности потоков
 * - Обнаружение deadlocks и race conditions
 * - Статистику использования ресурсов
 * - Алерты при проблемах с производительностью
 */
@Injectable()
export class ConcurrencyMonitorService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConcurrencyMonitorService.name);
  private readonly monitoringInterval: NodeJS.Timeout;
  private readonly metrics = {
    totalThreads: 0,
    activeThreads: 0,
    blockedThreads: 0,
    deadlockCount: 0,
    raceConditionCount: 0,
    averageResponseTime: 0,
    throughput: 0,
    errorRate: 0
  };
  private readonly threadStats = new Map<string, {
    startTime: number;
    endTime?: number;
    status: 'running' | 'blocked' | 'completed' | 'error';
    operations: number;
    errors: number;
  }>();
  private readonly deadlockDetector = new DeadlockDetector();
  private readonly performanceAnalyzer = new PerformanceAnalyzer();

  constructor() {
    this.monitoringInterval = setInterval(() => {
      this.performMonitoring();
    }, 5000); // Мониторинг каждые 5 секунд
  }

  async onModuleInit() {
    LoggerUtil.info('shared', 'Concurrency monitor initialized');
  }

  async onModuleDestroy() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
    }
    LoggerUtil.info('shared', 'Concurrency monitor destroyed');
  }

  /**
   * Регистрация нового потока для мониторинга
   */
  registerThread(threadId: string, metadata?: any): void {
    try {
      this.threadStats.set(threadId, {
        startTime: Date.now(),
        status: 'running',
        operations: 0,
        errors: 0
      });

      this.metrics.totalThreads++;
      this.metrics.activeThreads++;

      LoggerUtil.debug('shared', 'Thread registered for monitoring', {
        threadId,
        totalThreads: this.metrics.totalThreads
      });
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to register thread', error as Error, { threadId });
    }
  }

  /**
   * Обновление статуса потока
   */
  updateThreadStatus(threadId: string, status: 'running' | 'blocked' | 'completed' | 'error'): void {
    try {
      const threadStat = this.threadStats.get(threadId);
      if (!threadStat) {
        LoggerUtil.warn('shared', 'Thread not found for status update', { threadId });
        return;
      }

      const oldStatus = threadStat.status;
      threadStat.status = status;

      if (status === 'blocked' && oldStatus !== 'blocked') {
        this.metrics.blockedThreads++;
      } else if (status !== 'blocked' && oldStatus === 'blocked') {
        this.metrics.blockedThreads--;
      }

      if (status === 'completed' || status === 'error') {
        threadStat.endTime = Date.now();
        this.metrics.activeThreads--;
      }

      LoggerUtil.debug('shared', 'Thread status updated', {
        threadId,
        status,
        blockedThreads: this.metrics.blockedThreads
      });
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to update thread status', error as Error, { threadId });
    }
  }

  /**
   * Запись операции потока
   */
  recordThreadOperation(threadId: string, operationTime: number, success: boolean): void {
    try {
      const threadStat = this.threadStats.get(threadId);
      if (!threadStat) {
        return;
      }

      threadStat.operations++;
      if (!success) {
        threadStat.errors++;
      }

      // Обновляем среднее время ответа
      this.updateAverageResponseTime(operationTime);

      LoggerUtil.debug('shared', 'Thread operation recorded', {
        threadId,
        operationTime,
        success,
        totalOperations: threadStat.operations
      });
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to record thread operation', error as Error, { threadId });
    }
  }

  /**
   * Обнаружение deadlock
   */
  detectDeadlock(threadId: string, resources: string[]): boolean {
    try {
      const isDeadlock = this.deadlockDetector.detect(threadId, resources);
      if (isDeadlock) {
        this.metrics.deadlockCount++;
        LoggerUtil.warn('shared', 'Deadlock detected', {
          threadId,
          resources,
          deadlockCount: this.metrics.deadlockCount
        });
      }
      return isDeadlock;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to detect deadlock', error as Error, { threadId });
      return false;
    }
  }

  /**
   * Обнаружение race condition
   */
  detectRaceCondition(threadId: string, resource: string): boolean {
    try {
      const isRaceCondition = this.performanceAnalyzer.detectRaceCondition(threadId, resource);
      if (isRaceCondition) {
        this.metrics.raceConditionCount++;
        LoggerUtil.warn('shared', 'Race condition detected', {
          threadId,
          resource,
          raceConditionCount: this.metrics.raceConditionCount
        });
      }
      return isRaceCondition;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to detect race condition', error as Error, { threadId });
      return false;
    }
  }

  /**
   * Получение метрик производительности
   */
  getPerformanceMetrics(): {
    totalThreads: number;
    activeThreads: number;
    blockedThreads: number;
    deadlockCount: number;
    raceConditionCount: number;
    averageResponseTime: number;
    throughput: number;
    errorRate: number;
    threadStats: Array<{
      threadId: string;
      duration: number;
      operations: number;
      errors: number;
      status: string;
    }>;
  } {
    const threadStats = Array.from(this.threadStats.entries()).map(([threadId, stats]) => ({
      threadId,
      duration: stats.endTime ? stats.endTime - stats.startTime : Date.now() - stats.startTime,
      operations: stats.operations,
      errors: stats.errors,
      status: stats.status
    }));

    return {
      ...this.metrics,
      threadStats
    };
  }

  /**
   * Получение рекомендаций по оптимизации
   */
  getOptimizationRecommendations(): Array<{
    type: 'performance' | 'deadlock' | 'race_condition' | 'resource_usage';
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    recommendation: string;
  }> {
    const recommendations: Array<{
      type: 'performance' | 'deadlock' | 'race_condition' | 'resource_usage';
      severity: 'low' | 'medium' | 'high' | 'critical';
      message: string;
      recommendation: string;
    }> = [];

    // Проверяем deadlocks
    if (this.metrics.deadlockCount > 0) {
      recommendations.push({
        type: 'deadlock',
        severity: 'critical',
        message: `Detected ${this.metrics.deadlockCount} deadlocks`,
        recommendation: 'Review resource acquisition order and implement timeout mechanisms'
      });
    }

    // Проверяем race conditions
    if (this.metrics.raceConditionCount > 0) {
      recommendations.push({
        type: 'race_condition',
        severity: 'high',
        message: `Detected ${this.metrics.raceConditionCount} race conditions`,
        recommendation: 'Implement proper synchronization mechanisms and atomic operations'
      });
    }

    // Проверяем производительность
    if (this.metrics.averageResponseTime > 5000) {
      recommendations.push({
        type: 'performance',
        severity: 'medium',
        message: `Average response time is ${this.metrics.averageResponseTime}ms`,
        recommendation: 'Consider optimizing algorithms or increasing thread pool size'
      });
    }

    // Проверяем использование ресурсов
    if (this.metrics.blockedThreads > this.metrics.activeThreads * 0.5) {
      recommendations.push({
        type: 'resource_usage',
        severity: 'high',
        message: `${this.metrics.blockedThreads} threads are blocked`,
        recommendation: 'Review resource allocation and consider increasing available resources'
      });
    }

    return recommendations;
  }

  /**
   * Выполнение мониторинга
   */
  private performMonitoring(): void {
    try {
      // Обновляем метрики
      this.updateMetrics();
      
      // Проверяем на проблемы
      this.checkForIssues();
      
      // Очищаем старые данные
      this.cleanupOldData();
      
      LoggerUtil.debug('shared', 'Concurrency monitoring completed', {
        activeThreads: this.metrics.activeThreads,
        blockedThreads: this.metrics.blockedThreads,
        deadlockCount: this.metrics.deadlockCount
      });
    } catch (error) {
      LoggerUtil.error('shared', 'Concurrency monitoring failed', error as Error);
    }
  }

  /**
   * Обновление метрик
   */
  private updateMetrics(): void {
    // Вычисляем throughput
    const totalOperations = Array.from(this.threadStats.values())
      .reduce((sum, stats) => sum + stats.operations, 0);
    this.metrics.throughput = totalOperations / 5; // Операций в секунду

    // Вычисляем error rate
    const totalErrors = Array.from(this.threadStats.values())
      .reduce((sum, stats) => sum + stats.errors, 0);
    this.metrics.errorRate = totalOperations > 0 ? totalErrors / totalOperations : 0;
  }

  /**
   * Проверка на проблемы
   */
  private checkForIssues(): void {
    // Проверяем на высокий error rate
    if (this.metrics.errorRate > 0.1) {
      LoggerUtil.warn('shared', 'High error rate detected', {
        errorRate: this.metrics.errorRate
      });
    }

    // Проверяем на большое количество заблокированных потоков
    if (this.metrics.blockedThreads > this.metrics.activeThreads * 0.8) {
      LoggerUtil.warn('shared', 'High number of blocked threads', {
        blockedThreads: this.metrics.blockedThreads,
        activeThreads: this.metrics.activeThreads
      });
    }

    // Проверяем на низкий throughput
    if (this.metrics.throughput < 10) {
      LoggerUtil.warn('shared', 'Low throughput detected', {
        throughput: this.metrics.throughput
      });
    }
  }

  /**
   * Очистка старых данных
   */
  private cleanupOldData(): void {
    const now = Date.now();
    const maxAge = 300000; // 5 минут

    for (const [threadId, stats] of this.threadStats.entries()) {
      if (stats.endTime && (now - stats.endTime) > maxAge) {
        this.threadStats.delete(threadId);
      }
    }
  }

  /**
   * Обновление среднего времени ответа
   */
  private updateAverageResponseTime(operationTime: number): void {
    const alpha = 0.1; // Коэффициент сглаживания
    this.metrics.averageResponseTime = 
      this.metrics.averageResponseTime * (1 - alpha) + operationTime * alpha;
  }
}

/**
 * Детектор deadlock
 */
class DeadlockDetector {
  private readonly resourceGraph = new Map<string, Set<string>>();
  private readonly threadResources = new Map<string, Set<string>>();

  detect(threadId: string, resources: string[]): boolean {
    try {
      // Обновляем граф ресурсов
      this.updateResourceGraph(threadId, resources);
      
      // Проверяем на циклы в графе
      return this.hasCycle();
    } catch (error) {
      return false;
    }
  }

  private updateResourceGraph(threadId: string, resources: string[]): void {
    this.threadResources.set(threadId, new Set(resources));
    
    for (const resource of resources) {
      if (!this.resourceGraph.has(resource)) {
        this.resourceGraph.set(resource, new Set());
      }
      
      // Добавляем связи между ресурсами
      for (const otherResource of resources) {
        if (resource !== otherResource) {
          this.resourceGraph.get(resource)!.add(otherResource);
        }
      }
    }
  }

  private hasCycle(): boolean {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    for (const resource of this.resourceGraph.keys()) {
      if (!visited.has(resource)) {
        if (this.dfs(resource, visited, recursionStack)) {
          return true;
        }
      }
    }

    return false;
  }

  private dfs(resource: string, visited: Set<string>, recursionStack: Set<string>): boolean {
    visited.add(resource);
    recursionStack.add(resource);

    const neighbors = this.resourceGraph.get(resource) || new Set();
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (this.dfs(neighbor, visited, recursionStack)) {
          return true;
        }
      } else if (recursionStack.has(neighbor)) {
        return true; // Найден цикл
      }
    }

    recursionStack.delete(resource);
    return false;
  }
}

/**
 * Анализатор производительности
 */
class PerformanceAnalyzer {
  private readonly resourceAccess = new Map<string, Array<{ threadId: string; timestamp: number }>>();

  detectRaceCondition(threadId: string, resource: string): boolean {
    try {
      const now = Date.now();
      
      if (!this.resourceAccess.has(resource)) {
        this.resourceAccess.set(resource, []);
      }
      
      const accesses = this.resourceAccess.get(resource)!;
      accesses.push({ threadId, timestamp: now });
      
      // Очищаем старые записи (старше 1 секунды)
      const cutoff = now - 1000;
      const recentAccesses = accesses.filter(access => access.timestamp > cutoff);
      this.resourceAccess.set(resource, recentAccesses);
      
      // Проверяем на race condition (множественные потоки обращаются к ресурсу одновременно)
      if (recentAccesses.length > 1) {
        const uniqueThreads = new Set(recentAccesses.map(access => access.threadId));
        return uniqueThreads.size > 1;
      }
      
      return false;
    } catch (error) {
      return false;
    }
  }
}
