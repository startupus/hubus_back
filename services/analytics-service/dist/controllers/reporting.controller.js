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
exports.ReportingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const analytics_dto_1 = require("../dto/analytics.dto");
const reporting_service_1 = require("../services/reporting.service");
const shared_1 = require("@ai-aggregator/shared");
let ReportingController = class ReportingController {
    reportingService;
    constructor(reportingService) {
        this.reportingService = reportingService;
    }
    async createExport(createExportDto) {
        try {
            shared_1.LoggerUtil.debug('reporting-controller', 'Creating data export', {
                exportType: createExportDto.exportType,
                filters: createExportDto.filters,
                userId: createExportDto.userId
            });
            const filters = {
                ...createExportDto.filters,
                dateRange: {
                    start: new Date(createExportDto.filters.dateRange.start),
                    end: new Date(createExportDto.filters.dateRange.end),
                },
            };
            const exportRecord = await this.reportingService.createDataExport(createExportDto.exportType, filters, createExportDto.userId);
            return {
                success: true,
                data: exportRecord,
                message: 'Export created successfully'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('reporting-controller', 'Failed to create export', error);
            throw new common_1.HttpException('Failed to create export', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getExportStatus(exportId) {
        try {
            shared_1.LoggerUtil.debug('reporting-controller', 'Getting export status', { exportId });
            const exportRecord = await this.reportingService.getExportStatus(exportId);
            if (!exportRecord) {
                throw new common_1.HttpException('Export not found', common_1.HttpStatus.NOT_FOUND);
            }
            return {
                success: true,
                data: exportRecord,
                message: 'Export status retrieved successfully'
            };
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            shared_1.LoggerUtil.error('reporting-controller', 'Failed to get export status', error);
            throw new common_1.HttpException('Failed to get export status', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async downloadExport(exportId, res) {
        try {
            shared_1.LoggerUtil.debug('reporting-controller', 'Downloading export file', { exportId });
            const fileBuffer = await this.reportingService.downloadExport(exportId);
            if (!fileBuffer) {
                throw new common_1.HttpException('Export file not found or not ready', common_1.HttpStatus.NOT_FOUND);
            }
            const exportRecord = await this.reportingService.getExportStatus(exportId);
            const contentType = this.getContentType(exportRecord?.exportType || 'json');
            const fileName = `export_${exportId}.${exportRecord?.exportType || 'json'}`;
            res.set({
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${fileName}"`,
                'Content-Length': fileBuffer.length.toString()
            });
            res.send(fileBuffer);
        }
        catch (error) {
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            shared_1.LoggerUtil.error('reporting-controller', 'Failed to download export', error);
            throw new common_1.HttpException('Failed to download export', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async generateUsageReport(userId, startDate, endDate, format = 'json') {
        try {
            shared_1.LoggerUtil.debug('reporting-controller', 'Generating usage report', {
                userId,
                startDate,
                endDate,
                format
            });
            const timeRange = {
                start: new Date(startDate),
                end: new Date(endDate),
                granularity: 'day'
            };
            const report = await this.reportingService.generateUsageReport(userId, timeRange, format);
            return {
                success: true,
                data: report,
                message: 'Usage report generated successfully'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('reporting-controller', 'Failed to generate usage report', error);
            throw new common_1.HttpException('Failed to generate usage report', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async generateSystemHealthReport(startDate, endDate) {
        try {
            shared_1.LoggerUtil.debug('reporting-controller', 'Generating system health report', {
                startDate,
                endDate
            });
            const timeRange = {
                start: new Date(startDate),
                end: new Date(endDate),
                granularity: 'day'
            };
            const report = await this.reportingService.generateSystemHealthReport(timeRange);
            return {
                success: true,
                data: report,
                message: 'System health report generated successfully'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('reporting-controller', 'Failed to generate system health report', error);
            throw new common_1.HttpException('Failed to generate system health report', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async generateAIAnalyticsReport(startDate, endDate) {
        try {
            shared_1.LoggerUtil.debug('reporting-controller', 'Generating AI analytics report', {
                startDate,
                endDate
            });
            const timeRange = {
                start: new Date(startDate),
                end: new Date(endDate),
                granularity: 'day'
            };
            const report = await this.reportingService.generateAIAnalyticsReport(timeRange);
            return {
                success: true,
                data: report,
                message: 'AI analytics report generated successfully'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('reporting-controller', 'Failed to generate AI analytics report', error);
            throw new common_1.HttpException('Failed to generate AI analytics report', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async generateChartData(chartType, startDate, endDate, granularity = 'day') {
        try {
            shared_1.LoggerUtil.debug('reporting-controller', 'Generating chart data', {
                chartType,
                startDate,
                endDate,
                granularity
            });
            const timeRange = {
                start: new Date(startDate),
                end: new Date(endDate),
                granularity
            };
            const chartData = await this.reportingService.generateChartData(chartType, timeRange);
            return {
                success: true,
                data: chartData,
                message: 'Chart data generated successfully'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('reporting-controller', 'Failed to generate chart data', error);
            throw new common_1.HttpException('Failed to generate chart data', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async cleanupExpiredExports() {
        try {
            shared_1.LoggerUtil.debug('reporting-controller', 'Starting cleanup of expired exports');
            const cleanedCount = await this.reportingService.cleanupExpiredExports();
            return {
                success: true,
                data: { cleanedCount },
                message: `Cleanup completed successfully. Removed ${cleanedCount} expired exports.`
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('reporting-controller', 'Failed to cleanup expired exports', error);
            throw new common_1.HttpException('Failed to cleanup expired exports', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    getContentType(exportType) {
        const contentTypes = {
            csv: 'text/csv',
            json: 'application/json',
            excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            pdf: 'application/pdf'
        };
        return contentTypes[exportType] || 'application/octet-stream';
    }
};
exports.ReportingController = ReportingController;
__decorate([
    (0, common_1.Post)('exports'),
    (0, swagger_1.ApiOperation)({
        summary: 'Create data export',
        description: 'Create a new data export with specified filters and format'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.CREATED,
        description: 'Export created successfully',
        type: analytics_dto_1.DataExportResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.BAD_REQUEST,
        description: 'Invalid export parameters'
    }),
    (0, swagger_1.ApiBody)({ type: analytics_dto_1.CreateDataExportDto }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [analytics_dto_1.CreateDataExportDto]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "createExport", null);
__decorate([
    (0, common_1.Get)('exports/:exportId/status'),
    (0, swagger_1.ApiOperation)({
        summary: 'Get export status',
        description: 'Check the status of a data export'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Export status retrieved successfully',
        type: analytics_dto_1.DataExportResponseDto
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Export not found'
    }),
    (0, swagger_1.ApiParam)({ name: 'exportId', description: 'Export ID' }),
    __param(0, (0, common_1.Param)('exportId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "getExportStatus", null);
__decorate([
    (0, common_1.Get)('exports/:exportId/download'),
    (0, swagger_1.ApiOperation)({
        summary: 'Download export file',
        description: 'Download the completed export file'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Export file downloaded successfully'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.NOT_FOUND,
        description: 'Export file not found'
    }),
    (0, swagger_1.ApiParam)({ name: 'exportId', description: 'Export ID' }),
    __param(0, (0, common_1.Param)('exportId')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "downloadExport", null);
__decorate([
    (0, common_1.Get)('usage/:userId'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate usage report',
        description: 'Generate a comprehensive usage report for a specific user'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Usage report generated successfully'
    }),
    (0, swagger_1.ApiParam)({ name: 'userId', description: 'User ID' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'format', required: false, description: 'Report format', enum: ['json', 'csv', 'excel'] }),
    __param(0, (0, common_1.Param)('userId')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('format')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "generateUsageReport", null);
__decorate([
    (0, common_1.Get)('system-health'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate system health report',
        description: 'Generate a comprehensive system health report'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'System health report generated successfully'
    }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (ISO string)' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "generateSystemHealthReport", null);
__decorate([
    (0, common_1.Get)('ai-analytics'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate AI analytics report',
        description: 'Generate a comprehensive AI analytics report'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'AI analytics report generated successfully'
    }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (ISO string)' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "generateAIAnalyticsReport", null);
__decorate([
    (0, common_1.Get)('charts/:chartType'),
    (0, swagger_1.ApiOperation)({
        summary: 'Generate chart data',
        description: 'Generate data for various chart types'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Chart data generated successfully'
    }),
    (0, swagger_1.ApiParam)({
        name: 'chartType',
        description: 'Chart type',
        enum: ['line', 'bar', 'pie', 'area', 'scatter']
    }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: true, description: 'Start date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: true, description: 'End date (ISO string)' }),
    (0, swagger_1.ApiQuery)({ name: 'granularity', required: false, description: 'Time granularity', enum: ['minute', 'hour', 'day', 'week', 'month'] }),
    __param(0, (0, common_1.Param)('chartType')),
    __param(1, (0, common_1.Query)('startDate')),
    __param(2, (0, common_1.Query)('endDate')),
    __param(3, (0, common_1.Query)('granularity')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "generateChartData", null);
__decorate([
    (0, common_1.Post)('cleanup'),
    (0, swagger_1.ApiOperation)({
        summary: 'Cleanup expired exports',
        description: 'Clean up expired export files and database records'
    }),
    (0, swagger_1.ApiResponse)({
        status: common_1.HttpStatus.OK,
        description: 'Cleanup completed successfully'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportingController.prototype, "cleanupExpiredExports", null);
exports.ReportingController = ReportingController = __decorate([
    (0, swagger_1.ApiTags)('Reporting'),
    (0, common_1.Controller)('reports'),
    __metadata("design:paramtypes", [reporting_service_1.ReportingService])
], ReportingController);
//# sourceMappingURL=reporting.controller.js.map