import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class ProxyService {
  private readonly proxyServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.proxyServiceUrl = this.configService.get('PROXY_SERVICE_URL', 'http://proxy-service:3003');
  }

  async proxyOpenAI(requestData: any) {
    try {
      LoggerUtil.debug('api-gateway', 'Proxying OpenAI request', { requestData });

      const response = await firstValueFrom(
        this.httpService.post(`${this.proxyServiceUrl}/proxy/openai/chat/completions`, requestData)
      );
      return response.data;
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to proxy OpenAI request', error as Error);
      throw new HttpException(
        'Failed to proxy OpenAI request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async proxyOpenRouter(requestData: any) {
    try {
      LoggerUtil.debug('api-gateway', 'Proxying OpenRouter request', { requestData });

      const response = await firstValueFrom(
        this.httpService.post(`${this.proxyServiceUrl}/proxy/openrouter/chat/completions`, requestData)
      );
      return response.data;
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to proxy OpenRouter request', error as Error);
      throw new HttpException(
        'Failed to proxy OpenRouter request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async proxyGitHub(requestData: any, userId?: string) {
    try {
      LoggerUtil.debug('api-gateway', 'Proxying GitHub request', { requestData, userId });

      const url = userId 
        ? `${this.proxyServiceUrl}/proxy/github/chat/completions?user_id=${userId}`
        : `${this.proxyServiceUrl}/proxy/github/chat/completions`;
        
      const response = await firstValueFrom(
        this.httpService.post(url, requestData)
      );
      return response.data;
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to proxy GitHub request', error as Error);
      throw new HttpException(
        'Failed to proxy GitHub request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getModels(provider?: string) {
    try {
      LoggerUtil.debug('api-gateway', 'Getting models', { provider });

      const url = provider 
        ? `${this.proxyServiceUrl}/proxy/models?provider=${provider}`
        : `${this.proxyServiceUrl}/proxy/models`;
        
      const response = await firstValueFrom(
        this.httpService.get(url)
      );
      return response.data;
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to get models', error as Error);
      throw new HttpException(
        'Failed to get models',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async validateRequest(requestData: any) {
    try {
      LoggerUtil.debug('api-gateway', 'Validating request', { requestData });

      const response = await firstValueFrom(
        this.httpService.post(`${this.proxyServiceUrl}/proxy/validate-request`, requestData)
      );
      return response.data;
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to validate request', error as Error);
      throw new HttpException(
        'Failed to validate request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
