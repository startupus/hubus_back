import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { 
  AnalyticsRequest,
  AnalyticsResponse,
  UserAnalytics,
  AIAnalytics,
  AIClassificationAnalytics,
  AICertificationAnalytics,
  AISafetyAnalytics,
  DashboardData,
  MetricsResponse,
  TimeRange,
  ChartData,
  ChartType,
  Recommendation,
  RecommendationType
} from '../types/analytics.types';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * Analytics Service
 * 
 * Responsible for:
 * - Data analysis and aggregation
 * - Dashboard data generation
 * - User analytics processing
 * - AI analytics processing
 * - Trend analysis and forecasting
 * - Recommendation generation
 */
@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get analytics events with filtering and pagination
   */
  async getAnalyticsEvents(request: AnalyticsRequest): Promise<AnalyticsResponse<any>> {
    try {
      this.logger.debug('Fetching analytics events', { request });

      const where = this.buildEventFilter(request);
      const orderBy = this.buildEventOrderBy(request);
      const skip = ((request.page || 1) - 1) * (request.limit || 20);
      const take = request.limit || 20;

      const [events, total] = await Promise.all([
        this.prisma.analyticsEvent.findMany({
          where,
          orderBy,
          skip,
          take,
          // include удален - в AnalyticsEvent нет связи с User
        }),
        this.prisma.analyticsEvent.count({ where })
      ]);

      const totalPages = Math.ceil(total / take);

      return {
        success: true,
        data: events.map(event => this.mapToAnalyticsEvent(event)),
        pagination: {
          page: request.page || 1,
          limit: take,
          total,
          totalPages,
          hasNext: (request.page || 1) < totalPages,
          hasPrev: (request.page || 1) > 1
        },
        metadata: {
          filters: request,
          generatedAt: new Date()
        }
      };
    } catch (error) {
      this.logger.error('Failed to fetch analytics events', error);
      throw error;
    }
  }

  /**
   * Get metrics with filtering and aggregation
   */
  async getMetrics(request: AnalyticsRequest): Promise<MetricsResponse> {
    try {
      this.logger.debug('Fetching metrics', { request });

      const where = this.buildMetricsFilter(request);
      const orderBy = { timestamp: 'desc' as const };
      const skip = ((request.page || 1) - 1) * (request.limit || 20);
      const take = request.limit || 20;

      const [metrics, total] = await Promise.all([
        this.prisma.metricsSnapshot.findMany({
          where,
          orderBy,
          skip,
          take
        }),
        this.prisma.metricsSnapshot.count({ where })
      ]);

      // Calculate summary statistics
      const summary = await this.calculateMetricsSummary(where);
      
      // Calculate trends
      const trends = await this.calculateMetricsTrends(where);

      return {
        metrics: metrics.map(metric => this.mapToMetricsSnapshot(metric)),
        summary,
        trends
      };
    } catch (error) {
      this.logger.error('Failed to fetch metrics', error);
      throw error;
    }
  }

  /**
   * Get user analytics
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics | null> {
    try {
      this.logger.debug('Fetching user analytics', { userId });

      const userAnalytics = await this.prisma.userAnalytics.findUnique({
        where: { userId }
        // include удален - в UserAnalytics нет связи с User
      });

      if (!userAnalytics) {
        return null;
      }

      return this.mapToUserAnalytics(userAnalytics);
    } catch (error) {
      this.logger.error('Failed to fetch user analytics', error);
      throw error;
    }
  }

  /**
   * Update user analytics
   */
  async updateUserAnalytics(userId: string, data: Partial<UserAnalytics>): Promise<UserAnalytics> {
    try {
      this.logger.debug('Updating user analytics', { userId, data });

      const updated = await this.prisma.userAnalytics.upsert({
        where: { userId },
        update: {
          totalRequests: data.totalRequests,
          totalTokens: data.totalTokens,
          totalCost: data.totalCost,
          averageResponseTime: data.averageResponseTime,
          successRate: data.successRate,
          lastActivity: data.lastActivity || new Date(),
          preferences: data.preferences,
          timezone: data.timezone,
          language: data.language
        },
        create: {
          userId,
          totalRequests: data.totalRequests || 0,
          totalTokens: data.totalTokens || 0,
          totalCost: data.totalCost || 0,
          averageResponseTime: data.averageResponseTime || 0,
          successRate: data.successRate || 0,
          lastActivity: data.lastActivity || new Date(),
          preferences: data.preferences,
          timezone: data.timezone,
          language: data.language
        }
      });

      return this.mapToUserAnalytics(updated);
    } catch (error) {
      this.logger.error('Failed to update user analytics', error);
      throw error;
    }
  }

  /**
   * Get AI analytics
   */
  async getAIAnalytics(modelId?: string, provider?: string): Promise<AIAnalytics[]> {
    try {
      this.logger.debug('Fetching AI analytics', { modelId, provider });

      const where: any = {};
      if (modelId) where.modelId = modelId;
      if (provider) where.provider = provider;

      const aiAnalytics = await this.prisma.aIAnalytics.findMany({
        where,
        orderBy: { lastUpdated: 'desc' }
      });

      return aiAnalytics.map(analytics => this.mapToAIAnalytics(analytics));
    } catch (error) {
      this.logger.error('Failed to fetch AI analytics', error);
      throw error;
    }
  }

  /**
   * Update AI analytics
   */
  async updateAIAnalytics(modelId: string, provider: string, data: Partial<AIAnalytics>): Promise<AIAnalytics> {
    try {
      this.logger.debug('Updating AI analytics', { modelId, provider, data });

      const updated = await this.prisma.aIAnalytics.upsert({
        where: {
          modelId_provider: { modelId, provider }
        },
        update: {
          totalRequests: data.totalRequests,
          totalTokens: data.totalTokens,
          averageLatency: data.averageLatency,
          successRate: data.successRate,
          averageCost: data.averageCost,
          qualityScore: data.qualityScore,
          lastUpdated: new Date(),
          metadata: data.metadata
        },
        create: {
          modelId,
          provider,
          totalRequests: data.totalRequests || 0,
          totalTokens: data.totalTokens || 0,
          averageLatency: data.averageLatency || 0,
          successRate: data.successRate || 0,
          averageCost: data.averageCost || 0,
          qualityScore: data.qualityScore,
          lastUpdated: new Date(),
          metadata: data.metadata
        }
      });

      return this.mapToAIAnalytics(updated);
    } catch (error) {
      this.logger.error('Failed to update AI analytics', error);
      throw error;
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardData(userId?: string): Promise<DashboardData> {
    try {
      this.logger.debug('Generating dashboard data', { userId });

      const [
        summary,
        charts,
        recentActivity,
        alerts,
        recommendations
      ] = await Promise.all([
        this.generateDashboardSummary(userId),
        this.generateDashboardCharts(userId),
        this.getRecentActivity(userId),
        this.getActiveAlerts(),
        this.generateRecommendations(userId)
      ]);

      return {
        summary,
        charts,
        recentActivity,
        alerts,
        recommendations
      };
    } catch (error) {
      this.logger.error('Failed to generate dashboard data', error);
      throw error;
    }
  }

  /**
   * Generate recommendations for user
   */
  async generateRecommendations(userId?: string): Promise<Recommendation[]> {
    try {
      this.logger.debug('Generating recommendations', { userId });

      const recommendations: Recommendation[] = [];

      // Get user analytics for personalized recommendations
      if (userId) {
        const userAnalytics = await this.getUserAnalytics(userId);
        if (userAnalytics) {
          // Cost optimization recommendations
          if (userAnalytics.totalCost > 100) {
            recommendations.push({
              id: `cost_opt_${userId}`,
              type: 'cost_optimization',
              title: 'Optimize AI Usage Costs',
              description: 'Consider using more cost-effective models for routine tasks',
              priority: 'medium',
              actionRequired: true,
              estimatedImpact: 'Save up to 30% on costs'
            });
          }

          // Performance recommendations
          if (userAnalytics.averageResponseTime > 2000) {
            recommendations.push({
              id: `perf_opt_${userId}`,
              type: 'performance_improvement',
              title: 'Improve Response Times',
              description: 'Consider switching to faster models or optimizing requests',
              priority: 'high',
              actionRequired: true,
              estimatedImpact: 'Reduce response time by 40%'
            });
          }

          // Usage optimization
          if (userAnalytics.successRate < 0.95) {
            recommendations.push({
              id: `usage_opt_${userId}`,
              type: 'usage_optimization',
              title: 'Improve Success Rate',
              description: 'Review failed requests and optimize prompt engineering',
              priority: 'high',
              actionRequired: true,
              estimatedImpact: 'Increase success rate to 98%'
            });
          }
        }
      }

      // General system recommendations
      const systemHealth = await this.getSystemHealth();
      if (systemHealth.some(service => service.status === 'degraded')) {
        recommendations.push({
          id: 'system_health',
          type: 'performance_improvement',
          title: 'System Health Alert',
          description: 'Some services are experiencing degraded performance',
          priority: 'high',
          actionRequired: true,
          estimatedImpact: 'Restore optimal system performance'
        });
      }

      return recommendations;
    } catch (error) {
      this.logger.error('Failed to generate recommendations', error);
      return [];
    }
  }

  /**
   * Get system health status
   */
  async getSystemHealth(): Promise<any[]> {
    try {
      const healthData = await this.prisma.systemHealth.findMany({
        orderBy: { timestamp: 'desc' },
        take: 10
      });

      return healthData.map(health => ({
        service: health.service,
        status: health.status,
        responseTime: health.responseTime,
        errorRate: health.errorRate,
        timestamp: health.timestamp
      }));
    } catch (error) {
      this.logger.error('Failed to get system health', error);
      return [];
    }
  }

  // Private helper methods

  private buildEventFilter(request: AnalyticsRequest): any {
    const where: any = {};

    if (request.userId) {
      where.userId = request.userId;
    }

    if (request.startDate || request.endDate) {
      where.timestamp = {};
      if (request.startDate) {
        const startDate = new Date(request.startDate);
        if (!isNaN(startDate.getTime())) {
          where.timestamp.gte = startDate;
        }
      }
      if (request.endDate) {
        const endDate = new Date(request.endDate);
        if (!isNaN(endDate.getTime())) {
          where.timestamp.lte = endDate;
        }
      }
    }

    if (request.eventTypes && request.eventTypes.length > 0) {
      where.eventType = { in: request.eventTypes };
    }

    if (request.services && request.services.length > 0) {
      where.service = { in: request.services };
    }

    return where;
  }

  private buildMetricsFilter(request: AnalyticsRequest): any {
    const where: any = {};

    if (request.startDate || request.endDate) {
      where.timestamp = {};
      if (request.startDate) {
        const startDate = new Date(request.startDate);
        if (!isNaN(startDate.getTime())) {
          where.timestamp.gte = startDate;
        }
      }
      if (request.endDate) {
        const endDate = new Date(request.endDate);
        if (!isNaN(endDate.getTime())) {
          where.timestamp.lte = endDate;
        }
      }
    }

    if (request.services && request.services.length > 0) {
      where.service = { in: request.services };
    }

    return where;
  }

  private buildEventOrderBy(request: AnalyticsRequest): any {
    const orderBy: any = {};
    const sortBy = request.sortBy || 'timestamp';
    const sortOrder = request.sortOrder || 'desc';

    orderBy[sortBy] = sortOrder;
    return orderBy;
  }

  private async calculateMetricsSummary(where: any): Promise<any> {
    const metrics = await this.prisma.metricsSnapshot.findMany({ where });
    
    if (metrics.length === 0) {
      return {
        totalMetrics: 0,
        averageValue: 0,
        minValue: 0,
        maxValue: 0,
        lastUpdated: new Date()
      };
    }

    const values = metrics.map(m => m.value);
    const totalMetrics = metrics.length;
    const averageValue = values.reduce((sum, val) => sum + val, 0) / totalMetrics;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const lastUpdated = new Date(Math.max(...metrics.map(m => m.timestamp.getTime())));

    return {
      totalMetrics,
      averageValue,
      minValue,
      maxValue,
      lastUpdated
    };
  }

  private async calculateMetricsTrends(where: any): Promise<any[]> {
    // This is a simplified trend calculation
    // In a real implementation, you'd use more sophisticated algorithms
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const previous24h = new Date(now.getTime() - 48 * 60 * 60 * 1000);

    const [current, previous] = await Promise.all([
      this.prisma.metricsSnapshot.count({ where: { ...where, timestamp: { gte: last24h } } }),
      this.prisma.metricsSnapshot.count({ where: { ...where, timestamp: { gte: previous24h, lt: last24h } } })
    ]);

    const changePercent = previous > 0 ? ((current - previous) / previous) * 100 : 0;

    return [{
      metric: 'total_metrics',
      trend: changePercent > 0 ? 'up' : changePercent < 0 ? 'down' : 'stable',
      changePercent: Math.abs(changePercent),
      period: '24h'
    }];
  }

  private async generateDashboardSummary(userId?: string): Promise<any> {
    const now = new Date();
    const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const where = userId ? { userId } : {};
    const timeWhere = { timestamp: { gte: last24h } };

    const [totalRequests, totalUsers, totalCost, avgResponseTime, successRate] = await Promise.all([
      this.prisma.analyticsEvent.count({ where: { ...where, ...timeWhere } }),
      this.prisma.userAnalytics.count(),
      this.prisma.userAnalytics.aggregate({
        _sum: { totalCost: true }
      }),
      this.prisma.userAnalytics.aggregate({
        _avg: { averageResponseTime: true }
      }),
      this.prisma.userAnalytics.aggregate({
        _avg: { successRate: true }
      })
    ]);

    return {
      totalRequests,
      totalUsers,
      totalCost: totalCost._sum.totalCost || 0,
      averageResponseTime: avgResponseTime._avg.averageResponseTime || 0,
      successRate: (successRate._avg.successRate || 0) * 100,
      uptime: 99.9 // This would be calculated from system health data
    };
  }

  private async generateDashboardCharts(userId?: string): Promise<ChartData[]> {
    // This is a simplified implementation
    // In a real system, you'd generate more sophisticated charts
    return [
      {
        id: 'usage_over_time',
        type: 'line',
        title: 'Usage Over Time',
        data: [],
        xAxis: 'time',
        yAxis: 'requests',
        timeRange: {
          start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          end: new Date(),
          granularity: 'day'
        }
      }
    ];
  }

  private async getRecentActivity(userId?: string): Promise<any[]> {
    const where = userId ? { userId } : {};
    
    const activities = await this.prisma.analyticsEvent.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 10,
      select: {
        id: true,
        timestamp: true,
        eventType: true,
        eventName: true,
        service: true,
        userId: true,
        properties: true
      }
    });

    return activities.map(activity => ({
      id: activity.id,
      timestamp: activity.timestamp,
      type: activity.eventType,
      description: `${activity.eventName} in ${activity.service}`,
      userId: activity.userId,
      metadata: activity.properties
    }));
  }

  private async getActiveAlerts(): Promise<any[]> {
    const alerts = await this.prisma.alert.findMany({
      where: { isActive: true },
      orderBy: { triggeredAt: 'desc' },
      take: 5
    });

    return alerts.map(alert => ({
      id: alert.id,
      alertType: alert.alertType,
      alertName: alert.alertName,
      description: alert.description,
      service: alert.service,
      triggeredAt: alert.triggeredAt
    }));
  }

  // Mapping methods
  private mapToAnalyticsEvent(prismaEvent: any): any {
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
      userAgent: prismaEvent.userAgent,
      user: prismaEvent.user
    };
  }

  private mapToMetricsSnapshot(prismaMetrics: any): any {
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

  private mapToUserAnalytics(prismaUserAnalytics: any): UserAnalytics {
    return {
      id: prismaUserAnalytics.id,
      userId: prismaUserAnalytics.userId,
      totalRequests: prismaUserAnalytics.totalRequests,
      totalTokens: prismaUserAnalytics.totalTokens,
      totalCost: prismaUserAnalytics.totalCost,
      averageResponseTime: prismaUserAnalytics.averageResponseTime,
      successRate: prismaUserAnalytics.successRate,
      lastActivity: prismaUserAnalytics.lastActivity,
      preferences: prismaUserAnalytics.preferences,
      timezone: prismaUserAnalytics.timezone,
      language: prismaUserAnalytics.language
    };
  }

  private mapToAIAnalytics(prismaAIAnalytics: any): AIAnalytics {
    return {
      id: prismaAIAnalytics.id,
      modelId: prismaAIAnalytics.modelId,
      provider: prismaAIAnalytics.provider,
      totalRequests: prismaAIAnalytics.totalRequests,
      totalTokens: prismaAIAnalytics.totalTokens,
      averageLatency: prismaAIAnalytics.averageLatency,
      successRate: prismaAIAnalytics.successRate,
      averageCost: prismaAIAnalytics.averageCost,
      qualityScore: prismaAIAnalytics.qualityScore,
      lastUpdated: prismaAIAnalytics.lastUpdated,
      metadata: prismaAIAnalytics.metadata
    };
  }

  /**
   * Отслеживает событие
   */
  async trackEvent(data: {
    userId?: string;
    eventName: string;
    eventType: string;
    service: string;
    properties?: Record<string, any>;
    metadata?: Record<string, any>;
  }): Promise<{ success: boolean; eventId: string }> {
    try {
      LoggerUtil.debug('analytics-service', 'Tracking event', {
        eventName: data.eventName,
        eventType: data.eventType,
        service: data.service,
        userId: data.userId
      });

      // Создаем запись о событии в базе данных
      const event = await this.prisma.analyticsEvent.create({
        data: {
          userId: data.userId,
          eventName: data.eventName,
          eventType: data.eventType,
          service: data.service,
          properties: data.properties || {},
          metadata: data.metadata || {},
          timestamp: new Date(),
        },
      });

      LoggerUtil.info('analytics-service', 'Event tracked successfully', {
        eventId: event.id,
        eventName: data.eventName,
        userId: data.userId
      });

      return {
        success: true,
        eventId: event.id,
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to track event', error as Error, {
        eventName: data.eventName,
        userId: data.userId
      });
      throw error;
    }
  }

  /**
   * Получает метрики использования
   */
  async getUsageMetrics(): Promise<{
    metrics: Array<{
      name: string;
      value: number;
      unit: string;
      timestamp: string;
    }>;
  }> {
    try {
      LoggerUtil.debug('analytics-service', 'Getting usage metrics');

      // Получаем статистику за последние 24 часа
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const [
        totalRequests,
        totalUsers,
        totalTokens,
        averageResponseTime,
        errorCount
      ] = await Promise.all([
        this.prisma.analyticsEvent.count({
          where: {
            eventType: 'api_request',
            timestamp: { gte: yesterday }
          }
        }),
        this.prisma.analyticsEvent.groupBy({
          by: ['userId'],
          where: {
            eventType: 'api_request',
            timestamp: { gte: yesterday }
          }
        }).then(result => result.length),
        this.prisma.analyticsEvent.count({
          where: {
            eventType: 'api_request',
            timestamp: { gte: yesterday }
          }
        }).then(() => {
          // Заглушка для total_tokens - в реальности нужно извлекать из JSON
          return 0;
        }),
        this.prisma.analyticsEvent.count({
          where: {
            eventType: 'api_request',
            timestamp: { gte: yesterday }
          }
        }).then(() => {
          return 120; // Временная заглушка для среднего времени ответа
        }),
        this.prisma.analyticsEvent.count({
          where: {
            eventType: 'api_error',
            timestamp: { gte: yesterday }
          }
        })
      ]);

      const metrics = [
        {
          name: 'requests_count',
          value: totalRequests,
          unit: 'count',
          timestamp: new Date().toISOString(),
        },
        {
          name: 'unique_users',
          value: totalUsers,
          unit: 'count',
          timestamp: new Date().toISOString(),
        },
        {
          name: 'tokens_used',
          value: totalTokens,
          unit: 'tokens',
          timestamp: new Date().toISOString(),
        },
        {
          name: 'average_response_time',
          value: averageResponseTime,
          unit: 'milliseconds',
          timestamp: new Date().toISOString(),
        },
        {
          name: 'error_rate',
          value: totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0,
          unit: 'percentage',
          timestamp: new Date().toISOString(),
        },
      ];

      return { metrics };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get usage metrics', error as Error);
      throw error;
    }
  }

  /**
   * Получает данные для дашборда аналитики
   */
  async getAnalyticsDashboard(): Promise<{
    totalRequests: number;
    totalUsers: number;
    averageResponseTime: number;
    topModels: Array<{ name: string; usage: number }>;
    requestsByService: Record<string, number>;
    requestsByDay: Array<{ date: string; count: number }>;
    errorRate: number;
    totalCost: number;
    currency: string;
  }> {
    try {
      LoggerUtil.debug('analytics-service', 'Getting analytics dashboard data');

      // Получаем статистику за последние 30 дней
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalRequests,
        totalUsers,
        averageResponseTime,
        topModels,
        requestsByService,
        requestsByDay,
        errorCount,
        totalCost
      ] = await Promise.all([
        this.prisma.analyticsEvent.count({
          where: {
            eventType: 'api_request',
            timestamp: { gte: thirtyDaysAgo }
          }
        }),
        this.prisma.analyticsEvent.groupBy({
          by: ['userId'],
          where: {
            eventType: 'api_request',
            timestamp: { gte: thirtyDaysAgo }
          }
        }).then(result => result.length),
        this.getAverageResponseTime(thirtyDaysAgo),
        this.getTopModels(thirtyDaysAgo),
        this.getRequestsByService(thirtyDaysAgo),
        this.getRequestsByDay(thirtyDaysAgo),
        this.prisma.analyticsEvent.count({
          where: {
            eventType: 'api_error',
            timestamp: { gte: thirtyDaysAgo }
          }
        }),
        this.getTotalCost(thirtyDaysAgo)
      ]);

      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

      return {
        totalRequests,
        totalUsers,
        averageResponseTime,
        topModels,
        requestsByService,
        requestsByDay,
        errorRate,
        totalCost,
        currency: 'USD'
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get analytics dashboard', error as Error);
      throw error;
    }
  }

  /**
   * Получает среднее время ответа
   */
  private async getAverageResponseTime(since: Date): Promise<number> {
    // Заглушка - в реальном проекте здесь будет запрос к БД
    return 120;
  }

  /**
   * Получает топ моделей
   */
  private async getTopModels(since: Date): Promise<Array<{ name: string; usage: number }>> {
    // Заглушка - в реальном проекте здесь будет запрос к БД
    return [
      { name: 'gpt-4', usage: 700 },
      { name: 'gpt-3.5-turbo', usage: 500 },
      { name: 'claude-3', usage: 300 }
    ];
  }

  /**
   * Получает запросы по сервисам
   */
  private async getRequestsByService(since: Date): Promise<Record<string, number>> {
    // Заглушка - в реальном проекте здесь будет запрос к БД
    return {
      'proxy-service': 1000,
      'auth-service': 200,
      'billing-service': 150
    };
  }

  /**
   * Получает запросы по дням
   */
  private async getRequestsByDay(since: Date): Promise<Array<{ date: string; count: number }>> {
    // Заглушка - в реальном проекте здесь будет запрос к БД
    const result = [];
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      result.push({
        date: date.toISOString().split('T')[0],
        count: Math.floor(Math.random() * 100) + 50
      });
    }
    return result.reverse();
  }

  /**
   * Получает общую стоимость
   */
  private async getTotalCost(since: Date): Promise<number> {
    // Заглушка - в реальном проекте здесь будет запрос к БД
    return 150.75;
  }
}
