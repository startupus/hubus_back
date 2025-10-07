import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';

export interface NeuralNetworkStats {
  id: string;
  provider: string;
  model: string;
  totalRequests: number;
  totalTokens: number;
  totalCost: number;
  uniqueUsers: number;
  avgResponseTime: number;
  successRate: number;
  lastUsed: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NeuralNetworkRecommendation {
  id: string;
  userId?: string;
  provider: string;
  model: string;
  reason: string;
  score: number;
  isDefault: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface RecommendationRequest {
  userId?: string;
  limit?: number;
  includeRussian?: boolean;
}

export interface RecommendationResponse {
  recommendations: Array<{
    provider: string;
    model: string;
    reason: string;
    score: number;
    isDefault: boolean;
    stats?: {
      totalRequests: number;
      avgResponseTime: number;
      successRate: number;
    };
  }>;
  total: number;
  hasRussianDefaults: boolean;
}

/**
 * Neural Network Recommendation Service
 * 
 * Управление рекомендациями нейросетей:
 * - Подсчет статистики популярности
 * - Рекомендации на основе статистики
 * - Российские нейросети по умолчанию
 * - Персональные рекомендации
 */
@Injectable()
export class NeuralNetworkRecommendationService {
  private readonly logger = new Logger(NeuralNetworkRecommendationService.name);

  // Российские нейросети по умолчанию
  private readonly russianDefaults = [
    {
      provider: 'yandex',
      model: 'yandex-gpt',
      reason: 'russian',
      score: 100,
      description: 'Yandex GPT - российская языковая модель'
    },
    {
      provider: 'sber',
      model: 'gigachat',
      reason: 'russian',
      score: 95,
      description: 'GigaChat - ИИ-модель от Сбера'
    },
    {
      provider: 'sber',
      model: 'kandinsky',
      reason: 'russian',
      score: 90,
      description: 'Kandinsky - генерация изображений от Сбера'
    }
  ];

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Обновить статистику нейросети
   */
  async updateNeuralNetworkStats(data: {
    provider: string;
    model: string;
    requests?: number;
    tokens?: number;
    cost?: number;
    responseTime?: number;
    success?: boolean;
    userId?: string;
  }): Promise<void> {
    try {
      const { provider, model, requests = 1, tokens = 0, cost = 0, responseTime = 0, success = true, userId } = data;

      // Обновляем или создаем статистику
      await this.prisma.neuralNetworkStats.upsert({
        where: {
          provider_model: {
            provider,
            model
          }
        },
        update: {
          totalRequests: { increment: requests },
          totalTokens: { increment: tokens },
          totalCost: { increment: cost },
          lastUsed: new Date(),
          // Обновляем среднее время ответа
          avgResponseTime: {
            set: await this.calculateAverageResponseTime(provider, model, responseTime)
          },
          // Обновляем процент успешности
          successRate: {
            set: await this.calculateSuccessRate(provider, model, success)
          }
        },
        create: {
          provider,
          model,
          totalRequests: requests,
          totalTokens: tokens,
          totalCost: cost,
          uniqueUsers: userId ? 1 : 0,
          avgResponseTime: responseTime,
          successRate: success ? 100 : 0,
          lastUsed: new Date()
        }
      });

      // Если указан userId, обновляем количество уникальных пользователей
      if (userId) {
        await this.updateUniqueUsersCount(provider, model);
      }

      LoggerUtil.info('analytics-service', 'Neural network stats updated', {
        provider,
        model,
        requests,
        tokens,
        cost,
        userId
      });
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to update neural network stats', error as Error, {
        provider: data.provider,
        model: data.model
      });
    }
  }

