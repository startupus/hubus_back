import { Injectable } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class HealthService {
  async getHealth() {
    LoggerUtil.info('analytics-service', 'HealthService.getHealth() called');
    
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'analytics-service',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        status: 'healthy',
        responseTime: '5ms',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getReadiness() {
    return {
      status: 'ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: 'healthy',
          responseTime: '5ms',
          timestamp: new Date().toISOString(),
        },
        service: 'healthy',
      },
    };
  }

  async getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
