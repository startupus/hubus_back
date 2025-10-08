import { PrismaService } from '../common/prisma/prisma.service';
import { AnalyticsRequest, AnalyticsResponse, UserAnalytics, AIAnalytics, DashboardData, MetricsResponse, Recommendation } from '../types/analytics.types';
export declare class AnalyticsService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getAnalyticsEvents(request: AnalyticsRequest): Promise<AnalyticsResponse<any>>;
    getMetrics(request: AnalyticsRequest): Promise<MetricsResponse>;
    getUserAnalytics(userId: string): Promise<UserAnalytics | null>;
    updateUserAnalytics(userId: string, data: Partial<UserAnalytics>): Promise<UserAnalytics>;
    getAIAnalytics(modelId?: string, provider?: string): Promise<AIAnalytics[]>;
    updateAIAnalytics(modelId: string, provider: string, data: Partial<AIAnalytics>): Promise<AIAnalytics>;
    getDashboardData(userId?: string): Promise<DashboardData>;
    generateRecommendations(userId?: string): Promise<Recommendation[]>;
    getSystemHealth(): Promise<any[]>;
    private buildEventFilter;
    private buildMetricsFilter;
    private buildEventOrderBy;
    private calculateMetricsSummary;
    private calculateMetricsTrends;
    private generateDashboardSummary;
    private generateDashboardCharts;
    private getRecentActivity;
    private getActiveAlerts;
    private mapToAnalyticsEvent;
    private mapToMetricsSnapshot;
    private mapToUserAnalytics;
    private mapToAIAnalytics;
    trackEvent(data: {
        userId?: string;
        eventName: string;
        eventType: string;
        service: string;
        properties?: Record<string, any>;
        metadata?: Record<string, any>;
    }): Promise<{
        success: boolean;
        eventId: string;
    }>;
    getUsageMetrics(): Promise<{
        metrics: Array<{
            name: string;
            value: number;
            unit: string;
            timestamp: string;
        }>;
    }>;
    getAnalyticsDashboard(): Promise<{
        totalRequests: number;
        totalUsers: number;
        averageResponseTime: number;
        topModels: Array<{
            name: string;
            usage: number;
        }>;
        requestsByService: Record<string, number>;
        requestsByDay: Array<{
            date: string;
            count: number;
        }>;
        errorRate: number;
        totalCost: number;
        currency: string;
    }>;
    private getAverageResponseTime;
    private getTopModels;
    private getRequestsByService;
    private getRequestsByDay;
    private getTotalCost;
}
