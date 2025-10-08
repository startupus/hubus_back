import { TrackEventDto, RecordMetricsDto, GetAnalyticsDto, GetMetricsDto, AnalyticsResponseDto, AnalyticsEventResponseDto, MetricsSnapshotResponseDto, UserAnalyticsResponseDto, DashboardResponseDto, BatchEventDto, BatchMetricsDto, ProcessingResultDto } from '../dto/analytics.dto';
import { DataCollectionService } from '../services/data-collection.service';
import { AnalyticsService } from '../services/analytics.service';
import { ReportingService } from '../services/reporting.service';
export declare class AnalyticsController {
    private readonly dataCollectionService;
    private readonly analyticsService;
    private readonly reportingService;
    constructor(dataCollectionService: DataCollectionService, analyticsService: AnalyticsService, reportingService: ReportingService);
    trackEvent(trackEventDto: TrackEventDto): Promise<AnalyticsResponseDto<AnalyticsEventResponseDto>>;
    trackEventsBatch(batchEventDto: BatchEventDto): Promise<AnalyticsResponseDto<ProcessingResultDto>>;
    recordMetrics(recordMetricsDto: RecordMetricsDto): Promise<AnalyticsResponseDto<MetricsSnapshotResponseDto>>;
    recordMetricsBatch(batchMetricsDto: BatchMetricsDto): Promise<AnalyticsResponseDto<ProcessingResultDto>>;
    getEvents(query: GetAnalyticsDto): Promise<AnalyticsResponseDto<AnalyticsEventResponseDto[]>>;
    getMetrics(query: GetMetricsDto): Promise<AnalyticsResponseDto<MetricsSnapshotResponseDto[]>>;
    getUserAnalytics(userId: string): Promise<AnalyticsResponseDto<UserAnalyticsResponseDto>>;
    getDashboard(userId?: string): Promise<AnalyticsResponseDto<DashboardResponseDto>>;
    getAIAnalytics(modelId?: string, provider?: string): Promise<AnalyticsResponseDto<any[]>>;
    getSystemHealth(): Promise<AnalyticsResponseDto<any[]>>;
    getCollectionStats(): Promise<AnalyticsResponseDto<any>>;
    ping(): Promise<AnalyticsResponseDto<any>>;
}
