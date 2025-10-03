import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { HealthCheck } from '@ai-aggregator/shared';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  async getHealth(): Promise<HealthCheck> {
    const startTime = Date.now();
    
    // Check database connection
    let dbStatus = 'healthy';
    let dbResponseTime = 0;
    
    try {
      const dbStartTime = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      dbResponseTime = Date.now() - dbStartTime;
    } catch (error) {
      dbStatus = 'unhealthy';
    }

    return {
      service: 'auth-service',
      status: dbStatus === 'healthy' ? 'healthy' : 'unhealthy',
      timestamp: new Date(),
      version: '1.0.0',
      uptime: process.uptime() * 1000,
      dependencies: {
        database: {
          status: dbStatus as 'healthy' | 'unhealthy',
          responseTime: dbResponseTime,
        },
      },
    };
  }

  async getReadiness(): Promise<{ status: string; timestamp: string }> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: 'ready',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        status: 'not ready',
        timestamp: new Date().toISOString(),
      };
    }
  }

  async getLiveness(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }
}
