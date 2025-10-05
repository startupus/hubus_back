import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LoggerUtil } from '@ai-aggregator/shared';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor() {}

  @Post('track-event')
  @ApiOperation({ summary: 'Track analytics event' })
  @ApiResponse({ status: 200, description: 'Event tracked successfully' })
  async trackEvent(@Body() body: {
    userId: string;
    eventName: string;
    properties?: Record<string, string>;
    timestamp?: string;
  }) {
    try {
      LoggerUtil.debug('analytics-service', 'HTTP TrackEvent called', { 
        userId: body.userId,
        eventName: body.eventName 
      });
      
      return {
        success: true,
        message: 'Event tracked successfully',
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'HTTP TrackEvent failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Get('usage-metrics/:userId')
  @ApiOperation({ summary: 'Get usage metrics for user' })
  @ApiResponse({ status: 200, description: 'Usage metrics retrieved successfully' })
  async getUsageMetrics(
    @Query('userId') userId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      LoggerUtil.debug('analytics-service', 'HTTP GetUsageMetrics called', { 
        userId,
        startDate,
        endDate 
      });
      
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
          {
            name: 'total_cost',
            value: 25.50,
            unit: 'USD',
            timestamp: new Date().toISOString(),
          },
          {
            name: 'average_response_time',
            value: 1.2,
            unit: 'seconds',
            timestamp: new Date().toISOString(),
          },
        ],
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'HTTP GetUsageMetrics failed', error as Error);
      return {
        metrics: [],
      };
    }
  }

  @Get('dashboard/:userId')
  @ApiOperation({ summary: 'Get analytics dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@Query('userId') userId: string) {
    try {
      LoggerUtil.debug('analytics-service', 'HTTP GetDashboard called', { userId });
      
      return {
        summary: {
          total_requests: 1250,
          total_tokens: 45000,
          total_cost: 125.75,
          average_response_time: 1.5,
          success_rate: 98.5,
        },
        recent_activity: [
          {
            timestamp: new Date().toISOString(),
            event: 'api_request',
            details: 'GPT-4 completion request',
            cost: 0.05,
          },
          {
            timestamp: new Date(Date.now() - 300000).toISOString(),
            event: 'api_request',
            details: 'GPT-3.5-turbo completion request',
            cost: 0.02,
          },
        ],
        top_models: [
          { model: 'gpt-4', requests: 800, cost: 100.50 },
          { model: 'gpt-3.5-turbo', requests: 450, cost: 25.25 },
        ],
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'HTTP GetDashboard failed', error as Error);
      throw error;
    }
  }

  @Get('ping')
  @ApiOperation({ summary: 'Ping check for analytics service' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async getPing() {
    return {
      service: 'analytics-service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
  }
}
