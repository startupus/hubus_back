import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoggerUtil } from '@ai-aggregator/shared';

@ApiTags('Provider Orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  constructor() {}

  @Post('route-request')
  @ApiOperation({ summary: 'Route AI request to appropriate provider' })
  @ApiResponse({ status: 200, description: 'Request routed successfully' })
  async routeRequest(@Body() body: {
    userId: string;
    model: string;
    prompt: string;
    options?: Record<string, any>;
  }) {
    try {
      LoggerUtil.debug('provider-orchestrator', 'HTTP RouteRequest called', { 
        userId: body.userId,
        model: body.model 
      });
      
      return {
        response: 'AI response from provider',
        provider: 'openai',
        model: body.model || 'gpt-4',
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
        providerId 
      });
      
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
  @ApiOperation({ summary: 'Get all available providers' })
  @ApiResponse({ status: 200, description: 'Providers list retrieved successfully' })
  async getProviders() {
    try {
      LoggerUtil.debug('provider-orchestrator', 'HTTP GetProviders called');
      
      return {
        providers: [
          {
            id: 'openai',
            name: 'OpenAI',
            status: 'operational',
            models: ['gpt-4', 'gpt-3.5-turbo'],
            costPerToken: 0.0001,
          },
          {
            id: 'openrouter',
            name: 'OpenRouter',
            status: 'operational',
            models: ['gpt-4', 'claude-3'],
            costPerToken: 0.00008,
          },
        ],
      };
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'HTTP GetProviders failed', error as Error);
      throw error;
    }
  }
}
