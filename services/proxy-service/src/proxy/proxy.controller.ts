import { Controller, Post, Get, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoggerUtil, ChatCompletionRequest, ChatCompletionResponse } from '@ai-aggregator/shared';
import { ProxyService } from './proxy.service';

@ApiTags('Proxy Service')
@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('chat/completions')
  @ApiOperation({ summary: 'Process chat completion with anonymization' })
  @ApiResponse({ status: 200, description: 'Chat completion processed successfully' })
  async chatCompletions(
    @Body() request: any,
    @Query('user_id') userId: string,
    @Query('provider') provider: 'openai' | 'openrouter' | 'github' | 'yandex' = 'openai'
  ): Promise<any> {
    try {
      // Валидация входных данных
      if (!request || !request.model) {
        throw new Error('Missing required field: model');
      }
      
      if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
        throw new Error('Missing or invalid messages array');
      }
      
      LoggerUtil.debug('proxy-service', 'Chat completions request', { 
        userId,
        provider,
        model: request.model,
        messageCount: request.messages?.length || 0
      });
      
      return await this.proxyService.processChatCompletion(request, userId, provider);
    } catch (error) {
      LoggerUtil.error('proxy-service', 'Chat completions failed', error as Error, {
        userId,
        provider,
        model: request.model
      });
      throw error;
    }
  }

  @Get('models')
  @ApiOperation({ summary: 'Get available models' })
  @ApiResponse({ status: 200, description: 'Models retrieved successfully' })
  async getModels(
    @Query('provider') provider?: 'openai' | 'openrouter' | 'github' | 'yandex',
    @Query('category') category?: string
  ) {
    try {
      LoggerUtil.debug('proxy-service', 'Get models request', { provider, category });
      
      const models = await this.proxyService.getAvailableModels(provider);
      
      return {
        success: true,
        message: 'Models retrieved successfully',
        models: models.filter(model => !category || model.category === category),
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'Get models failed', error as Error, { provider, category });
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
    @Param('provider') provider: 'openai' | 'openrouter' | 'github' | 'yandex',
    @Param('model') model: string
  ) {
    try {
      LoggerUtil.debug('proxy-service', 'Get model info request', { provider, model });
      
      const models = await this.proxyService.getAvailableModels(provider);
      const modelInfo = models.find(m => m.id === model);
      
      if (!modelInfo) {
        return {
          success: false,
          message: `Model ${model} not found for provider ${provider}`,
          model: null,
        };
      }
      
      return {
        success: true,
        message: 'Model info retrieved successfully',
        model: modelInfo,
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'Get model info failed', error as Error, { provider, model });
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        model: null,
      };
    }
  }

  @Post('github/chat/completions')
  @ApiOperation({ summary: 'Process GitHub Models chat completion' })
  @ApiResponse({ status: 200, description: 'GitHub chat completion processed successfully' })
  async githubChatCompletions(
    @Body() request: any,
    @Query('user_id') userId: string
  ): Promise<any> {
    try {
      LoggerUtil.debug('proxy-service', 'GitHub chat completions request', { 
        userId,
        model: request.model,
        messageCount: request.messages?.length || 0
      });
      
      return await this.proxyService.processChatCompletion(request, userId, 'github');
    } catch (error) {
      LoggerUtil.error('proxy-service', 'GitHub chat completions failed', error as Error, {
        userId,
        model: request.model
      });
      throw error;
    }
  }

  @Post('validate-request')
  @ApiOperation({ summary: 'Validate request before processing' })
  @ApiResponse({ status: 200, description: 'Request validated successfully' })
  async validateRequest(@Body() request: ChatCompletionRequest) {
    try {
      LoggerUtil.debug('proxy-service', 'Validate request', { 
        model: request.model,
        messageCount: request.messages.length
      });
      
      const validation = await this.proxyService.validateRequest(request);
      
      return {
        success: validation.isValid,
        message: validation.isValid ? 'Request is valid' : 'Request validation failed',
        is_valid: validation.isValid,
        errors: validation.errors,
        warnings: validation.warnings,
        estimated_tokens: validation.estimatedTokens,
        estimated_cost: validation.estimatedCost,
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'Validate request failed', error as Error, {
        model: request.model
      });
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
