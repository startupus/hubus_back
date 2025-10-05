import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Param, 
  Res,
  HttpStatus, 
  HttpException,
  UseGuards,
  Request
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiQuery, 
  ApiParam,
  ApiBearerAuth,
  ApiBody
} from '@nestjs/swagger';
import { Response } from 'express';
import { 
  CreateDataExportDto,
  DataExportResponseDto,
  AnalyticsResponseDto
} from '../dto/analytics.dto';
import { ReportingService } from '../services/reporting.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { ExportFilters, TimeRange } from '../types/analytics.types';

/**
 * Reporting Controller
 * 
 * API controller for reporting and data export functionality
 * Provides endpoints for:
 * - Data export creation and management
 * - Report generation
 * - Chart data preparation
 * - File downloads
 */
@ApiTags('Reporting')
@Controller('reports')
export class ReportingController {
  constructor(
    private readonly reportingService: ReportingService
  ) {}

  // ===========================================
  // DATA EXPORT ENDPOINTS
  // ===========================================

  @Post('exports')
  @ApiOperation({ 
    summary: 'Create data export',
    description: 'Create a new data export with specified filters and format'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Export created successfully',
    type: DataExportResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid export parameters'
  })
  @ApiBody({ type: CreateDataExportDto })
  async createExport(@Body() createExportDto: CreateDataExportDto): Promise<AnalyticsResponseDto<DataExportResponseDto>> {
    try {
      LoggerUtil.debug('reporting-controller', 'Creating data export', {
        exportType: createExportDto.exportType,
        filters: createExportDto.filters,
        userId: createExportDto.userId
      });

      // Convert string dates to Date objects
      const filters: ExportFilters = {
        ...createExportDto.filters,
        dateRange: {
          start: new Date(createExportDto.filters.dateRange.start),
          end: new Date(createExportDto.filters.dateRange.end),
        },
      };

      const exportRecord = await this.reportingService.createDataExport(
        createExportDto.exportType,
        filters,
        createExportDto.userId
      );

      return {
        success: true,
        data: exportRecord as DataExportResponseDto,
        message: 'Export created successfully'
      };
    } catch (error) {
      LoggerUtil.error('reporting-controller', 'Failed to create export', error as Error);
      throw new HttpException(
        'Failed to create export',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('exports/:exportId/status')
  @ApiOperation({ 
    summary: 'Get export status',
    description: 'Check the status of a data export'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Export status retrieved successfully',
    type: DataExportResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Export not found'
  })
  @ApiParam({ name: 'exportId', description: 'Export ID' })
  async getExportStatus(@Param('exportId') exportId: string): Promise<AnalyticsResponseDto<DataExportResponseDto>> {
    try {
      LoggerUtil.debug('reporting-controller', 'Getting export status', { exportId });

      const exportRecord = await this.reportingService.getExportStatus(exportId);

      if (!exportRecord) {
        throw new HttpException(
          'Export not found',
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: exportRecord as DataExportResponseDto,
        message: 'Export status retrieved successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      LoggerUtil.error('reporting-controller', 'Failed to get export status', error as Error);
      throw new HttpException(
        'Failed to get export status',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('exports/:exportId/download')
  @ApiOperation({ 
    summary: 'Download export file',
    description: 'Download the completed export file'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Export file downloaded successfully'
  })
  @ApiResponse({ 
    status: HttpStatus.NOT_FOUND, 
    description: 'Export file not found'
  })
  @ApiParam({ name: 'exportId', description: 'Export ID' })
  async downloadExport(
    @Param('exportId') exportId: string,
    @Res() res: Response
  ): Promise<void> {
    try {
      LoggerUtil.debug('reporting-controller', 'Downloading export file', { exportId });

      const fileBuffer = await this.reportingService.downloadExport(exportId);

      if (!fileBuffer) {
        throw new HttpException(
          'Export file not found or not ready',
          HttpStatus.NOT_FOUND
        );
      }

      // Set appropriate headers based on export type
      const exportRecord = await this.reportingService.getExportStatus(exportId);
      const contentType = this.getContentType(exportRecord?.exportType || 'json');
      const fileName = `export_${exportId}.${exportRecord?.exportType || 'json'}`;

      res.set({
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Content-Length': fileBuffer.length.toString()
      });

      res.send(fileBuffer);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      LoggerUtil.error('reporting-controller', 'Failed to download export', error as Error);
      throw new HttpException(
        'Failed to download export',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===========================================
  // REPORT GENERATION ENDPOINTS
  // ===========================================

  @Get('usage/:userId')
  @ApiOperation({ 
    summary: 'Generate usage report',
    description: 'Generate a comprehensive usage report for a specific user'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Usage report generated successfully'
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'format', required: false, description: 'Report format', enum: ['json', 'csv', 'excel'] })
  async generateUsageReport(
    @Param('userId') userId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('format') format: 'json' | 'csv' | 'excel' = 'json'
  ): Promise<AnalyticsResponseDto<any>> {
    try {
      LoggerUtil.debug('reporting-controller', 'Generating usage report', {
        userId,
        startDate,
        endDate,
        format
      });

      const timeRange: TimeRange = {
        start: new Date(startDate),
        end: new Date(endDate),
        granularity: 'day'
      };

      const report = await this.reportingService.generateUsageReport(
        userId,
        timeRange,
        format
      );

      return {
        success: true,
        data: report,
        message: 'Usage report generated successfully'
      };
    } catch (error) {
      LoggerUtil.error('reporting-controller', 'Failed to generate usage report', error as Error);
      throw new HttpException(
        'Failed to generate usage report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('system-health')
  @ApiOperation({ 
    summary: 'Generate system health report',
    description: 'Generate a comprehensive system health report'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'System health report generated successfully'
  })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  async generateSystemHealthReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<AnalyticsResponseDto<any>> {
    try {
      LoggerUtil.debug('reporting-controller', 'Generating system health report', {
        startDate,
        endDate
      });

      const timeRange: TimeRange = {
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
    } catch (error) {
      LoggerUtil.error('reporting-controller', 'Failed to generate system health report', error as Error);
      throw new HttpException(
        'Failed to generate system health report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('ai-analytics')
  @ApiOperation({ 
    summary: 'Generate AI analytics report',
    description: 'Generate a comprehensive AI analytics report'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'AI analytics report generated successfully'
  })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  async generateAIAnalyticsReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string
  ): Promise<AnalyticsResponseDto<any>> {
    try {
      LoggerUtil.debug('reporting-controller', 'Generating AI analytics report', {
        startDate,
        endDate
      });

      const timeRange: TimeRange = {
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
    } catch (error) {
      LoggerUtil.error('reporting-controller', 'Failed to generate AI analytics report', error as Error);
      throw new HttpException(
        'Failed to generate AI analytics report',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===========================================
  // CHART DATA ENDPOINTS
  // ===========================================

  @Get('charts/:chartType')
  @ApiOperation({ 
    summary: 'Generate chart data',
    description: 'Generate data for various chart types'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Chart data generated successfully'
  })
  @ApiParam({ 
    name: 'chartType', 
    description: 'Chart type',
    enum: ['line', 'bar', 'pie', 'area', 'scatter']
  })
  @ApiQuery({ name: 'startDate', required: true, description: 'Start date (ISO string)' })
  @ApiQuery({ name: 'endDate', required: true, description: 'End date (ISO string)' })
  @ApiQuery({ name: 'granularity', required: false, description: 'Time granularity', enum: ['minute', 'hour', 'day', 'week', 'month'] })
  async generateChartData(
    @Param('chartType') chartType: 'line' | 'bar' | 'pie' | 'area' | 'scatter',
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @Query('granularity') granularity: 'minute' | 'hour' | 'day' | 'week' | 'month' = 'day'
  ): Promise<AnalyticsResponseDto<any>> {
    try {
      LoggerUtil.debug('reporting-controller', 'Generating chart data', {
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

      const chartData = await this.reportingService.generateChartData(
        chartType,
        timeRange
      );

      return {
        success: true,
        data: chartData,
        message: 'Chart data generated successfully'
      };
    } catch (error) {
      LoggerUtil.error('reporting-controller', 'Failed to generate chart data', error as Error);
      throw new HttpException(
        'Failed to generate chart data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===========================================
  // MAINTENANCE ENDPOINTS
  // ===========================================

  @Post('cleanup')
  @ApiOperation({ 
    summary: 'Cleanup expired exports',
    description: 'Clean up expired export files and database records'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Cleanup completed successfully'
  })
  async cleanupExpiredExports(): Promise<AnalyticsResponseDto<{ cleanedCount: number }>> {
    try {
      LoggerUtil.debug('reporting-controller', 'Starting cleanup of expired exports');

      const cleanedCount = await this.reportingService.cleanupExpiredExports();

      return {
        success: true,
        data: { cleanedCount },
        message: `Cleanup completed successfully. Removed ${cleanedCount} expired exports.`
      };
    } catch (error) {
      LoggerUtil.error('reporting-controller', 'Failed to cleanup expired exports', error as Error);
      throw new HttpException(
        'Failed to cleanup expired exports',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================

  private getContentType(exportType: string): string {
    const contentTypes = {
      csv: 'text/csv',
      json: 'application/json',
      excel: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      pdf: 'application/pdf'
    };
    return contentTypes[exportType] || 'application/octet-stream';
  }
}
