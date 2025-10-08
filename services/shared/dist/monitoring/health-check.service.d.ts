import { ConfigService } from '@nestjs/config';
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
export declare class HealthCheckService {
    private readonly configService;
    private readonly logger;
    private readonly startTime;
    constructor(configService: ConfigService);
    /**
     * Perform comprehensive health check
     */
    performHealthCheck(serviceName: string): Promise<HealthCheckResult>;
    /**
     * Check database connection
     */
    private checkDatabase;
    /**
     * Check Redis connection
     */
    private checkRedis;
    /**
     * Check RabbitMQ connection
     */
    private checkRabbitMQ;
    /**
     * Get system metrics
     */
    getSystemMetrics(): {
        uptime: number;
        memory: NodeJS.MemoryUsage;
        cpu: NodeJS.CpuUsage;
        platform: string;
        nodeVersion: string;
    };
    /**
     * Check if system resources are healthy
     */
    checkSystemResources(): {
        memory: 'healthy' | 'degraded' | 'unhealthy';
        cpu: 'healthy' | 'degraded' | 'unhealthy';
        overall: 'healthy' | 'degraded' | 'unhealthy';
    };
}
//# sourceMappingURL=health-check.service.d.ts.map