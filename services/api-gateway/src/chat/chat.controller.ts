import { Controller, Post, Get, Body, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ChatService } from './chat.service';
import { 
  ChatCompletionRequest, 
  ChatCompletionResponse 
} from '@ai-aggregator/shared';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('completions')
  @ApiOperation({ summary: 'Create chat completion with anonymization' })
  @ApiResponse({ status: 200, description: 'Chat completion created successfully' })
  async createCompletion(
    @Body() request: any,
    @Query('user_id') userId: string,
    @Query('provider') provider: 'openai' | 'openrouter' | 'yandex' = 'openai'
  ): Promise<any> {
    console.log('Chat completion request received:', JSON.stringify(request, null, 2));
    return this.chatService.createCompletion(request, userId, provider);
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
}

