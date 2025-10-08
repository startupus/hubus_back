"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReportingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const csv = __importStar(require("csv-writer"));
const ExcelJS = __importStar(require("exceljs"));
let ReportingService = ReportingService_1 = class ReportingService {
    prisma;
    logger = new common_1.Logger(ReportingService_1.name);
    exportDir = process.env.EXPORT_DIR || './exports';
    constructor(prisma) {
        this.prisma = prisma;
        if (!fs.existsSync(this.exportDir)) {
            fs.mkdirSync(this.exportDir, { recursive: true });
        }
    }
    async createDataExport(exportType, filters, userId) {
        try {
            this.logger.debug('Creating data export', { exportType, filters, userId });
            const exportRecord = await this.prisma.dataExport.create({
                data: {
                    exportType,
                    filters: filters,
                    status: 'pending',
                    userId,
                    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                }
            });
            this.processExportAsync(exportRecord.id);
            return this.mapToDataExport(exportRecord);
        }
        catch (error) {
            this.logger.error('Failed to create data export', error);
            throw error;
        }
    }
    async getExportStatus(exportId) {
        try {
            const exportRecord = await this.prisma.dataExport.findUnique({
                where: { id: exportId }
            });
            if (!exportRecord) {
                return null;
            }
            return this.mapToDataExport(exportRecord);
        }
        catch (error) {
            this.logger.error('Failed to get export status', error);
            throw error;
        }
    }
    async downloadExport(exportId) {
        try {
            const exportRecord = await this.prisma.dataExport.findUnique({
                where: { id: exportId }
            });
            if (!exportRecord || exportRecord.status !== 'completed' || !exportRecord.filePath) {
                return null;
            }
            const filePath = path.join(this.exportDir, exportRecord.filePath);
            if (!fs.existsSync(filePath)) {
                return null;
            }
            return fs.readFileSync(filePath);
        }
        catch (error) {
            this.logger.error('Failed to download export', error);
            throw error;
        }
    }
    async generateUsageReport(userId, timeRange, format = 'json') {
        try {
            this.logger.debug('Generating usage report', { userId, timeRange, format });
            const where = {
                userId,
                timestamp: {
                    gte: timeRange.start,
                    lte: timeRange.end
                }
            };
            const [events, metrics, userAnalytics] = await Promise.all([
                this.prisma.analyticsEvent.findMany({
                    where,
                    orderBy: { timestamp: 'desc' }
                }),
                this.prisma.metricsSnapshot.findMany({
                    where: { timestamp: { gte: timeRange.start, lte: timeRange.end } },
                    orderBy: { timestamp: 'desc' }
                }),
                this.prisma.userAnalytics.findUnique({
                    where: { userId }
                })
            ]);
            const report = {
                userId,
                timeRange,
                generatedAt: new Date(),
                summary: {
                    totalEvents: events.length,
                    totalMetrics: metrics.length,
                    totalRequests: userAnalytics?.totalRequests || 0,
                    totalTokens: userAnalytics?.totalTokens || 0,
                    totalCost: userAnalytics?.totalCost || 0,
                    averageResponseTime: userAnalytics?.averageResponseTime || 0,
                    successRate: userAnalytics?.successRate || 0
                },
                events: events.map(event => ({
                    id: event.id,
                    eventType: event.eventType,
                    eventName: event.eventName,
                    service: event.service,
                    timestamp: event.timestamp,
                    properties: event.properties
                })),
                metrics: metrics.map(metric => ({
                    service: metric.service,
                    metricType: metric.metricType,
                    metricName: metric.metricName,
                    value: metric.value,
                    unit: metric.unit,
                    timestamp: metric.timestamp
                }))
            };
            if (format === 'json') {
                return report;
            }
            else if (format === 'csv') {
                return this.convertToCSV(report);
            }
            else if (format === 'excel') {
                return await this.convertToExcel(report);
            }
            return report;
        }
        catch (error) {
            this.logger.error('Failed to generate usage report', error);
            throw error;
        }
    }
    async generateSystemHealthReport(timeRange) {
        try {
            this.logger.debug('Generating system health report', { timeRange });
            const where = {
                timestamp: {
                    gte: timeRange.start,
                    lte: timeRange.end
                }
            };
            const [healthData, errorData, metricsData] = await Promise.all([
                this.prisma.systemHealth.findMany({
                    where,
                    orderBy: { timestamp: 'desc' }
                }),
                this.prisma.errorAnalytics.findMany({
                    where,
                    orderBy: { timestamp: 'desc' }
                }),
                this.prisma.metricsSnapshot.findMany({
                    where: {
                        ...where,
                        metricType: 'performance'
                    },
                    orderBy: { timestamp: 'desc' }
                })
            ]);
            const services = [...new Set(healthData.map(h => h.service))];
            const serviceStats = services.map(service => {
                const serviceHealth = healthData.filter(h => h.service === service);
                const avgResponseTime = serviceHealth.reduce((sum, h) => sum + (h.responseTime || 0), 0) / serviceHealth.length;
                const avgErrorRate = serviceHealth.reduce((sum, h) => sum + (h.errorRate || 0), 0) / serviceHealth.length;
                const uptime = serviceHealth.filter(h => h.status === 'healthy').length / serviceHealth.length * 100;
                return {
                    service,
                    uptime,
                    averageResponseTime: avgResponseTime,
                    averageErrorRate: avgErrorRate,
                    totalChecks: serviceHealth.length
                };
            });
            const report = {
                timeRange,
                generatedAt: new Date(),
                summary: {
                    totalServices: services.length,
                    averageUptime: serviceStats.reduce((sum, s) => sum + s.uptime, 0) / services.length,
                    totalErrors: errorData.length,
                    totalMetrics: metricsData.length
                },
                serviceStats,
                errors: errorData.map(error => ({
                    id: error.id,
                    service: error.service,
                    errorType: error.errorType,
                    errorCode: error.errorCode,
                    errorMessage: error.errorMessage,
                    timestamp: error.timestamp,
                    resolved: error.resolved
                })),
                metrics: metricsData.map(metric => ({
                    service: metric.service,
                    metricName: metric.metricName,
                    value: metric.value,
                    unit: metric.unit,
                    timestamp: metric.timestamp
                }))
            };
            return report;
        }
        catch (error) {
            this.logger.error('Failed to generate system health report', error);
            throw error;
        }
    }
    async generateAIAnalyticsReport(timeRange) {
        try {
            this.logger.debug('Generating AI analytics report', { timeRange });
            const where = {
                lastUpdated: {
                    gte: timeRange.start,
                    lte: timeRange.end
                }
            };
            const [aiAnalytics, classificationAnalytics, certificationAnalytics, safetyAnalytics] = await Promise.all([
                this.prisma.aIAnalytics.findMany({
                    where,
                    orderBy: { lastUpdated: 'desc' }
                }),
                this.prisma.aIClassificationAnalytics.findMany({
                    where,
                    orderBy: { lastUpdated: 'desc' }
                }),
                this.prisma.aICertificationAnalytics.findMany({
                    where,
                    orderBy: { lastUpdated: 'desc' }
                }),
                this.prisma.aISafetyAnalytics.findMany({
                    where,
                    orderBy: { lastUpdated: 'desc' }
                })
            ]);
            const report = {
                timeRange,
                generatedAt: new Date(),
                summary: {
                    totalModels: aiAnalytics.length,
                    totalClassifications: classificationAnalytics.reduce((sum, c) => sum + c.totalClassified, 0),
                    totalCertifications: certificationAnalytics.reduce((sum, c) => sum + c.totalCertified, 0),
                    totalSafetyAssessments: safetyAnalytics.reduce((sum, s) => sum + s.totalAssessed, 0)
                },
                modelPerformance: aiAnalytics.map(analytics => ({
                    modelId: analytics.modelId,
                    provider: analytics.provider,
                    totalRequests: analytics.totalRequests,
                    totalTokens: analytics.totalTokens,
                    averageLatency: analytics.averageLatency,
                    successRate: analytics.successRate,
                    averageCost: analytics.averageCost,
                    qualityScore: analytics.qualityScore
                })),
                classificationStats: classificationAnalytics.map(analytics => ({
                    modelId: analytics.modelId,
                    category: analytics.category,
                    totalClassified: analytics.totalClassified,
                    accuracyRate: analytics.accuracyRate,
                    averageConfidence: analytics.averageConfidence,
                    processingTime: analytics.processingTime
                })),
                certificationStats: certificationAnalytics.map(analytics => ({
                    modelId: analytics.modelId,
                    certificationLevel: analytics.certificationLevel,
                    totalCertified: analytics.totalCertified,
                    complianceRate: analytics.complianceRate,
                    auditFindings: analytics.auditFindings,
                    renewalRate: analytics.renewalRate
                })),
                safetyStats: safetyAnalytics.map(analytics => ({
                    modelId: analytics.modelId,
                    safetyLevel: analytics.safetyLevel,
                    totalAssessed: analytics.totalAssessed,
                    riskScore: analytics.riskScore,
                    biasScore: analytics.biasScore,
                    incidentCount: analytics.incidentCount
                }))
            };
            return report;
        }
        catch (error) {
            this.logger.error('Failed to generate AI analytics report', error);
            throw error;
        }
    }
    async generateChartData(chartType, timeRange, filters) {
        try {
            this.logger.debug('Generating chart data', { chartType, timeRange, filters });
            const where = {
                timestamp: {
                    gte: timeRange.start,
                    lte: timeRange.end
                },
                ...filters
            };
            let data = [];
            let xAxis = 'timestamp';
            let yAxis = 'value';
            switch (chartType) {
                case 'line':
                    data = await this.generateLineChartData(where, timeRange);
                    break;
                case 'bar':
                    data = await this.generateBarChartData(where, timeRange);
                    break;
                case 'pie':
                    data = await this.generatePieChartData(where, timeRange);
                    break;
                case 'area':
                    data = await this.generateAreaChartData(where, timeRange);
                    break;
                case 'scatter':
                    data = await this.generateScatterChartData(where, timeRange);
                    break;
                default:
                    data = [];
            }
            return {
                id: `chart_${Date.now()}`,
                type: chartType,
                title: this.getChartTitle(chartType),
                data,
                xAxis,
                yAxis,
                timeRange
            };
        }
        catch (error) {
            this.logger.error('Failed to generate chart data', error);
            throw error;
        }
    }
    async cleanupExpiredExports() {
        try {
            this.logger.debug('Cleaning up expired exports');
            const expiredExports = await this.prisma.dataExport.findMany({
                where: {
                    expiresAt: {
                        lt: new Date()
                    }
                }
            });
            let cleanedCount = 0;
            for (const exportRecord of expiredExports) {
                if (exportRecord.filePath) {
                    const filePath = path.join(this.exportDir, exportRecord.filePath);
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                }
                await this.prisma.dataExport.delete({
                    where: { id: exportRecord.id }
                });
                cleanedCount++;
            }
            this.logger.log(`Cleaned up ${cleanedCount} expired exports`);
            return cleanedCount;
        }
        catch (error) {
            this.logger.error('Failed to cleanup expired exports', error);
            throw error;
        }
    }
    async processExportAsync(exportId) {
        try {
            await this.prisma.dataExport.update({
                where: { id: exportId },
                data: { status: 'processing' }
            });
            const exportRecord = await this.prisma.dataExport.findUnique({
                where: { id: exportId }
            });
            if (!exportRecord) {
                throw new Error('Export record not found');
            }
            const data = await this.generateExportData(exportRecord.filters);
            const fileName = `export_${exportId}_${Date.now()}.${exportRecord.exportType}`;
            const filePath = path.join(this.exportDir, fileName);
            await this.generateExportFile(data, exportRecord.exportType, filePath);
            await this.prisma.dataExport.update({
                where: { id: exportId },
                data: {
                    status: 'completed',
                    filePath: filePath,
                    completedAt: new Date()
                }
            });
            this.logger.log(`Export ${exportId} completed successfully`);
        }
        catch (error) {
            this.logger.error(`Failed to process export ${exportId}`, error);
            await this.prisma.dataExport.update({
                where: { id: exportId },
                data: { status: 'failed' }
            });
        }
    }
    async generateExportData(filters) {
        const where = {
            timestamp: {
                gte: filters.dateRange.start,
                lte: filters.dateRange.end
            }
        };
        if (filters.eventTypes && filters.eventTypes.length > 0) {
            where.eventType = { in: filters.eventTypes };
        }
        if (filters.services && filters.services.length > 0) {
            where.service = { in: filters.services };
        }
        if (filters.userIds && filters.userIds.length > 0) {
            where.userId = { in: filters.userIds };
        }
        return await this.prisma.analyticsEvent.findMany({
            where,
            orderBy: { timestamp: 'desc' }
        });
    }
    async generateExportFile(data, exportType, filePath) {
        switch (exportType) {
            case 'csv':
                await this.generateCSVFile(data, filePath);
                break;
            case 'json':
                await this.generateJSONFile(data, filePath);
                break;
            case 'excel':
                await this.generateExcelFile(data, filePath);
                break;
            default:
                throw new Error(`Unsupported export type: ${exportType}`);
        }
    }
    async generateCSVFile(data, filePath) {
        const writer = csv.createObjectCsvWriter({
            path: filePath,
            header: [
                { id: 'id', title: 'ID' },
                { id: 'userId', title: 'User ID' },
                { id: 'eventType', title: 'Event Type' },
                { id: 'eventName', title: 'Event Name' },
                { id: 'service', title: 'Service' },
                { id: 'timestamp', title: 'Timestamp' },
                { id: 'properties', title: 'Properties' }
            ]
        });
        await writer.writeRecords(data);
    }
    async generateJSONFile(data, filePath) {
        const jsonData = {
            generatedAt: new Date(),
            totalRecords: data.length,
            data
        };
        fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
    }
    async generateExcelFile(data, filePath) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Analytics Data');
        worksheet.columns = [
            { header: 'ID', key: 'id', width: 20 },
            { header: 'User ID', key: 'userId', width: 20 },
            { header: 'Event Type', key: 'eventType', width: 15 },
            { header: 'Event Name', key: 'eventName', width: 20 },
            { header: 'Service', key: 'service', width: 15 },
            { header: 'Timestamp', key: 'timestamp', width: 20 },
            { header: 'Properties', key: 'properties', width: 30 }
        ];
        data.forEach(row => {
            worksheet.addRow({
                ...row,
                properties: JSON.stringify(row.properties)
            });
        });
        await workbook.xlsx.writeFile(filePath);
    }
    convertToCSV(data) {
        const headers = Object.keys(data.summary);
        const csvRows = [headers.join(',')];
        const values = headers.map(header => data.summary[header]);
        csvRows.push(values.join(','));
        return csvRows.join('\n');
    }
    async convertToExcel(data) {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Usage Report');
        worksheet.addRow(['Metric', 'Value']);
        Object.entries(data.summary).forEach(([key, value]) => {
            worksheet.addRow([key, value]);
        });
        return Buffer.from(await workbook.xlsx.writeBuffer());
    }
    async generateLineChartData(where, timeRange) {
        const data = await this.prisma.metricsSnapshot.findMany({
            where,
            orderBy: { timestamp: 'asc' }
        });
        return data.map(metric => ({
            x: metric.timestamp,
            y: metric.value,
            label: metric.metricName
        }));
    }
    async generateBarChartData(where, timeRange) {
        const data = await this.prisma.analyticsEvent.groupBy({
            by: ['service'],
            where,
            _count: { service: true }
        });
        return data.map(item => ({
            x: item.service,
            y: item._count.service,
            label: item.service
        }));
    }
    async generatePieChartData(where, timeRange) {
        const data = await this.prisma.analyticsEvent.groupBy({
            by: ['eventType'],
            where,
            _count: { eventType: true }
        });
        return data.map(item => ({
            label: item.eventType,
            value: item._count.eventType
        }));
    }
    async generateAreaChartData(where, timeRange) {
        return this.generateLineChartData(where, timeRange);
    }
    async generateScatterChartData(where, timeRange) {
        const data = await this.prisma.metricsSnapshot.findMany({
            where,
            orderBy: { timestamp: 'asc' }
        });
        return data.map(metric => ({
            x: metric.timestamp.getTime(),
            y: metric.value,
            label: metric.metricName
        }));
    }
    getChartTitle(chartType) {
        const titles = {
            line: 'Usage Over Time',
            bar: 'Service Comparison',
            pie: 'Event Distribution',
            area: 'Cumulative Usage',
            scatter: 'Performance Correlation'
        };
        return titles[chartType] || 'Chart';
    }
    mapToDataExport(prismaExport) {
        return {
            id: prismaExport.id,
            exportType: prismaExport.exportType,
            filters: prismaExport.filters,
            status: prismaExport.status,
            filePath: prismaExport.filePath,
            userId: prismaExport.userId,
            createdAt: prismaExport.createdAt,
            completedAt: prismaExport.completedAt,
            expiresAt: prismaExport.expiresAt
        };
    }
};
exports.ReportingService = ReportingService;
exports.ReportingService = ReportingService = ReportingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportingService);
//# sourceMappingURL=reporting.service.js.map