import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';
import { LoggerUtil } from '@ai-aggregator/shared';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check' })
  @ApiResponse({ status: 200, description: 'Service is healthy' })
  async getHealth() {
    LoggerUtil.info('analytics-service', 'Health check endpoint called');
    const result = await this.healthService.getHealth();
    LoggerUtil.info('analytics-service', 'Health check result', { result });
    return result;
  }

  @Get('ready')
  @ApiOperation({ summary: 'Readiness check' })
  @ApiResponse({ status: 200, description: 'Service is ready' })
  async getReadiness() {
    LoggerUtil.info('analytics-service', 'Readiness check endpoint called');
    const result = await this.healthService.getReadiness();
    LoggerUtil.info('analytics-service', 'Readiness check result', { result });
    return result;
  }

  @Get('live')
  @ApiOperation({ summary: 'Liveness check' })
  @ApiResponse({ status: 200, description: 'Service is alive' })
  async getLiveness() {
    LoggerUtil.info('analytics-service', 'Liveness check endpoint called');
    const result = await this.healthService.getLiveness();
    LoggerUtil.info('analytics-service', 'Liveness check result', { result });
    return result;
  }
}
