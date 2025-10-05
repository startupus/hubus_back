import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { 
  DataExport,
  ExportFilters,
  ExportType,
  ExportStatus,
  TimeRange,
  ChartData,
  ChartType
} from '../types/analytics.types';
import { LoggerUtil } from '@ai-aggregator/shared';
import * as fs from 'fs';
import * as path from 'path';
import * as csv from 'csv-writer';
import * as ExcelJS from 'exceljs';

/**
 * Reporting Service
 * 
 * Responsible for:
 * - Data export functionality (CSV, JSON, Excel, PDF)
 * - Report generation
 * - Chart data preparation
 * - Scheduled reports
 * - Custom report templates
 */
@Injectable()
export class ReportingService {
  private readonly logger = new Logger(ReportingService.name);
  private readonly exportDir = process.env.EXPORT_DIR || './exports';

  constructor(private readonly prisma: PrismaService) {
    // Ensure export directory exists
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }

  /**
   * Create a data export
   */
  async createDataExport(
    exportType: ExportType,
    filters: ExportFilters,
    userId?: string
  ): Promise<DataExport> {
    try {
      this.logger.debug('Creating data export', { exportType, filters, userId });

      // Create export record
      const exportRecord = await (this.prisma as any).dataExport.create({
        data: {
          exportType,
          filters: filters as any,
          status: 'pending',
          userId,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
        }
      });

      // Process export asynchronously
      this.processExportAsync(exportRecord.id);

      return this.mapToDataExport(exportRecord);
    } catch (error) {
      this.logger.error('Failed to create data export', error);
      throw error;
    }
  }

  /**
   * Get export status
   */
  async getExportStatus(exportId: string): Promise<DataExport | null> {
    try {
      const exportRecord = await (this.prisma as any).dataExport.findUnique({
        where: { id: exportId }
      });

      if (!exportRecord) {
        return null;
      }

      return this.mapToDataExport(exportRecord);
    } catch (error) {
      this.logger.error('Failed to get export status', error);
      throw error;
    }
  }

