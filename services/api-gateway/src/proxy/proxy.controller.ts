import { Controller, Post, Body, HttpException, HttpStatus } from '@nestjs/common';
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
