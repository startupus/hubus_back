import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsObject, IsDateString, IsBoolean, IsArray, Min, Max, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { EventType, MetricType, AlertType, ChartType, ExportType, ExportStatus, HealthStatus } from '../types/analytics.types';

// ===========================================
// REQUEST DTOs
// ===========================================

export class TrackEventDto {
  @ApiProperty({ description: 'User ID who triggered the event' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Session ID for grouping events' })
  @IsOptional()
  @IsString()
  sessionId?: string;

  @ApiProperty({ description: 'Type of event', enum: EventType })
  @IsString()
  eventType: string;

  @ApiProperty({ description: 'Name of the event' })
  @IsString()
  eventName: string;

  @ApiProperty({ description: 'Service that generated the event' })
  @IsString()
  service: string;

  @ApiProperty({ description: 'Event-specific properties' })
  @IsObject()
  properties: Record<string, any>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: 'IP address of the user' })
  @IsOptional()
  @IsString()
  ipAddress?: string;

  @ApiPropertyOptional({ description: 'User agent string' })
  @IsOptional()
  @IsString()
  userAgent?: string;
}

export class RecordMetricsDto {
  @ApiProperty({ description: 'Service name' })
  @IsString()
  service: string;

  @ApiProperty({ description: 'Type of metric', enum: MetricType })
  @IsEnum(MetricType)
  metricType: MetricType;

  @ApiProperty({ description: 'Name of the metric' })
  @IsString()
  metricName: string;

  @ApiProperty({ description: 'Metric value' })
  @IsNumber()
  value: number;

  @ApiProperty({ description: 'Unit of measurement' })
  @IsString()
  unit: string;

  @ApiProperty({ description: 'Labels for grouping metrics' })
  @IsObject()
  labels: Record<string, string>;

  @ApiPropertyOptional({ description: 'Additional metadata' })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}

