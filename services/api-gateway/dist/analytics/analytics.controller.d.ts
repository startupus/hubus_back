import { AnalyticsService } from './analytics.service';
export declare class AnalyticsController {
    private readonly analyticsService;
    constructor(analyticsService: AnalyticsService);
    getMetrics(): Promise<any>;
    getDashboard(): Promise<any>;
    getCollectionStats(): Promise<any>;
    getEventsSummary(): Promise<any>;
    trackEvent(eventData: any): Promise<any>;
    trackEventAlternative(eventData: any): Promise<any>;
}
