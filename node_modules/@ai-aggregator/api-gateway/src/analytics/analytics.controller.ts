import { Controller, Get, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('metrics')
  @ApiOperation({ summary: 'Get analytics metrics' })
  @ApiResponse({ status: 200, description: 'Analytics metrics retrieved successfully' })
  async getMetrics() {
    return this.analyticsService.getMetrics();
  }

  @Get('dashboard')
  @ApiOperation({ summary: 'Get analytics dashboard' })
  @ApiResponse({ status: 200, description: 'Analytics dashboard retrieved successfully' })
  async getDashboard() {
    return this.analyticsService.getDashboard();
  }

  @Get('stats/collection')
  @ApiOperation({ summary: 'Get collection statistics' })
  @ApiResponse({ status: 200, description: 'Collection statistics retrieved successfully' })
  async getCollectionStats() {
    return this.analyticsService.getCollectionStats();
  }

  @Get('events/summary')
  @ApiOperation({ summary: 'Get events summary' })
  @ApiResponse({ status: 200, description: 'Events summary retrieved successfully' })
  async getEventsSummary() {
    return this.analyticsService.getEventsSummary();
  }

  @Post('events/track')
  @ApiOperation({ summary: 'Track an event' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  async trackEvent(@Body() eventData: any) {
    return this.analyticsService.trackEvent(eventData);
  }

  @Post('track-event')
  @ApiOperation({ summary: 'Track an event (alternative format)' })
  @ApiResponse({ status: 201, description: 'Event tracked successfully' })
  async trackEventAlternative(@Body() eventData: any) {
    return this.analyticsService.trackEventAlternative(eventData);
  }
}

