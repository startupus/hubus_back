import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthCheck, LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class HealthService {
  private readonly startTime = Date.now();

  constructor(private readonly configService: ConfigService) {}

  async getHealth(): Promise<HealthCheck> {
    const service = this.configService.get('service.name', 'api-gateway');
    const version = this.configService.get('service.version', '1.0.0');
    const uptime = Date.now() - this.startTime;

    // Check dependencies
    const dependencies = {
      redis: await this.checkRedis(),
      rabbitmq: await this.checkRabbitMQ(),
    };

    const isHealthy = Object.values(dependencies).every(dep => dep.status === 'healthy');
    const status = isHealthy ? 'healthy' : 'unhealthy';

    LoggerUtil.info(service, 'Health check performed', {
      status,
      uptime,
      dependencies,
    });

    return {
      service,
      status,
      timestamp: new Date(),
      version,
      uptime,
      dependencies,
    };
  }

  async getReadiness(): Promise<{ status: string; timestamp: string }> {
    const health = await this.getHealth();
    const isReady = health.status === 'healthy';

    return {
      status: isReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
    };
  }

  async getLiveness(): Promise<{ status: string; timestamp: string }> {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  private async checkRedis(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
    const start = Date.now();
    try {
      // TODO: Implement actual Redis health check
      // For now, return healthy
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  private async checkRabbitMQ(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
    const start = Date.now();
    try {
      // TODO: Implement actual RabbitMQ health check
      // For now, return healthy
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }
}
