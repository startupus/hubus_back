"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProcessingResultDto = exports.BatchMetricsDto = exports.BatchEventDto = exports.AnalyticsResponseDto = exports.PaginationResponseDto = exports.DataExportResponseDto = exports.AlertResponseDto = exports.DashboardResponseDto = exports.UserAnalyticsResponseDto = exports.MetricsSnapshotResponseDto = exports.AnalyticsEventResponseDto = exports.CreateDataExportDto = exports.CreateAlertRuleDto = exports.GetMetricsDto = exports.GetAnalyticsDto = exports.RecordMetricsDto = exports.TrackEventDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const analytics_types_1 = require("../types/analytics.types");
class TrackEventDto {
    userId;
    sessionId;
    eventType;
    eventName;
    service;
    properties;
    metadata;
    ipAddress;
    userAgent;
}
exports.TrackEventDto = TrackEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID who triggered the event' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Session ID for grouping events' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type of event', enum: analytics_types_1.EventType }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "eventType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name of the event' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "eventName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Service that generated the event' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "service", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event-specific properties' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], TrackEventDto.prototype, "properties", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], TrackEventDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'IP address of the user' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User agent string' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TrackEventDto.prototype, "userAgent", void 0);
class RecordMetricsDto {
    service;
    metricType;
    metricName;
    value;
    unit;
    labels;
    metadata;
}
exports.RecordMetricsDto = RecordMetricsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Service name' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordMetricsDto.prototype, "service", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type of metric', enum: analytics_types_1.MetricType }),
    (0, class_validator_1.IsEnum)(analytics_types_1.MetricType),
    __metadata("design:type", String)
], RecordMetricsDto.prototype, "metricType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name of the metric' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordMetricsDto.prototype, "metricName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Metric value' }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], RecordMetricsDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unit of measurement' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RecordMetricsDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Labels for grouping metrics' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RecordMetricsDto.prototype, "labels", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Additional metadata' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RecordMetricsDto.prototype, "metadata", void 0);
class GetAnalyticsDto {
    userId;
    startDate;
    endDate;
    eventTypes;
    services;
    page = 1;
    limit = 20;
    sortBy = 'timestamp';
    sortOrder = 'desc';
}
exports.GetAnalyticsDto = GetAnalyticsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID to filter by' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetAnalyticsDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Start date for filtering' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetAnalyticsDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'End date for filtering' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetAnalyticsDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Event types to filter by', enum: analytics_types_1.EventType, isArray: true }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsEnum)(analytics_types_1.EventType, { each: true }),
    __metadata("design:type", Array)
], GetAnalyticsDto.prototype, "eventTypes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Services to filter by' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], GetAnalyticsDto.prototype, "services", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number for pagination' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GetAnalyticsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items per page' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GetAnalyticsDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Field to sort by' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetAnalyticsDto.prototype, "sortBy", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Sort order', enum: ['asc', 'desc'] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(['asc', 'desc']),
    __metadata("design:type", String)
], GetAnalyticsDto.prototype, "sortOrder", void 0);
class GetMetricsDto {
    service;
    metricType;
    startDate;
    endDate;
    page = 1;
    limit = 20;
}
exports.GetMetricsDto = GetMetricsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Service to filter by' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], GetMetricsDto.prototype, "service", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Metric type to filter by', enum: analytics_types_1.MetricType }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(analytics_types_1.MetricType),
    __metadata("design:type", String)
], GetMetricsDto.prototype, "metricType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Start date for filtering' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetMetricsDto.prototype, "startDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'End date for filtering' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], GetMetricsDto.prototype, "endDate", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Page number for pagination' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], GetMetricsDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Number of items per page' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], GetMetricsDto.prototype, "limit", void 0);
class CreateAlertRuleDto {
    name;
    description;
    alertType;
    condition;
    threshold;
    service;
    isActive = true;
}
exports.CreateAlertRuleDto = CreateAlertRuleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Name of the alert rule' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertRuleDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Description of the alert rule' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertRuleDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type of alert', enum: analytics_types_1.AlertType }),
    (0, class_validator_1.IsEnum)(analytics_types_1.AlertType),
    __metadata("design:type", String)
], CreateAlertRuleDto.prototype, "alertType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Alert condition configuration' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateAlertRuleDto.prototype, "condition", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Threshold value' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], CreateAlertRuleDto.prototype, "threshold", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Service to monitor' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateAlertRuleDto.prototype, "service", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'Whether the rule is active' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateAlertRuleDto.prototype, "isActive", void 0);
class CreateDataExportDto {
    exportType;
    filters;
    userId;
}
exports.CreateDataExportDto = CreateDataExportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type of export', enum: analytics_types_1.ExportType }),
    (0, class_validator_1.IsEnum)(analytics_types_1.ExportType),
    __metadata("design:type", String)
], CreateDataExportDto.prototype, "exportType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Export filters' }),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateDataExportDto.prototype, "filters", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: 'User ID requesting the export' }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateDataExportDto.prototype, "userId", void 0);
class AnalyticsEventResponseDto {
    id;
    userId;
    sessionId;
    eventType;
    eventName;
    service;
    properties;
    metadata;
    timestamp;
    ipAddress;
    userAgent;
}
exports.AnalyticsEventResponseDto = AnalyticsEventResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event ID' }),
    __metadata("design:type", String)
], AnalyticsEventResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    __metadata("design:type", String)
], AnalyticsEventResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Session ID' }),
    __metadata("design:type", String)
], AnalyticsEventResponseDto.prototype, "sessionId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event type' }),
    __metadata("design:type", String)
], AnalyticsEventResponseDto.prototype, "eventType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event name' }),
    __metadata("design:type", String)
], AnalyticsEventResponseDto.prototype, "eventName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Service name' }),
    __metadata("design:type", String)
], AnalyticsEventResponseDto.prototype, "service", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event properties' }),
    __metadata("design:type", Object)
], AnalyticsEventResponseDto.prototype, "properties", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event metadata' }),
    __metadata("design:type", Object)
], AnalyticsEventResponseDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Event timestamp' }),
    __metadata("design:type", Date)
], AnalyticsEventResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'IP address' }),
    __metadata("design:type", String)
], AnalyticsEventResponseDto.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User agent' }),
    __metadata("design:type", String)
], AnalyticsEventResponseDto.prototype, "userAgent", void 0);
class MetricsSnapshotResponseDto {
    id;
    service;
    metricType;
    metricName;
    value;
    unit;
    labels;
    timestamp;
    metadata;
}
exports.MetricsSnapshotResponseDto = MetricsSnapshotResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Snapshot ID' }),
    __metadata("design:type", String)
], MetricsSnapshotResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Service name' }),
    __metadata("design:type", String)
], MetricsSnapshotResponseDto.prototype, "service", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Metric type' }),
    __metadata("design:type", String)
], MetricsSnapshotResponseDto.prototype, "metricType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Metric name' }),
    __metadata("design:type", String)
], MetricsSnapshotResponseDto.prototype, "metricName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Metric value' }),
    __metadata("design:type", Number)
], MetricsSnapshotResponseDto.prototype, "value", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Unit of measurement' }),
    __metadata("design:type", String)
], MetricsSnapshotResponseDto.prototype, "unit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Metric labels' }),
    __metadata("design:type", Object)
], MetricsSnapshotResponseDto.prototype, "labels", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Snapshot timestamp' }),
    __metadata("design:type", Date)
], MetricsSnapshotResponseDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Additional metadata' }),
    __metadata("design:type", Object)
], MetricsSnapshotResponseDto.prototype, "metadata", void 0);
class UserAnalyticsResponseDto {
    id;
    userId;
    totalRequests;
    totalTokens;
    totalCost;
    averageResponseTime;
    successRate;
    lastActivity;
    preferences;
    timezone;
    language;
}
exports.UserAnalyticsResponseDto = UserAnalyticsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Analytics ID' }),
    __metadata("design:type", String)
], UserAnalyticsResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    __metadata("design:type", String)
], UserAnalyticsResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total requests' }),
    __metadata("design:type", Number)
], UserAnalyticsResponseDto.prototype, "totalRequests", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total tokens' }),
    __metadata("design:type", Number)
], UserAnalyticsResponseDto.prototype, "totalTokens", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total cost' }),
    __metadata("design:type", Number)
], UserAnalyticsResponseDto.prototype, "totalCost", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Average response time' }),
    __metadata("design:type", Number)
], UserAnalyticsResponseDto.prototype, "averageResponseTime", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Success rate' }),
    __metadata("design:type", Number)
], UserAnalyticsResponseDto.prototype, "successRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last activity timestamp' }),
    __metadata("design:type", Date)
], UserAnalyticsResponseDto.prototype, "lastActivity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User preferences' }),
    __metadata("design:type", Object)
], UserAnalyticsResponseDto.prototype, "preferences", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User timezone' }),
    __metadata("design:type", String)
], UserAnalyticsResponseDto.prototype, "timezone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User language' }),
    __metadata("design:type", String)
], UserAnalyticsResponseDto.prototype, "language", void 0);
class DashboardResponseDto {
    summary;
    charts;
    recentActivity;
    alerts;
    recommendations;
}
exports.DashboardResponseDto = DashboardResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Dashboard summary' }),
    __metadata("design:type", Object)
], DashboardResponseDto.prototype, "summary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Chart data' }),
    __metadata("design:type", Array)
], DashboardResponseDto.prototype, "charts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recent activity' }),
    __metadata("design:type", Array)
], DashboardResponseDto.prototype, "recentActivity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Active alerts' }),
    __metadata("design:type", Array)
], DashboardResponseDto.prototype, "alerts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Recommendations' }),
    __metadata("design:type", Array)
], DashboardResponseDto.prototype, "recommendations", void 0);
class AlertResponseDto {
    id;
    alertType;
    alertName;
    description;
    service;
    userId;
    isActive;
    triggeredAt;
    resolvedAt;
    metadata;
}
exports.AlertResponseDto = AlertResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Alert ID' }),
    __metadata("design:type", String)
], AlertResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Alert type' }),
    __metadata("design:type", String)
], AlertResponseDto.prototype, "alertType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Alert name' }),
    __metadata("design:type", String)
], AlertResponseDto.prototype, "alertName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Alert description' }),
    __metadata("design:type", String)
], AlertResponseDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Service name' }),
    __metadata("design:type", String)
], AlertResponseDto.prototype, "service", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    __metadata("design:type", String)
], AlertResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether alert is active' }),
    __metadata("design:type", Boolean)
], AlertResponseDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'When alert was triggered' }),
    __metadata("design:type", Date)
], AlertResponseDto.prototype, "triggeredAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'When alert was resolved' }),
    __metadata("design:type", Date)
], AlertResponseDto.prototype, "resolvedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Alert metadata' }),
    __metadata("design:type", Object)
], AlertResponseDto.prototype, "metadata", void 0);
class DataExportResponseDto {
    id;
    exportType;
    status;
    filePath;
    userId;
    createdAt;
    completedAt;
    expiresAt;
}
exports.DataExportResponseDto = DataExportResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Export ID' }),
    __metadata("design:type", String)
], DataExportResponseDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Export type' }),
    __metadata("design:type", String)
], DataExportResponseDto.prototype, "exportType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Export status' }),
    __metadata("design:type", String)
], DataExportResponseDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'File path' }),
    __metadata("design:type", String)
], DataExportResponseDto.prototype, "filePath", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID' }),
    __metadata("design:type", String)
], DataExportResponseDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'When export was created' }),
    __metadata("design:type", Date)
], DataExportResponseDto.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'When export was completed' }),
    __metadata("design:type", Date)
], DataExportResponseDto.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'When export expires' }),
    __metadata("design:type", Date)
], DataExportResponseDto.prototype, "expiresAt", void 0);
class PaginationResponseDto {
    page;
    limit;
    total;
    totalPages;
    hasNext;
    hasPrev;
}
exports.PaginationResponseDto = PaginationResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Current page' }),
    __metadata("design:type", Number)
], PaginationResponseDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Items per page' }),
    __metadata("design:type", Number)
], PaginationResponseDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total items' }),
    __metadata("design:type", Number)
], PaginationResponseDto.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Total pages' }),
    __metadata("design:type", Number)
], PaginationResponseDto.prototype, "totalPages", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Has next page' }),
    __metadata("design:type", Boolean)
], PaginationResponseDto.prototype, "hasNext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Has previous page' }),
    __metadata("design:type", Boolean)
], PaginationResponseDto.prototype, "hasPrev", void 0);
class AnalyticsResponseDto {
    success;
    data;
    message;
    pagination;
    metadata;
}
exports.AnalyticsResponseDto = AnalyticsResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Success status' }),
    __metadata("design:type", Boolean)
], AnalyticsResponseDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Response data' }),
    __metadata("design:type", Object)
], AnalyticsResponseDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Response message' }),
    __metadata("design:type", String)
], AnalyticsResponseDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Pagination info' }),
    __metadata("design:type", PaginationResponseDto)
], AnalyticsResponseDto.prototype, "pagination", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Response metadata' }),
    __metadata("design:type", Object)
], AnalyticsResponseDto.prototype, "metadata", void 0);
class BatchEventDto {
    events;
    batchId;
    timestamp;
    source;
}
exports.BatchEventDto = BatchEventDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Array of events to process' }),
    (0, class_validator_1.IsArray)(),
    (0, class_transformer_1.Type)(() => TrackEventDto),
    __metadata("design:type", Array)
], BatchEventDto.prototype, "events", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Batch ID for tracking' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BatchEventDto.prototype, "batchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp for batch processing', type: Date }),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], BatchEventDto.prototype, "timestamp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source of the batch' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BatchEventDto.prototype, "source", void 0);
class BatchMetricsDto {
    metrics;
    batchId;
    source;
    timestamp;
}
exports.BatchMetricsDto = BatchMetricsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Array of metrics to process' }),
    (0, class_validator_1.IsArray)(),
    (0, class_transformer_1.Type)(() => RecordMetricsDto),
    __metadata("design:type", Array)
], BatchMetricsDto.prototype, "metrics", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Batch ID for tracking' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BatchMetricsDto.prototype, "batchId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Source of the batch' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], BatchMetricsDto.prototype, "source", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Timestamp for batch processing', type: Date }),
    (0, class_validator_1.IsDate)(),
    (0, class_transformer_1.Type)(() => Date),
    __metadata("design:type", Date)
], BatchMetricsDto.prototype, "timestamp", void 0);
class ProcessingResultDto {
    success;
    processed;
    failed;
    errors;
    batchId;
}
exports.ProcessingResultDto = ProcessingResultDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Processing success status' }),
    __metadata("design:type", Boolean)
], ProcessingResultDto.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of items processed' }),
    __metadata("design:type", Number)
], ProcessingResultDto.prototype, "processed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Number of items failed' }),
    __metadata("design:type", Number)
], ProcessingResultDto.prototype, "failed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Processing errors' }),
    __metadata("design:type", Array)
], ProcessingResultDto.prototype, "errors", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Batch ID' }),
    __metadata("design:type", String)
], ProcessingResultDto.prototype, "batchId", void 0);
//# sourceMappingURL=analytics.dto.js.map