import { PrismaService } from '../common/prisma/prisma.service';
declare class ThreadPoolService {
    execute<T>(task: () => Promise<T>): Promise<T>;
    executeBatch<T>(tasks: (() => Promise<T>)[]): Promise<T[]>;
    executeParallel<T>(tasks: (() => Promise<T>)[], options?: any): Promise<T[]>;
}
export declare class ConcurrentAnalyticsService {
    private readonly prisma;
    private readonly logger;
    private readonly dashboardCache;
    private readonly metricsCache;
    private readonly reportCache;
    private readonly totalEvents;
    private readonly processedEvents;
    private readonly failedEvents;
    private readonly totalUsers;
    private readonly totalRequests;
    private readonly eventQueue;
    private readonly aggregationQueue;
    private readonly aggregationLocks;
    private readonly threadPool;
    private readonly realtimeMetrics;
    constructor(prisma: PrismaService, threadPool: ThreadPoolService);
    recordEvent(userId: string, eventType: string, eventName: string, service: string, properties: any, metadata: any, timestamp?: Date): Promise<{
        success: boolean;
        eventId?: string;
        error?: string;
    }>;
    recordBatchEvents(events: Array<{
        userId: string;
        eventType: string;
        eventName: string;
        service: string;
        properties: any;
        metadata: any;
        timestamp?: Date;
    }>): Promise<Array<{
        success: boolean;
        eventId?: string;
        error?: string;
    }>>;
    getDashboardMetrics(timeRange: string): Promise<{
        totalUsers: number;
        totalRequests: number;
        averageResponseTime: number;
        successRate: number;
        errorRate: number;
        topServices: Array<{
            service: string;
            requests: number;
        }>;
        topUsers: Array<{
            userId: string;
            requests: number;
        }>;
    }>;
    aggregateMetrics(type: string, timeRange: string, dimensions: string[], filters: any): Promise<{
        success: boolean;
        data?: any;
        error?: string;
    }>;
    aggregateBatchMetrics(aggregations: Array<{
        type: string;
        timeRange: string;
        dimensions: string[];
        filters: any;
    }>): Promise<Array<{
        success: boolean;
        data?: any;
        error?: string;
    }>>;
    updateRealtimeMetrics(metricName: string, value: number, timestamp?: Date): Promise<void>;
    getRealtimeMetrics(): Promise<Array<{
        name: string;
        value: number;
        timestamp: Date;
        count: number;
    }>>;
    private startEventProcessor;
    private startAggregationProcessor;
    private startMetricsAggregator;
    private processEvent;
    private processAggregation;
    private calculateDashboardMetrics;
    private performAggregation;
    private performRealtimeAggregation;
    private getAggregationLock;
    private acquireLock;
    private releaseLock;
    private generateEventId;
    private generateAggregationId;
    getStats(): {
        totalEvents: number;
        processedEvents: number;
        failedEvents: number;
        totalUsers: number;
        totalRequests: number;
        queueSize: number;
        realtimeMetricsCount: number;
        cacheStats: {
            dashboardCache: number;
            metricsCache: number;
            reportCache: number;
        };
    };
    clearCache(): Promise<void>;
}
export {};
