import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Get service health status' })
  @ApiResponse({ status: 200, description: 'Health status retrieved successfully' })
  async getHealth() {
    return this.healthService.getHealth();
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check if service is ready' })
  @ApiResponse({ status: 200, description: 'Service readiness check' })
  async getReadiness() {
    return this.healthService.getReadiness();
  }

  @Get('live')
  @ApiOperation({ summary: 'Check if service is alive' })
  @ApiResponse({ status: 200, description: 'Service liveness check' })
  async getLiveness() {
    return this.healthService.getLiveness();
  }
}
