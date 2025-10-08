import { ConfigService } from '@nestjs/config';
import { MetricsSnapshot } from '../types/analytics.types';
export declare class PrometheusService {
    private readonly configService;
    private readonly logger;
    private readonly prometheusEnabled;
    private readonly prometheusEndpoint;
    private readonly customMetrics;
    constructor(configService: ConfigService);
    exportMetrics(metrics: MetricsSnapshot[]): Promise<boolean>;
    exportMetric(metric: MetricsSnapshot): Promise<boolean>;
    createCustomMetric(name: string, type: 'counter' | 'gauge' | 'histogram' | 'summary', help: string): any;
    updateCustomMetric(name: string, value: number, labels?: Record<string, string>): void;
    getPrometheusMetrics(): Promise<string>;
    checkPrometheusHealth(): Promise<{
        status: 'healthy' | 'unhealthy';
        responseTime?: number;
        error?: string;
    }>;
    private groupMetricsByType;
    private exportMetricGroup;
    private formatMetricForPrometheus;
    private formatLabelsForPrometheus;
    private sanitizeMetricName;
    private sanitizeLabelName;
    private sanitizeLabelValue;
    private sendToPrometheus;
    getConfiguration(): {
        enabled: boolean;
        endpoint: string;
        customMetricsCount: number;
    };
}
