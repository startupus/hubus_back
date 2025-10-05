import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { 
  AISafetyLevel,
  AISafetyAssessment,
  SafetyIncident,
  RiskFactorCategory,
  LoggerUtil
} from '@ai-aggregator/shared';

export interface SafetyTestRequest {
  modelId: string;
  testData?: any;
  testType: 'comprehensive' | 'quick' | 'targeted';
  focusAreas?: RiskFactorCategory[];
}

export interface SafetyTestResponse {
  success: boolean;
  assessment?: AISafetyAssessment;
  errors?: string[];
  warnings?: string[];
  recommendations?: string[];
}

@Injectable()
export class AISafetyService {
  private readonly safetyServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.safetyServiceUrl = this.configService.get('SAFETY_SERVICE_URL', 'http://safety-service:3008');
  }

  async conductSafetyAssessment(request: SafetyTestRequest): Promise<SafetyTestResponse> {
    try {
      LoggerUtil.info('api-gateway', 'Conducting safety assessment', {
        modelId: request.modelId,
        testType: request.testType,
        focusAreas: request.focusAreas
      });

      const response: AxiosResponse<SafetyTestResponse> = await firstValueFrom(
        this.httpService.post(`${this.safetyServiceUrl}/ai/safety/assess`, request)
      );

      LoggerUtil.info('api-gateway', 'Safety assessment completed', {
        modelId: request.modelId,
        success: response.data.success
      });

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Safety assessment failed', error, {
        modelId: request.modelId,
        testType: request.testType
      });

      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Safety service error',
          error.response.status
        );
      }

      throw new HttpException(
        'Failed to conduct safety assessment',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getSafetyLevels(): Promise<{ levels: AISafetyLevel[] }> {
    try {
      const response: AxiosResponse<{ levels: AISafetyLevel[] }> = await firstValueFrom(
        this.httpService.get(`${this.safetyServiceUrl}/ai/safety/levels`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get safety levels failed', error);
      throw new HttpException('Failed to get safety levels', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getRiskCategories(): Promise<{ categories: RiskFactorCategory[] }> {
    try {
      const response: AxiosResponse<{ categories: RiskFactorCategory[] }> = await firstValueFrom(
        this.httpService.get(`${this.safetyServiceUrl}/ai/safety/risk-categories`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get risk categories failed', error);
      throw new HttpException('Failed to get risk categories', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getModelAssessment(modelId: string): Promise<AISafetyAssessment | null> {
    try {
      const response: AxiosResponse<AISafetyAssessment | null> = await firstValueFrom(
        this.httpService.get(`${this.safetyServiceUrl}/ai/safety/models/${modelId}/assessment`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get model assessment failed', error, { modelId });
      throw new HttpException('Failed to get model assessment', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getModelIncidents(modelId: string, severity?: string): Promise<{ incidents: SafetyIncident[] }> {
    try {
      const params: any = {};
      if (severity) params.severity = severity;

      const response: AxiosResponse<{ incidents: SafetyIncident[] }> = await firstValueFrom(
        this.httpService.get(`${this.safetyServiceUrl}/ai/safety/models/${modelId}/incidents`, { params })
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get model incidents failed', error, { modelId, severity });
      throw new HttpException('Failed to get model incidents', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async reportIncident(incident: Omit<SafetyIncident, 'id'>): Promise<SafetyIncident> {
    try {
      const response: AxiosResponse<SafetyIncident> = await firstValueFrom(
        this.httpService.post(`${this.safetyServiceUrl}/ai/safety/incidents`, incident)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Report incident failed', error, { incident });
      throw new HttpException('Failed to report incident', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getSafetyStatistics(modelId: string): Promise<{
    totalIncidents: number;
    criticalIncidents: number;
    resolvedIncidents: number;
    averageResolutionTime: number;
  }> {
    try {
      const response: AxiosResponse<{
        totalIncidents: number;
        criticalIncidents: number;
        resolvedIncidents: number;
        averageResolutionTime: number;
      }> = await firstValueFrom(
        this.httpService.get(`${this.safetyServiceUrl}/ai/safety/models/${modelId}/statistics`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get safety statistics failed', error, { modelId });
      throw new HttpException('Failed to get safety statistics', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getSafetyLevelDescription(level: AISafetyLevel): Promise<{
    level: AISafetyLevel;
    description: string;
    requirements: string[];
    restrictions: string[];
  }> {
    try {
      const response: AxiosResponse<{
        level: AISafetyLevel;
        description: string;
        requirements: string[];
        restrictions: string[];
      }> = await firstValueFrom(
        this.httpService.get(`${this.safetyServiceUrl}/ai/safety/levels/${level}/description`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get safety level description failed', error, { level });
      throw new HttpException('Failed to get safety level description', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
