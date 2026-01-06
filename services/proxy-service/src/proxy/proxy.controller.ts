import { Controller, Post, Get, Body, Param, Query, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody } from '@nestjs/swagger';
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
    @Query('provider') provider: 'openrouter' = 'openrouter'
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
  @ApiOperation({ summary: 'Get available models from OpenRouter' })
  @ApiResponse({ status: 200, description: 'Models retrieved successfully' })
  async getModels(
    @Query('provider') provider?: 'openrouter',
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
    @Param('provider') provider: 'openrouter',
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


  @Get('models/audio')
  @ApiOperation({ summary: 'Get models with audio/video support' })
  @ApiResponse({ status: 200, description: 'Audio-capable models retrieved successfully' })
  async getAudioModels() {
    try {
      LoggerUtil.debug('proxy-service', 'Get audio-capable models request');
      
      const audioModels = await this.proxyService.getAudioCapableModels();
      
      return {
        success: true,
        message: 'Audio-capable models retrieved successfully',
        models: audioModels,
        count: audioModels.length
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'Get audio models failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
        models: [],
        count: 0
      };
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

  @Post('openai/chat/completions')
  @ApiOperation({ summary: 'Process chat completion request directly to OpenAI (for video support)' })
  @ApiResponse({ status: 200, description: 'Chat completion processed successfully' })
  async openaiChatCompletions(
    @Body() request: any,
    @Query('user_id') userId: string
  ): Promise<any> {
    try {
      if (!request || !request.model) {
        throw new Error('Missing required field: model');
      }
      
      if (!request.messages || !Array.isArray(request.messages) || request.messages.length === 0) {
        throw new Error('Missing or invalid messages array');
      }
      
      LoggerUtil.debug('proxy-service', 'OpenAI chat completions request', { 
        userId,
        model: request.model,
        messageCount: request.messages?.length || 0
      });
      
      return await this.proxyService.processChatCompletion(request, userId, 'openrouter');
    } catch (error) {
      LoggerUtil.error('proxy-service', 'OpenAI chat completions failed', error as Error, {
        userId,
        model: request?.model
      });
      throw error;
    }
  }

  @Post('embeddings')
  @ApiOperation({ summary: 'Process embeddings request' })
  @ApiResponse({ status: 200, description: 'Embeddings generated successfully' })
  async embeddings(
    @Body() request: { model: string; input: string | string[]; user?: string },
    @Query('user_id') userId: string,
    @Query('provider') provider: 'openrouter' = 'openrouter'
  ): Promise<any> {
    try {
      if (!request || !request.model) {
        throw new Error('Missing required field: model');
      }
      
      if (!request.input) {
        throw new Error('Missing required field: input');
      }
      
      LoggerUtil.debug('proxy-service', 'Embeddings request', { 
        userId,
        provider,
        model: request.model,
        inputType: Array.isArray(request.input) ? 'array' : 'string'
      });
      
      return await this.proxyService.processEmbeddings(request, userId, provider);
    } catch (error) {
      LoggerUtil.error('proxy-service', 'Embeddings failed', error as Error, {
        userId,
        provider,
        model: request?.model
      });
      throw error;
    }
  }

  @Post('audio/transcriptions')
  @UseInterceptors(FileInterceptor('file', {
    limits: {
      fileSize: 50 * 1024 * 1024, // 50 MB
    },
  }))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Process audio transcription request' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Audio or video file to transcribe'
        },
        model: {
          type: 'string',
          default: 'whisper-1',
          description: 'Model to use for transcription'
        },
        language: {
          type: 'string',
          description: 'Language code (e.g., ru, en)'
        },
        prompt: {
          type: 'string',
          description: 'Optional prompt to improve accuracy'
        },
        temperature: {
          type: 'number',
          description: 'Temperature (0.0 - 1.0)'
        },
        response_format: {
          type: 'string',
          enum: ['json', 'text', 'srt', 'verbose_json', 'vtt'],
          default: 'verbose_json',
          description: 'Response format'
        }
      },
      required: ['file', 'model']
    }
  })
  @ApiResponse({ status: 200, description: 'Audio transcribed successfully' })
  async audioTranscriptions(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Query('user_id') userId: string,
    @Query('provider') provider: 'openrouter' = 'openrouter'
  ): Promise<any> {
    try {
      if (!file) {
        throw new Error('Missing required field: file');
      }

      const request = {
        model: body.model || 'whisper-1',
        language: body.language,
        prompt: body.prompt,
        temperature: body.temperature ? parseFloat(body.temperature) : undefined,
        response_format: body.response_format || 'verbose_json'
      };
      
      LoggerUtil.debug('proxy-service', 'Audio transcription request', { 
        userId,
        provider,
        model: request.model,
        fileSize: file.size
      });
      
      return await this.proxyService.processAudioTranscription(file, request, userId, provider);
    } catch (error) {
      LoggerUtil.error('proxy-service', 'Audio transcription failed', error as Error, {
        userId,
        provider
      });
      throw error;
    }
  }
}