  /**
   * Download export file
   */
  async downloadExport(exportId: string): Promise<Buffer | null> {
    try {
      const exportRecord = await (this.prisma as any).dataExport.findUnique({
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
    } catch (error) {
      this.logger.error('Failed to download export', error);
      throw error;
    }
  }

  /**
   * Generate usage report
   */
  async generateUsageReport(
    userId: string,
    timeRange: TimeRange,
    format: 'json' | 'csv' | 'excel' = 'json'
  ): Promise<any> {
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
        (this.prisma as any).analyticsEvent.findMany({
          where,
          orderBy: { timestamp: 'desc' }
        }),
        (this.prisma as any).metricsSnapshot.findMany({
          where: { timestamp: { gte: timeRange.start, lte: timeRange.end } },
          orderBy: { timestamp: 'desc' }
        }),
        (this.prisma as any).userAnalytics.findUnique({
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
      } else if (format === 'csv') {
        return this.convertToCSV(report);
      } else if (format === 'excel') {
        return await this.convertToExcel(report);
      }

      return report;
    } catch (error) {
      this.logger.error('Failed to generate usage report', error);
      throw error;
    }
  }

  /**
   * Generate system health report
   */
  async generateSystemHealthReport(timeRange: TimeRange): Promise<any> {
    try {
      this.logger.debug('Generating system health report', { timeRange });

      const where = {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      };

      const [healthData, errorData, metricsData] = await Promise.all([
        (this.prisma as any).systemHealth.findMany({
          where,
          orderBy: { timestamp: 'desc' }
        }),
        (this.prisma as any).errorAnalytics.findMany({
          where,
          orderBy: { timestamp: 'desc' }
        }),
        (this.prisma as any).metricsSnapshot.findMany({
          where: {
            ...where,
            metricType: 'performance'
          },
          orderBy: { timestamp: 'desc' }
        })
      ]);

      // Calculate health statistics
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
    } catch (error) {
      this.logger.error('Failed to generate system health report', error);
      throw error;
    }
  }

  /**
   * Generate AI analytics report
   */
  async generateAIAnalyticsReport(timeRange: TimeRange): Promise<any> {
    try {
      this.logger.debug('Generating AI analytics report', { timeRange });

      const where = {
        lastUpdated: {
          gte: timeRange.start,
          lte: timeRange.end
        }
      };

      const [aiAnalytics, classificationAnalytics, certificationAnalytics, safetyAnalytics] = await Promise.all([
        (this.prisma as any).aIAnalytics.findMany({
          where,
          orderBy: { lastUpdated: 'desc' }
        }),
        (this.prisma as any).aIClassificationAnalytics.findMany({
          where,
          orderBy: { lastUpdated: 'desc' }
        }),
        (this.prisma as any).aICertificationAnalytics.findMany({
          where,
          orderBy: { lastUpdated: 'desc' }
        }),
        (this.prisma as any).aISafetyAnalytics.findMany({
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
    } catch (error) {
      this.logger.error('Failed to generate AI analytics report', error);
      throw error;
    }
  }

  /**
   * Generate chart data for dashboard
   */
  async generateChartData(
    chartType: ChartType,
    timeRange: TimeRange,
    filters?: any
  ): Promise<ChartData> {
    try {
      this.logger.debug('Generating chart data', { chartType, timeRange, filters });

      const where = {
        timestamp: {
          gte: timeRange.start,
          lte: timeRange.end
        },
        ...filters
      };

      let data: any[] = [];
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
    } catch (error) {
      this.logger.error('Failed to generate chart data', error);
      throw error;
    }
  }

  /**
   * Clean up expired exports
   */
  async cleanupExpiredExports(): Promise<number> {
    try {
      this.logger.debug('Cleaning up expired exports');

      const expiredExports = await (this.prisma as any).dataExport.findMany({
        where: {
          expiresAt: {
            lt: new Date()
          }
        }
      });

      let cleanedCount = 0;

      for (const exportRecord of expiredExports) {
        // Delete file if it exists
        if (exportRecord.filePath) {
          const filePath = path.join(this.exportDir, exportRecord.filePath);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        }

        // Delete database record
        await (this.prisma as any).dataExport.delete({
          where: { id: exportRecord.id }
        });

        cleanedCount++;
      }

      this.logger.log(`Cleaned up ${cleanedCount} expired exports`);
      return cleanedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup expired exports', error);
      throw error;
    }
  }

  // Private helper methods

  private async processExportAsync(exportId: string): Promise<void> {
    try {
      // Update status to processing
      await (this.prisma as any).dataExport.update({
        where: { id: exportId },
        data: { status: 'processing' }
      });

      const exportRecord = await (this.prisma as any).dataExport.findUnique({
        where: { id: exportId }
      });

      if (!exportRecord) {
        throw new Error('Export record not found');
      }

      // Generate export data based on filters
      const data = await this.generateExportData(exportRecord.filters as unknown as ExportFilters);
      
      // Generate file based on export type
      const fileName = `export_${exportId}_${Date.now()}.${exportRecord.exportType}`;
      const filePath = path.join(this.exportDir, fileName);

      await this.generateExportFile(data, exportRecord.exportType as ExportType, filePath);

      // Update export record
      await (this.prisma as any).dataExport.update({
        where: { id: exportId },
        data: {
          status: 'completed',
          filePath: filePath,
          completedAt: new Date()
        }
      });

      this.logger.log(`Export ${exportId} completed successfully`);
    } catch (error) {
      this.logger.error(`Failed to process export ${exportId}`, error);
      
      await (this.prisma as any).dataExport.update({
        where: { id: exportId },
        data: { status: 'failed' }
      });
    }
  }
 
  private async generateExportData(filters: ExportFilters): Promise<any[]> {
    const where: any = {
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

    return await (this.prisma as any).analyticsEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' }
    });
  }

  private async generateExportFile(data: any[], exportType: ExportType, filePath: string): Promise<void> {
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

  private async generateCSVFile(data: any[], filePath: string): Promise<void> {
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

  private async generateJSONFile(data: any[], filePath: string): Promise<void> {
    const jsonData = {
      generatedAt: new Date(),
      totalRecords: data.length,
      data
    };

    fs.writeFileSync(filePath, JSON.stringify(jsonData, null, 2));
  }

  private async generateExcelFile(data: any[], filePath: string): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Analytics Data');

    // Add headers
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 20 },
      { header: 'User ID', key: 'userId', width: 20 },
      { header: 'Event Type', key: 'eventType', width: 15 },
      { header: 'Event Name', key: 'eventName', width: 20 },
      { header: 'Service', key: 'service', width: 15 },
      { header: 'Timestamp', key: 'timestamp', width: 20 },
      { header: 'Properties', key: 'properties', width: 30 }
    ];

    // Add data
    data.forEach(row => {
      worksheet.addRow({
        ...row,
        properties: JSON.stringify(row.properties)
      });
    });

    await workbook.xlsx.writeFile(filePath);
  }

  private convertToCSV(data: any): string {
    // Simplified CSV conversion
    const headers = Object.keys(data.summary);
    const csvRows = [headers.join(',')];
    
    const values = headers.map(header => data.summary[header]);
    csvRows.push(values.join(','));
    
    return csvRows.join('\n');
  }

  private async convertToExcel(data: any): Promise<Buffer> {
    // Simplified Excel conversion
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Usage Report');
    
    // Add summary data
    worksheet.addRow(['Metric', 'Value']);
    Object.entries(data.summary).forEach(([key, value]) => {
      worksheet.addRow([key, value]);
    });
    
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private async generateLineChartData(where: any, timeRange: TimeRange): Promise<any[]> {
    // Simplified line chart data generation
    const data = await (this.prisma as any).metricsSnapshot.findMany({
      where,
      orderBy: { timestamp: 'asc' }
    });

    return data.map(metric => ({
      x: metric.timestamp,
      y: metric.value,
      label: metric.metricName
    }));
  }

  private async generateBarChartData(where: any, timeRange: TimeRange): Promise<any[]> {
    // Simplified bar chart data generation
    const data = await (this.prisma as any).analyticsEvent.groupBy({
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

  private async generatePieChartData(where: any, timeRange: TimeRange): Promise<any[]> {
    // Simplified pie chart data generation
    const data = await (this.prisma as any).analyticsEvent.groupBy({
      by: ['eventType'],
      where,
      _count: { eventType: true }
    });

    return data.map(item => ({
      label: item.eventType,
      value: item._count.eventType
    }));
  }

  private async generateAreaChartData(where: any, timeRange: TimeRange): Promise<any[]> {
    // Similar to line chart but for area visualization
    return this.generateLineChartData(where, timeRange);
  }

  private async generateScatterChartData(where: any, timeRange: TimeRange): Promise<any[]> {
    // Simplified scatter chart data generation
    const data = await (this.prisma as any).metricsSnapshot.findMany({
      where,
      orderBy: { timestamp: 'asc' }
    });

    return data.map(metric => ({
      x: metric.timestamp.getTime(),
      y: metric.value,
      label: metric.metricName
    }));
  }

  private getChartTitle(chartType: ChartType): string {
    const titles = {
      line: 'Usage Over Time',
      bar: 'Service Comparison',
      pie: 'Event Distribution',
      area: 'Cumulative Usage',
      scatter: 'Performance Correlation'
    };
    return titles[chartType] || 'Chart';
  }

  private mapToDataExport(prismaExport: any): DataExport {
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
}