export declare class AnalyticsController {
    constructor();
    trackEvent(body: {
        userId: string;
        eventName: string;
        properties?: Record<string, string>;
        timestamp?: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    trackEventAlternative(body: {
        eventType: string;
        userId: string;
        metadata?: Record<string, any>;
        timestamp?: string;
    }): Promise<{
        success: boolean;
        message: string;
        eventId: string;
        eventType: string;
    } | {
        success: boolean;
        message: string;
        eventId?: undefined;
        eventType?: undefined;
    }>;
    trackEventStandard(body: {
        eventName: string;
        service: string;
        properties: Record<string, any>;
        userId?: string;
        timestamp?: string;
    }): Promise<{
        success: boolean;
        message: string;
        eventId: string;
        eventName: string;
        service: string;
    } | {
        success: boolean;
        message: string;
        eventId?: undefined;
        eventName?: undefined;
        service?: undefined;
    }>;
    getUsageMetrics(userId: string, startDate?: string, endDate?: string): Promise<{
        metrics: {
            name: string;
            value: number;
            unit: string;
            timestamp: string;
        }[];
    }>;
    getDashboard(userId?: string): Promise<{
        summary: {
            total_requests: number;
            total_tokens: number;
            total_cost: number;
            average_response_time: number;
            success_rate: number;
        };
        recent_activity: {
            timestamp: string;
            event: string;
            details: string;
            cost: number;
        }[];
        top_models: {
            model: string;
            requests: number;
            cost: number;
        }[];
    }>;
    getPing(): Promise<{
        service: string;
        status: string;
        timestamp: string;
        version: string;
    }>;
    getCollectionStats(): Promise<{
        success: boolean;
        data: {
            totalEvents: number;
            totalUsers: number;
            totalSessions: number;
            averageEventsPerUser: number;
            topEvents: {
                name: string;
                count: number;
            }[];
            recentActivity: {
                timestamp: string;
                event: string;
                userId: string;
                service: string;
                cost: number;
            }[];
        };
        error?: undefined;
    } | {
        success: boolean;
        data: any;
        error: string;
    }>;
    getEventsSummary(startDate?: string, endDate?: string, userId?: string): Promise<{
        success: boolean;
        data: {
            period: {
                start: string;
                end: string;
            };
            summary: {
                totalEvents: number;
                uniqueUsers: number;
                totalSessions: number;
                averageEventsPerSession: number;
            };
            breakdown: {
                byEventType: {
                    user_action: number;
                    system_event: number;
                    ai_interaction: number;
                    security_event: number;
                    billing_event: number;
                };
                byService: {
                    'auth-service': number;
                    'api-gateway': number;
                    'proxy-service': number;
                    'billing-service': number;
                    'analytics-service': number;
                };
                byHour: {
                    hour: number;
                    events: number;
                }[];
            };
        };
        error?: undefined;
    } | {
        success: boolean;
        data: any;
        error: string;
    }>;
}