export class GetAnalyticsDto {
  @ApiPropertyOptional({ description: 'User ID to filter by' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Event types to filter by', enum: EventType, isArray: true })
  @IsOptional()
  @IsArray()
  @IsEnum(EventType, { each: true })
  eventTypes?: EventType[];

  @ApiPropertyOptional({ description: 'Services to filter by' })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  services?: string[];

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Field to sort by' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'timestamp';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['asc', 'desc'] })
  @IsOptional()
  @IsEnum(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}

export class GetMetricsDto {
  @ApiPropertyOptional({ description: 'Service to filter by' })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({ description: 'Metric type to filter by', enum: MetricType })
  @IsOptional()
  @IsEnum(MetricType)
  metricType?: MetricType;

  @ApiPropertyOptional({ description: 'Start date for filtering' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: 'End date for filtering' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ description: 'Page number for pagination' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Number of items per page' })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class CreateAlertRuleDto {
  @ApiProperty({ description: 'Name of the alert rule' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Description of the alert rule' })
  @IsString()
  description: string;

  @ApiProperty({ description: 'Type of alert', enum: AlertType })
  @IsEnum(AlertType)
  alertType: AlertType;

  @ApiProperty({ description: 'Alert condition configuration' })
  @IsObject()
  condition: {
    metric: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    value: number;
    timeWindow: number;
    consecutiveViolations?: number;
  };

  @ApiPropertyOptional({ description: 'Threshold value' })
  @IsOptional()
  @IsNumber()
  threshold?: number;

  @ApiPropertyOptional({ description: 'Service to monitor' })
  @IsOptional()
  @IsString()
  service?: string;

  @ApiPropertyOptional({ description: 'Whether the rule is active' })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean = true;
}

export class CreateDataExportDto {
  @ApiProperty({ description: 'Type of export', enum: ExportType })
  @IsEnum(ExportType)
  exportType: ExportType;

  @ApiProperty({ description: 'Export filters' })
  @IsObject()
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

  @ApiPropertyOptional({ description: 'User ID requesting the export' })
  @IsOptional()
  @IsString()
  userId?: string;
}

// ===========================================
// RESPONSE DTOs
// ===========================================

export class AnalyticsEventResponseDto {
  @ApiProperty({ description: 'Event ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId?: string;

  @ApiProperty({ description: 'Session ID' })
  sessionId?: string;

  @ApiProperty({ description: 'Event type' })
  eventType: EventType;

  @ApiProperty({ description: 'Event name' })
  eventName: string;

  @ApiProperty({ description: 'Service name' })
  service: string;

  @ApiProperty({ description: 'Event properties' })
  properties: Record<string, any>;

  @ApiProperty({ description: 'Event metadata' })
  metadata?: Record<string, any>;

  @ApiProperty({ description: 'Event timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'IP address' })
  ipAddress?: string;

  @ApiProperty({ description: 'User agent' })
  userAgent?: string;
}

export class MetricsSnapshotResponseDto {
  @ApiProperty({ description: 'Snapshot ID' })
  id: string;

  @ApiProperty({ description: 'Service name' })
  service: string;

  @ApiProperty({ description: 'Metric type' })
  metricType: MetricType;

  @ApiProperty({ description: 'Metric name' })
  metricName: string;

  @ApiProperty({ description: 'Metric value' })
  value: number;

  @ApiProperty({ description: 'Unit of measurement' })
  unit: string;

  @ApiProperty({ description: 'Metric labels' })
  labels: Record<string, string>;

  @ApiProperty({ description: 'Snapshot timestamp' })
  timestamp: Date;

  @ApiProperty({ description: 'Additional metadata' })
  metadata?: Record<string, any>;
}

export class UserAnalyticsResponseDto {
  @ApiProperty({ description: 'Analytics ID' })
  id: string;

  @ApiProperty({ description: 'User ID' })
  userId: string;

  @ApiProperty({ description: 'Total requests' })
  totalRequests: number;

  @ApiProperty({ description: 'Total tokens' })
  totalTokens: number;

  @ApiProperty({ description: 'Total cost' })
  totalCost: number;

  @ApiProperty({ description: 'Average response time' })
  averageResponseTime: number;

  @ApiProperty({ description: 'Success rate' })
  successRate: number;

  @ApiProperty({ description: 'Last activity timestamp' })
  lastActivity: Date;

  @ApiProperty({ description: 'User preferences' })
  preferences?: Record<string, any>;

  @ApiProperty({ description: 'User timezone' })
  timezone?: string;

  @ApiProperty({ description: 'User language' })
  language?: string;
}

export class DashboardResponseDto {
  @ApiProperty({ description: 'Dashboard summary' })
  summary: {
    totalRequests: number;
    totalUsers: number;
    totalCost: number;
    averageResponseTime: number;
    successRate: number;
    uptime: number;
  };

  @ApiProperty({ description: 'Chart data' })
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

  @ApiProperty({ description: 'Recent activity' })
  recentActivity: Array<{
    id: string;
    timestamp: Date;
    type: string;
    description: string;
    userId?: string;
    metadata?: Record<string, any>;
  }>;

  @ApiProperty({ description: 'Active alerts' })
  alerts: Array<{
    id: string;
    alertType: AlertType;
    alertName: string;
    description: string;
    service?: string;
    triggeredAt: Date;
  }>;

  @ApiProperty({ description: 'Recommendations' })
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

export class AlertResponseDto {
  @ApiProperty({ description: 'Alert ID' })
  id: string;

  @ApiProperty({ description: 'Alert type' })
  alertType: AlertType;

  @ApiProperty({ description: 'Alert name' })
  alertName: string;

  @ApiProperty({ description: 'Alert description' })
  description: string;

  @ApiProperty({ description: 'Service name' })
  service?: string;

  @ApiProperty({ description: 'User ID' })
  userId?: string;

  @ApiProperty({ description: 'Whether alert is active' })
  isActive: boolean;

  @ApiProperty({ description: 'When alert was triggered' })
  triggeredAt: Date;

  @ApiProperty({ description: 'When alert was resolved' })
  resolvedAt?: Date;

  @ApiProperty({ description: 'Alert metadata' })
  metadata?: Record<string, any>;
}

export class DataExportResponseDto {
  @ApiProperty({ description: 'Export ID' })
  id: string;

  @ApiProperty({ description: 'Export type' })
  exportType: ExportType;

  @ApiProperty({ description: 'Export status' })
  status: ExportStatus;

  @ApiProperty({ description: 'File path' })
  filePath?: string;

  @ApiProperty({ description: 'User ID' })
  userId?: string;

  @ApiProperty({ description: 'When export was created' })
  createdAt: Date;

  @ApiProperty({ description: 'When export was completed' })
  completedAt?: Date;

  @ApiProperty({ description: 'When export expires' })
  expiresAt?: Date;
}

export class PaginationResponseDto {
  @ApiProperty({ description: 'Current page' })
  page: number;

  @ApiProperty({ description: 'Items per page' })
  limit: number;

  @ApiProperty({ description: 'Total items' })
  total: number;

  @ApiProperty({ description: 'Total pages' })
  totalPages: number;

  @ApiProperty({ description: 'Has next page' })
  hasNext: boolean;

  @ApiProperty({ description: 'Has previous page' })
  hasPrev: boolean;
}

export class AnalyticsResponseDto<T = any> {
  @ApiProperty({ description: 'Success status' })
  success: boolean;

  @ApiProperty({ description: 'Response data' })
  data?: T;

  @ApiProperty({ description: 'Response message' })
  message?: string;

  @ApiProperty({ description: 'Pagination info' })
  pagination?: PaginationResponseDto;

  @ApiProperty({ description: 'Response metadata' })
  metadata?: Record<string, any>;
}

// ===========================================
// BATCH PROCESSING DTOs
// ===========================================

export class BatchEventDto {
  @ApiProperty({ description: 'Array of events to process' })
  @IsArray()
  @Type(() => TrackEventDto)
  events: TrackEventDto[];

  @ApiProperty({ description: 'Batch ID for tracking' })
  @IsString()
  batchId: string;

  @ApiProperty({ description: 'Timestamp for batch processing', type: Date })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;

  @ApiProperty({ description: 'Source of the batch' })
  @IsString()
  source: string;
}

export class BatchMetricsDto {
  @ApiProperty({ description: 'Array of metrics to process' })
  @IsArray()
  @Type(() => RecordMetricsDto)
  metrics: RecordMetricsDto[];

  @ApiProperty({ description: 'Batch ID for tracking' })
  @IsString()
  batchId: string;

  @ApiProperty({ description: 'Source of the batch' })
  @IsString()
  source: string;

  @ApiProperty({ description: 'Timestamp for batch processing', type: Date })
  @IsDate()
  @Type(() => Date)
  timestamp: Date;
}

export class ProcessingResultDto {
  @ApiProperty({ description: 'Processing success status' })
  success: boolean;

  @ApiProperty({ description: 'Number of items processed' })
  processed: number;

  @ApiProperty({ description: 'Number of items failed' })
  failed: number;

  @ApiProperty({ description: 'Processing errors' })
  errors: Array<{
    index: number;
    error: string;
    data: any;
  }>;

  @ApiProperty({ description: 'Batch ID' })
  batchId: string;
}
