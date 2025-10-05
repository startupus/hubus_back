import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { AxiosResponse } from 'axios';
import { 
  AIClassificationRequest, 
  AIClassificationResponse,
  AICategory,
  AIClassification,
  LoggerUtil
} from '@ai-aggregator/shared';

@Injectable()
export class AIClassificationService {
  private readonly classificationServiceUrl: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.classificationServiceUrl = this.configService.get('CLASSIFICATION_SERVICE_URL', 'http://classification-service:3006');
  }

  async classifyModel(request: AIClassificationRequest): Promise<AIClassificationResponse> {
    try {
      LoggerUtil.info('api-gateway', 'Classifying AI model', {
        modelId: request.modelId,
        provider: request.provider,
        modelName: request.modelName
      });

      const response: AxiosResponse<AIClassificationResponse> = await firstValueFrom(
        this.httpService.post(`${this.classificationServiceUrl}/ai/classification/classify`, request)
      );

      LoggerUtil.info('api-gateway', 'Model classification completed', {
        modelId: request.modelId,
        success: response.data.success
      });

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Model classification failed', error, {
        modelId: request.modelId,
        provider: request.provider
      });

      if (error.response?.status) {
        throw new HttpException(
          error.response.data?.message || 'Classification service error',
          error.response.status
        );
      }

      throw new HttpException(
        'Failed to classify model',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  async getCategories(): Promise<{ categories: AICategory[] }> {
    try {
      const response: AxiosResponse<{ categories: AICategory[] }> = await firstValueFrom(
        this.httpService.get(`${this.classificationServiceUrl}/ai/classification/categories`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get categories failed', error);
      throw new HttpException('Failed to get categories', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getCategoryInfo(category: string): Promise<{
    category: AICategory;
    description: string;
    useCases: string[];
  }> {
    try {
      const response: AxiosResponse<{
        category: AICategory;
        description: string;
        useCases: string[];
      }> = await firstValueFrom(
        this.httpService.get(`${this.classificationServiceUrl}/ai/classification/categories/${category}`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get category info failed', error, { category });
      throw new HttpException('Failed to get category info', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  async getModelClassification(modelId: string): Promise<AIClassification | null> {
    try {
      const response: AxiosResponse<AIClassification | null> = await firstValueFrom(
        this.httpService.get(`${this.classificationServiceUrl}/ai/classification/models/${modelId}/classification`)
      );

      return response.data;
    } catch (error: any) {
      LoggerUtil.error('api-gateway', 'Get model classification failed', error, { modelId });
      throw new HttpException('Failed to get model classification', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
