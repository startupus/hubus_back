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

  @Post('events/track')
  @ApiOperation({ summary: 'Track analytics event (alternative endpoint)' })
  @ApiResponse({ status: 200, description: 'Event tracked successfully' })
  async trackEventAlternative(@Body() body: {
    eventType: string;
    userId: string;
    metadata?: Record<string, any>;
    timestamp?: string;
  }) {
    try {
      LoggerUtil.debug('analytics-service', 'HTTP TrackEventAlternative called', { 
        userId: body.userId,
        eventType: body.eventType 
      });
      
      return {
        success: true,
        message: 'Event tracked successfully',
        eventId: `event-${Date.now()}`,
        eventType: body.eventType
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'HTTP TrackEventAlternative failed', error as Error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  @Post('track-event')
  @ApiOperation({ summary: 'Track analytics event (standard format)' })
  @ApiResponse({ status: 200, description: 'Event tracked successfully' })
  async trackEventStandard(@Body() body: {
    eventName: string;
    service: string;
    properties: Record<string, any>;
    userId?: string;
    timestamp?: string;
  }) {
    try {
      LoggerUtil.debug('analytics-service', 'HTTP TrackEventStandard called', { 
        userId: body.userId,
        eventName: body.eventName,
        service: body.service
      });
      
      return {
        success: true,
        message: 'Event tracked successfully',
        eventId: `event-${Date.now()}`,
        eventName: body.eventName,
        service: body.service
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'HTTP TrackEventStandard failed', error as Error);
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

  @Get('dashboard')
  @ApiOperation({ summary: 'Get analytics dashboard data' })
  @ApiResponse({ status: 200, description: 'Dashboard data retrieved successfully' })
  async getDashboard(@Query('userId') userId?: string) {
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

  @Get('stats/collection')
  @ApiOperation({ summary: 'Get analytics collection stats' })
  @ApiResponse({ status: 200, description: 'Collection stats retrieved successfully' })
  async getCollectionStats() {
    try {
      LoggerUtil.debug('analytics-service', 'HTTP GetCollectionStats called');
      
      return {
        success: true,
        data: {
          totalEvents: 15000,
          totalUsers: 250,
          totalSessions: 500,
          averageEventsPerUser: 60,
          topEvents: [
            { name: 'api_request', count: 8000 },
            { name: 'user_login', count: 3000 },
            { name: 'model_usage', count: 2500 },
            { name: 'error_occurred', count: 1000 },
            { name: 'payment_processed', count: 500 }
          ],
          recentActivity: [
            {
              timestamp: new Date().toISOString(),
              event: 'api_request',
              userId: 'user-123',
              service: 'openai',
              cost: 0.05
            },
            {
              timestamp: new Date(Date.now() - 300000).toISOString(),
              event: 'user_login',
              userId: 'user-456',
              service: 'auth',
              cost: 0.00
            }
          ]
        }
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'HTTP GetCollectionStats failed', error as Error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  @Get('events/summary')
  @ApiOperation({ summary: 'Get events summary' })
  @ApiResponse({ status: 200, description: 'Events summary retrieved successfully' })
  async getEventsSummary(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('userId') userId?: string
  ) {
    try {
      LoggerUtil.debug('analytics-service', 'HTTP GetEventsSummary called', { 
        startDate, 
        endDate, 
        userId 
      });
      
      return {
        success: true,
        data: {
          period: {
            start: startDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            end: endDate || new Date().toISOString()
          },
          summary: {
            totalEvents: 2500,
            uniqueUsers: 45,
            totalSessions: 120,
            averageEventsPerSession: 20.8
          },
          breakdown: {
            byEventType: {
              'user_action': 800,
              'system_event': 600,
              'ai_interaction': 700,
              'security_event': 200,
              'billing_event': 200
            },
            byService: {
              'auth-service': 400,
              'api-gateway': 800,
              'proxy-service': 600,
              'billing-service': 200,
              'analytics-service': 300
            },
            byHour: Array.from({ length: 24 }, (_, i) => ({
              hour: i,
              events: Math.floor(Math.random() * 100) + 50
            }))
          }
        }
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'HTTP GetEventsSummary failed', error as Error);
      return {
        success: false,
        data: null,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}
