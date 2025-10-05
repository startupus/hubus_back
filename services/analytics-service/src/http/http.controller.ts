import { Controller, Post, Get, Body, Param, Query, HttpCode, HttpStatus, ValidationPipe, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { LoggerUtil } from '@ai-aggregator/shared';
import { AnalyticsService } from '../services/analytics.service';
import { TrackEventDto } from '../dto/analytics.dto';

@ApiTags('analytics')
@Controller('analytics')
export class HttpController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Post('events/track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Track event' })
  @ApiBody({ type: TrackEventDto })
  @ApiResponse({ status: 200, description: 'Event tracked successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - validation failed' })
  async trackEvent(@Body(ValidationPipe) data: TrackEventDto) {
    try {
      LoggerUtil.debug('analytics-service', 'HTTP TrackEvent called', { 
        userId: data.userId,
        eventName: data.eventName,
        eventType: data.eventType,
        service: data.service
      });

      // Валидация обязательных полей
      if (!data.eventName || !data.eventType || !data.service) {
        throw new BadRequestException('Missing required fields: eventName, eventType, service are required');
      }

      // Валидация eventType
      const validEventTypes = ['user_action', 'system_event', 'ai_interaction', 'security_event'];
      if (!validEventTypes.includes(data.eventType)) {
        throw new BadRequestException(`Invalid eventType. Must be one of: ${validEventTypes.join(', ')}`);
      }
      
      const result = await this.analyticsService.trackEvent({
        userId: data.userId,
        eventName: data.eventName,
        eventType: data.eventType,
        service: data.service,
        properties: data.properties || {},
        metadata: data.metadata || {}
      });
      
      LoggerUtil.info('analytics-service', 'Event tracked successfully', {
        eventId: result.eventId,
        eventName: data.eventName,
        userId: data.userId
      });
      
      return {
        success: result.success,
        message: 'Event tracked successfully',
        eventId: result.eventId,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'HTTP TrackEvent failed', error as Error, {
        eventName: data.eventName,
        userId: data.userId,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Unknown error occurred while tracking event'
      );
    }
  }

  @Get('metrics')
  @ApiOperation({ summary: 'Get usage metrics' })
  @ApiResponse({ status: 200, description: 'Metrics retrieved successfully' })
  async getUsageMetrics(
    @Query('userId') userId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string
  ) {
    try {
      LoggerUtil.debug('analytics-service', 'HTTP GetUsageMetrics called', { 
        userId: userId,
        startDate: startDate,
        endDate: endDate 
      });
      
      return await this.analyticsService.getUsageMetrics();
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
  async getDashboard() {
    try {
      LoggerUtil.debug('analytics-service', 'HTTP GetDashboard called');
      
      return await this.analyticsService.getAnalyticsDashboard();
    } catch (error) {
      LoggerUtil.error('analytics-service', 'HTTP GetDashboard failed', error as Error);
      throw error;
    }
  }

  @Get('users/:userId/analytics')
  @ApiOperation({ summary: 'Get user analytics' })
  @ApiResponse({ status: 200, description: 'User analytics retrieved successfully' })
  async getUserAnalytics(@Param('userId') userId: string) {
    try {
      LoggerUtil.debug('analytics-service', 'HTTP GetUserAnalytics called', { userId });
      
      return await this.analyticsService.getUserAnalytics(userId);
    } catch (error) {
      LoggerUtil.error('analytics-service', 'HTTP GetUserAnalytics failed', error as Error);
      throw error;
    }
  }
}
