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
      
      // Заглушка - в реальном проекте здесь будет маршрутизация запроса
      return {
        response: 'AI response from provider',
        provider: 'openai',
        model: data.model || 'gpt-4',
        cost: 0.05,
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
      
      // Заглушка - в реальном проекте здесь будет проверка статуса провайдера
      return {
        providerName: providerId,
        status: 'operational',
        lastChecked: new Date().toISOString(),
        message: 'Provider is operational',
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
}
