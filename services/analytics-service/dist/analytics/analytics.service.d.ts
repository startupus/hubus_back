import { PrismaService } from '../common/prisma/prisma.service';
export interface TrackEventData {
    userId?: string;
    eventName: string;
    eventType: string;
    service: string;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
    timestamp?: Date;
}
export interface AnalyticsMetrics {
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
}
export interface UserAnalytics {
    userId: string;
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    currency: string;
    lastActivity: Date;
    requestsByModel: Record<string, number>;
    requestsByService: Record<string, number>;
    averageResponseTime: number;
    errorRate: number;
}
export declare class AnalyticsService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    trackEvent(data: TrackEventData): Promise<{
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
    getAnalyticsDashboard(): Promise<AnalyticsMetrics>;
    getUserAnalytics(userId: string): Promise<UserAnalytics>;
    private getAverageResponseTime;
    private getTopModels;
    private getRequestsByService;
    private getRequestsByDay;
    private getTotalCost;
    private getUserTotalTokens;
    private getUserTotalCost;
    private getUserLastActivity;
    private getUserRequestsByModel;
    private getUserRequestsByService;
    private getUserAverageResponseTime;
}
