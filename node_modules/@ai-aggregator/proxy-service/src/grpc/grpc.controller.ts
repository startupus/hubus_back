import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { LoggerUtil } from '@ai-aggregator/shared';

@Controller()
export class ProxyGrpcController {
  constructor() {}

  @GrpcMethod('ProxyService', 'ProxyRequest')
  async proxyRequest(data: any) {
    try {
      LoggerUtil.debug('proxy-service', 'gRPC ProxyRequest called', { 
        user_id: data.user_id,
        provider: data.provider,
        model: data.model 
      });
      
      // Заглушка - в реальном проекте здесь будет проксирование к внешним AI провайдерам
      return {
        success: true,
        message: 'Request processed successfully',
        response_text: 'This is a mock AI response from the proxy service',
        input_tokens: 10,
        output_tokens: 20,
        cost: 0.05,
        currency: 'USD',
        response_time: 1.5,
        provider: data.provider || 'openai',
        model: data.model || 'gpt-4',
        finish_reason: 'stop',
        metadata: {},
      };
    } catch (error) {
      LoggerUtil.error('proxy-service', 'gRPC ProxyRequest failed', error as Error);
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
}
