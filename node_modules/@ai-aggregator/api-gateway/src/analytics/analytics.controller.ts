import { Controller, Get } from '@nestjs/common';
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
}

