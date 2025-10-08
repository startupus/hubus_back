import { EventType, MetricType, AlertType, ChartType, ExportType, ExportStatus } from '../types/analytics.types';
export declare class TrackEventDto {
    userId?: string;
    sessionId?: string;
    eventType: string;
    eventName: string;
    service: string;
    properties: Record<string, any>;
    metadata?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
}
export declare class RecordMetricsDto {
    service: string;
    metricType: MetricType;
    metricName: string;
    value: number;
    unit: string;
    labels: Record<string, string>;
    metadata?: Record<string, any>;
}
export declare class GetAnalyticsDto {
    userId?: string;
    startDate?: string;
    endDate?: string;
    eventTypes?: EventType[];
    services?: string[];
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}
export declare class GetMetricsDto {
    service?: string;
    metricType?: MetricType;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
}
export declare class CreateAlertRuleDto {
    name: string;
    description: string;
    alertType: AlertType;
    condition: {
        metric: string;
        operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
        value: number;
        timeWindow: number;
        consecutiveViolations?: number;
    };
    threshold?: number;
    service?: string;
    isActive?: boolean;
}
export declare class CreateDataExportDto {
    exportType: ExportType;
    filters: {
        dateRange: {
            start: string;
            end: string;
        };
        eventTypes?: EventType[];
        services?: string[];
        userIds?: string[];
        metrics?: string[];
    };
    userId?: string;
}
export declare class AnalyticsEventResponseDto {
    id: string;
    userId?: string;
    sessionId?: string;
    eventType: EventType;
    eventName: string;
    service: string;
    properties: Record<string, any>;
    metadata?: Record<string, any>;
    timestamp: Date;
    ipAddress?: string;
    userAgent?: string;
}
export declare class MetricsSnapshotResponseDto {
    id: string;
    service: string;
    metricType: MetricType;
    metricName: string;
    value: number;
    unit: string;
    labels: Record<string, string>;
    timestamp: Date;
    metadata?: Record<string, any>;
}
export declare class UserAnalyticsResponseDto {
    id: string;
    userId: string;
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
    lastActivity: Date;
    preferences?: Record<string, any>;
    timezone?: string;
    language?: string;
}
export declare class DashboardResponseDto {
    summary: {
        totalRequests: number;
        totalUsers: number;
        totalCost: number;
        averageResponseTime: number;
        successRate: number;
        uptime: number;
    };
    charts: Array<{
        id: string;
        type: ChartType;
        title: string;
        data: any[];
        xAxis: string;
        yAxis: string;
        timeRange: {
            start: Date;
            end: Date;
            granularity: string;
        };
    }>;
    recentActivity: Array<{
        id: string;
        timestamp: Date;
        type: string;
        description: string;
        userId?: string;
        metadata?: Record<string, any>;
    }>;
    alerts: Array<{
        id: string;
        alertType: AlertType;
        alertName: string;
        description: string;
        service?: string;
        triggeredAt: Date;
    }>;
    recommendations: Array<{
        id: string;
        type: string;
        title: string;
        description: string;
        priority: string;
        actionRequired: boolean;
        estimatedImpact?: string;
    }>;
}
export declare class AlertResponseDto {
    id: string;
    alertType: AlertType;
    alertName: string;
    description: string;
    service?: string;
    userId?: string;
    isActive: boolean;
    triggeredAt: Date;
    resolvedAt?: Date;
    metadata?: Record<string, any>;
}
export declare class DataExportResponseDto {
    id: string;
    exportType: ExportType;
    status: ExportStatus;
    filePath?: string;
    userId?: string;
    createdAt: Date;
    completedAt?: Date;
    expiresAt?: Date;
}
export declare class PaginationResponseDto {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export declare class AnalyticsResponseDto<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    pagination?: PaginationResponseDto;
    metadata?: Record<string, any>;
}
export declare class BatchEventDto {
    events: TrackEventDto[];
    batchId: string;
    timestamp: Date;
    source: string;
}
export declare class BatchMetricsDto {
    metrics: RecordMetricsDto[];
    batchId: string;
    source: string;
    timestamp: Date;
}
export declare class ProcessingResultDto {
    success: boolean;
    processed: number;
    failed: number;
    errors: Array<{
        index: number;
        error: string;
        data: any;
    }>;
    batchId: string;
}
