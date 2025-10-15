import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { 
  ChatCompletionRequest, 
  ChatCompletionResponse, 
  LoggerUtil
} from '@ai-aggregator/shared';
import * as amqp from 'amqplib';
// import { AnonymizedData, RabbitMQService } from '@ai-aggregator/shared'; // Removed - using local implementations
import { AnonymizationService } from '../anonymization/anonymization.service';

@Injectable()
export class ProxyService {
  private readonly openaiApiKey: string;
  private readonly openrouterApiKey: string;
  private readonly githubApiKey: string;
  private readonly yandexApiKey: string;
  private readonly yandexFolderId: string;
  private readonly openaiBaseUrl: string;
  private readonly openrouterBaseUrl: string;
  private readonly githubBaseUrl: string;
  private readonly yandexBaseUrl: string;
  private readonly rabbitmqUrl: string;
  private connection: any = null;
  private channel: any = null;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly anonymizationService: AnonymizationService,
  ) {
    this.openaiApiKey = this.configService.get('OPENAI_API_KEY', '');
    this.openrouterApiKey = this.configService.get('OPENROUTER_API_KEY', '');
    this.githubApiKey = this.configService.get('GITHUB_API_KEY', '');
    this.yandexApiKey = this.configService.get('YANDEX_API_KEY', '');
    this.yandexFolderId = this.configService.get('YANDEX_FOLDER_ID', '');
    this.openaiBaseUrl = this.configService.get('OPENAI_BASE_URL', 'https://api.openai.com/v1');
    this.openrouterBaseUrl = this.configService.get('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
    this.githubBaseUrl = this.configService.get('GITHUB_BASE_URL', 'https://api.github.com');
    this.yandexBaseUrl = this.configService.get('YANDEX_BASE_URL', 'https://llm.api.cloud.yandex.net/foundationModels/v1');
    this.rabbitmqUrl = this.configService.get('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672');
  }

  /**
   * Обрабатывает запрос к ИИ-провайдеру с обезличиванием
   */
  async processChatCompletion(
    request: any,
    userId: string,
    provider: 'openai' | 'openrouter' | 'github' | 'yandex' = 'openai'
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      LoggerUtil.info('proxy-service', 'Processing chat completion request', {
        userId,
        provider,
        model: request.model,
        messageCount: request.messages.length
      });

      // Шаг 1: Обезличиваем данные
      const anonymizedData = this.anonymizationService.anonymizeChatMessages(request.messages);
      const anonymizedRequest: ChatCompletionRequest = {
        ...request,
        messages: anonymizedData.data
      };

      LoggerUtil.debug('proxy-service', 'Data anonymized', {
        originalMessageCount: request.messages.length,
        anonymizedMessageCount: anonymizedRequest.messages.length,
        mappingKeys: Object.keys(anonymizedData.mapping).length
      });

      // Шаг 2: Отправляем запрос к провайдеру с fallback логикой
      let response;
      try {
        // Применяем маппинг модели для провайдера
        const mappedRequest = {
          ...anonymizedRequest,
          model: this.mapModelForProvider(anonymizedRequest.model, provider)
        };
        response = await this.sendToProvider(mappedRequest, provider);
      } catch (error: any) {
        // Если OpenAI недоступен (квота, регион), пробуем OpenRouter или Yandex
        if (provider === 'openai' && this.openrouterApiKey && 
            !this.openrouterApiKey.includes('your-') && 
            !this.openrouterApiKey.includes('sk-or-your-')) {
          
          LoggerUtil.warn('proxy-service', 'OpenAI failed, falling back to OpenRouter', {
            originalError: error.message,
            userId,
            model: request.model
          });
          
          // Переключаем модель для OpenRouter с правильным маппингом
          const openrouterRequest = {
            ...anonymizedRequest,
            model: this.mapModelForProvider(anonymizedRequest.model, 'openrouter')
          };
          
          response = await this.sendToProvider(openrouterRequest, 'openrouter');
        } else {
          throw error;
        }
      }

      // Шаг 3: Деобезличиваем ответ
      const deanonymizedResponse = this.deanonymizeResponse(response, anonymizedData.mapping);

      const processingTime = Date.now() - startTime;

      LoggerUtil.info('proxy-service', 'Chat completion processed successfully', {
        userId,
        provider,
        model: request.model,
        processingTimeMs: processingTime,
        inputTokens: deanonymizedResponse.usage.prompt_tokens,
        outputTokens: deanonymizedResponse.usage.completion_tokens
      });

      // Отправляем событие биллинга
      try {
        await this.sendBillingEvent({
          userId,
          service: 'ai-chat',
          resource: 'tokens',
          tokens: deanonymizedResponse.usage.total_tokens,
          inputTokens: deanonymizedResponse.usage.prompt_tokens,
          outputTokens: deanonymizedResponse.usage.completion_tokens,
          cost: this.calculateCost(deanonymizedResponse.usage, request.model),
          provider: provider === 'openrouter' ? 'openrouter' : provider,
          model: request.model,
          timestamp: new Date().toISOString()
        });
      } catch (billingError) {
        LoggerUtil.warn('proxy-service', 'Failed to send billing event', {
          error: (billingError as Error).message,
          userId,
          model: request.model
        });
      }

      return {
        ...deanonymizedResponse,
        provider,
        processing_time_ms: processingTime
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      LoggerUtil.error('proxy-service', 'Chat completion failed', error as Error, {
        userId,
        provider,
        model: request.model,
        processingTimeMs: processingTime
      });

      throw new HttpException(
        `Failed to process chat completion: ${error instanceof Error ? error.message : 'Unknown error'}`,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Отправляет запрос к конкретному провайдеру
   */
  private async sendToProvider(
    request: ChatCompletionRequest, 
    provider: 'openai' | 'openrouter' | 'github' | 'yandex'
  ): Promise<ChatCompletionResponse> {
    // Проверяем API ключи
    LoggerUtil.debug('proxy-service', 'Checking API keys', {
      openaiKey: this.openaiApiKey ? 'set' : 'not set',
      openrouterKey: this.openrouterApiKey ? 'set' : 'not set',
      githubKey: this.githubApiKey ? 'set' : 'not set',
      yandexKey: this.yandexApiKey ? 'set' : 'not set',
      yandexFolderId: this.yandexFolderId ? 'set' : 'not set',
      openaiKeyValue: this.openaiApiKey,
      openrouterKeyValue: this.openrouterApiKey,
      githubKeyValue: this.githubApiKey,
      yandexKeyValue: this.yandexApiKey
    });

    // Если нет API ключей, используем mock-режим
    let apiKey: string;
    let baseUrl: string;
    
    if (provider === 'openai') {
      apiKey = this.openaiApiKey;
      baseUrl = this.openaiBaseUrl;
    } else if (provider === 'openrouter') {
      apiKey = this.openrouterApiKey;
      baseUrl = this.openrouterBaseUrl;
    } else if (provider === 'github') {
      apiKey = this.githubApiKey;
      baseUrl = this.githubBaseUrl;
    } else if (provider === 'yandex') {
      apiKey = this.yandexApiKey;
      baseUrl = this.yandexBaseUrl;
    }

    if (!apiKey || apiKey.includes('your-') || apiKey.includes('sk-your-') || apiKey.includes('sk-or-your-') || apiKey.includes('github_pat_')) {
      LoggerUtil.info('proxy-service', 'Using mock mode - no valid API key provided');
      return this.createMockResponse(request, provider);
    }

    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Aggregator/1.0.0'
    };

    // Добавляем специфичные заголовки для разных провайдеров
    if (provider === 'openai' || provider === 'openrouter') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (provider === 'github') {
      headers['Authorization'] = `Bearer ${apiKey}`;
    } else if (provider === 'yandex') {
      headers['Authorization'] = `Api-Key ${apiKey}`;
    }

    if (provider === 'openrouter') {
      headers['HTTP-Referer'] = 'https://ai-aggregator.com';
      headers['X-Title'] = 'AI Aggregator';
    }

    try {
      let url: string;
      let requestBody: any;

      if (provider === 'yandex') {
        // YandexGPT использует другой формат
        url = `${baseUrl}/completion`;
        requestBody = {
          modelUri: `gpt://${this.yandexFolderId}/${request.model}`,
          completionOptions: {
            stream: false,
            temperature: request.temperature || 0.6,
            maxTokens: request.max_tokens || 2000
          },
          messages: request.messages.map(msg => ({
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            text: msg.content
          }))
        };
      } else if (provider === 'github') {
        // GitHub Models использует другой формат
        url = `${baseUrl}/chat/completions`;
        requestBody = {
          ...request,
          model: this.mapModelForProvider(request.model, 'github')
        };
      } else {
        // OpenAI и OpenRouter используют стандартный формат
        url = `${baseUrl}/chat/completions`;
        requestBody = request;
      }

      LoggerUtil.debug('proxy-service', `Sending request to ${provider}`, {
        url: url,
        headers: headers,
        request: requestBody
      });

      const response: AxiosResponse<ChatCompletionResponse> = await firstValueFrom(
        this.httpService.post(url, requestBody, { headers })
      );

      LoggerUtil.debug('proxy-service', `Received response from ${provider}`, {
        status: response.status,
        data: response.data
      });

      // Преобразуем ответ YandexGPT в стандартный формат
      if (provider === 'yandex') {
        const yandexResponse = response.data as any;
        return {
          id: yandexResponse.id || `yandex-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: request.model,
          choices: [{
            index: 0,
            message: {
              role: 'assistant',
              content: yandexResponse.result?.alternatives?.[0]?.message?.text || 'No response'
            },
            finish_reason: 'stop'
          }],
          usage: {
            prompt_tokens: yandexResponse.usage?.inputTextTokens || 0,
            completion_tokens: yandexResponse.usage?.completionTokens || 0,
            total_tokens: yandexResponse.usage?.totalTokens || 0
          },
          provider: 'yandex',
          processing_time_ms: 100
        };
      }

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('proxy-service', `Provider ${provider} request failed`, error, {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message
      });

      throw new HttpException(
        `Provider ${provider} request failed: ${error.response?.data?.error?.message || error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Деобезличивает ответ от провайдера
   */
  private deanonymizeResponse(
    response: ChatCompletionResponse, 
    mapping: Record<string, string>
  ): ChatCompletionResponse {
    const deanonymizedChoices = response.choices.map(choice => ({
      ...choice,
      message: {
        ...choice.message,
        content: this.anonymizationService.deanonymizeText(choice.message.content, mapping)
      }
    }));

    return {
      ...response,
      choices: deanonymizedChoices
    };
  }

  /**
   * Отправляет событие биллинга через RabbitMQ
   */
  async sendBillingEvent(billingData: any): Promise<void> {
    try {
      await this.ensureRabbitMQConnection();
      
      const message = {
        eventType: 'ai_usage',
        userId: billingData.userId,
        service: billingData.service,
        resource: billingData.resource,
        tokens: billingData.tokens,
        inputTokens: billingData.inputTokens,
        outputTokens: billingData.outputTokens,
        cost: billingData.cost,
        provider: billingData.provider,
        model: billingData.model,
        timestamp: billingData.timestamp,
        metadata: {
          service: 'proxy-service',
          currency: 'USD'
        }
      };

      await this.channel.assertQueue('billing.usage', { durable: true });
      await this.channel.sendToQueue('billing.usage', Buffer.from(JSON.stringify(message)), {
        persistent: true
      });
      
      LoggerUtil.debug('proxy-service', 'Billing event sent successfully', {
        userId: billingData.userId,
        tokens: billingData.tokens,
        inputTokens: billingData.inputTokens,
        outputTokens: billingData.outputTokens,
        cost: billingData.cost
      });
    } catch (error) {
      LoggerUtil.error('proxy-service', 'Failed to send billing event', error as Error);
      // Не бросаем ошибку, чтобы не прерывать основной процесс
    }
  }

  /**
   * Устанавливает соединение с RabbitMQ
   */
  private async ensureRabbitMQConnection(): Promise<void> {
    if (!this.connection) {
      try {
        this.connection = await amqp.connect(this.rabbitmqUrl);
        this.channel = await this.connection.createChannel();
        
        LoggerUtil.debug('proxy-service', 'RabbitMQ connection established');
      } catch (error) {
        LoggerUtil.error('proxy-service', 'Failed to connect to RabbitMQ', error as Error);
        throw error;
      }
    }
  }

  /**
   * Получает список доступных моделей
   */
  async getAvailableModels(provider?: 'openai' | 'openrouter' | 'github' | 'yandex'): Promise<any[]> {
    const models = [];

    if (!provider || provider === 'openai') {
      models.push(...this.getOpenAIModels());
    }

    if (!provider || provider === 'openrouter') {
      models.push(...this.getOpenRouterModels());
    }

    if (!provider || provider === 'github') {
      models.push(...this.getGitHubModels());
    }

    if (!provider || provider === 'yandex') {
      models.push(...this.getYandexModels());
    }

    return models;
  }

  /**
   * Получает модели OpenAI
   */
  private getOpenAIModels(): any[] {
    return [
      {
        id: 'gpt-4',
        name: 'GPT-4',
        provider: 'openai',
        category: 'chat',
        description: 'Most capable GPT-4 model',
        max_tokens: 8192,
        cost_per_input_token: 0.00003,
        cost_per_output_token: 0.00006,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion'],
        created_at: '2023-03-14T00:00:00Z',
        updated_at: '2023-03-14T00:00:00Z',
      },
      {
        id: 'gpt-3.5-turbo',
        name: 'GPT-3.5 Turbo',
        provider: 'openai',
        category: 'chat',
        description: 'Fast and efficient GPT-3.5 model',
        max_tokens: 4096,
        cost_per_input_token: 0.0000015,
        cost_per_output_token: 0.000002,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion'],
        created_at: '2022-11-30T00:00:00Z',
        updated_at: '2022-11-30T00:00:00Z',
      },
      {
        id: 'gpt-4-turbo-preview',
        name: 'GPT-4 Turbo Preview',
        provider: 'openai',
        category: 'chat',
        description: 'Latest GPT-4 Turbo model with improved capabilities',
        max_tokens: 128000,
        cost_per_input_token: 0.00001,
        cost_per_output_token: 0.00003,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion'],
        created_at: '2023-11-06T00:00:00Z',
        updated_at: '2023-11-06T00:00:00Z',
      }
    ];
  }

  /**
   * Получает модели OpenRouter
   */
  private getOpenRouterModels(): any[] {
    return [
      {
        id: 'openai/gpt-4o',
        name: 'GPT-4o',
        provider: 'openrouter',
        category: 'chat',
        description: 'Latest GPT-4o model via OpenRouter',
        max_tokens: 128000,
        cost_per_input_token: 0.0000025,
        cost_per_output_token: 0.00001,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion', 'vision'],
        created_at: '2024-05-13T00:00:00Z',
        updated_at: '2024-05-13T00:00:00Z',
      },
      {
        id: 'openai/gpt-4o-mini',
        name: 'GPT-4o Mini',
        provider: 'openrouter',
        category: 'chat',
        description: 'Fast and efficient GPT-4o Mini model',
        max_tokens: 128000,
        cost_per_input_token: 0.00000015,
        cost_per_output_token: 0.0000006,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion', 'vision'],
        created_at: '2024-07-18T00:00:00Z',
        updated_at: '2024-07-18T00:00:00Z',
      },
      {
        id: 'anthropic/claude-3-5-sonnet-20241022',
        name: 'Claude 3.5 Sonnet',
        provider: 'openrouter',
        category: 'chat',
        description: 'Latest Claude 3.5 Sonnet model',
        max_tokens: 200000,
        cost_per_input_token: 0.000003,
        cost_per_output_token: 0.000015,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion', 'vision'],
        created_at: '2024-10-22T00:00:00Z',
        updated_at: '2024-10-22T00:00:00Z',
      },
      {
        id: 'anthropic/claude-3-5-haiku-20241022',
        name: 'Claude 3.5 Haiku',
        provider: 'openrouter',
        category: 'chat',
        description: 'Fast Claude 3.5 Haiku model',
        max_tokens: 200000,
        cost_per_input_token: 0.0000008,
        cost_per_output_token: 0.000004,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion', 'vision'],
        created_at: '2024-10-22T00:00:00Z',
        updated_at: '2024-10-22T00:00:00Z',
      },
      {
        id: 'google/gemini-pro-1.5',
        name: 'Gemini Pro 1.5',
        provider: 'openrouter',
        category: 'chat',
        description: 'Google Gemini Pro 1.5 model',
        max_tokens: 2000000,
        cost_per_input_token: 0.00000125,
        cost_per_output_token: 0.000005,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion', 'vision'],
        created_at: '2024-02-15T00:00:00Z',
        updated_at: '2024-02-15T00:00:00Z',
      },
      {
        id: 'meta-llama/llama-3.1-8b-instruct',
        name: 'Llama 3.1 8B Instruct',
        provider: 'openrouter',
        category: 'chat',
        description: 'Meta Llama 3.1 8B Instruct model',
        max_tokens: 128000,
        cost_per_input_token: 0.0000002,
        cost_per_output_token: 0.0000002,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion'],
        created_at: '2024-01-29T00:00:00Z',
        updated_at: '2024-01-29T00:00:00Z',
      },
      {
        id: 'deepseek/deepseek-r1-0528',
        name: 'DeepSeek R1 0528',
        provider: 'openrouter',
        category: 'chat',
        description: 'DeepSeek R1 0528 model - free and powerful reasoning model',
        max_tokens: 128000,
        cost_per_input_token: 0,
        cost_per_output_token: 0,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion', 'reasoning'],
        created_at: '2024-05-28T00:00:00Z',
        updated_at: '2024-05-28T00:00:00Z',
      }
    ];
  }

  /**
   * Получает модели GitHub
   */
  private getGitHubModels(): any[] {
    return [
      {
        id: 'github/github-copilot-chat',
        name: 'GitHub Copilot Chat',
        provider: 'github',
        category: 'chat',
        description: 'GitHub Copilot Chat model for code assistance',
        max_tokens: 4096,
        cost_per_input_token: 0.0001,
        cost_per_output_token: 0.0001,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion', 'code'],
        created_at: '2023-10-01T00:00:00Z',
        updated_at: '2023-10-01T00:00:00Z',
      },
      {
        id: 'github/github-copilot-codex',
        name: 'GitHub Copilot Codex',
        provider: 'github',
        category: 'completion',
        description: 'GitHub Copilot Codex model for code completion',
        max_tokens: 2048,
        cost_per_input_token: 0.00005,
        cost_per_output_token: 0.00005,
        currency: 'USD',
        is_available: true,
        capabilities: ['completion', 'code'],
        created_at: '2023-10-01T00:00:00Z',
        updated_at: '2023-10-01T00:00:00Z',
      }
    ];
  }

  /**
   * Получает модели YandexGPT
   */
  private getYandexModels(): any[] {
    return [
      {
        id: 'yandexgpt',
        name: 'YandexGPT',
        provider: 'yandex',
        category: 'chat',
        description: 'Основная модель YandexGPT для диалогов',
        max_tokens: 8000,
        cost_per_input_token: 0.0001,
        cost_per_output_token: 0.0001,
        currency: 'RUB',
        is_available: true,
        capabilities: ['chat', 'completion'],
        created_at: '2023-05-01T00:00:00Z',
        updated_at: '2023-05-01T00:00:00Z',
      },
      {
        id: 'yandexgpt-lite',
        name: 'YandexGPT Lite',
        provider: 'yandex',
        category: 'chat',
        description: 'Быстрая и легкая модель YandexGPT',
        max_tokens: 4000,
        cost_per_input_token: 0.00005,
        cost_per_output_token: 0.00005,
        currency: 'RUB',
        is_available: true,
        capabilities: ['chat', 'completion'],
        created_at: '2023-05-01T00:00:00Z',
        updated_at: '2023-05-01T00:00:00Z',
      }
    ];
  }

  /**
   * Валидирует запрос перед обработкой
   */
  async validateRequest(request: ChatCompletionRequest): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    estimatedTokens: number;
    estimatedCost: number;
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Проверяем обязательные поля
    if (!request.model) {
      errors.push('Model is required');
    }

    if (!request.messages || request.messages.length === 0) {
      errors.push('Messages array is required and cannot be empty');
    }

    // Проверяем сообщения
    if (request.messages) {
      request.messages.forEach((message, index) => {
        if (!message.role) {
          errors.push(`Message ${index + 1}: role is required`);
        }
        if (!message.content) {
          errors.push(`Message ${index + 1}: content is required`);
        }
      });
    }

    // Проверяем параметры
    if (request.temperature !== undefined && (request.temperature < 0 || request.temperature > 2)) {
      errors.push('Temperature must be between 0 and 2');
    }

    if (request.top_p !== undefined && (request.top_p < 0 || request.top_p > 1)) {
      errors.push('Top_p must be between 0 and 1');
    }

    // Оцениваем количество токенов
    const estimatedTokens = this.estimateTokens(request);
    
    // Оцениваем стоимость (базовая оценка)
    const estimatedCost = estimatedTokens * 0.00003; // Примерная стоимость

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      estimatedTokens,
      estimatedCost
    };
  }

  /**
   * Оценивает количество токенов в запросе
   */
  private estimateTokens(request: ChatCompletionRequest): number {
    let totalTokens = 0;

    const messages = request.messages || [];
    messages.forEach(message => {
      // Примерная оценка: 1 токен = 4 символа
      const content = message.content || '';
      totalTokens += Math.ceil(content.length / 4);
    });

    // Добавляем токены для системных сообщений
    totalTokens += 10;

    return totalTokens;
  }

  /**
   * Создает mock-ответ для демонстрации обезличивания
   */
  private createMockResponse(
    request: ChatCompletionRequest, 
    provider: 'openai' | 'openrouter' | 'github' | 'yandex'
  ): ChatCompletionResponse {
    // Показываем, что данные были обезличены
    const messages = request.messages || [];
    LoggerUtil.debug('proxy-service', 'Creating mock response', { 
      messageCount: messages.length,
      firstMessage: messages[0],
      request: JSON.stringify(request, null, 2)
    });
    
    const originalContent = messages.length > 0 ? (messages[0].content || 'No message content') : 'No message content';
    
    // Демонстрируем обезличивание
    const anonymizedContent = this.anonymizationService.anonymizeText(originalContent);
    
    return {
      id: `mock-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: request.model || 'gpt-3.5-turbo',
      choices: [{
        index: 0,
        message: {
          role: 'assistant' as any,
          content: `Mock response from ${provider}. 

ORIGINAL MESSAGE: "${originalContent}"
ANONYMIZED MESSAGE: "${anonymizedContent}"

The anonymization system replaced personal information with placeholders before sending to the AI provider. This ensures privacy and data protection.`
        },
        finish_reason: 'stop'
      }],
      usage: {
        prompt_tokens: this.estimateTokens(request),
        completion_tokens: 50,
        total_tokens: this.estimateTokens(request) + 50
      },
      provider,
      processing_time_ms: 100
    };
  }

  /**
   * Маппинг моделей для разных провайдеров
   */
  private mapModelForProvider(model: string, provider: 'openai' | 'openrouter' | 'github' | 'yandex'): string {
    // Маппинг моделей для OpenRouter
    if (provider === 'openrouter') {
      const modelMapping: Record<string, string> = {
        // OpenAI модели
        'gpt-4o': 'openai/gpt-4o',
        'gpt-4o-mini': 'openai/gpt-4o-mini',
        'gpt-4-turbo': 'openai/gpt-4-turbo',
        'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
        
        // Claude модели
        'claude-3-5-sonnet-20241022': 'anthropic/claude-3.5-sonnet-20241022',
        'claude-3-5-haiku-20241022': 'anthropic/claude-3.5-haiku-20241022',
        'claude-3-opus-20240229': 'anthropic/claude-3-opus-20240229',
        
        // Gemini модели
        'gemini-1.5-pro': 'google/gemini-1.5-pro',
        'gemini-1.5-flash': 'google/gemini-1.5-flash',
        
        // Yandex модели
        'yandexgpt': 'yandex/yandexgpt',
        'gigachat': 'sber/gigachat'
      };
      
      return modelMapping[model] || model; // Для OpenRouter возвращаем модель как есть
    }
    
    // Маппинг моделей для GitHub
    if (provider === 'github') {
      const modelMapping: Record<string, string> = {
        'github-copilot-chat': 'github/github-copilot-chat',
        'github-copilot-codex': 'github/github-copilot-codex',
        'copilot-chat': 'github/github-copilot-chat',
        'copilot-codex': 'github/github-copilot-codex'
      };
      
      return modelMapping[model] || `github/${model}`;
    }
    
    // Для других провайдеров возвращаем модель как есть
    return model;
  }

  /**
   * Рассчитывает стоимость запроса
   */
  private calculateCost(usage: any, model: string): number {
    // Примерные цены за токен (в долларах)
    const pricing: Record<string, { input: number; output: number }> = {
      'gpt-4o': { input: 0.005, output: 0.015 },
      'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
      'gpt-4-turbo': { input: 0.01, output: 0.03 },
      'gpt-3.5-turbo': { input: 0.0005, output: 0.0015 },
      'claude-3-5-sonnet-20241022': { input: 0.003, output: 0.015 },
      'claude-3-5-haiku-20241022': { input: 0.00025, output: 0.00125 },
      'claude-3-opus-20240229': { input: 0.015, output: 0.075 },
      'gemini-1.5-pro': { input: 0.00125, output: 0.005 },
      'gemini-1.5-flash': { input: 0.000075, output: 0.0003 }
    };

    const modelPricing = pricing[model] || { input: 0.001, output: 0.002 };
    const inputCost = (usage.prompt_tokens || 0) * modelPricing.input;
    const outputCost = (usage.completion_tokens || 0) * modelPricing.output;
    
    return inputCost + outputCost;
  }
}
