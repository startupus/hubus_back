import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoggerUtil } from '@ai-aggregator/shared';

@ApiTags('Proxy Service')
@Controller('proxy')
export class ProxyController {
  constructor() {}

  @Post('request')
  @ApiOperation({ summary: 'Proxy request to external AI provider' })
  @ApiResponse({ status: 200, description: 'Request processed successfully' })
  async proxyRequest(@Body() body: {
    user_id: string;
    provider: string;
    model: string;
    request_type?: string;
    prompt: string;
    max_tokens?: number;
    temperature?: number;
    top_p?: number;
  }) {
    try {
      LoggerUtil.debug('proxy-service', 'HTTP ProxyRequest called', { 
        user_id: body.user_id,
        provider: body.provider,
        model: body.model 
      });
      
      return {
        success: true,
        message: 'Request processed successfully',
        response_text: 'This is a mock AI response from the proxy service',
        input_tokens: 10,
        output_tokens: 20,
        cost: 0.05,
        currency: 'USD',
        response_time: 1.5,
        provider: body.provider || 'openai',
        model: body.model || 'gpt-4',
        finish_reason: 'stop',
        metadata: {},
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'HTTP ProxyRequest failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        response_text: '',
        input_tokens: 0,
        output_tokens: 0,
        cost: 0,
        currency: 'USD',
        response_time: 0,
        provider: '',
        model: '',
        finish_reason: 'error',
        metadata: {},
      };
    }
  }

  @Get('models')
  @ApiOperation({ summary: 'Get available models' })
  @ApiResponse({ status: 200, description: 'Models retrieved successfully' })
  async getModels(
    @Query('provider') provider?: string,
    @Query('category') category?: string
  ) {
    try {
      LoggerUtil.debug('proxy-service', 'HTTP GetModels called', { provider, category });
      
      return {
        success: true,
        message: 'Models retrieved successfully',
        models: [
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
        ],
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'HTTP GetModels failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        models: [],
      };
    }
  }

  @Get('models/:provider/:model')
  @ApiOperation({ summary: 'Get model information' })
  @ApiResponse({ status: 200, description: 'Model info retrieved successfully' })
  async getModelInfo(
    @Param('provider') provider: string,
    @Param('model') model: string
  ) {
    try {
      LoggerUtil.debug('proxy-service', 'HTTP GetModelInfo called', { provider, model });
      
      return {
        success: true,
        message: 'Model info retrieved successfully',
        model: {
          id: model,
          name: model,
          provider: provider,
          category: 'chat',
          description: `Information about ${model} from ${provider}`,
          max_tokens: 4096,
          cost_per_input_token: 0.00003,
          cost_per_output_token: 0.00006,
          currency: 'USD',
          is_available: true,
          capabilities: ['chat', 'completion'],
          created_at: '2023-01-01T00:00:00Z',
          updated_at: '2023-01-01T00:00:00Z',
        },
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'HTTP GetModelInfo failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        model: null,
      };
    }
  }

  @Post('validate-request')
  @ApiOperation({ summary: 'Validate request before processing' })
  @ApiResponse({ status: 200, description: 'Request validated successfully' })
  async validateRequest(@Body() body: {
    user_id: string;
    provider: string;
    model: string;
    request_type: string;
    prompt: string;
    max_tokens?: number;
  }) {
    try {
      LoggerUtil.debug('proxy-service', 'HTTP ValidateRequest called', { 
        user_id: body.user_id,
        provider: body.provider,
        model: body.model 
      });
      
      return {
        success: true,
        message: 'Request is valid',
        is_valid: true,
        errors: [],
        warnings: [],
        estimated_tokens: body.prompt.length / 4,
        estimated_cost: (body.prompt.length / 4) * 0.00003,
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'HTTP ValidateRequest failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        is_valid: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        warnings: [],
        estimated_tokens: 0,
        estimated_cost: 0,
      };
    }
  }
}
