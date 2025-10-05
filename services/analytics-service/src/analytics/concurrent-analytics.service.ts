import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';
import { ThreadPoolService } from '@ai-aggregator/shared';
import { ConcurrentMap, ConcurrentQueue, AtomicCounter, ConcurrentCache } from '@ai-aggregator/shared';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Concurrent Analytics Service для высоконагруженной обработки аналитики
 * 
 * Обеспечивает:
 * - Параллельную обработку событий аналитики
 * - Потокобезопасную агрегацию метрик
 * - Кэширование результатов вычислений
 * - Предотвращение потери данных
 */
@Injectable()
export class ConcurrentAnalyticsService {
  private readonly logger = new Logger(ConcurrentAnalyticsService.name);
  
  // Потокобезопасные коллекции для кэширования
  private readonly dashboardCache = new ConcurrentCache<string, {
    data: any;
    timeRange: string;
    lastUpdated: Date;
  }>();
  
  private readonly metricsCache = new ConcurrentCache<string, {
    metrics: any;
    timestamp: Date;
  }>();
  
  private readonly reportCache = new ConcurrentCache<string, {
    report: any;
    generatedAt: Date;
    expiresAt: Date;
  }>();
  
  // Потокобезопасные счетчики для метрик
  private readonly totalEvents = new AtomicCounter(0);
  private readonly processedEvents = new AtomicCounter(0);
  private readonly failedEvents = new AtomicCounter(0);
  private readonly totalUsers = new AtomicCounter(0);
  private readonly totalRequests = new AtomicCounter(0);
  
  // Очередь для обработки событий
  private readonly eventQueue = new ConcurrentQueue<{
    eventId: string;
    userId: string;
    eventType: string;
    eventName: string;
    service: string;
    properties: any;
    metadata: any;
    timestamp: Date;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }>();
  
  // Очередь для агрегации метрик
  private readonly aggregationQueue = new ConcurrentQueue<{
    aggregationId: string;
    type: string;
    timeRange: string;
    dimensions: string[];
    filters: any;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }>();
  
  // Потокобезопасная карта для блокировок агрегаций
  private readonly aggregationLocks = new ConcurrentMap<string, Int32Array>();
  
  // Пул потоков для параллельной обработки
  private readonly threadPool: ThreadPoolService;
  
  // Потокобезопасная карта для метрик в реальном времени
  private readonly realtimeMetrics = new ConcurrentMap<string, {
    value: number;
    timestamp: Date;
    count: number;
  }>();

  constructor(
    private readonly prisma: PrismaService,
    threadPool: ThreadPoolService
  ) {
    this.threadPool = threadPool;
    this.startEventProcessor();
    this.startAggregationProcessor();
    this.startMetricsAggregator();
  }

