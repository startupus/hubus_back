import { Injectable } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';

export interface TrackEventData {
  userId?: string;
  eventName: string;
  eventType: string;
  service: string;
  properties?: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp?: Date;
}

export interface AnalyticsMetrics {
  totalRequests: number;
  totalUsers: number;
  averageResponseTime: number;
  topModels: Array<{ name: string; usage: number }>;
  requestsByService: Record<string, number>;
  requestsByDay: Array<{ date: string; count: number }>;
  errorRate: number;
  totalCost: number;
  currency: string;
}

export interface UserAnalytics {
  userId: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  currency: string;
  lastActivity: Date;
  requestsByModel: Record<string, number>;
  requestsByService: Record<string, number>;
  averageResponseTime: number;
  errorRate: number;
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Отслеживает событие
   */
  async trackEvent(data: TrackEventData): Promise<{ success: boolean; eventId: string }> {
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
          timestamp: data.timestamp || new Date(),
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
        this.prisma.analyticsEvent.aggregate({
          _sum: {
            properties: true
          },
          where: {
            eventType: 'api_request',
            timestamp: { gte: yesterday }
          }
        }).then(result => {
          // Извлекаем total_tokens из properties
          return 0; // Заглушка для total_tokens
        }),
        this.prisma.analyticsEvent.aggregate({
          _avg: {
            properties: true
          },
          where: {
            eventType: 'api_request',
            timestamp: { gte: yesterday }
          }
        }).then(result => {
          // Извлекаем response_time из properties
          return 120; // Заглушка для average_response_time
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
  async getAnalyticsDashboard(): Promise<AnalyticsMetrics> {
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
   * Получает аналитику для конкретного пользователя
   */
  async getUserAnalytics(userId: string): Promise<UserAnalytics> {
    try {
      LoggerUtil.debug('analytics-service', 'Getting user analytics', { userId });

      // Получаем статистику пользователя за последние 30 дней
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const [
        totalRequests,
        totalTokens,
        totalCost,
        lastActivity,
        requestsByModel,
        requestsByService,
        averageResponseTime,
        errorCount
      ] = await Promise.all([
        this.prisma.analyticsEvent.count({
          where: {
            userId,
            eventType: 'api_request',
            timestamp: { gte: thirtyDaysAgo }
          }
        }),
        this.getUserTotalTokens(userId, thirtyDaysAgo),
        this.getUserTotalCost(userId, thirtyDaysAgo),
        this.getUserLastActivity(userId),
        this.getUserRequestsByModel(userId, thirtyDaysAgo),
        this.getUserRequestsByService(userId, thirtyDaysAgo),
        this.getUserAverageResponseTime(userId, thirtyDaysAgo),
        this.prisma.analyticsEvent.count({
          where: {
            userId,
            eventType: 'api_error',
            timestamp: { gte: thirtyDaysAgo }
          }
        })
      ]);

      const errorRate = totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

      return {
        userId,
        totalRequests,
        totalTokens,
        totalCost,
        currency: 'USD',
        lastActivity,
        requestsByModel,
        requestsByService,
        averageResponseTime,
        errorRate
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get user analytics', error as Error, { userId });
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

  /**
   * Получает общее количество токенов пользователя
   */
  private async getUserTotalTokens(userId: string, since: Date): Promise<number> {
    // Заглушка - в реальном проекте здесь будет запрос к БД
    return 5000;
  }

  /**
   * Получает общую стоимость пользователя
   */
  private async getUserTotalCost(userId: string, since: Date): Promise<number> {
    // Заглушка - в реальном проекте здесь будет запрос к БД
    return 25.50;
  }

  /**
   * Получает последнюю активность пользователя
   */
  private async getUserLastActivity(userId: string): Promise<Date> {
    const lastEvent = await this.prisma.analyticsEvent.findFirst({
      where: { userId },
      orderBy: { timestamp: 'desc' }
    });
    return lastEvent?.timestamp || new Date();
  }

  /**
   * Получает запросы пользователя по моделям
   */
  private async getUserRequestsByModel(userId: string, since: Date): Promise<Record<string, number>> {
    // Заглушка - в реальном проекте здесь будет запрос к БД
    return {
      'gpt-4': 10,
      'gpt-3.5-turbo': 5,
      'claude-3': 3
    };
  }

  /**
   * Получает запросы пользователя по сервисам
   */
  private async getUserRequestsByService(userId: string, since: Date): Promise<Record<string, number>> {
    // Заглушка - в реальном проекте здесь будет запрос к БД
    return {
      'proxy-service': 15,
      'auth-service': 2,
      'billing-service': 1
    };
  }

  /**
   * Получает среднее время ответа пользователя
   */
  private async getUserAverageResponseTime(userId: string, since: Date): Promise<number> {
    // Заглушка - в реальном проекте здесь будет запрос к БД
    return 150;
  }
}
