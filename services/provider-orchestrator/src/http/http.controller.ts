import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoggerUtil } from '@ai-aggregator/shared';

@ApiTags('orchestrator')
@Controller('orchestrator')
export class HttpController {
  constructor() {}

  @Post('route-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Route request to appropriate provider' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        model: { type: 'string' },
        prompt: { type: 'string' },
        provider: { type: 'string' }
      },
      required: ['userId', 'model']
    }
  })
  @ApiResponse({ status: 200, description: 'Request routed successfully' })
  async routeRequest(@Body() data: any) {
    try {
      LoggerUtil.debug('provider-orchestrator', 'HTTP RouteRequest called', { 
        userId: data.userId,
        model: data.model 
      });
      
      // Простая заглушка для маршрутизации
      return {
        success: true,
        message: 'Request routed successfully',
        provider: data.provider || 'openai',
        model: data.model || 'gpt-3.5-turbo',
        estimatedCost: 0.05,
        estimatedTokens: 30
      };
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'HTTP RouteRequest failed', error as Error);
      throw error;
    }
  }

  @Get('provider-status/:providerId')
  @ApiOperation({ summary: 'Get provider status' })
  @ApiResponse({ status: 200, description: 'Provider status retrieved successfully' })
  async getProviderStatus(@Param('providerId') providerId: string) {
    try {
      LoggerUtil.debug('provider-orchestrator', 'HTTP GetProviderStatus called', { 
        provider_id: providerId 
      });
      
      // Простая заглушка для статуса провайдера
      return {
        provider: providerId,
        status: 'operational',
        responseTime: 100,
        successRate: 99.5,
        errorRate: 0.5,
        message: 'Provider is operational'
      };
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'HTTP GetProviderStatus failed', error as Error);
      throw error;
    }
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get list of available providers' })
  @ApiResponse({ status: 200, description: 'Providers list retrieved successfully' })
  async getProviders() {
    try {
      LoggerUtil.debug('provider-orchestrator', 'HTTP GetProviders called');
      
      // Заглушка - в реальном проекте здесь будет список провайдеров
      return {
        providers: [
          {
            id: 'openai',
            name: 'OpenAI',
            status: 'operational',
            models: ['gpt-4', 'gpt-3.5-turbo']
          },
          {
            id: 'openrouter',
            name: 'OpenRouter',
            status: 'operational',
            models: ['gpt-4', 'claude-3']
          }
        ]
      };
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'HTTP GetProviders failed', error as Error);
      throw error;
    }
  }

  @Get('models')
  @ApiOperation({ summary: 'Get list of available models' })
  @ApiResponse({ status: 200, description: 'Models list retrieved successfully' })
  async getModels() {
    try {
      LoggerUtil.debug('provider-orchestrator', 'HTTP GetModels called');
      
      // Простая заглушка для моделей
      return {
        models: [
          {
            id: 'gpt-4',
            name: 'GPT-4',
            provider: 'OpenAI',
            status: 'available',
            costPerToken: 0.00003
          },
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            provider: 'OpenAI',
            status: 'available',
            costPerToken: 0.00002
          }
        ]
      };
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'HTTP GetModels failed', error as Error);
      throw error;
    }
  }
}
