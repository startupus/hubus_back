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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_dto_1 = require("../dto/analytics.dto");
const data_collection_service_1 = require("../services/data-collection.service");
const analytics_service_1 = require("../services/analytics.service");
const reporting_service_1 = require("../services/reporting.service");
const shared_1 = require("@ai-aggregator/shared");
let AnalyticsController = class AnalyticsController {
    dataCollectionService;
    analyticsService;
    reportingService;
    constructor(dataCollectionService, analyticsService, reportingService) {
        this.dataCollectionService = dataCollectionService;
        this.analyticsService = analyticsService;
        this.reportingService = reportingService;
    }
    async trackEvent(trackEventDto) {
        try {
            shared_1.LoggerUtil.debug('analytics-controller', 'Tracking event', {
                eventType: trackEventDto.eventType,
                eventName: trackEventDto.eventName,
                service: trackEventDto.service
            });
            const event = await this.dataCollectionService.recordEvent({
                userId: trackEventDto.userId,
                sessionId: trackEventDto.sessionId,
                eventType: trackEventDto.eventType,
                eventName: trackEventDto.eventName,
                service: trackEventDto.service,
                properties: trackEventDto.properties,
                metadata: trackEventDto.metadata,
                ipAddress: trackEventDto.ipAddress,
                userAgent: trackEventDto.userAgent
            });
            return {
                success: true,
                data: event,
                message: 'Event tracked successfully'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-controller', 'Failed to track event', error);
            throw new common_1.HttpException('Failed to track event', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async trackEventsBatch(batchEventDto) {
        try {
            shared_1.LoggerUtil.debug('analytics-controller', 'Processing batch events', {
                batchId: batchEventDto.batchId,
                eventCount: batchEventDto.events.length,
                source: batchEventDto.source
            });
            const result = await this.dataCollectionService.processBatchEvents(batchEventDto);
            return {
                success: result.success,
                data: result,
                message: result.success ? 'Events processed successfully' : 'Some events failed to process'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-controller', 'Failed to process batch events', error);
            throw new common_1.HttpException('Failed to process batch events', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async recordMetrics(recordMetricsDto) {
        try {
            shared_1.LoggerUtil.debug('analytics-controller', 'Recording metrics', {
                service: recordMetricsDto.service,
                metricType: recordMetricsDto.metricType,
                metricName: recordMetricsDto.metricName,
                value: recordMetricsDto.value
            });
            const metrics = await this.dataCollectionService.recordMetrics({
                service: recordMetricsDto.service,
                metricType: recordMetricsDto.metricType,
                metricName: recordMetricsDto.metricName,
                value: recordMetricsDto.value,
                unit: recordMetricsDto.unit,
                labels: recordMetricsDto.labels,
                metadata: recordMetricsDto.metadata
            });
            return {
                success: true,
                data: metrics,
                message: 'Metrics recorded successfully'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-controller', 'Failed to record metrics', error);
            throw new common_1.HttpException('Failed to record metrics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async recordMetricsBatch(batchMetricsDto) {
        try {
            shared_1.LoggerUtil.debug('analytics-controller', 'Processing batch metrics', {
                batchId: batchMetricsDto.batchId,
                metricsCount: batchMetricsDto.metrics.length,
                source: batchMetricsDto.source
            });
            const result = await this.dataCollectionService.processBatchMetrics(batchMetricsDto);
            return {
                success: result.success,
                data: result,
                message: result.success ? 'Metrics processed successfully' : 'Some metrics failed to process'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-controller', 'Failed to process batch metrics', error);
            throw new common_1.HttpException('Failed to process batch metrics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getEvents(query) {
        try {
            shared_1.LoggerUtil.debug('analytics-controller', 'Fetching events', { query });
            const result = await this.analyticsService.getAnalyticsEvents({
                userId: query.userId,
                startDate: query.startDate ? new Date(query.startDate) : undefined,
                endDate: query.endDate ? new Date(query.endDate) : undefined,
                eventTypes: query.eventTypes,
                services: query.services,
                page: query.page,
                limit: query.limit,
                sortBy: query.sortBy,
                sortOrder: query.sortOrder
            });
            return result;
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-controller', 'Failed to fetch events', error);
            throw new common_1.HttpException('Failed to fetch events', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getMetrics(query) {
        try {
            shared_1.LoggerUtil.debug('analytics-controller', 'Fetching metrics', { query });
            const result = await this.analyticsService.getMetrics({
                userId: undefined,
                startDate: query.startDate ? new Date(query.startDate) : undefined,
                endDate: query.endDate ? new Date(query.endDate) : undefined,
                services: query.service ? [query.service] : undefined,
                page: query.page,
                limit: query.limit
            });
            return {
                success: true,
                data: result.metrics,
                pagination: {
                    page: query.page || 1,
                    limit: query.limit || 20,
                    total: result.summary.totalMetrics,
                    totalPages: Math.ceil(result.summary.totalMetrics / (query.limit || 20)),
                    hasNext: (query.page || 1) < Math.ceil(result.summary.totalMetrics / (query.limit || 20)),
                    hasPrev: (query.page || 1) > 1
                },
                metadata: {
                    summary: result.summary,
                    trends: result.trends
                }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-controller', 'Failed to fetch metrics', error);
            throw new common_1.HttpException('Failed to fetch metrics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getUserAnalytics(userId) {
        try {
            shared_1.LoggerUtil.debug('analytics-controller', 'Fetching user analytics', { userId });
            const userAnalytics = await this.analyticsService.getUserAnalytics(userId);
            if (!userAnalytics) {
                throw new common_1.HttpException('User analytics not found', common_1.HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                data: userAnalytics,
                message: 'User analytics retrieved successfully'
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            shared_1.LoggerUtil.error('analytics-controller', 'Failed to fetch user analytics', error);
            throw new common_1.HttpException('Failed to fetch user analytics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getDashboard(userId) {
        try {
            shared_1.LoggerUtil.debug('analytics-controller', 'Generating dashboard data', { userId });
            const dashboardData = await this.analyticsService.getDashboardData(userId);
            return {
                success: true,
                data: dashboardData,
                message: 'Dashboard data retrieved successfully'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-controller', 'Failed to generate dashboard data', error);
            throw new common_1.HttpException('Failed to generate dashboard data', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getAIAnalytics(modelId, provider) {
        try {
            shared_1.LoggerUtil.debug('analytics-controller', 'Fetching AI analytics', { modelId, provider });
            const aiAnalytics = await this.analyticsService.getAIAnalytics(modelId, provider);
            return {
                success: true,
                data: aiAnalytics,
                message: 'AI analytics retrieved successfully'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-controller', 'Failed to fetch AI analytics', error);
            throw new common_1.HttpException('Failed to fetch AI analytics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getSystemHealth() {
        try {
            shared_1.LoggerUtil.debug('analytics-controller', 'Fetching system health');
            const systemHealth = await this.analyticsService.getSystemHealth();
            return {
                success: true,
                data: systemHealth,
                message: 'System health retrieved successfully'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-controller', 'Failed to fetch system health', error);
            throw new common_1.HttpException('Failed to fetch system health', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCollectionStats() {
        try {
            shared_1.LoggerUtil.debug('analytics-controller', 'Fetching collection statistics');
            const stats = await this.dataCollectionService.getCollectionStats();
            return {
                success: true,
                data: stats,
                message: 'Collection statistics retrieved successfully'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('analytics-controller', 'Failed to fetch collection statistics', error);
            throw new common_1.HttpException('Failed to fetch collection statistics', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async ping() {
        return {
            success: true,
            data: {
                service: 'analytics-service',
                status: 'healthy',
                timestamp: new Date().toISOString(),
                version: '1.0.0'
            },
            message: 'Service is healthy'
        };
    }
};
exports.AnalyticsController = AnalyticsController;
__decorate([
    (0, common_1.Post)('events/track'),
    (0, swagger_1.ApiOperation)({
        summary: 'Track analytics event',
        description: 'Record a single analytics event for tracking user behavior and system events'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Event tracked successfully',
        type: analytics_dto_1.AnalyticsEventResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Invalid event data'
    }),
    (0, swagger_1.ApiBody)({ type: analytics_dto_1.TrackEventDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_dto_1.TrackEventDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "trackEvent", null);
__decorate([
    (0, common_1.Post)('events/batch'),
    (0, swagger_1.ApiOperation)({
        summary: 'Track multiple events in batch',
        description: 'Record multiple analytics events in a single batch operation for better performance'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Events processed successfully',
        type: analytics_dto_1.ProcessingResultDto
    }),
    (0, swagger_1.ApiBody)({ type: analytics_dto_1.BatchEventDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_dto_1.BatchEventDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "trackEventsBatch", null);
__decorate([
    (0, common_1.Post)('metrics/record'),
    (0, swagger_1.ApiOperation)({
        summary: 'Record metrics snapshot',
        description: 'Record a single metrics snapshot for system performance monitoring'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Metrics recorded successfully',
        type: analytics_dto_1.MetricsSnapshotResponseDto
    }),
    (0, swagger_1.ApiBody)({ type: analytics_dto_1.RecordMetricsDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_dto_1.RecordMetricsDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "recordMetrics", null);
__decorate([
    (0, common_1.Post)('metrics/batch'),
    (0, swagger_1.ApiOperation)({
        summary: 'Record multiple metrics in batch',
        description: 'Record multiple metrics snapshots in a single batch operation'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Metrics processed successfully',
        type: analytics_dto_1.ProcessingResultDto
    }),
    (0, swagger_1.ApiBody)({ type: analytics_dto_1.BatchMetricsDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_dto_1.BatchMetricsDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "recordMetricsBatch", null);
__decorate([
    (0, common_1.Get)('events'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get analytics events',
        description: 'Retrieve analytics events with filtering and pagination'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Events retrieved successfully',
        type: [analytics_dto_1.AnalyticsEventResponseDto]
    }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'Filter by user ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date filter (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date filter (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'eventTypes', required: false, description: 'Filter by event types (comma-separated)' }),
    (0, swagger_1.ApiQuery)({ name: 'services', required: false, description: 'Filter by services (comma-separated)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page', example: 20 }),
    (0, swagger_1.ApiQuery)({ name: 'sortBy', required: false, description: 'Sort field', example: 'timestamp' }),
    (0, swagger_1.ApiQuery)({ name: 'sortOrder', required: false, description: 'Sort order', enum: ['asc', 'desc'] }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_dto_1.GetAnalyticsDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getEvents", null);
__decorate([
    (0, common_1.Get)('metrics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get metrics snapshots',
        description: 'Retrieve metrics snapshots with filtering and aggregation'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Metrics retrieved successfully',
        type: [analytics_dto_1.MetricsSnapshotResponseDto]
    }),
    (0, swagger_1.ApiQuery)({ name: 'service', required: false, description: 'Filter by service' }),
    (0, swagger_1.ApiQuery)({ name: 'metricType', required: false, description: 'Filter by metric type' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false, description: 'Start date filter (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false, description: 'End date filter (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, description: 'Page number', example: 1 }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, description: 'Items per page', example: 20 }),
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_dto_1.GetMetricsDto]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)('users/:userId/analytics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get user analytics',
        description: 'Retrieve analytics data for a specific user'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'User analytics retrieved successfully',
        type: analytics_dto_1.UserAnalyticsResponseDto
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    __param(0, (0, common_1.Param)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getUserAnalytics", null);
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get dashboard data',
        description: 'Retrieve comprehensive dashboard data including summary, charts, and recent activity'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Dashboard data retrieved successfully',
        type: analytics_dto_1.DashboardResponseDto
    }),
    (0, swagger_1.ApiQuery)({ name: 'userId', required: false, description: 'Filter by user ID for personalized dashboard' }),
    __param(0, (0, common_1.Query)('userId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('ai/analytics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get AI analytics',
        description: 'Retrieve analytics data for AI models and providers'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'AI analytics retrieved successfully'
    }),
    (0, swagger_1.ApiQuery)({ name: 'modelId', required: false, description: 'Filter by model ID' }),
    (0, swagger_1.ApiQuery)({ name: 'provider', required: false, description: 'Filter by provider' }),
    __param(0, (0, common_1.Query)('modelId')),
    __param(1, (0, common_1.Query)('provider')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getAIAnalytics", null);
__decorate([
    (0, common_1.Get)('system-health'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get system health status',
        description: 'Retrieve current system health status and performance metrics'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'System health retrieved successfully'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getSystemHealth", null);
__decorate([
    (0, common_1.Get)('stats/collection'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get data collection statistics',
        description: 'Retrieve statistics about data collection performance and volume'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Collection statistics retrieved successfully'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "getCollectionStats", null);
__decorate([
    (0, common_1.Get)('ping'),
    (0, swagger_1.ApiOperation)({
        summary: 'Health check',
        description: 'Simple health check endpoint'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Service is healthy'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AnalyticsController.prototype, "ping", null);
exports.AnalyticsController = AnalyticsController = __decorate([
    (0, swagger_1.ApiTags)('Analytics'),
    (0, common_1.Controller)('analytics'),
    __metadata("design:paramtypes", [data_collection_service_1.DataCollectionService,
        analytics_service_1.AnalyticsService,
        reporting_service_1.ReportingService])
], AnalyticsController);
//# sourceMappingURL=analytics.controller.js.map