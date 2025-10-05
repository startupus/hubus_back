import { Controller, Post, Get, Body, Param, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoggerUtil } from '@ai-aggregator/shared';
import { OrchestratorService, RequestAnalysis, RouteResponse, ProviderStatus } from './orchestrator.service';

@ApiTags('Provider Orchestrator')
@Controller('orchestrator')
export class OrchestratorController {
  constructor(private readonly orchestratorService: OrchestratorService) {}

  @Post('route-request')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Route AI request to appropriate provider' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        userId: { type: 'string' },
        model: { type: 'string' },
        prompt: { type: 'string' },
        expectedTokens: { type: 'number', default: 100 },
        budget: { type: 'number', description: 'Maximum cost in USD' },
        urgency: { type: 'string', enum: ['low', 'medium', 'high'], default: 'medium' },
        quality: { type: 'string', enum: ['standard', 'premium'], default: 'standard' },
        options: { type: 'object', description: 'Additional request options' }
      },
      required: ['userId', 'model', 'prompt']
    }
  })
  @ApiResponse({ status: 200, description: 'Request routed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  @ApiResponse({ status: 503, description: 'No providers available' })
  async routeRequest(@Body() body: {
    userId: string;
    model: string;
    prompt: string;
    expectedTokens?: number;
    budget?: number;
    urgency?: 'low' | 'medium' | 'high';
    quality?: 'standard' | 'premium';
    options?: Record<string, any>;
  }): Promise<RouteResponse> {
    try {
      LoggerUtil.debug('provider-orchestrator', 'HTTP RouteRequest called', { 
        userId: body.userId,
        model: body.model,
        urgency: body.urgency,
        quality: body.quality
      });

      const analysis: RequestAnalysis = {
        userId: body.userId,
        model: body.model,
        prompt: body.prompt,
        expectedTokens: body.expectedTokens || 100,
        budget: body.budget,
        urgency: body.urgency || 'medium',
        quality: body.quality || 'standard',
        options: body.options
      };

      const result = await this.orchestratorService.routeRequest(analysis);
      
      LoggerUtil.info('provider-orchestrator', 'Request routed successfully', {
        userId: body.userId,
        provider: result.provider,
        cost: result.cost,
        responseTime: result.responseTime,
        fallbackUsed: result.fallbackUsed
      });

      return result;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'HTTP RouteRequest failed', error as Error, {
        userId: body.userId,
        model: body.model
      });
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        fallbackUsed: false
      };
    }
  }

  @Get('provider-status/:providerId')
  @ApiOperation({ summary: 'Get provider status' })
  @ApiResponse({ status: 200, description: 'Provider status retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Provider not found' })
  async getProviderStatus(@Param('providerId') providerId: string): Promise<ProviderStatus> {
    try {
      LoggerUtil.debug('provider-orchestrator', 'HTTP GetProviderStatus called', { 
        providerId 
      });
      
      const status = await this.orchestratorService.getProviderStatus(providerId);
      
      LoggerUtil.info('provider-orchestrator', 'Provider status retrieved', {
        providerId,
        status: status.status,
        responseTime: status.responseTime,
        successRate: status.successRate
      });

      return status;
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'HTTP GetProviderStatus failed', error as Error, { providerId });
      throw error;
    }
  }

  @Get('providers')
  @ApiOperation({ summary: 'Get all available providers' })
  @ApiResponse({ status: 200, description: 'Providers list retrieved successfully' })
  async getProviders() {
    try {
      LoggerUtil.debug('provider-orchestrator', 'HTTP GetProviders called');
      
      const providers = await this.orchestratorService.getProviders();
      
      LoggerUtil.info('provider-orchestrator', 'Providers list retrieved', {
        count: providers.length,
        providers: providers.map(p => ({ id: p.id, name: p.name, status: p.isActive ? 'active' : 'inactive' }))
      });

      return {
        providers: providers.map(provider => ({
          id: provider.id,
          name: provider.name,
          models: provider.models,
          costPerToken: provider.costPerToken,
          maxTokens: provider.maxTokens,
          responseTime: provider.responseTime,
          successRate: provider.successRate,
          isActive: provider.isActive,
          priority: provider.priority
        }))
      };
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'HTTP GetProviders failed', error as Error);
      throw error;
    }
  }
}
