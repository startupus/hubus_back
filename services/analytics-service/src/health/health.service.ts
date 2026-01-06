import { Injectable } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';
import { PrismaService } from '../common/prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth() {
    LoggerUtil.info('analytics-service', 'HealthService.getHealth() called');
    
    const startTime = Date.now();
    let databaseStatus = 'unhealthy';
    let responseTime = '0ms';
    
    try {
      // Проверяем подключение к базе данных
      await this.prisma.$queryRaw`SELECT 1`;
      const endTime = Date.now();
      responseTime = `${endTime - startTime}ms`;
      databaseStatus = 'healthy';
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Database health check failed', error as Error);
      databaseStatus = 'unhealthy';
    }
    
    const overallStatus = databaseStatus === 'healthy' ? 'ok' : 'unhealthy';
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      service: 'analytics-service',
      version: '1.0.0',
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      database: {
        status: databaseStatus,
        responseTime: responseTime,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getReadiness() {
    const startTime = Date.now();
    let databaseStatus = 'unhealthy';
    let responseTime = '0ms';
    
    try {
      // Проверяем готовность базы данных
      await this.prisma.$queryRaw`SELECT 1`;
      const endTime = Date.now();
      responseTime = `${endTime - startTime}ms`;
      databaseStatus = 'healthy';
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Database readiness check failed', error as Error);
      databaseStatus = 'unhealthy';
    }
    
    const overallStatus = databaseStatus === 'healthy' ? 'ready' : 'not ready';
    
    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: {
        database: {
          status: databaseStatus,
          responseTime: responseTime,
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
