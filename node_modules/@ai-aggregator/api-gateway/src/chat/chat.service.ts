import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { 
  ChatCompletionRequest, 
  ChatCompletionResponse, 
  LoggerUtil 
} from '@ai-aggregator/shared';

@Injectable()
export class ChatService {
  private readonly proxyServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.proxyServiceUrl = this.configService.get('PROXY_SERVICE_URL', 'http://proxy-service:3003');
  }

  async createCompletion(
    request: any,
    userId: string,
    provider: 'openai' | 'openrouter' | 'yandex' = 'openai'
  ): Promise<any> {
    try {
      LoggerUtil.info('api-gateway', 'Creating chat completion', {
        userId,
        provider,
        model: request.model,
        messageCount: request.messages.length,
        request: JSON.stringify(request, null, 2)
      });

      const response: AxiosResponse<ChatCompletionResponse> = await firstValueFrom(
        this.httpService.post(
          `${this.proxyServiceUrl}/proxy/chat/completions?user_id=${userId}&provider=${provider}`,
          request
        )
      );

      LoggerUtil.info('api-gateway', 'Chat completion created successfully', {
        userId,
        provider,
        model: request.model,
        processingTimeMs: response.data.processing_time_ms
      });

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Chat completion failed', error, {
        userId,
        provider,
        model: request.model
      });

      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Proxy service error',
          error.response.status
        );
      }

      throw new HttpException(
        'Failed to create chat completion',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getModels(provider?: 'openai' | 'openrouter' | 'yandex'): Promise<any[]> {
    try {
      const response: AxiosResponse<{ success: boolean; models: any[] }> = await firstValueFrom(
        this.httpService.get(`${this.proxyServiceUrl}/proxy/models`, {
          params: provider ? { provider } : {}
        })
      );

      if (!response.data.success) {
        throw new HttpException('Failed to get models', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return response.data.models;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get models failed', error, { provider });
      throw new HttpException('Failed to get models', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getModelInfo(provider: 'openai' | 'openrouter' | 'yandex', model: string): Promise<any> {
    try {
      const response: AxiosResponse<{ success: boolean; model: any }> = await firstValueFrom(
        this.httpService.get(`${this.proxyServiceUrl}/proxy/models/${provider}/${model}`)
      );

      if (!response.data.success) {
        throw new HttpException('Failed to get model info', HttpStatus.INTERNAL_SERVER_ERROR);
      }

      return response.data.model;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get model info failed', error, { provider, model });
      throw new HttpException('Failed to get model info', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async validateRequest(request: ChatCompletionRequest): Promise<{
    isValid: boolean;
    errors: string[];
    warnings: string[];
    estimatedTokens: number;
    estimatedCost: number;
  }> {
    try {
      const response: AxiosResponse<{
        success: boolean;
        is_valid: boolean;
        errors: string[];
        warnings: string[];
        estimated_tokens: number;
        estimated_cost: number;
      }> = await firstValueFrom(
        this.httpService.post(`${this.proxyServiceUrl}/proxy/validate-request`, request)
      );

      return {
        isValid: response.data.is_valid,
        errors: response.data.errors,
        warnings: response.data.warnings,
        estimatedTokens: response.data.estimated_tokens,
        estimatedCost: response.data.estimated_cost,
      };
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Validate request failed', error);
      throw new HttpException('Failed to validate request', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}

