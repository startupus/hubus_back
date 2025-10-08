import { ConfigService } from '@nestjs/config';
export interface ApiMetrics {
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    timestamp: Date;
    userId?: string;
    error?: string;
}
export interface ServiceHealth {
    serviceName: string;
    status: 'healthy' | 'degraded' | 'unhealthy';
    uptime: number;
    memoryUsage: NodeJS.MemoryUsage;
    responseTime: number;
    lastCheck: Date;
    dependencies: {
        database: boolean;
        redis: boolean;
        rabbitmq: boolean;
    };
}
export declare class ApiMonitorService {
    private readonly configService;
    private readonly logger;
    private metrics;
    private readonly maxMetrics;
    private healthChecks;
    constructor(configService: ConfigService);
    /**
     * Record API metrics
     */
    recordMetric(metric: Omit<ApiMetrics, 'timestamp'>): void;
    /**
     * Get API metrics for a specific time range
     */
    getMetrics(startTime?: Date, endTime?: Date, endpoint?: string): ApiMetrics[];
    /**
     * Get performance statistics
     */
    getPerformanceStats(startTime?: Date, endTime?: Date, endpoint?: string): {
        totalRequests: number;
        averageResponseTime: number;
        errorRate: number;
        p95ResponseTime: number;
        p99ResponseTime: number;
        statusCodeDistribution: Record<number, number>;
    };
    /**
     * Update service health
     */
    updateServiceHealth(serviceName: string, health: ServiceHealth): void;
    /**
     * Get all service health statuses
     */
    getAllServiceHealth(): ServiceHealth[];
    /**
     * Get service health by name
     */
    getServiceHealth(serviceName: string): ServiceHealth | undefined;
    /**
     * Check if any services are unhealthy
     */
    hasUnhealthyServices(): boolean;
    /**
     * Get system overview
     */
    getSystemOverview(): {
        totalServices: number;
        healthyServices: number;
        degradedServices: number;
        unhealthyServices: number;
        overallStatus: 'healthy' | 'degraded' | 'unhealthy';
        recentMetrics: {
            totalRequests: number;
            averageResponseTime: number;
            errorRate: number;
        };
    };
    /**
     * Clear old metrics
     */
    clearOldMetrics(olderThanHours?: number): void;
    /**
     * Export metrics for external monitoring
     */
    exportMetrics(): {
        metrics: ApiMetrics[];
        healthChecks: ServiceHealth[];
        systemOverview: any;
    };
}
//# sourceMappingURL=api-monitor.service.d.ts.map