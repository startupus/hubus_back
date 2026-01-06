import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { LoggerUtil } from '@ai-aggregator/shared';
import { firstValueFrom } from 'rxjs';

export interface Provider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
  costPerToken: number;
  maxTokens: number;
  responseTime: number;
  successRate: number;
  isActive: boolean;
  priority: number;
  fallbackOrder: number;
}

export interface RequestAnalysis {
  userId: string;
  model: string;
  prompt: string;
  expectedTokens: number;
  budget?: number;
  urgency: 'low' | 'medium' | 'high';
  quality: 'standard' | 'premium';
  options?: Record<string, any>;
}

export interface RouteResponse {
  success: boolean;
  response?: string;
  provider?: string;
  model?: string;
  cost?: number;
  tokens?: {
    input: number;
    output: number;
    total: number;
  };
  responseTime?: number;
  error?: string;
  fallbackUsed?: boolean;
}

export interface ProviderStatus {
  id: string;
  name: string;
  status: 'operational' | 'degraded' | 'down';
  lastChecked: Date;
  responseTime: number;
  successRate: number;
  errorRate: number;
  message: string;
}

@Injectable()
export class OrchestratorService {
  private readonly logger = new Logger(OrchestratorService.name);
  private readonly providers: Map<string, Provider> = new Map();
  private readonly providerStatuses: Map<string, ProviderStatus> = new Map();
  private healthCheckInterval: NodeJS.Timeout;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {
    console.log('OrchestratorService: Constructor called');
    // Инициализация в асинхронном режиме, чтобы не блокировать запуск
    Promise.resolve().then(async () => {
      console.log('OrchestratorService: Starting async initialization...');
      await this.initializeProviders();
      this.startHealthMonitoring();
      console.log('OrchestratorService: Async initialization completed');
    }).catch(error => {
      console.error('OrchestratorService initialization error:', error);
    });
  }

