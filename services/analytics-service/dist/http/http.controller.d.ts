import { AnalyticsService } from '../services/analytics.service';
import { TrackEventDto } from '../dto/analytics.dto';
export declare class HttpController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    trackEvent(data: TrackEventDto): Promise<{
        success: boolean;
        message: string;
        eventId: string;
        timestamp: string;
    }>;
    getUsageMetrics(userId?: string, startDate?: string, endDate?: string): Promise<{
        metrics: Array<{
            name: string;
            value: number;
            unit: string;
            timestamp: string;
        }>;
    }>;
    getDashboard(): Promise<{
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
    getUserAnalytics(userId: string): Promise<import("../types/analytics.types").UserAnalytics>;
}
