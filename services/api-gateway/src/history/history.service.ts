import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RequestHistory,
  RequestType,
  RequestStatus,
  CreateRequestHistoryDto,
  UpdateRequestHistoryDto,
  RequestHistoryQueryDto,
  RequestHistoryResponse,
  SessionHistory,
  CreateSessionHistoryDto,
  UpdateSessionHistoryDto,
  SessionHistoryQueryDto,
  SessionHistoryResponse,
} from '@ai-aggregator/shared';

@Injectable()
export class HistoryService {
  private readonly logger = new Logger(HistoryService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Преобразовать Prisma объект в RequestHistory
   */
  private transformRequestHistory(history: any): RequestHistory {
    return {
      ...history,
      cost: history.cost ? Number(history.cost) : undefined,
    } as RequestHistory;
  }

  /**
   * Преобразовать Prisma объект в SessionHistory
   */
  private transformSessionHistory(session: any): SessionHistory {
    return {
      ...session,
      totalCost: session.totalCost ? Number(session.totalCost) : 0,
    } as SessionHistory;
  }

  /**
   * Создать запись истории запроса
   */
  async createRequestHistory(dto: CreateRequestHistoryDto): Promise<RequestHistory> {
    try {
      const history = await this.prisma.requestHistory.create({
        data: {
          userId: dto.userId,
          sessionId: dto.sessionId,
          requestType: dto.requestType,
          provider: dto.provider,
          model: dto.model,
          requestData: dto.requestData,
          responseData: dto.responseData,
          tokensUsed: dto.tokensUsed,
          cost: dto.cost,
          responseTime: dto.responseTime,
          status: dto.status,
          errorMessage: dto.errorMessage,
        },
      });

      this.logger.log(`Request history created: ${history.id}`);
      return this.transformRequestHistory(history);
    } catch (error) {
      this.logger.error(`Failed to create request history: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Обновить запись истории запроса
   */
  async updateRequestHistory(id: string, dto: UpdateRequestHistoryDto): Promise<RequestHistory> {
    try {
      const history = await this.prisma.requestHistory.update({
        where: { id },
        data: {
          responseData: dto.responseData,
          tokensUsed: dto.tokensUsed,
          cost: dto.cost,
          responseTime: dto.responseTime,
          status: dto.status,
          errorMessage: dto.errorMessage,
        },
      });

      this.logger.log(`Request history updated: ${id}`);
      return this.transformRequestHistory(history);
    } catch (error) {
      this.logger.error(`Failed to update request history: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Получить историю запросов пользователя
   */
  async getRequestHistory(query: RequestHistoryQueryDto): Promise<RequestHistoryResponse> {
    try {
      const {
        userId,
        sessionId,
        requestType,
        provider,
        model,
        status,
        fromDate,
        toDate,
        limit = 20,
        offset = 0,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = query;

      const where: any = {
        userId,
      };

      if (sessionId) where.sessionId = sessionId;
      if (requestType) where.requestType = requestType;
      if (provider) where.provider = provider;
      if (model) where.model = model;
      if (status) where.status = status;
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = fromDate;
        if (toDate) where.createdAt.lte = toDate;
      }

      const [histories, total] = await Promise.all([
        this.prisma.requestHistory.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          take: limit,
          skip: offset,
        }),
        this.prisma.requestHistory.count({ where }),
      ]);

      return {
        success: true,
        data: histories.map(h => this.transformRequestHistory(h)),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get request history: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Получить конкретную запись истории
   */
  async getRequestHistoryById(id: string, userId: string): Promise<RequestHistoryResponse> {
    try {
      const history = await this.prisma.requestHistory.findFirst({
        where: { id, userId },
      });

      if (!history) {
        return {
          success: false,
          message: 'Request history not found',
        };
      }

      return {
        success: true,
        data: this.transformRequestHistory(history),
      };
    } catch (error) {
      this.logger.error(`Failed to get request history by id: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Удалить запись истории
   */
  async deleteRequestHistory(id: string, userId: string): Promise<RequestHistoryResponse> {
    try {
      const history = await this.prisma.requestHistory.findFirst({
        where: { id, userId },
      });

      if (!history) {
        return {
          success: false,
          message: 'Request history not found',
        };
      }

      await this.prisma.requestHistory.delete({
        where: { id },
      });

      this.logger.log(`Request history deleted: ${id}`);
      return {
        success: true,
        message: 'Request history deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete request history: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Создать сессию
   */
  async createSession(dto: CreateSessionHistoryDto): Promise<SessionHistory> {
    try {
      const session = await this.prisma.sessionHistory.create({
        data: {
          userId: dto.userId,
          properties: dto.properties,
        },
      });

      this.logger.log(`Session created: ${session.id}`);
      return this.transformSessionHistory(session);
    } catch (error) {
      this.logger.error(`Failed to create session: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Обновить сессию
   */
  async updateSession(id: string, dto: UpdateSessionHistoryDto): Promise<SessionHistory> {
    try {
      const session = await this.prisma.sessionHistory.update({
        where: { id },
        data: {
          endedAt: dto.endedAt,
          properties: dto.properties,
        },
      });

      // Обновить статистику сессии
      await this.updateSessionStats(id);

      this.logger.log(`Session updated: ${id}`);
      return this.transformSessionHistory(session);
    } catch (error) {
      this.logger.error(`Failed to update session: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Получить сессии пользователя
   */
  async getSessions(query: SessionHistoryQueryDto): Promise<SessionHistoryResponse> {
    try {
      const {
        userId,
        fromDate,
        toDate,
        limit = 20,
        offset = 0,
        sortBy = 'startedAt',
        sortOrder = 'desc',
      } = query;

      const where: any = {
        userId,
      };

      if (fromDate || toDate) {
        where.startedAt = {};
        if (fromDate) where.startedAt.gte = fromDate;
        if (toDate) where.startedAt.lte = toDate;
      }

      const [sessions, total] = await Promise.all([
        this.prisma.sessionHistory.findMany({
          where,
          orderBy: { [sortBy]: sortOrder },
          take: limit,
          skip: offset,
        }),
        this.prisma.sessionHistory.count({ where }),
      ]);

      return {
        success: true,
        data: sessions.map(s => this.transformSessionHistory(s)),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to get sessions: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Получить детали сессии
   */
  async getSessionById(id: string, userId: string): Promise<SessionHistoryResponse> {
    try {
      const session = await this.prisma.sessionHistory.findFirst({
        where: { id, userId },
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found',
        };
      }

      return {
        success: true,
        data: this.transformSessionHistory(session),
      };
    } catch (error) {
      this.logger.error(`Failed to get session by id: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Удалить сессию
   */
  async deleteSession(id: string, userId: string): Promise<SessionHistoryResponse> {
    try {
      const session = await this.prisma.sessionHistory.findFirst({
        where: { id, userId },
      });

      if (!session) {
        return {
          success: false,
          message: 'Session not found',
        };
      }

      // Удалить все запросы в сессии
      await this.prisma.requestHistory.deleteMany({
        where: { sessionId: id },
      });

      // Удалить сессию
      await this.prisma.sessionHistory.delete({
        where: { id },
      });

      this.logger.log(`Session deleted: ${id}`);
      return {
        success: true,
        message: 'Session deleted successfully',
      };
    } catch (error) {
      this.logger.error(`Failed to delete session: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Обновить статистику сессии
   */
  private async updateSessionStats(sessionId: string): Promise<void> {
    try {
      const stats = await this.prisma.requestHistory.aggregate({
        where: { sessionId },
        _count: { id: true },
        _sum: { tokensUsed: true, cost: true },
        _max: { createdAt: true },
      });

      await this.prisma.sessionHistory.update({
        where: { id: sessionId },
        data: {
          requestsCount: stats._count.id,
          totalTokens: stats._sum.tokensUsed || 0,
          totalCost: stats._sum.cost || 0,
          lastRequestAt: stats._max.createdAt,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to update session stats: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * Поиск по истории запросов
   */
  async searchRequests(params: {
    query?: string;
    userId?: string;
    provider?: string;
    model?: string;
    fromDate?: Date;
    toDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<RequestHistoryResponse> {
    try {
      const {
        query,
        userId,
        provider,
        model,
        fromDate,
        toDate,
        limit = 50,
        offset = 0,
      } = params;

      const where: any = {};

      if (userId) where.userId = userId;
      if (provider) where.provider = provider;
      if (model) where.model = model;
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = fromDate;
        if (toDate) where.createdAt.lte = toDate;
      }

      // Поиск по содержимому запросов
      if (query) {
        where.OR = [
          { requestData: { path: ['messages'], string_contains: query } },
          { responseData: { path: ['choices'], string_contains: query } },
          { errorMessage: { contains: query } }
        ];
      }

      const [histories, total] = await Promise.all([
        this.prisma.requestHistory.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.requestHistory.count({ where }),
      ]);

      return {
        success: true,
        data: histories.map(h => this.transformRequestHistory(h)),
        pagination: {
          total,
          limit,
          offset,
          hasMore: offset + limit < total,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to search requests: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Поиск по пользователям
   */
  async searchUsers(params: {
    query?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<RequestHistoryResponse> {
    try {
      const { query, fromDate, toDate } = params;

      const where: any = {};
      if (fromDate || toDate) {
        where.createdAt = {};
        if (fromDate) where.createdAt.gte = fromDate;
        if (toDate) where.createdAt.lte = toDate;
      }

      if (query) {
        where.OR = [
          { userId: { contains: query } },
          { requestData: { path: ['messages'], string_contains: query } }
        ];
      }

      const [histories, total] = await Promise.all([
        this.prisma.requestHistory.findMany({
          where,
          select: {
            userId: true,
            provider: true,
            model: true,
            createdAt: true,
            status: true,
            tokensUsed: true,
            cost: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 100,
        }),
        this.prisma.requestHistory.count({ where }),
      ]);

      // Группируем по пользователям
      const userMap = new Map();
      histories.forEach(history => {
        if (!userMap.has(history.userId)) {
          userMap.set(history.userId, {
            userId: history.userId,
            totalRequests: 0,
            totalTokens: 0,
            totalCost: 0,
            providers: new Set(),
            models: new Set(),
            lastActivity: history.createdAt,
            statusCounts: { success: 0, error: 0 }
          });
        }
        
        const user = userMap.get(history.userId);
        user.totalRequests++;
        user.totalTokens += history.tokensUsed || 0;
        user.totalCost += Number(history.cost || 0);
        user.providers.add(history.provider);
        user.models.add(history.model);
        if (history.createdAt > user.lastActivity) {
          user.lastActivity = history.createdAt;
        }
        if (history.status === 'SUCCESS') {
          user.statusCounts.success++;
        } else {
          user.statusCounts.error++;
        }
      });

      const userStats = Array.from(userMap.values()).map(user => ({
        ...user,
        providers: Array.from(user.providers),
        models: Array.from(user.models),
        successRate: user.totalRequests > 0 ? (user.statusCounts.success / user.totalRequests) * 100 : 0
      }));

      return {
        success: true,
        data: userStats,
        pagination: {
          total: userStats.length,
          limit: 100,
          offset: 0,
          hasMore: false,
        },
      };
    } catch (error) {
      this.logger.error(`Failed to search users: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Получить статистику системы
   */
  async getSystemStatistics(): Promise<any> {
    try {
      const [
        totalRequests,
        totalUsers,
        totalTokens,
        totalCost,
        requestsByProvider,
        requestsByModel,
        requestsByStatus,
        recentActivity
      ] = await Promise.all([
        this.prisma.requestHistory.count(),
        this.prisma.requestHistory.groupBy({
          by: ['userId'],
          _count: { userId: true }
        }).then(result => result.length),
        this.prisma.requestHistory.aggregate({
          _sum: { tokensUsed: true }
        }),
        this.prisma.requestHistory.aggregate({
          _sum: { cost: true }
        }),
        this.prisma.requestHistory.groupBy({
          by: ['provider'],
          _count: { provider: true }
        }),
        this.prisma.requestHistory.groupBy({
          by: ['model'],
          _count: { model: true }
        }),
        this.prisma.requestHistory.groupBy({
          by: ['status'],
          _count: { status: true }
        }),
        this.prisma.requestHistory.findMany({
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            userId: true,
            provider: true,
            model: true,
            status: true,
            createdAt: true
          }
        })
      ]);

      return {
        totalRequests,
        totalUsers,
        totalTokens: totalTokens._sum.tokensUsed || 0,
        totalCost: Number(totalCost._sum.cost || 0),
        requestsByProvider: requestsByProvider.map(r => ({
          provider: r.provider,
          count: r._count.provider
        })),
        requestsByModel: requestsByModel.map(r => ({
          model: r.model,
          count: r._count.model
        })),
        requestsByStatus: requestsByStatus.map(r => ({
          status: r.status,
          count: r._count.status
        })),
        recentActivity: recentActivity.map(r => ({
          userId: r.userId,
          provider: r.provider,
          model: r.model,
          status: r.status,
          createdAt: r.createdAt
        }))
      };
    } catch (error) {
      this.logger.error(`Failed to get system statistics: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  /**
   * Получить статистику пользователя
   */
  async getUserStats(userId: string): Promise<any> {
    try {
      const stats = await this.prisma.requestHistory.aggregate({
        where: { userId },
        _count: { id: true },
        _sum: { tokensUsed: true, cost: true },
        _avg: { responseTime: true },
      });

      const statusStats = await this.prisma.requestHistory.groupBy({
        by: ['status'],
        where: { userId },
        _count: { id: true },
      });

      const providerStats = await this.prisma.requestHistory.groupBy({
        by: ['provider'],
        where: { userId },
        _count: { id: true },
        _sum: { cost: true },
      });

      return {
        totalRequests: stats._count.id,
        totalTokens: stats._sum.tokensUsed || 0,
        totalCost: stats._sum.cost || 0,
        averageResponseTime: stats._avg.responseTime || 0,
        statusBreakdown: statusStats.map(s => ({
          status: s.status,
          count: s._count.id,
        })),
        providerBreakdown: providerStats.map(p => ({
          provider: p.provider,
          count: p._count.id,
          cost: p._sum.cost || 0,
        })),
      };
    } catch (error) {
      this.logger.error(`Failed to get user stats: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }
}
