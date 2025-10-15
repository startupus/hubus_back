import { Controller, Post, Get, Body, Query, HttpException, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProxyService } from './proxy.service';

@ApiTags('Proxy')
@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('openai/chat/completions')
  @ApiOperation({ summary: 'Proxy OpenAI chat completions' })
  @ApiResponse({ status: 200, description: 'Request proxied successfully' })
  async proxyOpenAI(@Body() requestData: any) {
    try {
      return await this.proxyService.proxyOpenAI(requestData);
    } catch (error) {
      throw new HttpException(
        'Failed to proxy OpenAI request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('openrouter/chat/completions')
  @ApiOperation({ summary: 'Proxy OpenRouter chat completions' })
  @ApiResponse({ status: 200, description: 'Request proxied successfully' })
  async proxyOpenRouter(@Body() requestData: any) {
    try {
      return await this.proxyService.proxyOpenRouter(requestData);
    } catch (error) {
      throw new HttpException(
        'Failed to proxy OpenRouter request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('github/chat/completions')
  @ApiOperation({ summary: 'Proxy GitHub Models chat completions' })
  @ApiResponse({ status: 200, description: 'Request proxied successfully' })
  async proxyGitHub(@Body() requestData: any, @Query('user_id') userId?: string) {
    try {
      return await this.proxyService.proxyGitHub(requestData, userId);
    } catch (error) {
      throw new HttpException(
        'Failed to proxy GitHub request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('models')
  @ApiOperation({ summary: 'Get available models' })
  @ApiResponse({ status: 200, description: 'Models retrieved successfully' })
  async getModels(@Query('provider') provider?: string) {
    try {
      return await this.proxyService.getModels(provider);
    } catch (error) {
      throw new HttpException(
        'Failed to get models',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('validate-request')
  @ApiOperation({ summary: 'Validate request format' })
  @ApiResponse({ status: 200, description: 'Request validated successfully' })
  async validateRequest(@Body() requestData: any) {
    try {
      return await this.proxyService.validateRequest(requestData);
    } catch (error) {
      throw new HttpException(
        'Failed to validate request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
