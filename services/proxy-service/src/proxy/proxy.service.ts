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
// import { AnonymizedData, RabbitMQService } from '@ai-aggregator/shared'; // Removed - using local implementations
import { AnonymizationService } from '../anonymization/anonymization.service';

@Injectable()
export class ProxyService {
  private readonly openaiApiKey: string;
  private readonly openrouterApiKey: string;
  private readonly yandexApiKey: string;
  private readonly yandexFolderId: string;
  private readonly openaiBaseUrl: string;
  private readonly openrouterBaseUrl: string;
  private readonly yandexBaseUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly anonymizationService: AnonymizationService,
  ) {
    this.openaiApiKey = this.configService.get('OPENAI_API_KEY', '');
    this.openrouterApiKey = this.configService.get('OPENROUTER_API_KEY', '');
    this.yandexApiKey = this.configService.get('YANDEX_API_KEY', '');
    this.yandexFolderId = this.configService.get('YANDEX_FOLDER_ID', '');
    this.openaiBaseUrl = this.configService.get('OPENAI_BASE_URL', 'https://api.openai.com/v1');
    this.openrouterBaseUrl = this.configService.get('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
    this.yandexBaseUrl = this.configService.get('YANDEX_BASE_URL', 'https://llm.api.cloud.yandex.net/foundationModels/v1');
  }

  /**
   * Обрабатывает запрос к ИИ-провайдеру с обезличиванием
   */
  async processChatCompletion(
    request: any,
    userId: string,
    provider: 'openai' | 'openrouter' | 'yandex' = 'openai'
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
        response = await this.sendToProvider(anonymizedRequest, provider);
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
          
          // Переключаем модель для OpenRouter
          const openrouterRequest = {
            ...anonymizedRequest,
            model: `openai/${anonymizedRequest.model}`
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
    provider: 'openai' | 'openrouter' | 'yandex'
  ): Promise<ChatCompletionResponse> {
    // Проверяем API ключи
    LoggerUtil.debug('proxy-service', 'Checking API keys', {
      openaiKey: this.openaiApiKey ? 'set' : 'not set',
      openrouterKey: this.openrouterApiKey ? 'set' : 'not set',
      yandexKey: this.yandexApiKey ? 'set' : 'not set',
      yandexFolderId: this.yandexFolderId ? 'set' : 'not set',
      openaiKeyValue: this.openaiApiKey,
      openrouterKeyValue: this.openrouterApiKey,
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
    } else if (provider === 'yandex') {
      apiKey = this.yandexApiKey;
      baseUrl = this.yandexBaseUrl;
    }

    if (!apiKey || apiKey.includes('your-') || apiKey.includes('sk-your-') || apiKey.includes('sk-or-your-')) {
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
      // TODO: Re-enable RabbitMQ integration
      // await this.rabbitmq.publishCriticalMessage('billing.usage', {
      //   eventType: 'ai_usage',
      //   userId: billingData.userId,
      //   service: billingData.service,
      //   resource: billingData.resource,
      //   tokens: billingData.tokens,
      //   cost: billingData.cost,
      //   provider: billingData.provider,
      //   model: billingData.model,
      //   timestamp: billingData.timestamp,
      //   metadata: {
      //     service: 'proxy-service',
      //     currency: 'USD'
      //   }
      // });
      
      LoggerUtil.debug('proxy-service', 'Billing event sent successfully', {
        userId: billingData.userId,
        tokens: billingData.tokens,
        cost: billingData.cost
      });
    } catch (error) {
      LoggerUtil.error('proxy-service', 'Failed to send billing event', error as Error);
      throw error;
    }
  }

  /**
   * Получает список доступных моделей
   */
  async getAvailableModels(provider?: 'openai' | 'openrouter' | 'yandex'): Promise<any[]> {
    const models = [];

    if (!provider || provider === 'openai') {
      models.push(...this.getOpenAIModels());
    }

    if (!provider || provider === 'openrouter') {
      models.push(...this.getOpenRouterModels());
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
        id: 'claude-3-haiku-20240307',
        name: 'Claude 3 Haiku',
        provider: 'openrouter',
        category: 'chat',
        description: 'Fast and efficient Claude 3 Haiku model',
        max_tokens: 200000,
        cost_per_input_token: 0.00025,
        cost_per_output_token: 0.00125,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion'],
        created_at: '2024-03-07T00:00:00Z',
        updated_at: '2024-03-07T00:00:00Z',
      },
      {
        id: 'claude-3-sonnet-20240229',
        name: 'Claude 3 Sonnet',
        provider: 'openrouter',
        category: 'chat',
        description: 'Balanced Claude 3 Sonnet model',
        max_tokens: 200000,
        cost_per_input_token: 0.003,
        cost_per_output_token: 0.015,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion'],
        created_at: '2024-02-29T00:00:00Z',
        updated_at: '2024-02-29T00:00:00Z',
      },
      {
        id: 'claude-3-opus-20240307',
        name: 'Claude 3 Opus',
        provider: 'openrouter',
        category: 'chat',
        description: 'Most capable Claude 3 Opus model',
        max_tokens: 200000,
        cost_per_input_token: 0.015,
        cost_per_output_token: 0.075,
        currency: 'USD',
        is_available: true,
        capabilities: ['chat', 'completion'],
        created_at: '2024-03-07T00:00:00Z',
        updated_at: '2024-03-07T00:00:00Z',
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
    provider: 'openai' | 'openrouter' | 'yandex'
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
}
