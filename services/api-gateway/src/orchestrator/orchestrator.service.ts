import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class OrchestratorService {
  async getModels() {
    try {
      LoggerUtil.debug('api-gateway', 'Getting available models');

      // Mock response for now
      return {
        models: [
          {
            id: 'gpt-3.5-turbo',
            name: 'GPT-3.5 Turbo',
            provider: 'openai',
            type: 'chat',
            isActive: true,
            pricing: {
              input: 0.0015,
              output: 0.002
            }
          },
          {
            id: 'gpt-4',
            name: 'GPT-4',
            provider: 'openai',
            type: 'chat',
            isActive: true,
            pricing: {
              input: 0.03,
              output: 0.06
            }
          },
          {
            id: 'claude-3-sonnet',
            name: 'Claude 3 Sonnet',
            provider: 'anthropic',
            type: 'chat',
            isActive: true,
            pricing: {
              input: 0.003,
              output: 0.015
            }
          }
        ]
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to get models', error as Error);
      throw new HttpException(
        'Failed to get models',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async routeRequest(requestData: any) {
    try {
      LoggerUtil.debug('api-gateway', 'Routing request to optimal provider', { requestData });

      // Mock response for now
      return {
        providerId: 'openai',
        model: requestData.model || 'gpt-3.5-turbo',
        cost: 0.001,
        estimatedResponseTime: 1.5,
        routingReason: 'Optimal provider selected based on cost and performance'
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to route request', error as Error);
      throw new HttpException(
        'Failed to route request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
