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
  private readonly openrouterApiKey: string;
  private readonly openrouterBaseUrl: string;
  private readonly rabbitmqUrl: string;
  private connection: any = null;
  private channel: any = null;
  
  // Кэш для моделей OpenRouter (обновляется каждые 5 минут)
  private openRouterModelsCache: any[] = [];
  private modelsCacheTimestamp: number = 0;
  private readonly MODELS_CACHE_TTL = 5 * 60 * 1000; // 5 минут

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly anonymizationService: AnonymizationService,
  ) {
    this.openrouterApiKey = this.configService.get('OPENROUTER_API_KEY', '');
    this.openrouterBaseUrl = this.configService.get('OPENROUTER_BASE_URL', 'https://openrouter.ai/api/v1');
    this.rabbitmqUrl = this.configService.get('RABBITMQ_URL', 'amqp://guest:guest@rabbitmq:5672');
    
    // Загружаем модели при старте
    this.loadOpenRouterModels().catch(error => {
      LoggerUtil.warn('proxy-service', 'Failed to load OpenRouter models on startup', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
    });
  }

  /**
   * Обрабатывает запрос к ИИ-провайдеру с обезличиванием
   */
  async processChatCompletion(
    request: any,
    userId: string,
    provider: 'openrouter' = 'openrouter'
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

      // Шаг 2: Отправляем запрос к провайдеру
      // Применяем маппинг модели для провайдера
      const mappedModel = await this.mapModelForProvider(anonymizedRequest.model, provider);
      const modelInfo = this.openRouterModelsCache.find(m => m.id === mappedModel);
      
      // Получаем context_length модели (общий лимит: входные + выходные токены)
      // Используем context_length если есть, иначе max_tokens (который тоже = context_length)
      const contextLength = modelInfo?.context_length || modelInfo?.max_tokens || 32768;
      
      // Оцениваем количество токенов во входных сообщениях
      const estimatedInputTokens = this.estimateTokens(anonymizedRequest);
      
      // Вычисляем максимальное количество выходных токенов с запасом
      // Запас 200 токенов для системных сообщений и форматирования
      const maxOutputTokens = Math.max(1, contextLength - estimatedInputTokens - 200);
      
      // Определяем max_tokens для запроса
      let maxTokens: number;
      if (anonymizedRequest.max_tokens) {
        // Если max_tokens указан в запросе, используем его, но не превышаем доступный лимит
        maxTokens = Math.min(anonymizedRequest.max_tokens, maxOutputTokens);
        
        if (anonymizedRequest.max_tokens > maxOutputTokens) {
          LoggerUtil.warn('proxy-service', 'Requested max_tokens exceeds available context, reducing', {
            requested: anonymizedRequest.max_tokens,
            available: maxOutputTokens,
            contextLength,
            estimatedInputTokens
          });
        }
      } else {
        // Если max_tokens не указан, используем доступный лимит
        maxTokens = maxOutputTokens;
      }
      
      const mappedRequest = {
        ...anonymizedRequest,
        model: mappedModel,
        max_tokens: maxTokens
      };
      
      LoggerUtil.debug('proxy-service', 'Request prepared with model mapping', {
        originalModel: anonymizedRequest.model,
        mappedModel: mappedModel,
        maxTokens: mappedRequest.max_tokens,
        contextLength: contextLength,
        estimatedInputTokens: estimatedInputTokens,
        maxOutputTokens: maxOutputTokens,
        requestedMaxTokens: anonymizedRequest.max_tokens
      });
      
      const response = await this.sendToProvider(mappedRequest, provider);

      // Шаг 3: Деобезличиваем ответ
      const deanonymizedResponse = this.deanonymizeResponse(response, anonymizedData.mapping);

      // Проверяем, был ли ответ обрезан из-за ограничения длины
      const isTruncated = deanonymizedResponse.choices?.some(
        (choice: any) => choice.finish_reason === 'length'
      );
      
      if (isTruncated) {
        LoggerUtil.warn('proxy-service', 'Response was truncated due to max_tokens limit', {
          userId,
          provider,
          model: request.model,
          maxTokens: mappedRequest.max_tokens,
          outputTokens: deanonymizedResponse.usage.completion_tokens,
          contextLength: contextLength,
          estimatedInputTokens: estimatedInputTokens
        });
        
        // Если ответ был обрезан, но max_tokens уже был установлен на максимум доступных выходных токенов,
        // это означает, что модель достигла своего лимита - не добавляем предупреждение
        // так как это естественное ограничение модели
        if (mappedRequest.max_tokens < maxOutputTokens) {
          LoggerUtil.info('proxy-service', 'Response truncated, but max_tokens was below available maximum', {
            currentMaxTokens: mappedRequest.max_tokens,
            maxOutputTokens: maxOutputTokens,
            contextLength: contextLength
          });
        }
      }

      const processingTime = Date.now() - startTime;

      LoggerUtil.info('proxy-service', 'Chat completion processed successfully', {
        userId,
        provider,
        model: request.model,
        processingTimeMs: processingTime,
        inputTokens: deanonymizedResponse.usage.prompt_tokens,
        outputTokens: deanonymizedResponse.usage.completion_tokens,
        isTruncated: isTruncated || false,
        finishReason: deanonymizedResponse.choices?.[0]?.finish_reason
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
          provider: 'openrouter',
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
   * Отправляет запрос к OpenRouter провайдеру
   */
  private async sendToProvider(
    request: ChatCompletionRequest, 
    provider: 'openrouter'
  ): Promise<ChatCompletionResponse> {
    const apiKey = this.openrouterApiKey;
    const baseUrl = this.openrouterBaseUrl;

    if (!apiKey || apiKey.includes('your-') || apiKey.includes('sk-or-your-')) {
      LoggerUtil.info('proxy-service', 'Using mock mode - no valid API key provided');
      return this.createMockResponse(request, provider);
    }

    const headers: any = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      'HTTP-Referer': 'https://ai-aggregator.com',
      'X-Title': 'AI Aggregator',
      'User-Agent': 'AI-Aggregator/1.0.0'
    };

    try {
      const url = `${baseUrl}/chat/completions`;
      
      // Валидируем модель перед отправкой
      const modelExists = this.openRouterModelsCache.some(m => m.id === request.model);
      if (!modelExists && this.openRouterModelsCache.length > 0) {
        LoggerUtil.warn('proxy-service', 'Model not found in cache, attempting request anyway', {
          model: request.model,
          availableModelsCount: this.openRouterModelsCache.length,
          suggestion: 'Model may still work, or cache needs refresh'
        });
      }
      
      const requestBody = request;

      LoggerUtil.debug('proxy-service', `Sending request to ${provider}`, {
        url: url,
        model: request.model,
        messageCount: request.messages?.length || 0,
        maxTokens: request.max_tokens,
        modelExists: modelExists
      });

      const response: AxiosResponse<ChatCompletionResponse> = await firstValueFrom(
        this.httpService.post(url, requestBody, { 
          headers,
          timeout: 600000 // 10 минут для длинных генераций
        })
      );

      LoggerUtil.debug('proxy-service', `Received response from ${provider}`, {
        status: response.status,
        model: response.data.model
      });

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
    const deanonymizedChoices = response.choices.map(choice => {
      // Обезличивание применяется только к текстовому контенту
      // Если content - массив (мультимодальный), не обезличиваем
      let content = choice.message.content;
      if (typeof content === 'string') {
        content = this.anonymizationService.deanonymizeText(content, mapping);
      }
      
      return {
        ...choice,
        message: {
          ...choice.message,
          content
        }
      };
    });

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
   * Получает список доступных моделей из OpenRouter API
   */
  async getAvailableModels(provider?: 'openrouter'): Promise<any[]> {
    // Всегда используем OpenRouter
    return await this.loadOpenRouterModels();
  }

  /**
   * Загружает модели из OpenRouter API с кэшированием
   */
  private async loadOpenRouterModels(): Promise<any[]> {
    const now = Date.now();
    
    // Проверяем кэш
    if (this.openRouterModelsCache.length > 0 && (now - this.modelsCacheTimestamp) < this.MODELS_CACHE_TTL) {
      LoggerUtil.debug('proxy-service', 'Returning cached OpenRouter models', {
        count: this.openRouterModelsCache.length,
        cacheAge: Math.floor((now - this.modelsCacheTimestamp) / 1000) + 's'
      });
      return this.openRouterModelsCache;
    }

    // Если нет API ключа, возвращаем пустой массив или mock данные
    if (!this.openrouterApiKey || this.openrouterApiKey.includes('your-') || this.openrouterApiKey.includes('sk-or-your-')) {
      LoggerUtil.warn('proxy-service', 'No valid OpenRouter API key, returning empty models list');
      return [];
    }

    try {
      LoggerUtil.info('proxy-service', 'Fetching models from OpenRouter API');
      
      const response = await firstValueFrom(
        this.httpService.get(`${this.openrouterBaseUrl}/models`, {
          headers: {
            'Authorization': `Bearer ${this.openrouterApiKey}`,
            'HTTP-Referer': 'https://ai-aggregator.com',
            'X-Title': 'AI Aggregator'
          },
          timeout: 600000 // 10 минут для длинных генераций
        })
      );

      const openRouterModels = response.data?.data || [];
      
      // Преобразуем модели OpenRouter в наш формат
      const formattedModels = openRouterModels.map((model: any) => ({
        id: model.id,
        name: model.name || model.id,
        provider: 'openrouter',
        category: this.detectCategory(model.id),
        description: model.description || `Model ${model.id} via OpenRouter`,
        // Сохраняем context_length как max_tokens для использования в расчетах
        // context_length - это общий лимит контекста (входные + выходные токены)
        max_tokens: model.context_length || 4096,
        context_length: model.context_length || 4096, // Сохраняем отдельно для ясности
        cost_per_input_token: model.pricing?.prompt ? parseFloat(model.pricing.prompt) : 0,
        cost_per_output_token: model.pricing?.completion ? parseFloat(model.pricing.completion) : 0,
        currency: 'USD',
        is_available: true,
        capabilities: this.detectCapabilities(model),
        created_at: model.created_at || new Date().toISOString(),
        updated_at: model.updated_at || new Date().toISOString(),
        // Дополнительные поля из OpenRouter
        architecture: model.architecture,
        top_provider: model.top_provider,
        moderation: model.moderation
      }));

      // Обновляем кэш
      this.openRouterModelsCache = formattedModels;
      this.modelsCacheTimestamp = now;

      LoggerUtil.info('proxy-service', 'OpenRouter models loaded successfully', {
        count: formattedModels.length
      });

      return formattedModels;
    } catch (error: any) {
      LoggerUtil.error('proxy-service', 'Failed to load models from OpenRouter API', error, {
        status: error.response?.status,
        message: error.message
      });
      
      // Если кэш есть, возвращаем его даже если он устарел
      if (this.openRouterModelsCache.length > 0) {
        LoggerUtil.warn('proxy-service', 'Using stale cache due to API error');
        return this.openRouterModelsCache;
      }
      
      return [];
    }
  }

  /**
   * Определяет категорию модели по её ID
   */
  private detectCategory(modelId: string): string {
    if (modelId.includes('gpt') || modelId.includes('claude') || modelId.includes('gemini') || modelId.includes('llama')) {
      return 'chat';
    }
    if (modelId.includes('embedding') || modelId.includes('embed')) {
      return 'embedding';
    }
    if (modelId.includes('image') || modelId.includes('dall-e') || modelId.includes('stable-diffusion')) {
      return 'image';
    }
    if (modelId.includes('audio') || modelId.includes('whisper') || modelId.includes('tts')) {
      return 'audio';
    }
    return 'chat';
  }

  /**
   * Определяет возможности модели
   */
  private detectCapabilities(model: any): string[] {
    const capabilities: string[] = ['chat', 'completion'];
    const modelId = model.id?.toLowerCase() || '';
    const modelName = model.name?.toLowerCase() || '';
    const description = model.description?.toLowerCase() || '';
    const context = `${modelId} ${modelName} ${description}`;
    
    if (model.id.includes('vision') || model.id.includes('gpt-4') || model.id.includes('claude-3')) {
      capabilities.push('vision');
    }
    
    if (model.id.includes('embedding') || model.id.includes('embed')) {
      capabilities.push('text_embedding');
    }
    
    if (model.id.includes('function') || model.id.includes('gpt-4')) {
      capabilities.push('function_calling');
    }
    
    // Проверяем поддержку аудио
    const audioKeywords = ['whisper', 'audio', 'transcription', 'speech', 'voice', 'opus'];
    if (audioKeywords.some(keyword => context.includes(keyword))) {
      capabilities.push('audio');
      capabilities.push('audio_transcription');
    }
    
    // GPT-4o и GPT-4 Turbo могут обрабатывать аудио
    if (modelId.includes('gpt-4o') || modelId.includes('gpt-4-turbo')) {
      capabilities.push('audio');
      capabilities.push('multimodal');
    }
    
    return capabilities;
  }

  /**
   * Получает модели с поддержкой аудио/видео
   */
  async getAudioCapableModels(): Promise<any[]> {
    const allModels = await this.getAvailableModels();
    
    return allModels.filter(model => {
      const capabilities = model.capabilities || [];
      const hasAudio = capabilities.some((cap: string) => 
        cap.toLowerCase().includes('audio') || 
        cap.toLowerCase().includes('transcription')
      );
      
      // Также проверяем по ID и названию
      const modelId = model.id?.toLowerCase() || '';
      const modelName = model.name?.toLowerCase() || '';
      const audioKeywords = ['whisper', 'audio', 'transcription', 'speech', 'voice', 'opus', 'gpt-4o', 'gpt-4-turbo'];
      const hasAudioKeyword = audioKeywords.some(keyword => 
        modelId.includes(keyword) || modelName.includes(keyword)
      );
      
      return hasAudio || hasAudioKeyword;
    });
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
   * Использует более точную оценку: учитывает пробелы, специальные символы и форматирование
   */
  private estimateTokens(request: ChatCompletionRequest): number {
    let totalTokens = 0;

    const messages = request.messages || [];
    messages.forEach(message => {
      const content = message.content || '';
      
      // Более точная оценка токенов:
      // - Английский текст: ~4 символа на токен
      // - Русский/китайский текст: ~2-3 символа на токен
      // - Специальные символы и форматирование: больше токенов
      // Используем консервативную оценку: 3 символа на токен для смешанного контента
      const estimatedTokens = Math.ceil(content.length / 3);
      totalTokens += estimatedTokens;
      
      // Добавляем токены для роли сообщения (role tokens)
      totalTokens += 3; // ~3 токена на сообщение для форматирования (role, content, etc.)
    });

    // Добавляем токены для системных сообщений и форматирования запроса
    // OpenRouter добавляет служебные токены для структуры запроса
    totalTokens += 15;

    return totalTokens;
  }

  /**
   * Создает mock-ответ для демонстрации обезличивания
   */
  private createMockResponse(
    request: ChatCompletionRequest, 
    provider: 'openrouter'
  ): ChatCompletionResponse {
    // Показываем, что данные были обезличены
    const messages = request.messages || [];
    LoggerUtil.debug('proxy-service', 'Creating mock response', { 
      messageCount: messages.length,
      firstMessage: messages[0],
      request: JSON.stringify(request, null, 2)
    });
    
    // Для mock ответа берем только текстовый контент
    let originalContent = 'No message content';
    if (messages.length > 0 && messages[0].content) {
      if (typeof messages[0].content === 'string') {
        originalContent = messages[0].content;
      } else if (Array.isArray(messages[0].content)) {
        // Берем первый текстовый элемент из массива
        const textItem = messages[0].content.find((item: any) => item.type === 'text') as any;
        originalContent = (textItem && 'text' in textItem) ? textItem.text : 'No message content';
      }
    }
    
    // Демонстрируем обезличивание (только для текста)
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
   * Маппинг моделей для OpenRouter
   * Использует реальные ID моделей из OpenRouter API
   * Если модель уже в формате OpenRouter (с префиксом), проверяет существование в кэше
   * Иначе пытается найти модель по имени или ID в списке доступных моделей
   */
  private async mapModelForProvider(model: string, provider: 'openrouter'): Promise<string> {
    // Если кэш пуст, пытаемся загрузить модели
    if (this.openRouterModelsCache.length === 0) {
      LoggerUtil.debug('proxy-service', 'Model cache is empty, loading models', { model });
      try {
        await this.loadOpenRouterModels();
      } catch (error) {
        LoggerUtil.warn('proxy-service', 'Failed to load models for mapping', {
          error: error instanceof Error ? error.message : String(error),
          model
        });
      }
    }
    
    // Если модель уже содержит префикс провайдера (например, "openai/gpt-4o"), проверяем существование
    if (model.includes('/')) {
      // Проверяем, существует ли модель в кэше
      const foundModel = this.openRouterModelsCache.find(m => m.id === model);
      if (foundModel) {
        return model;
      }
      // Если не найдена, возвращаем как есть - OpenRouter может принять
      LoggerUtil.warn('proxy-service', 'Model not found in cache, using as-is', {
        model,
        cacheSize: this.openRouterModelsCache.length
      });
      return model;
    }
    
    // Ищем модель в кэше по ID или имени (без префикса)
    const foundModel = this.openRouterModelsCache.find(m => 
      m.id === model || 
      m.id.endsWith(`/${model}`) || 
      m.name?.toLowerCase() === model.toLowerCase() ||
      m.id.toLowerCase() === model.toLowerCase()
    );
    
    if (foundModel) {
      LoggerUtil.debug('proxy-service', 'Model mapped from cache', {
        original: model,
        mapped: foundModel.id
      });
      return foundModel.id;
    }
    
    // Fallback: маппинг популярных моделей без префикса (для обратной совместимости)
    const modelMapping: Record<string, string> = {
      // OpenAI модели
      'gpt-4o': 'openai/gpt-4o',
      'gpt-4o-mini': 'openai/gpt-4o-mini',
      'gpt-4-turbo': 'openai/gpt-4-turbo',
      'gpt-4': 'openai/gpt-4',
      'gpt-3.5-turbo': 'openai/gpt-3.5-turbo',
      
      // Claude модели - используем актуальные версии
      'claude-3-5-sonnet': 'anthropic/claude-3-5-sonnet-20241022',
      'claude-3-5-haiku': 'anthropic/claude-3-5-haiku-20241022',
      'claude-3-opus': 'anthropic/claude-3-opus-20240229',
      'claude-3-sonnet': 'anthropic/claude-3-sonnet-20240229',
      'claude-3-haiku': 'anthropic/claude-3-haiku-20240307',
      
      // Gemini модели
      'gemini-1.5-pro': 'google/gemini-1.5-pro',
      'gemini-1.5-flash': 'google/gemini-1.5-flash',
      'gemini-pro': 'google/gemini-pro',
      
      // Llama модели
      'llama-3.1-8b': 'meta-llama/llama-3.1-8b-instruct',
      'llama-3.1-70b': 'meta-llama/llama-3.1-70b-instruct',
    };
    
    if (modelMapping[model]) {
      // Проверяем, существует ли маппингованная модель в кэше
      const mappedModel = this.openRouterModelsCache.find(m => m.id === modelMapping[model]);
      if (mappedModel) {
        return modelMapping[model];
      }
    }
    
    // Если ничего не найдено, возвращаем модель как есть и логируем предупреждение
    LoggerUtil.warn('proxy-service', 'Model not found in cache or mapping, using as-is', {
      model,
      cacheSize: this.openRouterModelsCache.length,
      suggestion: 'Model may not be available or cache needs refresh'
    });
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

  /**
   * Обрабатывает запрос на генерацию эмбеддингов
   */
  async processEmbeddings(
    request: { model: string; input: string | string[]; user?: string },
    userId: string,
    provider: 'openrouter' = 'openrouter'
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      LoggerUtil.info('proxy-service', 'Processing embeddings request', {
        userId,
        provider,
        model: request.model,
        inputType: Array.isArray(request.input) ? 'array' : 'string',
        inputLength: Array.isArray(request.input) ? request.input.length : 1
      });

      const apiKey = this.openrouterApiKey;
      const baseUrl = this.openrouterBaseUrl;

      if (!apiKey || apiKey.includes('your-') || apiKey.includes('sk-or-your-')) {
        LoggerUtil.warn('proxy-service', 'Using mock mode for embeddings - no valid API key provided');
        return this.createMockEmbeddingsResponse(request);
      }

      const headers: any = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ai-aggregator.com',
        'X-Title': 'AI Aggregator',
        'User-Agent': 'AI-Aggregator/1.0.0'
      };

      const url = `${baseUrl}/embeddings`;
      const requestBody = {
        model: request.model,
        input: request.input,
        ...(request.user && { user: request.user })
      };

      LoggerUtil.debug('proxy-service', `Sending embeddings request to ${provider}`, {
        url,
        model: request.model
      });

      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.post(url, requestBody, {
          headers,
          timeout: 300000 // 5 минут для embeddings
        })
      );

      const responseTime = Date.now() - startTime;

      LoggerUtil.info('proxy-service', 'Embeddings request completed', {
        userId,
        provider,
        model: request.model,
        responseTime,
        embeddingCount: response.data?.data?.length || 0
      });

      // Отправляем событие биллинга
      try {
        await this.sendBillingEvent({
          userId,
          provider,
          model: request.model,
          requestType: 'embeddings',
          usage: response.data?.usage || { prompt_tokens: 0, total_tokens: 0 },
          cost: this.calculateEmbeddingsCost(response.data?.usage || {}, request.model),
          responseTime
        });
      } catch (billingError) {
        LoggerUtil.warn('proxy-service', 'Failed to send billing event for embeddings', {
          error: billingError instanceof Error ? billingError.message : String(billingError)
        });
      }

      return {
        ...response.data,
        processing_time_ms: responseTime
      };
    } catch (error: any) {
      LoggerUtil.error('proxy-service', 'Embeddings request failed', error, {
        userId,
        provider,
        model: request.model
      });

      throw new HttpException(
        `Embeddings request failed: ${error.response?.data?.error?.message || error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Обрабатывает запрос на транскрибацию аудио
   */
  async processAudioTranscription(
    file: Buffer | Express.Multer.File,
    request: { model: string; language?: string; prompt?: string; temperature?: number; response_format?: string },
    userId: string,
    provider: 'openrouter' = 'openrouter'
  ): Promise<any> {
    const startTime = Date.now();
    
    try {
      LoggerUtil.info('proxy-service', 'Processing audio transcription request', {
        userId,
        provider,
        model: request.model,
        language: request.language,
        fileSize: file instanceof Buffer ? file.length : (file as Express.Multer.File).size
      });

      const apiKey = this.openrouterApiKey;
      const baseUrl = this.openrouterBaseUrl;

      if (!apiKey || apiKey.includes('your-') || apiKey.includes('sk-or-your-')) {
        LoggerUtil.warn('proxy-service', 'Using mock mode for audio transcription - no valid API key provided');
        return this.createMockAudioTranscriptionResponse();
      }

      // Подготавливаем FormData для multipart/form-data запроса
      const FormData = require('form-data');
      const formData = new FormData();
      
      // Добавляем файл
      const fileBuffer = file instanceof Buffer ? file : (file as Express.Multer.File).buffer;
      const fileName = file instanceof Buffer ? 'audio.mp3' : ((file as Express.Multer.File).originalname || 'audio.mp3');
      formData.append('file', fileBuffer, {
        filename: fileName,
        contentType: this.getContentType(fileName)
      });

      // Добавляем параметры
      formData.append('model', request.model);
      if (request.language) formData.append('language', request.language);
      if (request.prompt) formData.append('prompt', request.prompt);
      if (request.temperature !== undefined) formData.append('temperature', request.temperature.toString());
      if (request.response_format) formData.append('response_format', request.response_format);

      const headers: any = {
        ...formData.getHeaders(),
        'Authorization': `Bearer ${apiKey}`,
        'HTTP-Referer': 'https://ai-aggregator.com',
        'X-Title': 'AI Aggregator',
        'User-Agent': 'AI-Aggregator/1.0.0'
      };

      const url = `${baseUrl}/audio/transcriptions`;

      LoggerUtil.debug('proxy-service', `Sending audio transcription request to ${provider}`, {
        url,
        model: request.model,
        fileSize: (fileBuffer as Buffer).length
      });

      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.post(url, formData, {
          headers,
          timeout: 300000 // 5 минут для транскрибации
        })
      );

      const responseTime = Date.now() - startTime;

      LoggerUtil.info('proxy-service', 'Audio transcription request completed', {
        userId,
        provider,
        model: request.model,
        responseTime
      });

      // Отправляем событие биллинга
      try {
        await this.sendBillingEvent({
          userId,
          provider,
          model: request.model,
          requestType: 'audio_transcription',
          usage: { prompt_tokens: 0, total_tokens: 0 }, // Whisper не возвращает usage
          cost: this.calculateAudioTranscriptionCost((fileBuffer as Buffer).length, request.model),
          responseTime
        });
      } catch (billingError) {
        LoggerUtil.warn('proxy-service', 'Failed to send billing event for audio transcription', {
          error: billingError instanceof Error ? billingError.message : String(billingError)
        });
      }

      return {
        ...response.data,
        processing_time_ms: responseTime
      };
    } catch (error: any) {
      LoggerUtil.error('proxy-service', 'Audio transcription request failed', error, {
        userId,
        provider,
        model: request.model
      });

      throw new HttpException(
        `Audio transcription request failed: ${error.response?.data?.error?.message || error.message}`,
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Создает mock ответ для embeddings (для тестирования)
   */
  private createMockEmbeddingsResponse(request: { model: string; input: string | string[] }): any {
    const inputs = Array.isArray(request.input) ? request.input : [request.input];
    const mockEmbedding = Array.from({ length: 1536 }, () => Math.random() * 0.01 - 0.005);

    return {
      object: 'list',
      data: inputs.map((_, index) => ({
        object: 'embedding',
        embedding: mockEmbedding,
        index
      })),
      model: request.model,
      usage: {
        prompt_tokens: inputs.reduce((sum, input) => sum + Math.ceil(input.length / 4), 0),
        total_tokens: inputs.reduce((sum, input) => sum + Math.ceil(input.length / 4), 0)
      },
      processing_time_ms: 100
    };
  }

  /**
   * Создает mock ответ для audio transcription (для тестирования)
   */
  private createMockAudioTranscriptionResponse(): any {
    return {
      text: 'Это тестовая транскрипция аудио файла. В реальном режиме здесь будет транскрибированный текст.',
      language: 'ru',
      duration: 10.5,
      processing_time_ms: 2000
    };
  }

  /**
   * Определяет Content-Type по имени файла
   */
  private getContentType(fileName: string): string {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const contentTypes: Record<string, string> = {
      'mp3': 'audio/mpeg',
      'mp4': 'video/mp4',
      'mpeg': 'audio/mpeg',
      'mpga': 'audio/mpeg',
      'm4a': 'audio/mp4',
      'wav': 'audio/wav',
      'webm': 'audio/webm'
    };
    return contentTypes[ext || ''] || 'audio/mpeg';
  }

  /**
   * Рассчитывает стоимость embeddings
   */
  private calculateEmbeddingsCost(usage: any, model: string): number {
    // Цены для embeddings моделей (за 1K токенов)
    const pricing: Record<string, number> = {
      'text-embedding-ada-002': 0.0001, // $0.0001 за 1K токенов
      'text-embedding-3-small': 0.00002,
      'text-embedding-3-large': 0.00013
    };

    const pricePer1K = pricing[model] || 0.0001;
    return (usage.total_tokens || 0) / 1000 * pricePer1K;
  }

  /**
   * Рассчитывает стоимость audio transcription
   */
  private calculateAudioTranscriptionCost(fileSizeBytes: number, model: string): number {
    // Whisper API: $0.006 за минуту аудио
    // Оцениваем длительность: примерно 1MB = 1 минута для MP3
    const estimatedMinutes = fileSizeBytes / (1024 * 1024);
    return estimatedMinutes * 0.006;
  }
}
