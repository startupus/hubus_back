import { PrismaService } from '../common/prisma/prisma.service';
import { AnalyticsEvent, MetricsSnapshot, BatchEvent, BatchMetrics, ProcessingResult } from '../types/analytics.types';
export declare class DataCollectionService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    recordEvent(event: AnalyticsEvent): Promise<AnalyticsEvent>;
    recordEventsBatch(events: AnalyticsEvent[]): Promise<ProcessingResult>;
    recordMetrics(metrics: MetricsSnapshot): Promise<MetricsSnapshot>;
    recordMetricsBatch(metrics: MetricsSnapshot[]): Promise<ProcessingResult>;
    processBatchEvents(batchEvent: BatchEvent): Promise<ProcessingResult>;
    processBatchMetrics(batchMetrics: BatchMetrics): Promise<ProcessingResult>;
    private validateEvent;
    private validateMetrics;
    private mapToAnalyticsEvent;
    private mapToMetricsSnapshot;
    getCollectionStats(): Promise<{
        totalEvents: number;
        totalMetrics: number;
        eventsLast24h: number;
        metricsLast24h: number;
        averageEventsPerHour: number;
        averageMetricsPerHour: number;
    }>;
}
