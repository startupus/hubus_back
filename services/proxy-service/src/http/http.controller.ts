import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoggerUtil } from '@ai-aggregator/shared';
import { ProxyService } from '../proxy/proxy.service';

@ApiTags('proxy')
@Controller('proxy')
export class HttpController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Proxy request to AI provider' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        provider: { type: 'string' },
        model: { type: 'string' },
        prompt: { type: 'string' },
        messages: { type: 'array', items: { type: 'object' } }
      },
      required: ['userId', 'provider', 'model']
    }
  })
  @ApiResponse({ status: 200, description: 'Request processed successfully' })
  async proxyRequest(@Body() data: any) {
    try {
      LoggerUtil.debug('proxy-service', 'HTTP ProxyRequest called', { 
        user_id: data.userId,
        provider: data.provider,
        model: data.model 
      });
      
      // Валидируем запрос
      const validation = await this.proxyService.validateRequest({
        model: data.model,
        messages: data.messages || [{ role: 'user', content: data.prompt || 'Hello' }],
        temperature: data.temperature,
        max_tokens: data.max_tokens
      });

      if (!validation.isValid) {
        return {
          success: false,
          message: `Validation failed: ${validation.errors.join(', ')}`,
          responseText: '',
          inputTokens: 0,
          outputTokens: 0,
          cost: 0,
          currency: 'USD',
          responseTime: 0,
          provider: '',
          model: '',
          finishReason: 'error',
          metadata: { errors: validation.errors, warnings: validation.warnings },
        };
      }

      // Обрабатываем запрос через ProxyService
      const response = await this.proxyService.processChatCompletion(
        {
          model: data.model,
          messages: data.messages || [{ role: 'user', content: data.prompt || 'Hello' }],
          temperature: data.temperature,
          max_tokens: data.max_tokens
        },
        data.userId,
        data.provider || 'openai'
      );

      return {
        success: true,
        message: 'Request processed successfully',
        responseText: response.choices[0]?.message?.content || 'No response',
        inputTokens: response.usage?.prompt_tokens || 0,
        outputTokens: response.usage?.completion_tokens || 0,
        cost: (response.usage?.prompt_tokens || 0) * 0.00003 + (response.usage?.completion_tokens || 0) * 0.00006,
        currency: 'USD',
        responseTime: response.processing_time_ms || 0,
        provider: response.provider || data.provider || 'openai',
        model: response.model || data.model,
        finishReason: response.choices[0]?.finish_reason || 'stop',
        metadata: {
          estimatedTokens: validation.estimatedTokens,
          estimatedCost: validation.estimatedCost
        },
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'HTTP ProxyRequest failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        responseText: '',
        inputTokens: 0,
        outputTokens: 0,
        cost: 0,
        currency: 'USD',
        responseTime: 0,
        provider: '',
        model: '',
        finishReason: 'error',
        metadata: {},
      };
    }
  }

  @Get('models')
  @ApiOperation({ summary: 'Get available models' })
  @ApiResponse({ status: 200, description: 'Models list retrieved successfully' })
  async getModels() {
    try {
      LoggerUtil.debug('proxy-service', 'HTTP GetModels called');
      
      const models = await this.proxyService.getAvailableModels();
      
      return {
        success: true,
        message: 'Models retrieved successfully',
        models,
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'HTTP GetModels failed', error as Error);
      throw error;
    }
  }

  @Get('models/:provider/:model')
  @ApiOperation({ summary: 'Get specific model information' })
  @ApiResponse({ status: 200, description: 'Model information retrieved successfully' })
  async getModel(@Param('provider') provider: string, @Param('model') model: string) {
    try {
      LoggerUtil.debug('proxy-service', 'HTTP GetModel called', { provider, model });
      
      // Заглушка - в реальном проекте здесь будет информация о конкретной модели
      return {
        id: model,
        name: model,
        provider: provider,
        description: `Model ${model} from ${provider}`,
        capabilities: ['text_generation', 'conversation'],
        pricing: {
          input: 0.001,
          output: 0.002,
          currency: 'USD'
        }
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'HTTP GetModel failed', error as Error);
      throw error;
    }
  }

  @Post('validate-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Validate request before processing' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        provider: { type: 'string' },
        model: { type: 'string' },
        prompt: { type: 'string' }
      },
      required: ['userId', 'provider', 'model']
    }
  })
  @ApiResponse({ status: 200, description: 'Request validation result' })
  async validateRequest(@Body() data: any) {
    try {
      LoggerUtil.debug('proxy-service', 'HTTP ValidateRequest called', { 
        user_id: data.userId,
        provider: data.provider,
        model: data.model 
      });
      
      // Заглушка - в реальном проекте здесь будет валидация запроса
      return {
        valid: true,
        message: 'Request is valid',
        estimatedCost: 0.05,
        estimatedTokens: 30
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'HTTP ValidateRequest failed', error as Error);
      return {
        valid: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        estimatedCost: 0,
        estimatedTokens: 0
      };
    }
  }
}
