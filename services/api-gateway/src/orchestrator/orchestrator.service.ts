import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class OrchestratorService {
  private readonly orchestratorServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.orchestratorServiceUrl = this.configService.get('ORCHESTRATOR_SERVICE_URL', 'http://provider-orchestrator:3002');
  }

  async getModels() {
    try {
      LoggerUtil.debug('api-gateway', 'Getting available models');

      const response = await firstValueFrom(
        this.httpService.get(`${this.orchestratorServiceUrl}/orchestrator/models`)
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

  async routeRequest(requestData: any) {
    try {
      LoggerUtil.debug('api-gateway', 'Routing request to optimal provider', { requestData });

      const response = await firstValueFrom(
        this.httpService.post(`${this.orchestratorServiceUrl}/orchestrator/route-request`, requestData)
      );
      return response.data;
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to route request', error as Error);
      throw new HttpException(
        'Failed to route request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
