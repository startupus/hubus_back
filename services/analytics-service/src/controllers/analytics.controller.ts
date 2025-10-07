import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Query, 
  Param, 
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
import { 
  TrackEventDto,
  RecordMetricsDto,
  GetAnalyticsDto,
  GetMetricsDto,
  AnalyticsResponseDto,
  AnalyticsEventResponseDto,
  MetricsSnapshotResponseDto,
  UserAnalyticsResponseDto,
  DashboardResponseDto,
  BatchEventDto,
  BatchMetricsDto,
  ProcessingResultDto
} from '../dto/analytics.dto';
import { DataCollectionService } from '../services/data-collection.service';
import { AnalyticsService } from '../services/analytics.service';
import { ReportingService } from '../services/reporting.service';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * Analytics Controller
 * 
 * Main API controller for analytics functionality
 * Provides endpoints for:
 * - Event tracking
 * - Metrics recording
 * - Data retrieval
 * - Dashboard data
 * - Batch processing
 */
@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly dataCollectionService: DataCollectionService,
    private readonly analyticsService: AnalyticsService,
    private readonly reportingService: ReportingService
  ) {}

  // ===========================================
  // EVENT TRACKING ENDPOINTS
  // ===========================================

  @Post('events/track')
  @ApiOperation({ 
    summary: 'Track analytics event',
    description: 'Record a single analytics event for tracking user behavior and system events'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Event tracked successfully',
    type: AnalyticsEventResponseDto
  })
  @ApiResponse({ 
    status: HttpStatus.BAD_REQUEST, 
    description: 'Invalid event data'
  })
  @ApiBody({ type: TrackEventDto })
  async trackEvent(@Body() trackEventDto: TrackEventDto): Promise<AnalyticsResponseDto<AnalyticsEventResponseDto>> {
    try {
      LoggerUtil.debug('analytics-controller', 'Tracking event', {
        eventType: trackEventDto.eventType as any,
        eventName: trackEventDto.eventName,
        service: trackEventDto.service
      });

      const event = await this.dataCollectionService.recordEvent({
        userId: trackEventDto.userId,
        sessionId: trackEventDto.sessionId,
        eventType: trackEventDto.eventType as any,
        eventName: trackEventDto.eventName,
        service: trackEventDto.service,
        properties: trackEventDto.properties,
        metadata: trackEventDto.metadata,
        ipAddress: trackEventDto.ipAddress,
        userAgent: trackEventDto.userAgent
      });

      return {
        success: true,
        data: event as AnalyticsEventResponseDto,
        message: 'Event tracked successfully'
      };
    } catch (error) {
      LoggerUtil.error('analytics-controller', 'Failed to track event', error as Error);
      throw new HttpException(
        'Failed to track event',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('events/batch')
  @ApiOperation({ 
    summary: 'Track multiple events in batch',
    description: 'Record multiple analytics events in a single batch operation for better performance'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Events processed successfully',
    type: ProcessingResultDto
  })
  @ApiBody({ type: BatchEventDto })
  async trackEventsBatch(@Body() batchEventDto: BatchEventDto): Promise<AnalyticsResponseDto<ProcessingResultDto>> {
    try {
      LoggerUtil.debug('analytics-controller', 'Processing batch events', {
        batchId: batchEventDto.batchId,
        eventCount: batchEventDto.events.length,
        source: batchEventDto.source
      });

      const result = await this.dataCollectionService.processBatchEvents(batchEventDto as any);

      return {
        success: result.success,
        data: result,
        message: result.success ? 'Events processed successfully' : 'Some events failed to process'
      };
    } catch (error) {
      LoggerUtil.error('analytics-controller', 'Failed to process batch events', error as Error);
      throw new HttpException(
        'Failed to process batch events',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===========================================
  // METRICS RECORDING ENDPOINTS
  // ===========================================

  @Post('metrics/record')
  @ApiOperation({ 
    summary: 'Record metrics snapshot',
    description: 'Record a single metrics snapshot for system performance monitoring'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Metrics recorded successfully',
    type: MetricsSnapshotResponseDto
  })
  @ApiBody({ type: RecordMetricsDto })
  async recordMetrics(@Body() recordMetricsDto: RecordMetricsDto): Promise<AnalyticsResponseDto<MetricsSnapshotResponseDto>> {
    try {
      LoggerUtil.debug('analytics-controller', 'Recording metrics', {
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
        data: metrics as MetricsSnapshotResponseDto,
        message: 'Metrics recorded successfully'
      };
    } catch (error) {
      LoggerUtil.error('analytics-controller', 'Failed to record metrics', error as Error);
      throw new HttpException(
        'Failed to record metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('metrics/batch')
  @ApiOperation({ 
    summary: 'Record multiple metrics in batch',
    description: 'Record multiple metrics snapshots in a single batch operation'
  })
  @ApiResponse({ 
    status: HttpStatus.CREATED, 
    description: 'Metrics processed successfully',
    type: ProcessingResultDto
  })
  @ApiBody({ type: BatchMetricsDto })
  async recordMetricsBatch(@Body() batchMetricsDto: BatchMetricsDto): Promise<AnalyticsResponseDto<ProcessingResultDto>> {
    try {
      LoggerUtil.debug('analytics-controller', 'Processing batch metrics', {
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
    } catch (error) {
      LoggerUtil.error('analytics-controller', 'Failed to process batch metrics', error as Error);
      throw new HttpException(
        'Failed to process batch metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===========================================
  // DATA RETRIEVAL ENDPOINTS
  // ===========================================

  @Get('events')
  @ApiOperation({ 
    summary: 'Get analytics events',
    description: 'Retrieve analytics events with filtering and pagination'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Events retrieved successfully',
    type: [AnalyticsEventResponseDto]
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (ISO string)' })
  @ApiQuery({ name: 'eventTypes', required: false, description: 'Filter by event types (comma-separated)' })
  @ApiQuery({ name: 'services', required: false, description: 'Filter by services (comma-separated)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  @ApiQuery({ name: 'sortBy', required: false, description: 'Sort field', example: 'timestamp' })
  @ApiQuery({ name: 'sortOrder', required: false, description: 'Sort order', enum: ['asc', 'desc'] })
  async getEvents(@Query() query: GetAnalyticsDto): Promise<AnalyticsResponseDto<AnalyticsEventResponseDto[]>> {
    try {
      LoggerUtil.debug('analytics-controller', 'Fetching events', { query });

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
    } catch (error) {
      LoggerUtil.error('analytics-controller', 'Failed to fetch events', error as Error);
      throw new HttpException(
        'Failed to fetch events',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('metrics')
  @ApiOperation({ 
    summary: 'Get metrics snapshots',
    description: 'Retrieve metrics snapshots with filtering and aggregation'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Metrics retrieved successfully',
    type: [MetricsSnapshotResponseDto]
  })
  @ApiQuery({ name: 'service', required: false, description: 'Filter by service' })
  @ApiQuery({ name: 'metricType', required: false, description: 'Filter by metric type' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Start date filter (ISO string)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'End date filter (ISO string)' })
  @ApiQuery({ name: 'page', required: false, description: 'Page number', example: 1 })
  @ApiQuery({ name: 'limit', required: false, description: 'Items per page', example: 20 })
  async getMetrics(@Query() query: GetMetricsDto): Promise<AnalyticsResponseDto<MetricsSnapshotResponseDto[]>> {
    try {
      LoggerUtil.debug('analytics-controller', 'Fetching metrics', { query });

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
        data: result.metrics as MetricsSnapshotResponseDto[],
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
    } catch (error) {
      LoggerUtil.error('analytics-controller', 'Failed to fetch metrics', error as Error);
      throw new HttpException(
        'Failed to fetch metrics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===========================================
  // USER ANALYTICS ENDPOINTS
  // ===========================================

  @Get('users/:userId/analytics')
  @ApiOperation({ 
    summary: 'Get user analytics',
    description: 'Retrieve analytics data for a specific user'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'User analytics retrieved successfully',
    type: UserAnalyticsResponseDto
  })
  @ApiParam({ name: 'userId', description: 'User ID' })
  async getUserAnalytics(@Param('userId') userId: string): Promise<AnalyticsResponseDto<UserAnalyticsResponseDto>> {
    try {
      LoggerUtil.debug('analytics-controller', 'Fetching user analytics', { userId });

      const userAnalytics = await this.analyticsService.getUserAnalytics(userId);

      if (!userAnalytics) {
        throw new HttpException(
          'User analytics not found',
          HttpStatus.NOT_FOUND
        );
      }

      return {
        success: true,
        data: userAnalytics as UserAnalyticsResponseDto,
        message: 'User analytics retrieved successfully'
      };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      LoggerUtil.error('analytics-controller', 'Failed to fetch user analytics', error as Error);
      throw new HttpException(
        'Failed to fetch user analytics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===========================================
  // DASHBOARD ENDPOINTS
  // ===========================================

  @Get('dashboard')
  @ApiOperation({ 
    summary: 'Get dashboard data',
    description: 'Retrieve comprehensive dashboard data including summary, charts, and recent activity'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Dashboard data retrieved successfully',
    type: DashboardResponseDto
  })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter by user ID for personalized dashboard' })
  async getDashboard(@Query('userId') userId?: string): Promise<AnalyticsResponseDto<DashboardResponseDto>> {
    try {
      LoggerUtil.debug('analytics-controller', 'Generating dashboard data', { userId });

      const dashboardData = await this.analyticsService.getDashboardData(userId);

      return {
        success: true,
        data: dashboardData as DashboardResponseDto,
        message: 'Dashboard data retrieved successfully'
      };
    } catch (error) {
      LoggerUtil.error('analytics-controller', 'Failed to generate dashboard data', error as Error);
      throw new HttpException(
        'Failed to generate dashboard data',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===========================================
  // AI ANALYTICS ENDPOINTS
  // ===========================================

  @Get('ai/analytics')
  @ApiOperation({ 
    summary: 'Get AI analytics',
    description: 'Retrieve analytics data for AI models and providers'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'AI analytics retrieved successfully'
  })
  @ApiQuery({ name: 'modelId', required: false, description: 'Filter by model ID' })
  @ApiQuery({ name: 'provider', required: false, description: 'Filter by provider' })
  async getAIAnalytics(
    @Query('modelId') modelId?: string,
    @Query('provider') provider?: string
  ): Promise<AnalyticsResponseDto<any[]>> {
    try {
      LoggerUtil.debug('analytics-controller', 'Fetching AI analytics', { modelId, provider });

      const aiAnalytics = await this.analyticsService.getAIAnalytics(modelId, provider);

      return {
        success: true,
        data: aiAnalytics,
        message: 'AI analytics retrieved successfully'
      };
    } catch (error) {
      LoggerUtil.error('analytics-controller', 'Failed to fetch AI analytics', error as Error);
      throw new HttpException(
        'Failed to fetch AI analytics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===========================================
  // SYSTEM HEALTH ENDPOINTS
  // ===========================================

  @Get('system-health')
  @ApiOperation({ 
    summary: 'Get system health status',
    description: 'Retrieve current system health status and performance metrics'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'System health retrieved successfully'
  })
  async getSystemHealth(): Promise<AnalyticsResponseDto<any[]>> {
    try {
      LoggerUtil.debug('analytics-controller', 'Fetching system health');

      const systemHealth = await this.analyticsService.getSystemHealth();

      return {
        success: true,
        data: systemHealth,
        message: 'System health retrieved successfully'
      };
    } catch (error) {
      LoggerUtil.error('analytics-controller', 'Failed to fetch system health', error as Error);
      throw new HttpException(
        'Failed to fetch system health',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===========================================
  // STATISTICS ENDPOINTS
  // ===========================================

  @Get('stats/collection')
  @ApiOperation({ 
    summary: 'Get data collection statistics',
    description: 'Retrieve statistics about data collection performance and volume'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Collection statistics retrieved successfully'
  })
  async getCollectionStats(): Promise<AnalyticsResponseDto<any>> {
    try {
      LoggerUtil.debug('analytics-controller', 'Fetching collection statistics');

      const stats = await this.dataCollectionService.getCollectionStats();

      return {
        success: true,
        data: stats,
        message: 'Collection statistics retrieved successfully'
      };
    } catch (error) {
      LoggerUtil.error('analytics-controller', 'Failed to fetch collection statistics', error as Error);
      throw new HttpException(
        'Failed to fetch collection statistics',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  // ===========================================
  // HEALTH CHECK ENDPOINT
  // ===========================================

  @Get('ping')
  @ApiOperation({ 
    summary: 'Health check',
    description: 'Simple health check endpoint'
  })
  @ApiResponse({ 
    status: HttpStatus.OK, 
    description: 'Service is healthy'
  })
  async ping(): Promise<AnalyticsResponseDto<any>> {
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
}
