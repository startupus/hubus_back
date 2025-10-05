import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerUtil } from '../utils/logger.util';

export interface HealthCheckResult {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  timestamp: Date;
  details: {
    database?: boolean;
    redis?: boolean;
    rabbitmq?: boolean;
    memory?: NodeJS.MemoryUsage;
    uptime?: number;
  };
  error?: string;
}

@Injectable()
export class HealthCheckService {
  private readonly logger = new Logger(HealthCheckService.name);
  private readonly startTime = Date.now();

  constructor(private readonly configService: ConfigService) {}

  /**
   * Perform comprehensive health check
   */
  async performHealthCheck(serviceName: string): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const details: HealthCheckResult['details'] = {};
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    let error: string | undefined;

    try {
      // Check database connection
      try {
        details.database = await this.checkDatabase();
      } catch (err) {
        details.database = false;
        status = 'unhealthy';
        error = `Database check failed: ${err}`;
      }

      // Check Redis connection
      try {
        details.redis = await this.checkRedis();
      } catch (err) {
        details.redis = false;
        if (status === 'healthy') status = 'degraded';
        if (!error) error = `Redis check failed: ${err}`;
      }

      // Check RabbitMQ connection
      try {
        details.rabbitmq = await this.checkRabbitMQ();
      } catch (err) {
        details.rabbitmq = false;
        if (status === 'healthy') status = 'degraded';
        if (!error) error = `RabbitMQ check failed: ${err}`;
      }

      // Get memory usage
      details.memory = process.memoryUsage();

      // Get uptime
      details.uptime = Date.now() - this.startTime;

      // Check memory usage
      const memoryUsageMB = details.memory.heapUsed / 1024 / 1024;
      if (memoryUsageMB > 1000) { // More than 1GB
        if (status === 'healthy') status = 'degraded';
        if (!error) error = 'High memory usage detected';
      }

    } catch (err) {
      status = 'unhealthy';
      error = `Health check failed: ${err}`;
    }

    const responseTime = Date.now() - startTime;

    const result: HealthCheckResult = {
      service: serviceName,
      status,
      responseTime,
      timestamp: new Date(),
      details,
      error,
    };

    // Log health check result
    if (status === 'unhealthy') {
      LoggerUtil.error('health-check', 'Service is unhealthy', {
        service: serviceName,
        status,
        error,
        details,
      } as any);
    } else if (status === 'degraded') {
      LoggerUtil.warn('health-check', 'Service is degraded', {
        service: serviceName,
        status,
        error,
        details,
      });
    } else {
      LoggerUtil.info('health-check', 'Service is healthy', {
        service: serviceName,
        status,
        responseTime,
        details,
      });
    }

    return result;
  }

  /**
   * Check database connection
   */
  private async checkDatabase(): Promise<boolean> {
    // This would be implemented based on your database setup
    // For now, return true as a placeholder
    return true;
  }

  /**
   * Check Redis connection
   */
  private async checkRedis(): Promise<boolean> {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (!redisUrl) {
        throw new Error('REDIS_URL not configured');
      }
      
      // This would be implemented with actual Redis client
      // For now, return true as a placeholder
      return true;
    } catch (err) {
      throw new Error(`Redis check failed: ${err}`);
    }
  }

  /**
   * Check RabbitMQ connection
   */
  private async checkRabbitMQ(): Promise<boolean> {
    try {
      const rabbitmqUrl = this.configService.get<string>('RABBITMQ_URL');
      if (!rabbitmqUrl) {
        throw new Error('RABBITMQ_URL not configured');
      }
      
      // This would be implemented with actual RabbitMQ client
      // For now, return true as a placeholder
      return true;
    } catch (err) {
      throw new Error(`RabbitMQ check failed: ${err}`);
    }
  }

  /**
   * Get system metrics
   */
  getSystemMetrics(): {
    uptime: number;
    memory: NodeJS.MemoryUsage;
    cpu: NodeJS.CpuUsage;
    platform: string;
    nodeVersion: string;
  } {
    return {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
      platform: process.platform,
      nodeVersion: process.version,
    };
  }

  /**
   * Check if system resources are healthy
   */
  checkSystemResources(): {
    memory: 'healthy' | 'degraded' | 'unhealthy';
    cpu: 'healthy' | 'degraded' | 'unhealthy';
    overall: 'healthy' | 'degraded' | 'unhealthy';
  } {
    const memory = process.memoryUsage();
    const memoryUsageMB = memory.heapUsed / 1024 / 1024;
    
    let memoryStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (memoryUsageMB > 2000) {
      memoryStatus = 'unhealthy';
    } else if (memoryUsageMB > 1000) {
      memoryStatus = 'degraded';
    }

    // CPU check would require more sophisticated monitoring
    const cpuStatus: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    // Determine overall status
    let overall: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    const memStatus = memoryStatus as string;
    const cpStatus = cpuStatus as string;
    if (memStatus === 'unhealthy' || cpStatus === 'unhealthy') {
      overall = 'unhealthy';
    } else if (memStatus === 'degraded' || cpStatus === 'degraded') {
      overall = 'degraded';
    }

    return {
      memory: memoryStatus,
      cpu: cpuStatus,
      overall,
    };
  }
}
