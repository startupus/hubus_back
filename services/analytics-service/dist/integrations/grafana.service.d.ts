import { ConfigService } from '@nestjs/config';
export declare class GrafanaService {
    private readonly configService;
    private readonly logger;
    private readonly grafanaEnabled;
    private readonly grafanaApiUrl;
    private readonly grafanaApiKey;
    private readonly datasourceName;
    constructor(configService: ConfigService);
    createDashboard(title: string, description: string, panels: any[], tags?: string[]): Promise<{
        success: boolean;
        dashboardId?: string;
        error?: string;
    }>;
    createAnalyticsDashboard(): Promise<{
        success: boolean;
        dashboardId?: string;
        error?: string;
    }>;
    createUserDashboard(userId: string): Promise<{
        success: boolean;
        dashboardId?: string;
        error?: string;
    }>;
    createAlertRule(name: string, condition: string, frequency: string, message: string, severity?: 'critical' | 'warning' | 'info'): Promise<{
        success: boolean;
        ruleId?: string;
        error?: string;
    }>;
    createDataSource(): Promise<{
        success: boolean;
        datasourceId?: string;
        error?: string;
    }>;
    checkGrafanaHealth(): Promise<{
        status: 'healthy' | 'unhealthy';
        responseTime?: number;
        error?: string;
    }>;
    private createUsagePanel;
    private createPerformancePanel;
    private createErrorRatePanel;
    private createCostPanel;
    private createAIAnalyticsPanel;
    private createUserUsagePanel;
    private createUserCostPanel;
    private createUserActivityPanel;
    private createUserRecommendationsPanel;
    getConfiguration(): {
        enabled: boolean;
        apiUrl: string;
        datasourceName: string;
    };
}
