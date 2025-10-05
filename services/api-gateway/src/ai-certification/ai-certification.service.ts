import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { 
  AICertification, 
  AICertificationLevel,
  AICertificationStatus,
  LoggerUtil
} from '@ai-aggregator/shared';

export interface CertificationRequest {
  modelId: string;
  provider: string;
  modelName: string;
  requestedLevel: AICertificationLevel;
  testData?: any;
  metadata?: Record<string, any>;
}

export interface CertificationResponse {
  success: boolean;
  certification?: AICertification;
  errors?: string[];
  warnings?: string[];
  recommendations?: string[];
}

@Injectable()
export class AICertificationService {
  private readonly certificationServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.certificationServiceUrl = this.configService.get('CERTIFICATION_SERVICE_URL', 'http://ai-certification-service:3007');
  }

  async submitCertificationRequest(request: CertificationRequest): Promise<CertificationResponse> {
    try {
      LoggerUtil.info('api-gateway', 'Submitting certification request', {
        modelId: request.modelId,
        provider: request.provider,
        requestedLevel: request.requestedLevel
      });

      const response: AxiosResponse<CertificationResponse> = await firstValueFrom(
        this.httpService.post(`${this.certificationServiceUrl}/certification/submit`, request)
      );

      LoggerUtil.info('api-gateway', 'Certification request submitted', {
        modelId: request.modelId,
        success: response.data.success
      });

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Certification request failed', error, {
        modelId: request.modelId,
        provider: request.provider
      });

      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Certification service error',
          error.response.status
        );
      }

      throw new HttpException(
        'Failed to submit certification request',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCertificationLevels(): Promise<{ levels: AICertificationLevel[] }> {
    try {
      const response: AxiosResponse<{ levels: AICertificationLevel[] }> = await firstValueFrom(
        this.httpService.get(`${this.certificationServiceUrl}/certification/levels`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get certification levels failed', error);
      throw new HttpException('Failed to get certification levels', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getCertificationStatuses(): Promise<{ statuses: AICertificationStatus[] }> {
    try {
      const response: AxiosResponse<{ statuses: AICertificationStatus[] }> = await firstValueFrom(
        this.httpService.get(`${this.certificationServiceUrl}/certification/statuses`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get certification statuses failed', error);
      throw new HttpException('Failed to get certification statuses', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getModelCertification(modelId: string): Promise<AICertification | null> {
    try {
      const response: AxiosResponse<AICertification | null> = await firstValueFrom(
        this.httpService.get(`${this.certificationServiceUrl}/certification/model/${modelId}`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get model certification failed', error, { modelId });
      throw new HttpException('Failed to get model certification', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getAllCertifications(status?: AICertificationStatus, level?: AICertificationLevel): Promise<{ certifications: AICertification[] }> {
    try {
      const params: any = {};
      if (status) params.status = status;
      if (level) params.level = level;

      const response: AxiosResponse<{ certifications: AICertification[] }> = await firstValueFrom(
        this.httpService.get(`${this.certificationServiceUrl}/certification/all`, { params })
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get all certifications failed', error, { status, level });
      throw new HttpException('Failed to get certifications', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async revokeCertification(modelId: string, reason: string): Promise<{ success: boolean; message: string }> {
    try {
      const response: AxiosResponse<{ success: boolean; message: string }> = await firstValueFrom(
        this.httpService.post(`${this.certificationServiceUrl}/certification/revoke/${modelId}`, { reason })
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Revoke certification failed', error, { modelId, reason });
      throw new HttpException('Failed to revoke certification', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getLevelRequirements(level: AICertificationLevel): Promise<{
    level: AICertificationLevel;
    requirements: {
      minScore: number;
      minPassRate: number;
      requiredTests: string[];
      complianceStandards: string[];
    };
  }> {
    try {
      const response: AxiosResponse<{
        level: AICertificationLevel;
        requirements: {
          minScore: number;
          minPassRate: number;
          requiredTests: string[];
          complianceStandards: string[];
        };
      }> = await firstValueFrom(
        this.httpService.get(`${this.certificationServiceUrl}/certification/levels/${level}/requirements`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get level requirements failed', error, { level });
      throw new HttpException('Failed to get level requirements', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getRequirements(): Promise<any> {
    try {
      const response: AxiosResponse<any> = await firstValueFrom(
        this.httpService.get(`${this.certificationServiceUrl}/certification/requirements`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get requirements failed', error);
      throw new HttpException('Failed to get requirements', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
