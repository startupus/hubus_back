declare class RedisService {
    get<T = any>(key: string): Promise<T | null>;
    set(key: string, value: any, ttl?: number): Promise<boolean>;
    del(key: string): Promise<void>;
    exists(key: string): Promise<boolean>;
    keys(pattern: string): Promise<string[]>;
    mget<T = any>(keys: string[]): Promise<T[]>;
    clearPattern(pattern: string): Promise<number>;
}
export declare class AnalyticsCacheService {
    private readonly redisService;
    private readonly logger;
    private readonly DASHBOARD_PREFIX;
    private readonly REPORT_PREFIX;
    private readonly METRICS_PREFIX;
    private readonly SESSION_PREFIX;
    constructor(redisService: RedisService);
    cacheDashboardMetrics(metrics: {
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
        timeRange: string;
    }, ttl?: number): Promise<boolean>;
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
        timeRange: string;
        cachedAt: string;
    } | null>;
    cacheReport(reportId: string, report: {
        type: string;
        data: any;
        filters: any;
        generatedAt: Date;
        expiresAt: Date;
    }, ttl?: number): Promise<boolean>;
    getReport(reportId: string): Promise<{
        type: string;
        data: any;
        filters: any;
        generatedAt: string;
        expiresAt: string;
        cachedAt: string;
    } | null>;
    cacheSystemMetrics(metrics: {
        service: string;
        endpoint: string;
        responseTime: number;
        statusCode: number;
        memoryUsage: number;
        cpuUsage: number;
        timestamp: Date;
    }, ttl?: number): Promise<boolean>;
    getSystemMetrics(service: string, endpoint: string, timeWindow?: number): Promise<Array<{
        service: string;
        endpoint: string;
        responseTime: number;
        statusCode: number;
        memoryUsage: number;
        cpuUsage: number;
        timestamp: string;
        cachedAt: string;
    }>>;
    cacheUserSession(sessionId: string, session: {
        userId: string;
        startTime: Date;
        endTime?: Date;
        events: number;
        services: string[];
        metadata: any;
    }, ttl?: number): Promise<boolean>;
    getUserSession(sessionId: string): Promise<{
        userId: string;
        startTime: string;
        endTime?: string;
        events: number;
        services: string[];
        metadata: any;
        cachedAt: string;
    } | null>;
    cacheAggregatedData(aggregationKey: string, data: {
        type: string;
        timeRange: string;
        dimensions: string[];
        metrics: any;
        generatedAt: Date;
    }, ttl?: number): Promise<boolean>;
    getAggregatedData(aggregationKey: string): Promise<{
        type: string;
        timeRange: string;
        dimensions: string[];
        metrics: any;
        generatedAt: string;
        cachedAt: string;
    } | null>;
    clearCacheByPattern(pattern: string): Promise<number>;
    clearAllCache(): Promise<boolean>;
    getCacheStats(): Promise<{
        totalDashboards: number;
        totalReports: number;
        totalMetrics: number;
        totalSessions: number;
    }>;
}
export {};
