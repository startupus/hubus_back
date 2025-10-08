import { Response } from 'express';
import { CreateDataExportDto, DataExportResponseDto, AnalyticsResponseDto } from '../dto/analytics.dto';
import { ReportingService } from '../services/reporting.service';
export declare class ReportingController {
    private readonly reportingService;
    constructor(reportingService: ReportingService);
    createExport(createExportDto: CreateDataExportDto): Promise<AnalyticsResponseDto<DataExportResponseDto>>;
    getExportStatus(exportId: string): Promise<AnalyticsResponseDto<DataExportResponseDto>>;
    downloadExport(exportId: string, res: Response): Promise<void>;
    generateUsageReport(userId: string, startDate: string, endDate: string, format?: 'json' | 'csv' | 'excel'): Promise<AnalyticsResponseDto<any>>;
    generateSystemHealthReport(startDate: string, endDate: string): Promise<AnalyticsResponseDto<any>>;
    generateAIAnalyticsReport(startDate: string, endDate: string): Promise<AnalyticsResponseDto<any>>;
    generateChartData(chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter', startDate: string, endDate: string, granularity?: 'minute' | 'hour' | 'day' | 'week' | 'month'): Promise<AnalyticsResponseDto<any>>;
    cleanupExpiredExports(): Promise<AnalyticsResponseDto<{
        cleanedCount: number;
    }>>;
    private getContentType;
}
