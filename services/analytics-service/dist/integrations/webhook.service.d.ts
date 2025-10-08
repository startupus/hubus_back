import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { AnalyticsEvent, MetricsSnapshot } from '../types/analytics.types';
export declare class WebhookService {
    private readonly configService;
    private readonly httpService;
    private readonly logger;
    private readonly webhooks;
    private readonly retryAttempts;
    private readonly retryDelay;
    constructor(configService: ConfigService, httpService: HttpService);
    sendEvent(event: AnalyticsEvent): Promise<WebhookResult[]>;
    sendMetrics(metrics: MetricsSnapshot): Promise<WebhookResult[]>;
    sendBatch(events: AnalyticsEvent[], metrics: MetricsSnapshot[]): Promise<WebhookResult[]>;
    sendAlert(alert: {
        type: 'critical' | 'warning' | 'info';
        title: string;
        message: string;
        service?: string;
        metadata?: Record<string, any>;
    }): Promise<WebhookResult[]>;
    addWebhook(webhookId: string, config: WebhookConfig): void;
    removeWebhook(webhookId: string): boolean;
    testWebhook(webhookId: string): Promise<{
        success: boolean;
        responseTime?: number;
        error?: string;
    }>;
    getWebhookStatus(): {
        totalWebhooks: number;
        activeWebhooks: number;
        webhooks: Array<{
            id: string;
            url: string;
            events: string[];
            enabled: boolean;
        }>;
    };
    private sendToWebhook;
    private delay;
    private initializeWebhooks;
}
interface WebhookConfig {
    url: string;
    events: string[];
    headers: Record<string, string>;
    timeout?: number;
    enabled: boolean;
}
interface WebhookResult {
    webhookId: string;
    success: boolean;
    statusCode?: number;
    responseTime?: number;
    error?: string;
    attempts?: number;
}
export {};
