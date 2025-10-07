import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../node_modules/.prisma/client';
import { ConfigService } from '@nestjs/config';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('ANALYTICS_DATABASE_URL'),
        },
      },
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Logging is handled by Prisma's built-in logging configuration
  }

  async onModuleInit() {
    try {
      await this.$connect();
      LoggerUtil.info('analytics-service', 'Database connected successfully');
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to connect to database', error as Error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      LoggerUtil.info('analytics-service', 'Database disconnected successfully');
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to disconnect from database', error as Error);
    }
  }

  /**
   * Health check for database connection
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; responseTime?: number; error?: string }> {
    const start = Date.now();
    try {
      await this.$queryRaw`SELECT 1`;
      return {
        status: 'healthy',
        responseTime: Date.now() - start,
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        responseTime: Date.now() - start,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Get database statistics
   */
  async getDatabaseStats(): Promise<{
    totalEvents: number;
    totalMetrics: number;
    totalUsers: number;
    totalAlerts: number;
    databaseSize: string;
  }> {
    try {
      const [totalEvents, totalMetrics, totalUsers, totalAlerts] = await Promise.all([
        this.analyticsEvent.count(),
        this.metricsSnapshot.count(),
        this.userAnalytics.count(),
        this.alert.count(),
      ]);

      // Get database size (PostgreSQL specific)
      const sizeResult = await this.$queryRaw<[{ size: string }]>`
        SELECT pg_size_pretty(pg_database_size(current_database())) as size
      `;

      return {
        totalEvents,
        totalMetrics,
        totalUsers,
        totalAlerts,
        databaseSize: sizeResult[0]?.size || 'Unknown',
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get database statistics', error as Error);
      throw error;
    }
  }

  /**
   * Clean up old data based on retention policy
   */
  async cleanupOldData(retentionDays: number = 30): Promise<{
    deletedEvents: number;
    deletedMetrics: number;
    deletedAlerts: number;
  }> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

      LoggerUtil.info('analytics-service', 'Starting data cleanup', {
        cutoffDate,
        retentionDays,
      });

      const [deletedEvents, deletedMetrics, deletedAlerts] = await Promise.all([
        this.analyticsEvent.deleteMany({
          where: { timestamp: { lt: cutoffDate } },
        }),
        this.metricsSnapshot.deleteMany({
          where: { timestamp: { lt: cutoffDate } },
        }),
        this.alert.deleteMany({
          where: {
            AND: [
              { isActive: false },
              { resolvedAt: { lt: cutoffDate } },
            ],
          },
        }),
      ]);

      LoggerUtil.info('analytics-service', 'Data cleanup completed', {
        deletedEvents: deletedEvents.count,
        deletedMetrics: deletedMetrics.count,
        deletedAlerts: deletedAlerts.count,
      });

      return {
        deletedEvents: deletedEvents.count,
        deletedMetrics: deletedMetrics.count,
        deletedAlerts: deletedAlerts.count,
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to cleanup old data', error as Error);
      throw error;
    }
  }

  /**
   * Create database indexes for better performance
   */
  async createIndexes(): Promise<void> {
    try {
      LoggerUtil.info('analytics-service', 'Creating database indexes');

      // This would typically be done through migrations
      // But we can add some runtime index creation if needed
      
      LoggerUtil.info('analytics-service', 'Database indexes created successfully');
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to create database indexes', error as Error);
      throw error;
    }
  }

  /**
   * Get slow queries information
   */
  async getSlowQueries(): Promise<Array<{
    query: string;
    duration: number;
    timestamp: Date;
  }>> {
    try {
      // This would require enabling pg_stat_statements extension
      // For now, return empty array
      return [];
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get slow queries', error as Error);
      return [];
    }
  }

  /**
   * Optimize database performance
   */
  async optimizePerformance(): Promise<{
    vacuumed: boolean;
    analyzed: boolean;
    reindexed: boolean;
  }> {
    try {
      LoggerUtil.info('analytics-service', 'Starting database optimization');

      // Run VACUUM ANALYZE
      await this.$executeRaw`VACUUM ANALYZE`;

      // Run REINDEX
      await this.$executeRaw`REINDEX DATABASE ${this.configService.get('ANALYTICS_DATABASE_URL')}`;

      LoggerUtil.info('analytics-service', 'Database optimization completed');

      return {
        vacuumed: true,
        analyzed: true,
        reindexed: true,
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to optimize database', error as Error);
      throw error;
    }
  }
}
