import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
export declare class AnalyticsService {
    private readonly httpService;
    private readonly configService;
    private readonly analyticsServiceUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    getMetrics(): Promise<any>;
    getDashboard(): Promise<any>;
    getCollectionStats(): Promise<any>;
    getEventsSummary(): Promise<any>;
    trackEvent(eventData: any): Promise<any>;
    trackEventAlternative(eventData: any): Promise<any>;
}
