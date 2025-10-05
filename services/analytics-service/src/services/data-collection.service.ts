import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { 
  AnalyticsEvent, 
  MetricsSnapshot, 
  BatchEvent, 
  BatchMetrics, 
  ProcessingResult,
  ProcessingError 
} from '../types/analytics.types';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * Data Collection Service
 * 
 * Responsible for:
 * - Collecting and storing analytics events
 * - Recording metrics snapshots
 * - Batch processing of events and metrics
 * - Data validation and normalization
 * - Real-time and batch data ingestion
 */
@Injectable()
export class DataCollectionService {
  private readonly logger = new Logger(DataCollectionService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Record a single analytics event
   */
  async recordEvent(event: AnalyticsEvent): Promise<AnalyticsEvent> {
    try {
      this.logger.debug('Recording analytics event', {
        eventType: event.eventType,
        eventName: event.eventName,
        service: event.service,
        userId: event.userId
      });

      const createdEvent = await this.prisma.analyticsEvent.create({
        data: {
          userId: event.userId || null, // Делаем userId опциональным
          sessionId: event.sessionId,
          eventType: event.eventType,
          eventName: event.eventName,
          service: event.service,
          properties: event.properties,
          metadata: event.metadata,
          timestamp: event.timestamp || new Date(),
          ipAddress: event.ipAddress,
          userAgent: event.userAgent
        }
      });

      this.logger.log('Analytics event recorded successfully', {
        eventId: createdEvent.id,
        eventType: event.eventType
      });

      return this.mapToAnalyticsEvent(createdEvent);
    } catch (error) {
      this.logger.error('Failed to record analytics event', error);
      throw error;
    }
  }

  /**
   * Record multiple analytics events in batch
   */
  async recordEventsBatch(events: AnalyticsEvent[]): Promise<ProcessingResult> {
    const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errors: ProcessingError[] = [];
    let processed = 0;

    try {
      this.logger.debug('Processing batch of analytics events', {
        batchId,
        eventCount: events.length
      });

      // Process events in chunks to avoid overwhelming the database
      const chunkSize = 100;
      for (let i = 0; i < events.length; i += chunkSize) {
        const chunk = events.slice(i, i + chunkSize);
        
        try {
          await this.prisma.analyticsEvent.createMany({
            data: chunk.map(event => ({
              userId: event.userId,
              sessionId: event.sessionId,
              eventType: event.eventType,
              eventName: event.eventName,
              service: event.service,
              properties: event.properties,
              metadata: event.metadata,
              timestamp: event.timestamp || new Date(),
              ipAddress: event.ipAddress,
              userAgent: event.userAgent
            }))
          });
          processed += chunk.length;
        } catch (chunkError) {
          this.logger.error('Failed to process chunk of events', {
            batchId,
            chunkIndex: i,
            error: chunkError
          });
          
          // Record individual errors for this chunk
          chunk.forEach((event, index) => {
            errors.push({
              index: i + index,
              error: chunkError instanceof Error ? chunkError.message : String(chunkError),
              data: event
            });
          });
        }
      }

      this.logger.log('Batch processing completed', {
        batchId,
        processed,
        failed: errors.length,
        total: events.length
      });

      return {
        success: errors.length === 0,
        processed,
        failed: errors.length,
        errors,
        batchId
      };
    } catch (error) {
      this.logger.error('Failed to process events batch', error);
      throw error;
    }
  }

  /**
   * Record a single metrics snapshot
   */
  async recordMetrics(metrics: MetricsSnapshot): Promise<MetricsSnapshot> {
    try {
      this.logger.debug('Recording metrics snapshot', {
        service: metrics.service,
        metricType: metrics.metricType,
        metricName: metrics.metricName,
        value: metrics.value
      });

      const createdMetrics = await this.prisma.metricsSnapshot.create({
        data: {
          service: metrics.service,
          metricType: metrics.metricType,
          metricName: metrics.metricName,
          value: metrics.value,
          unit: metrics.unit,
          labels: metrics.labels,
          timestamp: metrics.timestamp || new Date(),
          metadata: metrics.metadata
        }
      });

      this.logger.log('Metrics snapshot recorded successfully', {
        metricsId: createdMetrics.id,
        service: metrics.service,
        metricName: metrics.metricName
      });

      return this.mapToMetricsSnapshot(createdMetrics);
    } catch (error) {
      this.logger.error('Failed to record metrics snapshot', error);
      throw error;
    }
  }

  /**
   * Record multiple metrics snapshots in batch
   */
  async recordMetricsBatch(metrics: MetricsSnapshot[]): Promise<ProcessingResult> {
    const batchId = `metrics_batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const errors: ProcessingError[] = [];
    let processed = 0;

    try {
      this.logger.debug('Processing batch of metrics snapshots', {
        batchId,
        metricsCount: metrics.length
      });

      // Process metrics in chunks
      const chunkSize = 100;
      for (let i = 0; i < metrics.length; i += chunkSize) {
        const chunk = metrics.slice(i, i + chunkSize);
        
        try {
          await this.prisma.metricsSnapshot.createMany({
            data: chunk.map(metric => ({
              service: metric.service,
              metricType: metric.metricType,
              metricName: metric.metricName,
              value: metric.value,
              unit: metric.unit,
              labels: metric.labels,
              timestamp: metric.timestamp || new Date(),
              metadata: metric.metadata
            }))
          });
          processed += chunk.length;
        } catch (chunkError) {
          this.logger.error('Failed to process chunk of metrics', {
            batchId,
            chunkIndex: i,
            error: chunkError
          });
          
          chunk.forEach((metric, index) => {
            errors.push({
              index: i + index,
              error: chunkError instanceof Error ? chunkError.message : String(chunkError),
              data: metric
            });
          });
        }
      }

      this.logger.log('Metrics batch processing completed', {
        batchId,
        processed,
        failed: errors.length,
        total: metrics.length
      });

      return {
        success: errors.length === 0,
        processed,
        failed: errors.length,
        errors,
        batchId
      };
    } catch (error) {
      this.logger.error('Failed to process metrics batch', error);
      throw error;
    }
  }

  /**
   * Process batch events from external sources
   */
  async processBatchEvents(batchEvent: BatchEvent): Promise<ProcessingResult> {
    try {
      this.logger.debug('Processing batch events from external source', {
        batchId: batchEvent.batchId,
        source: batchEvent.source,
        eventCount: batchEvent.events.length
      });

      const result = await this.recordEventsBatch(batchEvent.events);
      
      // Update batch ID in result
      result.batchId = batchEvent.batchId;

      this.logger.log('Batch events processed successfully', {
        batchId: batchEvent.batchId,
        source: batchEvent.source,
        processed: result.processed,
        failed: result.failed
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to process batch events', error);
      throw error;
    }
  }

  /**
   * Process batch metrics from external sources
   */
  async processBatchMetrics(batchMetrics: BatchMetrics): Promise<ProcessingResult> {
    try {
      this.logger.debug('Processing batch metrics from external source', {
        batchId: batchMetrics.batchId,
        source: batchMetrics.source,
        metricsCount: batchMetrics.metrics.length
      });

      const result = await this.recordMetricsBatch(batchMetrics.metrics);
      
      // Update batch ID in result
      result.batchId = batchMetrics.batchId;

      this.logger.log('Batch metrics processed successfully', {
        batchId: batchMetrics.batchId,
        source: batchMetrics.source,
        processed: result.processed,
        failed: result.failed
      });

      return result;
    } catch (error) {
      this.logger.error('Failed to process batch metrics', error);
      throw error;
    }
  }

  /**
   * Validate analytics event data
   */
  private validateEvent(event: AnalyticsEvent): boolean {
    if (!event.eventType || !event.eventName || !event.service) {
      return false;
    }

    if (!event.properties || typeof event.properties !== 'object') {
      return false;
    }

    return true;
  }

  /**
   * Validate metrics snapshot data
   */
  private validateMetrics(metrics: MetricsSnapshot): boolean {
    if (!metrics.service || !metrics.metricType || !metrics.metricName) {
      return false;
    }

    if (typeof metrics.value !== 'number' || isNaN(metrics.value)) {
      return false;
    }

    if (!metrics.unit || typeof metrics.unit !== 'string') {
      return false;
    }

    return true;
  }

  /**
   * Map Prisma model to AnalyticsEvent
   */
  private mapToAnalyticsEvent(prismaEvent: any): AnalyticsEvent {
    return {
      id: prismaEvent.id,
      userId: prismaEvent.userId,
      sessionId: prismaEvent.sessionId,
      eventType: prismaEvent.eventType,
      eventName: prismaEvent.eventName,
      service: prismaEvent.service,
      properties: prismaEvent.properties,
      metadata: prismaEvent.metadata,
      timestamp: prismaEvent.timestamp,
      ipAddress: prismaEvent.ipAddress,
      userAgent: prismaEvent.userAgent
    };
  }

  /**
   * Map Prisma model to MetricsSnapshot
   */
  private mapToMetricsSnapshot(prismaMetrics: any): MetricsSnapshot {
    return {
      id: prismaMetrics.id,
      service: prismaMetrics.service,
      metricType: prismaMetrics.metricType,
      metricName: prismaMetrics.metricName,
      value: prismaMetrics.value,
      unit: prismaMetrics.unit,
      labels: prismaMetrics.labels,
      timestamp: prismaMetrics.timestamp,
      metadata: prismaMetrics.metadata
    };
  }

  /**
   * Get data collection statistics
   */
  async getCollectionStats(): Promise<{
    totalEvents: number;
    totalMetrics: number;
    eventsLast24h: number;
    metricsLast24h: number;
    averageEventsPerHour: number;
    averageMetricsPerHour: number;
  }> {
    try {
      const now = new Date();
      const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [totalEvents, totalMetrics, eventsLast24h, metricsLast24h] = await Promise.all([
        this.prisma.analyticsEvent.count(),
        this.prisma.metricsSnapshot.count(),
        this.prisma.analyticsEvent.count({
          where: { timestamp: { gte: last24h } }
        }),
        this.prisma.metricsSnapshot.count({
          where: { timestamp: { gte: last24h } }
        })
      ]);

      return {
        totalEvents,
        totalMetrics,
        eventsLast24h,
        metricsLast24h,
        averageEventsPerHour: eventsLast24h / 24,
        averageMetricsPerHour: metricsLast24h / 24
      };
    } catch (error) {
      this.logger.error('Failed to get collection statistics', error);
      throw error;
    }
  }
}
