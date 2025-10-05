import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';
import { ThreadPoolService } from '@ai-aggregator/shared';
import { ConcurrentMap, ConcurrentQueue, AtomicCounter, ConcurrentCache } from '@ai-aggregator/shared';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Concurrent Orchestrator Service для высоконагруженной маршрутизации
 * 
 * Обеспечивает:
 * - Параллельную обработку запросов маршрутизации
 * - Потокобезопасный мониторинг провайдеров
 * - Кэширование результатов маршрутизации
 * - Балансировку нагрузки между провайдерами
 */
@Injectable()
export class ConcurrentOrchestratorService {
  private readonly logger = new Logger(ConcurrentOrchestratorService.name);
  
  // Потокобезопасные коллекции для кэширования
  private readonly providerStatusCache = new ConcurrentCache<string, {
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
    successRate: number;
    lastChecked: Date;
  }>();
  
  private readonly routingCache = new ConcurrentCache<string, {
    selectedProvider: string;
    reason: string;
    estimatedCost: number;
    estimatedTime: number;
    alternatives: string[];
  }>();
  
  private readonly metricsCache = new ConcurrentCache<string, {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    totalRequests: number;
    lastHourRequests: number;
  }>();
  
  // Потокобезопасные счетчики для метрик
  private readonly totalRequests = new AtomicCounter(0);
  private readonly successfulRequests = new AtomicCounter(0);
  private readonly failedRequests = new AtomicCounter(0);
  private readonly totalResponseTime = new AtomicCounter(0);
  
  // Очередь для обработки запросов маршрутизации
  private readonly routingQueue = new ConcurrentQueue<{
    requestId: string;
    userId: string;
    model: string;
    prompt: string;
    expectedTokens: number;
    priority: number;
    resolve: (result: any) => void;
    reject: (error: Error) => void;
  }>();
  
  // Потокобезопасная карта для блокировок провайдеров
  private readonly providerLocks = new ConcurrentMap<string, Int32Array>();
  
  // Пул потоков для параллельной обработки
  private readonly threadPool: ThreadPoolService;
  
  // Провайдеры и их конфигурация
  private readonly providers = new ConcurrentMap<string, {
    id: string;
    name: string;
    apiUrl: string;
    apiKey: string;
    models: string[];
    costPerToken: number;
    maxTokens: number;
    priority: number;
    isActive: boolean;
  }>();

  constructor(
    private readonly httpService: HttpService,
    threadPool: ThreadPoolService
  ) {
    this.threadPool = threadPool;
    this.initializeProviders();
    this.startRoutingProcessor();
    this.startHealthMonitoring();
  }

