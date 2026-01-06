import { Controller, Post, Get, Body, Headers, UseGuards, HttpException, HttpStatus, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiSecurity, ApiHeader } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { ApiKeyAuthGuard } from '../auth/api-key-auth.guard';
import { ChatService } from '../chat/chat.service';
import { HistoryService } from '../history/history.service';
import { AnonymizationService } from '../anonymization/anonymization.service';
import { 
  ChatCompletionRequest, 
  RequestType,
  RequestStatus,
  LoggerUtil
} from '@ai-aggregator/shared';

@ApiTags('External API')
@Controller('api/v1')
@ApiSecurity('ApiKeyAuth')
@ApiHeader({
  name: 'Authorization',
  description: 'API Key in format: Bearer ak_[A-Za-z0-9]{40} (e.g., Bearer ak_AbCdEf1234567890...)',
  required: true,
})
export class ExternalApiController {
  constructor(
    private readonly chatService: ChatService,
    private readonly historyService: HistoryService,
    private readonly anonymizationService: AnonymizationService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * External API endpoint for chat completions (OpenRouter-compatible)
   * POST /api/v1/chat/completions
   * 
   * Accepts:
   * - Authorization: Bearer ak_[A-Za-z0-9]{40} (API key)
   * - Body: { model, messages, max_tokens?, temperature?, ... }
   * 
   * Returns: Chat completion response
   */
  @Post('chat/completions')
  @UseGuards(ApiKeyAuthGuard)
  @ApiOperation({ 
    summary: 'Create chat completion (External API)',
    description: 'External API endpoint compatible with OpenRouter. Requires API key in Authorization header.'
  })
  @ApiResponse({ status: 200, description: 'Chat completion created successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createCompletion(
    @Body() request: any,
    @Request() req: any,
  ): Promise<any> {
    const startTime = Date.now();
    
    // Получаем информацию о пользователе из guard (установлена в req.user)
    const companyId = req.user?.companyId;
    const provider = 'openrouter'; // Всегда используем OpenRouter для внешнего API
    
    // Используем req.body напрямую, так как NestJS автоматически парсит JSON
    // Приоритет: req.body (парсится автоматически) > request (из @Body())
    const requestData = (req.body && req.body.model) 
      ? req.body 
      : (request && request.model ? request : null);
    
    if (!requestData || !requestData.model) {
      LoggerUtil.warn('api-gateway', 'Model is missing in request', {
        request: JSON.stringify(request),
        body: JSON.stringify(req.body),
        requestData: requestData ? JSON.stringify(requestData) : 'null',
        bodyType: typeof req.body,
        hasBody: !!req.body,
        bodyKeys: req.body ? Object.keys(req.body) : [],
      });
      throw new HttpException('Model is required', HttpStatus.BAD_REQUEST);
    }

    if (!requestData.messages || !Array.isArray(requestData.messages) || requestData.messages.length === 0) {
      throw new HttpException('Messages array is required and cannot be empty', HttpStatus.BAD_REQUEST);
    }

    LoggerUtil.info('api-gateway', 'External API chat completion request', {
      companyId,
      provider,
      model: requestData.model,
      messageCount: requestData.messages.length,
    });

    // Проверяем, нужно ли обезличивать запрос на основе настроек ФСБ
    const shouldAnonymize = await this.anonymizationService.shouldAnonymize(
      provider, 
      requestData.model
    );
    
    let requestToSend = requestData;
    let anonymizationMapping = null;
    
    if (shouldAnonymize) {
      LoggerUtil.info('api-gateway', 'Anonymizing request before sending to AI provider', {
        companyId,
        provider,
        model: request.model
      });
      
      // Обезличиваем данные перед отправкой в нейросеть
      const anonymizedData = this.anonymizationService.anonymizeChatMessages(requestData.messages);
      requestToSend = {
        ...requestData,
        messages: anonymizedData.data
      };
      anonymizationMapping = anonymizedData.mapping;
    }

    // Создаем запись истории запроса с ОРИГИНАЛЬНЫМИ данными
    // Для внешнего API используем companyId как userId
    const historyRecord = await this.historyService.createRequestHistory({
      userId: companyId || 'external-api',
      sessionId: null,
      requestType: RequestType.CHAT_COMPLETION,
      provider,
      model: requestData.model,
      requestData: requestData, // ОРИГИНАЛЬНЫЕ данные в истории (без обезличивания)
      status: RequestStatus.SUCCESS,
    });

    try {
      // Отправляем обезличенные данные в нейросеть
      // Используем companyId как userId для proxy-service
      const response = await this.chatService.createCompletion(
        requestToSend, 
        companyId || 'external-api', 
        provider
      );
      const responseTime = Date.now() - startTime;
      
      // Восстанавливаем данные в ответе, если было обезличивание
      let finalResponse = response;
      if (shouldAnonymize && anonymizationMapping) {
        LoggerUtil.info('api-gateway', 'Restoring anonymized data in response', {
          companyId,
          provider,
          model: request.model
        });
        
        // Восстанавливаем данные в ответе
        finalResponse = this.restoreAnonymizedResponse(response, anonymizationMapping);
      }

      // Обновляем историю с результатом
      await this.historyService.updateRequestHistory(historyRecord.id, {
        responseData: finalResponse,
        status: RequestStatus.SUCCESS,
        responseTime,
      });

      LoggerUtil.info('api-gateway', 'External API chat completion completed', {
        companyId,
        provider,
        model: request.model,
        responseTime,
      });

      return finalResponse;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      
      // Обновляем историю с ошибкой
      await this.historyService.updateRequestHistory(historyRecord.id, {
        status: RequestStatus.ERROR,
        errorMessage: error.message || 'Unknown error',
        responseTime,
      });

      LoggerUtil.error('api-gateway', 'External API chat completion failed', error, {
        companyId,
        provider,
        model: requestData.model,
      });

      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Proxy service error',
          error.response.status
        );
      }

      throw new HttpException(
        error.message || 'Failed to create chat completion',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Get available models (External API)
   * GET /api/v1/models
   */
  @Get('models')
  @UseGuards(ApiKeyAuthGuard)
  @ApiOperation({ 
    summary: 'Get available models (External API)',
    description: 'Returns list of available AI models. Requires API key in Authorization header.'
  })
  @ApiResponse({ status: 200, description: 'Models retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  async getModels(): Promise<any> {
    try {
      const proxyServiceUrl = this.configService.get('PROXY_SERVICE_URL', 'http://proxy-service:3003');
      
      const response = await firstValueFrom(
        this.httpService.get(`${proxyServiceUrl}/proxy/models`, {
          timeout: 10000
        })
      );

      return {
        data: response.data.models || response.data || [],
      };
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Failed to get models for external API', error);
      throw new HttpException(
        'Failed to retrieve models',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * External API endpoint for OpenAI direct chat completions (for video support)
   * POST /api/v1/openai/chat/completions
   * 
   * This endpoint bypasses OpenRouter and sends requests directly to OpenAI.
   * Use this for features not supported by OpenRouter (e.g., video processing).
   */
  @Post('openai/chat/completions')
  @UseGuards(ApiKeyAuthGuard)
  @ApiOperation({ 
    summary: 'Create chat completion via OpenAI directly (External API)',
    description: 'Direct OpenAI API endpoint for video and other features not supported by OpenRouter. Requires API key in Authorization header.'
  })
  @ApiResponse({ status: 200, description: 'Chat completion created successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createOpenAIChatCompletion(
    @Body() request: any,
    @Request() req: any,
  ): Promise<any> {
    const startTime = Date.now();
    const companyId = req.user?.companyId;
    const provider = 'openai';

    if (!request || !request.model || !request.messages) {
      throw new HttpException('Model and messages are required', HttpStatus.BAD_REQUEST);
    }

    LoggerUtil.info('api-gateway', 'External API OpenAI chat completion request', {
      companyId,
      provider,
      model: request.model,
      messageCount: request.messages.length
    });

    try {
      const proxyServiceUrl = this.configService.get('PROXY_SERVICE_URL', 'http://proxy-service:3003');
      const response = await firstValueFrom(
        this.httpService.post(
          `${proxyServiceUrl}/proxy/openai/chat/completions?user_id=${companyId || 'external-api'}`,
          request,
          { timeout: 120000 } // 2 минуты для видео
        )
      );
      const responseTime = Date.now() - startTime;

      await this.historyService.createRequestHistory({
        userId: companyId || 'external-api',
        sessionId: null,
        requestType: RequestType.CHAT_COMPLETION,
        provider,
        model: request.model,
        requestData: request,
        responseData: response.data,
        status: RequestStatus.SUCCESS,
        responseTime,
      });

      LoggerUtil.info('api-gateway', 'External API OpenAI chat completion completed', {
        companyId,
        provider,
        model: request.model,
        responseTime,
      });

      return response.data;
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      await this.historyService.createRequestHistory({
        userId: companyId || 'external-api',
        sessionId: null,
        requestType: RequestType.CHAT_COMPLETION,
        provider,
        model: request.model,
        requestData: request,
        errorMessage: error.message || 'Unknown error',
        status: RequestStatus.ERROR,
        responseTime,
      });
      LoggerUtil.error('api-gateway', 'External API OpenAI chat completion failed', error, {
        companyId,
        provider,
        model: request.model,
      });
      throw new HttpException(
        error.response?.data?.message || error.message || 'Failed to create chat completion',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  /**
   * Create embeddings (External API)
   * POST /api/v1/embeddings
   */
  @Post('embeddings')
  @UseGuards(ApiKeyAuthGuard)
  @ApiOperation({ 
    summary: 'Create embeddings (External API)',
    description: 'Generates embeddings for text input. Requires API key in Authorization header.'
  })
  @ApiResponse({ status: 200, description: 'Embeddings generated successfully' })
  @ApiResponse({ status: 401, description: 'Invalid or missing API key' })
  @ApiResponse({ status: 400, description: 'Invalid request' })
  async createEmbeddings(
    @Body() request: { model: string; input: string | string[]; user?: string },
    @Request() req: any,
  ): Promise<any> {
    const startTime = Date.now();
    const companyId = req.user?.companyId;
    const provider = 'openrouter';

    if (!request || !request.model) {
      throw new HttpException('Model is required', HttpStatus.BAD_REQUEST);
    }

    if (!request.input) {
      throw new HttpException('Input is required', HttpStatus.BAD_REQUEST);
    }

    LoggerUtil.info('api-gateway', 'External API embeddings request', {
      companyId,
      provider,
      model: request.model,
      inputType: Array.isArray(request.input) ? 'array' : 'string'
    });

    try {
      const proxyServiceUrl = this.configService.get('PROXY_SERVICE_URL', 'http://proxy-service:3003');
      
      const response = await firstValueFrom(
        this.httpService.post(
          `${proxyServiceUrl}/proxy/embeddings?user_id=${companyId || 'external-api'}&provider=${provider}`,
          request,
          {
            timeout: 300000 // 5 минут
          }
        )
      );

      const responseTime = Date.now() - startTime;

      LoggerUtil.info('api-gateway', 'External API embeddings completed', {
        companyId,
        provider,
        model: request.model,
        responseTime
      });

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'External API embeddings failed', error, {
        companyId,
        provider,
        model: request.model
      });

      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Proxy service error',
          error.response.status
        );
      }

      throw new HttpException(
        error.message || 'Failed to create embeddings',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }


  /**
   * Восстанавливает обезличенные данные в ответе
   */
  private restoreAnonymizedResponse(response: any, mapping: any): any {
    if (!response.choices || !Array.isArray(response.choices)) {
      return response;
    }

    const restoredChoices = response.choices.map((choice: any) => {
      if (!choice.message || !choice.message.content) {
        return choice;
      }

      let restoredContent = choice.message.content;
      
      // Восстанавливаем данные из маппинга
      Object.keys(mapping).forEach((placeholder: string) => {
        const originalValue = mapping[placeholder];
        const regex = new RegExp(placeholder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
        restoredContent = restoredContent.replace(regex, originalValue);
      });

      return {
        ...choice,
        message: {
          ...choice.message,
          content: restoredContent,
        },
      };
    });

    return {
      ...response,
      choices: restoredChoices,
    };
  }
}