  /**
   * Основная логика маршрутизации запросов
   */
  async routeRequest(analysis: RequestAnalysis): Promise<RouteResponse> {
    try {
      LoggerUtil.info('provider-orchestrator', 'Starting request routing', {
        userId: analysis.userId,
        model: analysis.model,
        urgency: analysis.urgency,
        quality: analysis.quality
      });

      // 1. Анализ запроса и выбор оптимального провайдера
      const selectedProvider = await this.selectOptimalProvider(analysis);
      
      if (!selectedProvider) {
        throw new Error('No available providers found');
      }

      // 2. Проверка доступности провайдера
      const availability = await this.checkProviderAvailability(selectedProvider.id);
      
      if (!availability.isAvailable) {
        LoggerUtil.warn('provider-orchestrator', 'Primary provider unavailable, using fallback', {
          primaryProvider: selectedProvider.id,
          fallbackProvider: availability.fallbackProvider
        });
        
        return await this.routeToFallbackProvider(analysis, availability.fallbackProvider);
      }

      // 3. Маршрутизация к выбранному провайдеру
      return await this.routeToProvider(selectedProvider, analysis);

    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'Request routing failed', error as Error, {
        userId: analysis.userId,
        model: analysis.model
      });

      // Попытка fallback маршрутизации
      return await this.attemptFallbackRouting(analysis);
    }
  }

  /**
   * Получение статуса провайдера
   */
  async getProviderStatus(providerId: string): Promise<ProviderStatus> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const status = this.providerStatuses.get(providerId) || await this.checkProviderHealth(provider);
    return status;
  }

  /**
   * Получение списка всех провайдеров
   */
  async getProviders(): Promise<Provider[]> {
    return Array.from(this.providers.values()).map(provider => ({
      ...provider,
      apiKey: '***' // Скрываем API ключи
    }));
  }

  /**
   * Инициализация провайдеров из конфигурации
   * Теперь используем только OpenRouter
   */
  private async initializeProviders(): Promise<void> {
    console.log('OrchestratorService: initializeProviders called');
    
    // Загружаем модели из OpenRouter API
    const models = await this.loadOpenRouterModels();
    
    // OpenRouter Provider
    this.providers.set('openrouter', {
      id: 'openrouter',
      name: 'OpenRouter',
      baseUrl: 'https://openrouter.ai/api/v1',
      apiKey: this.configService.get('OPENROUTER_API_KEY', ''),
      models: models,
      costPerToken: 0.00002, // Средняя стоимость
      maxTokens: 4096,
      responseTime: 1500,
      successRate: 0.95,
      isActive: true,
      priority: 1,
      fallbackOrder: 1
    });

    LoggerUtil.info('provider-orchestrator', 'Providers initialized', {
      count: this.providers.size,
      providers: Array.from(this.providers.keys()),
      modelsCount: models.length
    });
  }

  /**
   * Загружает модели из OpenRouter API
   */
  private async loadOpenRouterModels(): Promise<string[]> {
    const apiKey = this.configService.get('OPENROUTER_API_KEY', '');
    const baseUrl = 'https://openrouter.ai/api/v1';

    if (!apiKey || apiKey.includes('your-') || apiKey.includes('sk-or-your-')) {
      LoggerUtil.warn('provider-orchestrator', 'No valid OpenRouter API key, using default models');
      return ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-3-5-sonnet'];
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get(`${baseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://ai-aggregator.com',
            'X-Title': 'AI Aggregator'
          },
          timeout: 10000
        })
      );

      const models = response.data?.data || [];
      const modelIds = models.map((model: any) => model.id).filter(Boolean);
      
      LoggerUtil.info('provider-orchestrator', 'OpenRouter models loaded', {
        count: modelIds.length
      });

      return modelIds;
    } catch (error: any) {
      LoggerUtil.error('provider-orchestrator', 'Failed to load OpenRouter models', error, {
        status: error.response?.status,
        message: error.message
      });
      
      // Возвращаем список популярных моделей по умолчанию
      return ['openai/gpt-4o', 'openai/gpt-4o-mini', 'anthropic/claude-3-5-sonnet', 'anthropic/claude-3-5-haiku'];
    }
  }

  /**
   * Алгоритм выбора оптимального провайдера
   */
  private async selectOptimalProvider(analysis: RequestAnalysis): Promise<Provider | null> {
    const availableProviders = Array.from(this.providers.values())
      .filter(provider => provider.isActive && provider.models.includes(analysis.model));

    if (availableProviders.length === 0) {
      return null;
    }

    // Сортировка по критериям
    const scoredProviders = availableProviders.map(provider => {
      let score = 0;

      // Приоритет по стоимости (если указан бюджет)
      if (analysis.budget) {
        const estimatedCost = analysis.expectedTokens * provider.costPerToken;
        if (estimatedCost <= analysis.budget) {
          score += 100 - (estimatedCost / analysis.budget) * 50;
        }
      } else {
        // Приоритет по низкой стоимости
        score += (1 - provider.costPerToken / 0.0001) * 30;
      }

      // Приоритет по скорости (для urgent запросов)
      if (analysis.urgency === 'high') {
        score += (1 - provider.responseTime / 5000) * 40;
      }

      // Приоритет по качеству (для premium запросов)
      if (analysis.quality === 'premium') {
        score += provider.successRate * 20;
      }

      // Приоритет по надежности
      score += provider.successRate * 30;

      // Базовый приоритет
      score += (4 - provider.priority) * 10;

      return { provider, score };
    });

    // Сортировка по score (больше = лучше)
    scoredProviders.sort((a, b) => b.score - a.score);

    const selected = scoredProviders[0];
    LoggerUtil.debug('provider-orchestrator', 'Provider selected', {
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

  /**
   * Проверка доступности провайдера
   */
  private async checkProviderAvailability(providerId: string): Promise<{
    isAvailable: boolean;
    fallbackProvider?: string;
  }> {
    const status = this.providerStatuses.get(providerId);
    
    if (!status || status.status === 'down') {
      // Поиск fallback провайдера
      const fallbackProvider = await this.findFallbackProvider(providerId);
      return {
        isAvailable: false,
        fallbackProvider: fallbackProvider?.id
      };
    }

    return { isAvailable: status.status === 'operational' };
  }

  /**
   * Маршрутизация к провайдеру
   */
  private async routeToProvider(provider: Provider, analysis: RequestAnalysis): Promise<RouteResponse> {
    const startTime = Date.now();
    
    try {
      LoggerUtil.debug('provider-orchestrator', 'Routing to provider', {
        provider: provider.id,
        model: analysis.model,
        userId: analysis.userId
      });

      // Подготовка запроса к провайдеру
      const requestPayload = this.prepareProviderRequest(provider, analysis);
      
      // Отправка запроса
      const response = await firstValueFrom(
        this.httpService.post(`${provider.baseUrl}/chat/completions`, requestPayload, {
          headers: {
            'Authorization': `Bearer ${provider.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://ai-aggregator.com',
            'X-Title': 'AI Aggregator'
          },
          timeout: 30000
        })
      );

      const responseTime = Date.now() - startTime;
      const tokens = this.extractTokenUsage(response.data);
      const cost = this.calculateCost(provider, tokens);

      // Обновление статистики провайдера
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

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Обновление статистики ошибок
      await this.updateProviderStats(provider.id, responseTime, false);
      
      LoggerUtil.error('provider-orchestrator', 'Provider request failed', error as Error, {
        provider: provider.id,
        userId: analysis.userId
      });

      throw error;
    }
  }

  /**
   * Fallback маршрутизация
   */
  private async routeToFallbackProvider(analysis: RequestAnalysis, fallbackProviderId?: string): Promise<RouteResponse> {
    const fallbackProvider = fallbackProviderId 
      ? this.providers.get(fallbackProviderId)
      : await this.findFallbackProvider();

    if (!fallbackProvider) {
      throw new Error('No fallback providers available');
    }

    LoggerUtil.warn('provider-orchestrator', 'Using fallback provider', {
      fallbackProvider: fallbackProvider.id,
      userId: analysis.userId
    });

    return await this.routeToProvider(fallbackProvider, analysis);
  }

  /**
   * Попытка fallback маршрутизации при ошибке
   */
  private async attemptFallbackRouting(analysis: RequestAnalysis): Promise<RouteResponse> {
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
    } catch (error) {
      return {
        success: false,
        error: 'Fallback routing also failed',
        fallbackUsed: true
      };
    }
  }

  /**
   * Поиск fallback провайдера
   */
  private async findFallbackProvider(excludeId?: string): Promise<Provider | null> {
    const availableProviders = Array.from(this.providers.values())
      .filter(provider => 
        provider.isActive && 
        provider.id !== excludeId &&
        this.providerStatuses.get(provider.id)?.status !== 'down'
      )
      .sort((a, b) => a.fallbackOrder - b.fallbackOrder);

    return availableProviders[0] || null;
  }

  /**
   * Подготовка запроса для провайдера
   */
  private prepareProviderRequest(provider: Provider, analysis: RequestAnalysis): any {
    const baseRequest = {
      model: analysis.model,
      messages: [
        { role: 'user', content: analysis.prompt }
      ],
      max_tokens: Math.min(provider.maxTokens, analysis.expectedTokens * 2),
      temperature: analysis.options?.temperature || 0.7,
      stream: false
    };

    // OpenRouter использует стандартный формат
    return baseRequest;
  }

  /**
   * Извлечение информации о токенах из ответа
   */
  private extractTokenUsage(responseData: any): { input: number; output: number; total: number } {
    const usage = responseData.usage || {};
    return {
      input: usage.prompt_tokens || 0,
      output: usage.completion_tokens || 0,
      total: usage.total_tokens || 0
    };
  }

  /**
   * Расчет стоимости запроса
   */
  private calculateCost(provider: Provider, tokens: { input: number; output: number; total: number }): number {
    return tokens.total * provider.costPerToken;
  }

  /**
   * Обновление статистики провайдера
   */
  private async updateProviderStats(providerId: string, responseTime: number, success: boolean): Promise<void> {
    const currentStatus = this.providerStatuses.get(providerId);
    const provider = this.providers.get(providerId);
    
    if (!provider) return;

    const newStatus: ProviderStatus = {
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

  /**
   * Проверка здоровья провайдера
   */
  private async checkProviderHealth(provider: Provider): Promise<ProviderStatus> {
    const startTime = Date.now();
    
    try {
      // Простая проверка доступности через ping
      const response = await firstValueFrom(
        this.httpService.get(`${provider.baseUrl}/models`, {
          headers: { 
            'Authorization': `Bearer ${provider.apiKey}`,
            'HTTP-Referer': 'https://ai-aggregator.com',
            'X-Title': 'AI Aggregator'
          },
          timeout: 5000
        })
      );

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

    } catch (error) {
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

  /**
   * Запуск мониторинга здоровья провайдеров
   */
  private startHealthMonitoring(): void {
    console.log('OrchestratorService: startHealthMonitoring called');
    this.healthCheckInterval = setInterval(async () => {
      LoggerUtil.debug('provider-orchestrator', 'Running health checks');
      
      for (const [providerId, provider] of this.providers) {
        if (provider.isActive) {
          try {
            const healthStatus = await this.checkProviderHealth(provider);
            this.providerStatuses.set(providerId, healthStatus);
          } catch (error) {
            LoggerUtil.error('provider-orchestrator', 'Health check failed', error as Error, { providerId });
          }
        }
      }
    }, 60000); // Проверка каждую минуту
  }

  /**
   * Остановка мониторинга
   */
  onModuleDestroy(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }
}