  /**
   * Инициализация провайдеров
   */
  private initializeProviders(): void {
    // OpenAI
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

    // OpenRouter
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

    // YandexGPT
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

  /**
   * Потокобезопасная маршрутизация запроса
   */
  async routeRequest(
    userId: string,
    model: string,
    prompt: string,
    expectedTokens: number,
    priority: number = 0
  ): Promise<{
    success: boolean;
    selectedProvider: string;
    estimatedCost: number;
    estimatedTime: number;
    alternatives: string[];
    error?: string;
  }> {
    try {
      const requestId = this.generateRequestId();
      
      // Создаем хэш запроса для кэширования
      const requestHash = this.createRequestHash(userId, model, prompt, expectedTokens);
      
      // Проверяем кэш маршрутизации
      const cached = this.routingCache.get(requestHash);
      if (cached && (Date.now() - (cached as any).lastChecked.getTime()) < 300000) { // 5 минут TTL
        LoggerUtil.debug('provider-orchestrator', 'Routing result retrieved from cache', { requestId });
        return {
          success: true,
          selectedProvider: cached.selectedProvider,
          estimatedCost: cached.estimatedCost,
          estimatedTime: cached.estimatedTime,
          alternatives: cached.alternatives
        };
      }

      // Выбираем оптимального провайдера
      const selectedProvider = await this.selectOptimalProvider(model, expectedTokens);
      if (!selectedProvider) {
        throw new Error('No suitable provider found');
      }

      // Вычисляем альтернативы
      const alternatives = await this.getAlternativeProviders(model, selectedProvider.id);

      // Вычисляем стоимость и время
      const estimatedCost = this.calculateCost(selectedProvider, expectedTokens);
      const estimatedTime = this.estimateResponseTime(selectedProvider);

      // Кэшируем результат маршрутизации
      this.routingCache.set(requestHash, {
        selectedProvider: selectedProvider.id,
        reason: 'Optimal provider selected',
        estimatedCost,
        estimatedTime,
        alternatives: alternatives.map(p => p.id)
      });

      // Обновляем счетчики
      this.totalRequests.increment();

      LoggerUtil.info('provider-orchestrator', 'Request routed successfully', {
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
    } catch (error) {
      this.failedRequests.increment();
      LoggerUtil.error('provider-orchestrator', 'Failed to route request', error as Error, { userId, model });
      
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

  /**
   * Параллельная обработка множественных запросов
   */
  async routeBatchRequests(
    requests: Array<{
      userId: string;
      model: string;
      prompt: string;
      expectedTokens: number;
      priority?: number;
    }>
  ): Promise<Array<{
    success: boolean;
    selectedProvider: string;
    estimatedCost: number;
    estimatedTime: number;
    alternatives: string[];
    error?: string;
  }>> {
    try {
      // Создаем задачи для пула потоков
      const tasks = requests.map(request => 
        () => this.routeRequest(
          request.userId,
          request.model,
          request.prompt,
          request.expectedTokens,
          request.priority || 0
        )
      );

      // Выполняем задачи параллельно
      const results = await this.threadPool.executeParallel(tasks, {
        maxConcurrency: 10, // Максимум 10 параллельных запросов
        timeout: 60000 // 60 секунд таймаут
      });

      return results;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to route batch requests', error as Error);
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

  /**
   * Потокобезопасное получение статуса провайдера
   */
  async getProviderStatus(providerId: string): Promise<{
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
    successRate: number;
    lastChecked: Date;
    message: string;
  }> {
    try {
      // Проверяем кэш статуса
      const cached = this.providerStatusCache.get(providerId);
      if (cached && (Date.now() - cached.lastChecked.getTime()) < 60000) { // 1 минута TTL
        LoggerUtil.debug('provider-orchestrator', 'Provider status retrieved from cache', { providerId });
        return {
          ...cached,
          message: `Provider ${providerId} is ${cached.status}`
        };
      }

      // Получаем провайдера
      const provider = this.providers.get(providerId);
      if (!provider) {
        throw new Error(`Provider not found: ${providerId}`);
      }

      // Выполняем health check
      const healthCheck = await this.performHealthCheck(provider);
      
      // Кэшируем статус
      this.providerStatusCache.set(providerId, {
        status: healthCheck.status,
        responseTime: healthCheck.responseTime,
        successRate: healthCheck.successRate,
        lastChecked: new Date()
      });

      LoggerUtil.info('provider-orchestrator', 'Provider status checked', {
        providerId,
        status: healthCheck.status,
        responseTime: healthCheck.responseTime
      });

      return {
        ...healthCheck,
        lastChecked: new Date(),
        message: `Provider ${providerId} is ${healthCheck.status}`
      };
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to get provider status', error as Error, { providerId });
      return {
        status: 'down',
        responseTime: 0,
        successRate: 0,
        lastChecked: new Date(),
        message: `Provider ${providerId} is down: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Параллельная проверка статуса всех провайдеров
   */
  async getAllProvidersStatus(): Promise<Array<{
    id: string;
    name: string;
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
    successRate: number;
    lastChecked: Date;
    message: string;
  }>> {
    try {
      const providerIds = Array.from(this.providers.keys());
      
      // Создаем задачи для проверки статуса
      const tasks = providerIds.map(providerId => 
        () => this.getProviderStatus(providerId)
      );

      // Выполняем проверки параллельно
      const results = await this.threadPool.executeParallel(tasks, {
        maxConcurrency: 5, // Максимум 5 параллельных проверок
        timeout: 30000 // 30 секунд таймаут
      });

      return results.map((result, index) => ({
        id: providerIds[index],
        name: this.providers.get(providerIds[index])?.name || 'Unknown',
        ...result
      }));
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to get all providers status', error as Error);
      return [];
    }
  }

  /**
   * Выбор оптимального провайдера
   */
  private async selectOptimalProvider(model: string, expectedTokens: number): Promise<any> {
    try {
      const availableProviders = Array.from((this.providers as any).values())
        .filter((provider: any) => 
          provider.isActive && 
          provider.models.includes(model)
        );

      if (availableProviders.length === 0) {
        return null;
      }

      // Сортируем провайдеров по приоритету и стоимости
      availableProviders.sort((a: any, b: any) => {
        // Сначала по приоритету (меньше = лучше)
        if (a.priority !== b.priority) {
          return a.priority - b.priority;
        }
        // Затем по стоимости (меньше = лучше)
        return a.costPerToken - b.costPerToken;
      });

      return availableProviders[0];
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to select optimal provider', error as Error);
      return null;
    }
  }

  /**
   * Получение альтернативных провайдеров
   */
  private async getAlternativeProviders(model: string, excludeProviderId: string): Promise<any[]> {
    try {
      return Array.from((this.providers as any).values())
        .filter((provider: any) => 
          provider.isActive && 
          provider.models.includes(model) &&
          provider.id !== excludeProviderId
        )
        .sort((a: any, b: any) => a.priority - b.priority);
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to get alternative providers', error as Error);
      return [];
    }
  }

  /**
   * Выполнение health check провайдера
   */
  private async performHealthCheck(provider: any): Promise<{
    status: 'operational' | 'degraded' | 'down';
    responseTime: number;
    successRate: number;
    lastChecked: Date;
  }> {
    const startTime = Date.now();
    
    try {
      // Выполняем простой запрос к провайдеру
      const response = await firstValueFrom(
        this.httpService.get(provider.apiUrl, {
          timeout: 5000,
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`
          }
        })
      );

      const responseTime = Date.now() - startTime;
      const successRate = response.status === 200 ? 1.0 : 0.0;

      return {
        status: responseTime < 1000 ? 'operational' : 'degraded',
        responseTime,
        successRate,
        lastChecked: new Date()
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'down',
        responseTime,
        successRate: 0.0,
        lastChecked: new Date()
      };
    }
  }

  /**
   * Вычисление стоимости запроса
   */
  private calculateCost(provider: any, expectedTokens: number): number {
    return provider.costPerToken * expectedTokens;
  }

  /**
   * Оценка времени ответа
   */
  private estimateResponseTime(provider: any): number {
    // Базовая оценка на основе типа провайдера
    const baseTime = provider.id === 'openai' ? 1000 : 
                    provider.id === 'openrouter' ? 1200 : 1500;
    
    return baseTime + (Math.random() * 500); // Добавляем случайность
  }

  /**
   * Процессор запросов маршрутизации
   */
  private startRoutingProcessor(): void {
    const processRoutingRequests = async () => {
      while (true) {
        try {
          // Получаем запрос из очереди
          const request = this.routingQueue.dequeueBlocking(1000); // Ждем 1 секунду
          if (!request) {
            continue;
          }

          // Обрабатываем запрос
          const result = await this.routeRequest(
            request.userId,
            request.model,
            request.prompt,
            request.expectedTokens,
            request.priority
          );

          request.resolve(result);
        } catch (error) {
          LoggerUtil.error('provider-orchestrator', 'Failed to process routing request', error as Error);
        }
      }
    };

    // Запускаем процессор в отдельном потоке
    setImmediate(processRoutingRequests);
  }

  /**
   * Мониторинг здоровья провайдеров
   */
  private startHealthMonitoring(): void {
    const monitorHealth = async () => {
      while (true) {
        try {
          // Проверяем статус всех провайдеров
          await this.getAllProvidersStatus();
          
          // Ждем 30 секунд перед следующей проверкой
          await new Promise(resolve => setTimeout(resolve, 30000));
        } catch (error) {
          LoggerUtil.error('provider-orchestrator', 'Health monitoring error', error as Error);
        }
      }
    };

    // Запускаем мониторинг в отдельном потоке
    setImmediate(monitorHealth);
  }

  /**
   * Создание хэша запроса
   */
  private createRequestHash(userId: string, model: string, prompt: string, expectedTokens: number): string {
    const crypto = require('crypto');
    return crypto.createHash('md5')
      .update(`${userId}:${model}:${prompt}:${expectedTokens}`)
      .digest('hex');
  }

  /**
   * Генерация уникального ID запроса
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Получение статистики сервиса
   */
  getStats(): {
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    queueSize: number;
    cacheStats: {
      providerStatusCache: number;
      routingCache: number;
      metricsCache: number;
    };
  } {
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
        providerStatusCache: (this.providerStatusCache as any).size(),
        routingCache: (this.routingCache as any).size(),
        metricsCache: (this.metricsCache as any).size()
      }
    };
  }

  /**
   * Очистка кэша
   */
  async clearCache(): Promise<void> {
    try {
      // Очищаем все кэши
      this.providerStatusCache.cleanup();
      this.routingCache.cleanup();
      this.metricsCache.cleanup();

      LoggerUtil.info('provider-orchestrator', 'Cache cleared successfully');
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Failed to clear cache', error as Error);
    }
  }
}
