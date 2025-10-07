import { Controller, Post, Get, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { HttpService } from '@nestjs/axios';
import { ChatService } from './chat.service';
import { HistoryService } from '../history/history.service';
import { 
  ChatCompletionRequest, 
  ChatCompletionResponse,
  RequestType,
  RequestStatus,
  LoggerUtil
} from '@ai-aggregator/shared';
import { AnonymizationService } from '../anonymization/anonymization.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { ConfigService } from '@nestjs/config';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly historyService: HistoryService,
    private readonly anonymizationService: AnonymizationService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {}

  @Post('completions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create chat completion with anonymization' })
  @ApiResponse({ status: 200, description: 'Chat completion created successfully' })
  async createCompletion(
    @Body() request: any,
    @Request() req: any,
    @Query('provider') provider: 'openai' | 'openrouter' | 'yandex' = 'openai'
  ): Promise<any> {
    const userId = req.user.id;
    const sessionId = req.user.sessionId || null;
    const startTime = Date.now();
    
    console.log('Chat completion request received:', JSON.stringify(request, null, 2));
    
    // Проверяем, нужно ли обезличивать запрос на основе настроек ФСБ
    const shouldAnonymize = await this.anonymizationService.shouldAnonymize(
      provider, 
      request.model || 'gpt-3.5-turbo'
    );
    
    let requestToSend = request;
    let anonymizationMapping = null;
    
    if (shouldAnonymize) {
      LoggerUtil.info('api-gateway', 'Anonymizing request before sending to AI provider', {
        userId,
        provider,
        model: request.model || 'gpt-3.5-turbo'
      });
      
      // Обезличиваем данные перед отправкой в нейросеть
      const anonymizedData = this.anonymizationService.anonymizeChatMessages(request.messages);
      requestToSend = {
        ...request,
        messages: anonymizedData.data
      };
      anonymizationMapping = anonymizedData.mapping;
    }
    
    // Создаем запись истории запроса с ОРИГИНАЛЬНЫМИ данными
    const historyRecord = await this.historyService.createRequestHistory({
      userId,
      sessionId,
      requestType: RequestType.CHAT_COMPLETION,
      provider,
      model: request.model || 'gpt-3.5-turbo',
      requestData: request, // ОРИГИНАЛЬНЫЕ данные в истории (без обезличивания)
      status: RequestStatus.SUCCESS,
    });

    try {
      // Отправляем обезличенные данные в нейросеть
      const response = await this.chatService.createCompletion(requestToSend, userId, provider);
      const responseTime = Date.now() - startTime;
      
      // Восстанавливаем данные в ответе, если было обезличивание
      let finalResponse = response;
      if (shouldAnonymize && anonymizationMapping) {
        LoggerUtil.info('api-gateway', 'Restoring anonymized data in response', {
          userId,
          provider,
          model: request.model || 'gpt-3.5-turbo'
        });
        
        // Восстанавливаем данные в ответе
        finalResponse = this.restoreAnonymizedResponse(response, anonymizationMapping);
      }
      
      // Обновляем запись истории с ОРИГИНАЛЬНЫМ ответом
      await this.historyService.updateRequestHistory(historyRecord.id, {
        responseData: response,
        tokensUsed: response.usage?.total_tokens,
        cost: response.usage?.total_tokens ? response.usage.total_tokens * 0.00002 : 0,
        responseTime,
        status: RequestStatus.SUCCESS,
      });

      // Отправляем событие в analytics-service через RabbitMQ
      try {
        LoggerUtil.info('api-gateway', 'Sending analytics event', {
          userId,
          historyId: historyRecord.id,
          provider,
          model: request.model || 'gpt-3.5-turbo'
        });
        // TODO: Implement RabbitMQ analytics event
      } catch (rabbitError) {
        LoggerUtil.warn('api-gateway', 'Failed to send analytics event', {
          userId,
          historyId: historyRecord.id,
          error: rabbitError instanceof Error ? rabbitError.message : String(rabbitError)
        });
        // Не прерываем выполнение при ошибке RabbitMQ
      }

      return finalResponse;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      // Обновляем запись истории с ошибкой
      await this.historyService.updateRequestHistory(historyRecord.id, {
        responseTime,
        status: RequestStatus.ERROR,
        errorMessage: error instanceof Error ? error.message : String(error),
      });

      // Отправляем событие об ошибке в analytics-service через RabbitMQ
      try {
        LoggerUtil.info('api-gateway', 'Sending analytics error event', {
          userId,
          historyId: historyRecord.id,
          error: error instanceof Error ? error.message : String(error)
        });
        // TODO: Implement RabbitMQ analytics error event
      } catch (rabbitError) {
        LoggerUtil.warn('api-gateway', 'Failed to send analytics error event', {
          userId,
          historyId: historyRecord.id,
          error: rabbitError instanceof Error ? rabbitError.message : String(rabbitError)
        });
        // Не прерываем выполнение при ошибке RabbitMQ
      }

      throw error;
    }
  }

  /**
   * Восстанавливает обезличенные данные в ответе от нейросети
   */
  private restoreAnonymizedResponse(response: any, mapping: Record<string, string>): any {
    try {
      if (!response.choices || !Array.isArray(response.choices)) {
        return response;
      }

      // Создаем обратный маппинг для восстановления
      const reverseMapping: Record<string, string> = {};
      Object.entries(mapping).forEach(([key, value]) => {
        reverseMapping[value] = key;
      });

      // Восстанавливаем данные в каждом выборе ответа
      const restoredChoices = response.choices.map((choice: any) => {
        if (choice.message && choice.message.content) {
          let restoredContent = choice.message.content;
          
          // Заменяем обезличенные данные на оригинальные
          Object.entries(reverseMapping).forEach(([anonymized, original]) => {
            const regex = new RegExp(anonymized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            restoredContent = restoredContent.replace(regex, original);
          });
          
          return {
            ...choice,
            message: {
              ...choice.message,
              content: restoredContent
            }
          };
        }
        return choice;
      });

      return {
        ...response,
        choices: restoredChoices
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to restore anonymized response', error as Error);
      return response; // Возвращаем оригинальный ответ в случае ошибки
    }
  }

  @Get('models')
  @ApiOperation({ summary: 'Get available models' })
  @ApiResponse({ status: 200, description: 'Models retrieved successfully' })
  async getModels(
    @Query('provider') provider?: 'openai' | 'openrouter' | 'yandex'
  ) {
    const models = await this.chatService.getModels(provider);
    return {
      success: true,
      message: 'Models retrieved successfully',
      models
    };
  }

  @Get('models/:provider/:model')
  @ApiOperation({ summary: 'Get model information' })
  @ApiResponse({ status: 200, description: 'Model info retrieved successfully' })
  async getModelInfo(
    @Param('provider') provider: 'openai' | 'openrouter' | 'yandex',
    @Param('model') model: string
  ) {
    const modelInfo = await this.chatService.getModelInfo(provider, model);
    return {
      success: true,
      message: 'Model info retrieved successfully',
      model: modelInfo
    };
  }

  @Post('validate')
  @ApiOperation({ summary: 'Validate chat request' })
  @ApiResponse({ status: 200, description: 'Request validated successfully' })
  async validateRequest(@Body() request: ChatCompletionRequest) {
    const validation = await this.chatService.validateRequest(request);
    return {
      success: validation.isValid,
      message: validation.isValid ? 'Request is valid' : 'Request validation failed',
      ...validation
    };
  }

  @Get('recommendations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get neural network recommendations',
    description: 'Get personalized recommendations for neural networks based on popularity and usage statistics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Recommendations retrieved successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getRecommendations(
    @Request() req: any,
    @Query('limit') limit?: number,
    @Query('includeRussian') includeRussian?: boolean
  ) {
    try {
      const analyticsServiceUrl = this.configService.get<string>('ANALYTICS_SERVICE_URL') || 'http://localhost:3005';
      const url = `${analyticsServiceUrl}/neural-networks/recommendations`;
      
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      if (includeRussian !== undefined) params.append('includeRussian', includeRussian.toString());
      
      const fullUrl = `${url}?${params.toString()}`;
      
      LoggerUtil.info('api-gateway', 'Getting neural network recommendations', {
        userId: req.user?.id,
        url: fullUrl
      });

      const response = await this.httpService.axiosRef.get(fullUrl, {
        headers: {
          'Authorization': req.headers.authorization,
          'Content-Type': 'application/json'
        }
      });

      return response.data;
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to get neural network recommendations', error as Error, {
        userId: req.user?.id
      });
      
      // В случае ошибки возвращаем российские по умолчанию
      const russianDefaults = [
        {
          provider: 'yandex',
          model: 'yandex-gpt',
          reason: 'russian',
          score: 100,
          isDefault: true,
          description: 'Yandex GPT - российская языковая модель'
        },
        {
          provider: 'sber',
          model: 'gigachat',
          reason: 'russian',
          score: 95,
          isDefault: true,
          description: 'GigaChat - ИИ-модель от Сбера'
        },
        {
          provider: 'sber',
          model: 'kandinsky',
          reason: 'russian',
          score: 90,
          isDefault: true,
          description: 'Kandinsky - генерация изображений от Сбера'
        }
      ];

      return {
        success: true,
        data: {
          recommendations: russianDefaults.slice(0, limit || 10),
          total: russianDefaults.length,
          hasRussianDefaults: true
        }
      };
    }
  }

  @Get('popular')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ 
    summary: 'Get most popular neural networks',
    description: 'Get the most popular neural networks based on usage statistics'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Popular neural networks retrieved successfully'
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
  async getPopular(
    @Query('limit') limit?: number
  ) {
    try {
      const analyticsServiceUrl = this.configService.get<string>('ANALYTICS_SERVICE_URL') || 'http://localhost:3005';
      const url = `${analyticsServiceUrl}/neural-networks/popular`;
      
      const params = new URLSearchParams();
      if (limit) params.append('limit', limit.toString());
      
      const fullUrl = `${url}?${params.toString()}`;
      
      LoggerUtil.info('api-gateway', 'Getting popular neural networks', {
        url: fullUrl
      });

      const response = await this.httpService.axiosRef.get(fullUrl);

      return response.data;
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to get popular neural networks', error as Error);
      
      // В случае ошибки возвращаем пустой массив
      return {
        success: true,
        data: []
      };
    }
  }
}