  /**
   * Получить рекомендации нейросетей
   */
  async getRecommendations(request: RecommendationRequest = {}): Promise<RecommendationResponse> {
    try {
      const { userId, limit = 10, includeRussian = true } = request;

      LoggerUtil.info('analytics-service', 'Getting neural network recommendations', {
        userId,
        limit,
        includeRussian
      });

      // Получаем статистику нейросетей
      const stats = await this.prisma.neuralNetworkStats.findMany({
        where: {
          totalRequests: { gt: 0 } // Только те, что использовались
        },
        orderBy: [
          { totalRequests: 'desc' },
          { successRate: 'desc' },
          { avgResponseTime: 'asc' }
        ],
        take: limit * 2 // Берем больше для фильтрации
      });

      // Получаем персональные рекомендации если указан userId
      let personalRecommendations: NeuralNetworkRecommendation[] = [];
      if (userId) {
        const rawRecommendations = await this.prisma.neuralNetworkRecommendation.findMany({
          where: {
            userId,
            isActive: true
          },
          orderBy: { score: 'desc' }
        });
        
        personalRecommendations = rawRecommendations.map(rec => ({
          ...rec,
          score: Number(rec.score)
        }));
      }

      // Формируем рекомендации на основе статистики
      const recommendations = this.buildRecommendationsFromStats(stats, personalRecommendations, limit);

      // Добавляем российские по умолчанию если нужно
      let hasRussianDefaults = false;
      if (includeRussian && recommendations.length < limit) {
        const russianRecs = await this.getRussianDefaults(limit - recommendations.length);
        recommendations.push(...russianRecs);
        hasRussianDefaults = russianRecs.length > 0;
      }

      LoggerUtil.info('analytics-service', 'Neural network recommendations generated', {
        userId,
        total: recommendations.length,
        hasRussianDefaults
      });

      return {
        recommendations: recommendations.slice(0, limit),
        total: recommendations.length,
        hasRussianDefaults
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get recommendations', error as Error, {
        userId: request.userId
      });
      
      // В случае ошибки возвращаем российские по умолчанию
      return this.getRussianDefaultsResponse(request.limit || 3);
    }
  }

  /**
   * Получить топ популярных нейросетей
   */
  async getTopPopular(limit: number = 10): Promise<NeuralNetworkStats[]> {
    try {
      const stats = await this.prisma.neuralNetworkStats.findMany({
        where: {
          totalRequests: { gt: 0 }
        },
        orderBy: [
          { totalRequests: 'desc' },
          { successRate: 'desc' }
        ],
        take: limit
      });

      return stats.map(stat => ({
        id: stat.id,
        provider: stat.provider,
        model: stat.model,
        totalRequests: stat.totalRequests,
        totalTokens: stat.totalTokens,
        totalCost: Number(stat.totalCost),
        uniqueUsers: stat.uniqueUsers,
        avgResponseTime: stat.avgResponseTime,
        successRate: Number(stat.successRate),
        lastUsed: stat.lastUsed,
        createdAt: stat.createdAt,
        updatedAt: stat.updatedAt
      }));
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get top popular neural networks', error as Error);
      return [];
    }
  }

  /**
   * Получить статистику по провайдеру
   */
  async getProviderStats(provider: string): Promise<NeuralNetworkStats[]> {
    try {
      const stats = await this.prisma.neuralNetworkStats.findMany({
        where: { provider },
        orderBy: { totalRequests: 'desc' }
      });

      return stats.map(stat => ({
        id: stat.id,
        provider: stat.provider,
        model: stat.model,
        totalRequests: stat.totalRequests,
        totalTokens: stat.totalTokens,
        totalCost: Number(stat.totalCost),
        uniqueUsers: stat.uniqueUsers,
        avgResponseTime: stat.avgResponseTime,
        successRate: Number(stat.successRate),
        lastUsed: stat.lastUsed,
        createdAt: stat.createdAt,
        updatedAt: stat.updatedAt
      }));
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to get provider stats', error as Error, {
        provider
      });
      return [];
    }
  }

  /**
   * Создать персональную рекомендацию
   */
  async createPersonalRecommendation(data: {
    userId: string;
    provider: string;
    model: string;
    reason: string;
    score: number;
  }): Promise<NeuralNetworkRecommendation> {
    try {
      const recommendation = await this.prisma.neuralNetworkRecommendation.create({
        data: {
          userId: data.userId,
          provider: data.provider,
          model: data.model,
          reason: data.reason,
          score: data.score,
          isDefault: false
        }
      });

      LoggerUtil.info('analytics-service', 'Personal recommendation created', {
        userId: data.userId,
        provider: data.provider,
        model: data.model
      });

      return {
        id: recommendation.id,
        userId: recommendation.userId,
        provider: recommendation.provider,
        model: recommendation.model,
        reason: recommendation.reason,
        score: Number(recommendation.score),
        isDefault: recommendation.isDefault,
        isActive: recommendation.isActive,
        createdAt: recommendation.createdAt,
        updatedAt: recommendation.updatedAt
      };
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to create personal recommendation', error as Error, {
        userId: data.userId,
        provider: data.provider,
        model: data.model
      });
      throw error;
    }
  }

  /**
   * Инициализировать российские нейросети по умолчанию
   */
  async initializeRussianDefaults(): Promise<void> {
    try {
      for (const russian of this.russianDefaults) {
        await this.prisma.neuralNetworkRecommendation.upsert({
          where: {
            id: `${russian.provider}-${russian.model}-default`
          },
          update: {
            reason: russian.reason,
            score: russian.score,
            isDefault: true,
            isActive: true
          },
          create: {
            provider: russian.provider,
            model: russian.model,
            reason: russian.reason,
            score: russian.score,
            isDefault: true,
            isActive: true
          }
        });
      }

      LoggerUtil.info('analytics-service', 'Russian neural networks initialized', {
        count: this.russianDefaults.length
      });
    } catch (error) {
      LoggerUtil.error('analytics-service', 'Failed to initialize Russian defaults', error as Error);
    }
  }

  // ===========================================
  // PRIVATE METHODS
  // ===========================================

  private async calculateAverageResponseTime(provider: string, model: string, newResponseTime: number): Promise<number> {
    try {
      const existing = await this.prisma.neuralNetworkStats.findUnique({
        where: {
          provider_model: { provider, model }
        }
      });

      if (!existing) return newResponseTime;

      // Простое скользящее среднее
      const alpha = 0.1; // Коэффициент сглаживания
      return Math.round(existing.avgResponseTime * (1 - alpha) + newResponseTime * alpha);
    } catch (error) {
      return newResponseTime;
    }
  }

  private async calculateSuccessRate(provider: string, model: string, success: boolean): Promise<number> {
    try {
      const existing = await this.prisma.neuralNetworkStats.findUnique({
        where: {
          provider_model: { provider, model }
        }
      });

      if (!existing) return success ? 100 : 0;

      // Простое скользящее среднее
      const alpha = 0.1;
      const successValue = success ? 100 : 0;
      return Number((Number(existing.successRate) * (1 - alpha) + successValue * alpha).toFixed(2));
    } catch (error) {
      return success ? 100 : 0;
    }
  }

  private async updateUniqueUsersCount(provider: string, model: string): Promise<void> {
    try {
      // Подсчитываем уникальных пользователей для этой нейросети
      const uniqueUsers = await this.prisma.analyticsEvent.count({
        where: {
          eventType: 'ai_interaction',
          eventName: 'chat_completion_success',
          properties: {
            path: ['provider'],
            equals: provider
          }
        },
        // distinct удален - не поддерживается для JSON фильтров
      });

      await this.prisma.neuralNetworkStats.update({
        where: {
          provider_model: { provider, model }
        },
        data: {
          uniqueUsers
        }
      });
    } catch (error) {
      LoggerUtil.warn('analytics-service', 'Failed to update unique users count', {
        provider,
        model,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  private buildRecommendationsFromStats(
    stats: any[],
    personalRecommendations: NeuralNetworkRecommendation[],
    limit: number
  ): Array<{
    provider: string;
    model: string;
    reason: string;
    score: number;
    isDefault: boolean;
    stats?: {
      totalRequests: number;
      avgResponseTime: number;
      successRate: number;
    };
  }> {
    const recommendations: Array<{
      provider: string;
      model: string;
      reason: string;
      score: number;
      isDefault: boolean;
      stats?: {
        totalRequests: number;
        avgResponseTime: number;
        successRate: number;
      };
    }> = [];

    // Добавляем персональные рекомендации
    for (const personal of personalRecommendations) {
      if (recommendations.length >= limit) break;
      
      recommendations.push({
        provider: personal.provider,
        model: personal.model,
        reason: personal.reason,
        score: personal.score,
        isDefault: personal.isDefault
      });
    }

    // Добавляем популярные на основе статистики
    for (const stat of stats) {
      if (recommendations.length >= limit) break;
      
      // Проверяем, что не дублируем персональные
      const alreadyExists = personalRecommendations.some(
        p => p.provider === stat.provider && p.model === stat.model
      );
      
      if (alreadyExists) continue;

      const score = this.calculateRecommendationScore(stat);
      recommendations.push({
        provider: stat.provider,
        model: stat.model,
        reason: 'popular',
        score,
        isDefault: false,
        stats: {
          totalRequests: stat.totalRequests,
          avgResponseTime: stat.avgResponseTime,
          successRate: Number(stat.successRate)
        }
      });
    }

    return recommendations;
  }

  private calculateRecommendationScore(stat: any): number {
    // Комбинированный скор на основе популярности, скорости и надежности
    const popularityScore = Math.min(stat.totalRequests / 100, 50); // До 50 баллов за популярность
    const speedScore = Math.max(0, 30 - stat.avgResponseTime / 1000); // До 30 баллов за скорость
    const reliabilityScore = Number(stat.successRate) * 0.2; // До 20 баллов за надежность
    
    return Math.round(popularityScore + speedScore + reliabilityScore);
  }

  private async getRussianDefaults(limit: number): Promise<Array<{
    provider: string;
    model: string;
    reason: string;
    score: number;
    isDefault: boolean;
  }>> {
    return this.russianDefaults.slice(0, limit).map(russian => ({
      provider: russian.provider,
      model: russian.model,
      reason: russian.reason,
      score: russian.score,
      isDefault: true
    }));
  }

  private getRussianDefaultsResponse(limit: number): RecommendationResponse {
    const russianRecs = this.russianDefaults.slice(0, limit).map(russian => ({
      provider: russian.provider,
      model: russian.model,
      reason: russian.reason,
      score: russian.score,
      isDefault: true
    }));

    return {
      recommendations: russianRecs,
      total: russianRecs.length,
      hasRussianDefaults: true
    };
  }
}
