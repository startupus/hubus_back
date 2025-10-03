import { Controller } from '@nestjs/common';
import { GrpcMethod } from '@nestjs/microservices';
import { LoggerUtil } from '@ai-aggregator/shared';

@Controller()
export class AnalyticsGrpcController {
  constructor() {}

  @GrpcMethod('AnalyticsService', 'TrackEvent')
  async trackEvent(data: any) {
    try {
      LoggerUtil.debug('analytics-service', 'gRPC TrackEvent called', { 
        userId: data.userId,
        eventName: data.eventName 
      });
      
      // Заглушка - в реальном проекте здесь будет сохранение события в БД
      return {
        success: true,
        message: 'Event tracked successfully',
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'gRPC TrackEvent failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @GrpcMethod('AnalyticsService', 'GetUsageMetrics')
  async getUsageMetrics(data: any) {
    try {
      LoggerUtil.debug('analytics-service', 'gRPC GetUsageMetrics called', { 
        userId: data.userId,
        startDate: data.startDate,
        endDate: data.endDate 
      });
      
      // Заглушка - в реальном проекте здесь будет запрос метрик из БД
      return {
        metrics: [
          {
            name: 'requests_count',
            value: 100,
            unit: 'count',
            timestamp: new Date().toISOString(),
          },
          {
            name: 'tokens_used',
            value: 5000,
            unit: 'tokens',
            timestamp: new Date().toISOString(),
          },
        ],
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'gRPC GetUsageMetrics failed', error as Error);
      return {
        metrics: [],
      };
    }
  }
}
