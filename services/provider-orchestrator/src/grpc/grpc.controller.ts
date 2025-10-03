import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { LoggerUtil } from '@ai-aggregator/shared';

@Controller()
export class OrchestratorGrpcController {
  constructor() {}

  @GrpcMethod('ProviderOrchestratorService', 'RouteRequest')
  async routeRequest(data: any) {
    try {
      LoggerUtil.debug('provider-orchestrator', 'gRPC RouteRequest called', { 
        userId: data.userId,
        model: data.model 
      });
      
      // Заглушка - в реальном проекте здесь будет маршрутизация запроса
      return {
        response: 'AI response from provider',
        provider: 'openai',
        model: data.model || 'gpt-4',
        cost: 0.05,
      };
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'gRPC RouteRequest failed', error as Error);
      throw error;
    }
  }

  @GrpcMethod('ProviderOrchestratorService', 'GetProviderStatus')
  async getProviderStatus(data: any) {
    try {
      LoggerUtil.debug('provider-orchestrator', 'gRPC GetProviderStatus called', { 
        provider_id: data.provider_id 
      });
      
      // Заглушка - в реальном проекте здесь будет проверка статуса провайдера
      return {
        providerName: data.provider_id,
        status: 'operational',
        lastChecked: new Date().toISOString(),
        message: 'Provider is operational',
      };
    } catch (error) {
      LoggerUtil.error('provider-orchestrator', 'gRPC GetProviderStatus failed', error as Error);
      throw error;
    }
  }
}