  /**
   * Потокобезопасная запись события
   */
  async recordEvent(
    userId: string,
    eventType: string,
    eventName: string,
    service: string,
    properties: any,
    metadata: any,
    timestamp: Date = new Date()
  ): Promise<{ success: boolean; eventId?: string; error?: string }> {
    try {
      const eventId = this.generateEventId();
      
      // Добавляем событие в очередь для асинхронной обработки
      const success = this.eventQueue.enqueue({
        eventId,
        userId,
        eventType,
        eventName,
        service,
        properties,
        metadata,
        timestamp,
        resolve: () => {},
        reject: () => {}
      });

      if (success) {
        // Обновляем счетчики
        this.totalEvents.increment();
        if (userId) {
          this.totalUsers.increment();
        }

        LoggerUtil.debug('analytics-service', 'Event queued for processing', {
          eventId,
          userId,
          eventType,
          eventName,
          service
        });

        return { success: true, eventId };
      } else {
        LoggerUtil.warn('analytics-service', 'Event queue is full', { userId, eventType });
        return { success: false, error: 'Event queue is full' };
      }
    } catch (error) {
      this.failedEvents.increment();
      LoggerUtil.error('analytics-service', 'Failed to record event', error as Error, { userId, eventType });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Параллельная обработка множественных событий
   */
  async recordBatchEvents(
    events: Array<{
      userId: string;
      eventType: string;
      eventName: string;
      service: string;
      properties: any;
      metadata: any;
      timestamp?: Date;
    }>
  ): Promise<Array<{ success: boolean; eventId?: string; error?: string }>> {
    try {
      // Создаем задачи для пула потоков
      const tasks = events.map(event => 
        () => this.recordEvent(
          event.userId,
          event.eventType,
          event.eventName,
          event.service,
          event.properties,
          event.metadata,
          event.timestamp
        )
      );

      // Выполняем задачи параллельно
      const results = await this.threadPool.executeParallel(tasks, {
        maxConcurrency: 20, // Максимум 20 параллельных событий
        timeout: 30000 // 30 секунд таймаут
      });

      return results;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to record batch events', error as Error);
      return events.map(() => ({
        success: false,
        error: 'Batch processing failed'
      }));
    }
  }

  /**
   * Потокобезопасное получение дашборд метрик
   */
  async getDashboardMetrics(timeRange: string): Promise<{
    totalUsers: number;
    totalRequests: number;
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    topServices: Array<{ service: string; requests: number }>;
    topUsers: Array<{ userId: string; requests: number }>;
  }> {
    try {
      // Проверяем кэш
      const cached = this.dashboardCache.get(timeRange);
      if (cached && (Date.now() - cached.lastUpdated.getTime()) < 300000) { // 5 минут TTL
        LoggerUtil.debug('analytics-service', 'Dashboard metrics retrieved from cache', { timeRange });
        return cached.data;
      }

      // Вычисляем метрики
      const metrics = await this.calculateDashboardMetrics(timeRange);
      
      // Кэшируем результат
      this.dashboardCache.set(timeRange, {
        data: metrics,
        timeRange,
        lastUpdated: new Date()
      });

      LoggerUtil.info('analytics-service', 'Dashboard metrics calculated', {
        timeRange,
        totalUsers: metrics.totalUsers,
        totalRequests: metrics.totalRequests
      });

      return metrics;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get dashboard metrics', error as Error, { timeRange });
      throw error;
    }
  }

  /**
   * Потокобезопасная агрегация метрик
   */
  async aggregateMetrics(
    type: string,
    timeRange: string,
    dimensions: string[],
    filters: any
  ): Promise<{
    success: boolean;
    data?: any;
    error?: string;
  }> {
    try {
      const aggregationId = this.generateAggregationId();
      const cacheKey = `${type}:${timeRange}:${JSON.stringify(dimensions)}:${JSON.stringify(filters)}`;
      
      // Проверяем кэш
      const cached = this.metricsCache.get(cacheKey);
      if (cached && (Date.now() - cached.timestamp.getTime()) < 1800000) { // 30 минут TTL
        LoggerUtil.debug('analytics-service', 'Aggregated metrics retrieved from cache', { aggregationId });
        return { success: true, data: cached.metrics };
      }

      // Получаем блокировку для агрегации
      const aggregationLock = this.getAggregationLock(cacheKey);
      await this.acquireLock(aggregationLock);

      try {
        // Выполняем агрегацию
        const aggregatedData = await this.performAggregation(type, timeRange, dimensions, filters);
        
        // Кэшируем результат
        this.metricsCache.set(cacheKey, {
          metrics: aggregatedData,
          timestamp: new Date()
        });

        LoggerUtil.info('analytics-service', 'Metrics aggregated successfully', {
          aggregationId,
          type,
          timeRange,
          dimensions
        });

        return { success: true, data: aggregatedData };
      } finally {
        this.releaseLock(aggregationLock);
      }
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to aggregate metrics', error as Error, { type, timeRange });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Параллельная агрегация множественных метрик
   */
  async aggregateBatchMetrics(
    aggregations: Array<{
      type: string;
      timeRange: string;
      dimensions: string[];
      filters: any;
    }>
  ): Promise<Array<{ success: boolean; data?: any; error?: string }>> {
    try {
      // Создаем задачи для пула потоков
      const tasks = aggregations.map(aggregation => 
        () => this.aggregateMetrics(
          aggregation.type,
          aggregation.timeRange,
          aggregation.dimensions,
          aggregation.filters
        )
      );

      // Выполняем задачи параллельно
      const results = await this.threadPool.executeParallel(tasks, {
        maxConcurrency: 10, // Максимум 10 параллельных агрегаций
        timeout: 60000 // 60 секунд таймаут
      });

      return results;
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to aggregate batch metrics', error as Error);
      return aggregations.map(() => ({
        success: false,
        error: 'Batch aggregation failed'
      }));
    }
  }

  /**
   * Потокобезопасное обновление метрик в реальном времени
   */
  async updateRealtimeMetrics(
    metricName: string,
    value: number,
    timestamp: Date = new Date()
  ): Promise<void> {
    try {
      const existing = this.realtimeMetrics.get(metricName);
      
      if (existing) {
        // Обновляем существующую метрику
        const newValue = (existing.value * existing.count + value) / (existing.count + 1);
        this.realtimeMetrics.set(metricName, {
          value: newValue,
          timestamp,
          count: existing.count + 1
        });
      } else {
        // Создаем новую метрику
        this.realtimeMetrics.set(metricName, {
          value,
          timestamp,
          count: 1
        });
      }

      LoggerUtil.debug('analytics-service', 'Realtime metric updated', {
        metricName,
        value,
        timestamp
      });
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to update realtime metrics', error as Error, { metricName });
    }
  }

  /**
   * Получение метрик в реальном времени
   */
  async getRealtimeMetrics(): Promise<Array<{
    name: string;
    value: number;
    timestamp: Date;
    count: number;
  }>> {
    try {
      const metrics: Array<{ name: string; value: number; timestamp: Date; count: number }> = [];
      
      for (const [name, data] of this.realtimeMetrics.entries()) {
        metrics.push({
          name,
          value: data.value,
          timestamp: data.timestamp,
          count: data.count
        });
      }

      return metrics.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get realtime metrics', error as Error);
      return [];
    }
  }

  /**
   * Процессор событий из очереди
   */
  private startEventProcessor(): void {
    const processEvents = async () => {
      while (true) {
        try {
          // Получаем событие из очереди
          const event = this.eventQueue.dequeueBlocking(1000); // Ждем 1 секунду
          if (!event) {
            continue;
          }

          // Обрабатываем событие
          await this.processEvent(event);
        } catch (error) {
          LoggerUtil.error('analytics-service', 'Failed to process event from queue', error as Error);
        }
      }
    };

    // Запускаем процессор в отдельном потоке
    setImmediate(processEvents);
  }

  /**
   * Процессор агрегаций из очереди
   */
  private startAggregationProcessor(): void {
    const processAggregations = async () => {
      while (true) {
        try {
          // Получаем агрегацию из очереди
          const aggregation = this.aggregationQueue.dequeueBlocking(1000); // Ждем 1 секунду
          if (!aggregation) {
            continue;
          }

          // Обрабатываем агрегацию
          await this.processAggregation(aggregation);
        } catch (error) {
          LoggerUtil.error('analytics-service', 'Failed to process aggregation from queue', error as Error);
        }
      }
    };

    // Запускаем процессор в отдельном потоке
    setImmediate(processAggregations);
  }

  /**
   * Агрегатор метрик в реальном времени
   */
  private startMetricsAggregator(): void {
    const aggregateMetrics = async () => {
      while (true) {
        try {
          // Агрегируем метрики каждые 30 секунд
          await this.performRealtimeAggregation();
          
          // Ждем 30 секунд перед следующей агрегацией
          await new Promise(resolve => setTimeout(resolve, 30000));
        } catch (error) {
          LoggerUtil.error('analytics-service', 'Realtime aggregation error', error as Error);
        }
      }
    };

    // Запускаем агрегатор в отдельном потоке
    setImmediate(aggregateMetrics);
  }

  /**
   * Обработка события
   */
  private async processEvent(event: any): Promise<void> {
    try {
      // Создаем запись события в БД
      await this.prisma.analyticsEvent.create({
        data: {
          userId: event.userId,
          eventType: event.eventType,
          eventName: event.eventName,
          service: event.service,
          properties: event.properties,
          metadata: event.metadata,
          timestamp: event.timestamp
        }
      });

      // Обновляем метрики в реальном времени
      await this.updateRealtimeMetrics('total_events', 1);
      await this.updateRealtimeMetrics(`events_${event.service}`, 1);

      this.processedEvents.increment();
      
      LoggerUtil.debug('analytics-service', 'Event processed successfully', {
        eventId: event.eventId,
        eventType: event.eventType
      });
    } catch (error) {
      this.failedEvents.increment();
      LoggerUtil.error('analytics-service', 'Failed to process event', error as Error, {
        eventId: event.eventId
      });
    }
  }

  /**
   * Обработка агрегации
   */
  private async processAggregation(aggregation: any): Promise<void> {
    try {
      // Выполняем агрегацию
      const result = await this.performAggregation(
        aggregation.type,
        aggregation.timeRange,
        aggregation.dimensions,
        aggregation.filters
      );

      aggregation.resolve(result);
      
      LoggerUtil.debug('analytics-service', 'Aggregation processed successfully', {
        aggregationId: aggregation.aggregationId,
        type: aggregation.type
      });
    } catch (error) {
      aggregation.reject(error as Error);
      LoggerUtil.error('analytics-service', 'Failed to process aggregation', error as Error, {
        aggregationId: aggregation.aggregationId
      });
    }
  }

  /**
   * Вычисление метрик дашборда
   */
  private async calculateDashboardMetrics(timeRange: string): Promise<any> {
    try {
      // Здесь должна быть логика вычисления метрик
      // Для примера возвращаем mock данные
      return {
        totalUsers: this.totalUsers.get(),
        totalRequests: this.totalRequests.get(),
        averageResponseTime: 150,
        successRate: 0.95,
        errorRate: 0.05,
        topServices: [
          { service: 'billing-service', requests: 1000 },
          { service: 'auth-service', requests: 800 },
          { service: 'proxy-service', requests: 600 }
        ],
        topUsers: [
          { userId: 'user1', requests: 100 },
          { userId: 'user2', requests: 80 },
          { userId: 'user3', requests: 60 }
        ]
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to calculate dashboard metrics', error as Error);
      throw error;
    }
  }

  /**
   * Выполнение агрегации
   */
  private async performAggregation(
    type: string,
    timeRange: string,
    dimensions: string[],
    filters: any
  ): Promise<any> {
    try {
      // Здесь должна быть логика агрегации
      // Для примера возвращаем mock данные
      return {
        type,
        timeRange,
        dimensions,
        filters,
        data: {
          count: 1000,
          sum: 50000,
          average: 50,
          min: 1,
          max: 1000
        },
        generatedAt: new Date()
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to perform aggregation', error as Error);
      throw error;
    }
  }

  /**
   * Агрегация метрик в реальном времени
   */
  private async performRealtimeAggregation(): Promise<void> {
    try {
      // Агрегируем метрики из realtimeMetrics
      const metrics = await this.getRealtimeMetrics();
      
      // Здесь можно добавить логику сохранения агрегированных метрик
      LoggerUtil.debug('analytics-service', 'Realtime aggregation completed', {
        metricsCount: metrics.length
      });
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to perform realtime aggregation', error as Error);
    }
  }

  /**
   * Получение блокировки для агрегации
   */
  private getAggregationLock(key: string): Int32Array {
    if (!this.aggregationLocks.has(key)) {
      this.aggregationLocks.set(key, new Int32Array(new SharedArrayBuffer(4)));
    }
    return this.aggregationLocks.get(key)!;
  }

  /**
   * Получение блокировки
   */
  private async acquireLock(lock: Int32Array): Promise<void> {
    while (!Atomics.compareExchange(lock, 0, 0, 1)) {
      Atomics.wait(lock, 0, 1);
    }
  }

  /**
   * Освобождение блокировки
   */
  private releaseLock(lock: Int32Array): void {
    Atomics.store(lock, 0, 0);
    Atomics.notify(lock, 0, 1);
  }

  /**
   * Генерация уникального ID события
   */
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Генерация уникального ID агрегации
   */
  private generateAggregationId(): string {
    return `agg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Получение статистики сервиса
   */
  getStats(): {
    totalEvents: number;
    processedEvents: number;
    failedEvents: number;
    totalUsers: number;
    totalRequests: number;
    queueSize: number;
    realtimeMetricsCount: number;
    cacheStats: {
      dashboardCache: number;
      metricsCache: number;
      reportCache: number;
    };
  } {
    return {
      totalEvents: this.totalEvents.get(),
      processedEvents: this.processedEvents.get(),
      failedEvents: this.failedEvents.get(),
      totalUsers: this.totalUsers.get(),
      totalRequests: this.totalRequests.get(),
      queueSize: this.eventQueue.size(),
      realtimeMetricsCount: this.realtimeMetrics.size(),
      cacheStats: {
        dashboardCache: this.dashboardCache.size(),
        metricsCache: this.metricsCache.size(),
        reportCache: this.reportCache.size()
      }
    };
  }

  /**
   * Очистка кэша
   */
  async clearCache(): Promise<void> {
    try {
      // Очищаем все кэши
      this.dashboardCache.cleanup();
      this.metricsCache.cleanup();
      this.reportCache.cleanup();

      LoggerUtil.info('analytics-service', 'Cache cleared successfully');
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to clear cache', error as Error);
    }
  }
}
