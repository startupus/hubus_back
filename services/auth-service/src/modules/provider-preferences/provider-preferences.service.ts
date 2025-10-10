import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';

export interface CreateProviderPreferenceDto {
  model: string;
  preferredProvider: string;
  fallbackProviders?: string[];
  costLimit?: number;
  maxTokens?: number;
  metadata?: Record<string, any>;
}

export interface UpdateProviderPreferenceDto {
  preferredProvider?: string;
  fallbackProviders?: string[];
  costLimit?: number;
  maxTokens?: number;
  isActive?: boolean;
  metadata?: Record<string, any>;
}

export interface ProviderPreferenceResponse {
  id: string;
  model: string;
  preferredProvider: string;
  fallbackProviders: string[];
  costLimit?: number;
  maxTokens?: number;
  isActive: boolean;
  priority: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class ProviderPreferencesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Создать или обновить предпочтение провайдера для модели
   */
  async setProviderPreference(
    companyId: string,
    dto: CreateProviderPreferenceDto
  ): Promise<ProviderPreferenceResponse> {
    LoggerUtil.info('auth-service', 'Setting provider preference', {
      companyId,
      model: dto.model,
      preferredProvider: dto.preferredProvider
    });

    // Проверяем, существует ли уже предпочтение для этой модели
    const existing = await this.prisma.companyProviderPreference.findUnique({
      where: {
        companyId_model: {
          companyId,
          model: dto.model
        }
      }
    });

    if (existing) {
      // Обновляем существующее предпочтение
      const updated = await this.prisma.companyProviderPreference.update({
        where: { id: existing.id },
        data: {
          preferredProvider: dto.preferredProvider,
          fallbackProviders: dto.fallbackProviders || [],
          costLimit: dto.costLimit,
          maxTokens: dto.maxTokens,
          metadata: dto.metadata,
          isActive: true
        }
      });

      LoggerUtil.info('auth-service', 'Provider preference updated', {
        companyId,
        model: dto.model,
        preferenceId: updated.id
      });

      return this.mapToResponse(updated);
    } else {
      // Создаем новое предпочтение
      const created = await this.prisma.companyProviderPreference.create({
        data: {
          companyId,
          model: dto.model,
          preferredProvider: dto.preferredProvider,
          fallbackProviders: dto.fallbackProviders || [],
          costLimit: dto.costLimit,
          maxTokens: dto.maxTokens,
          metadata: dto.metadata
        }
      });

      LoggerUtil.info('auth-service', 'Provider preference created', {
        companyId,
        model: dto.model,
        preferenceId: created.id
      });

      return this.mapToResponse(created);
    }
  }

  /**
   * Получить предпочтения провайдеров для компании
   */
  async getProviderPreferences(companyId: string): Promise<ProviderPreferenceResponse[]> {
    LoggerUtil.debug('auth-service', 'Getting provider preferences', { companyId });

    const preferences = await this.prisma.companyProviderPreference.findMany({
      where: { companyId, isActive: true },
      orderBy: [
        { priority: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return preferences.map(pref => this.mapToResponse(pref));
  }

  /**
   * Получить предпочтение для конкретной модели
   */
  async getProviderPreferenceForModel(
    companyId: string,
    model: string
  ): Promise<ProviderPreferenceResponse | null> {
    LoggerUtil.debug('auth-service', 'Getting provider preference for model', {
      companyId,
      model
    });

    const preference = await this.prisma.companyProviderPreference.findUnique({
      where: {
        companyId_model: {
          companyId,
          model
        }
      }
    });

    if (!preference || !preference.isActive) {
      return null;
    }

    return this.mapToResponse(preference);
  }

  /**
   * Обновить предпочтение провайдера
   */
  async updateProviderPreference(
    companyId: string,
    preferenceId: string,
    dto: UpdateProviderPreferenceDto
  ): Promise<ProviderPreferenceResponse> {
    LoggerUtil.info('auth-service', 'Updating provider preference', {
      companyId,
      preferenceId,
      dto
    });

    // Проверяем, что предпочтение принадлежит компании
    const existing = await this.prisma.companyProviderPreference.findFirst({
      where: {
        id: preferenceId,
        companyId
      }
    });

    if (!existing) {
      throw new NotFoundException('Provider preference not found');
    }

    const updated = await this.prisma.companyProviderPreference.update({
      where: { id: preferenceId },
      data: {
        preferredProvider: dto.preferredProvider,
        fallbackProviders: dto.fallbackProviders,
        costLimit: dto.costLimit,
        maxTokens: dto.maxTokens,
        isActive: dto.isActive,
        metadata: dto.metadata
      }
    });

    LoggerUtil.info('auth-service', 'Provider preference updated', {
      companyId,
      preferenceId: updated.id
    });

    return this.mapToResponse(updated);
  }

  /**
   * Удалить предпочтение провайдера
   */
  async deleteProviderPreference(
    companyId: string,
    preferenceId: string
  ): Promise<void> {
    LoggerUtil.info('auth-service', 'Deleting provider preference', {
      companyId,
      preferenceId
    });

    // Проверяем, что предпочтение принадлежит компании
    const existing = await this.prisma.companyProviderPreference.findFirst({
      where: {
        id: preferenceId,
        companyId
      }
    });

    if (!existing) {
      throw new NotFoundException('Provider preference not found');
    }

    await this.prisma.companyProviderPreference.delete({
      where: { id: preferenceId }
    });

    LoggerUtil.info('auth-service', 'Provider preference deleted', {
      companyId,
      preferenceId
    });
  }

  /**
   * Получить доступные провайдеры для модели
   */
  async getAvailableProvidersForModel(model: string): Promise<string[]> {
    // Здесь можно интегрироваться с provider-orchestrator для получения актуального списка
    // Пока возвращаем статический список
    const providersByModel: Record<string, string[]> = {
      'gpt-4': ['openai', 'openrouter'],
      'gpt-3.5-turbo': ['openai', 'openrouter'],
      'claude-3-sonnet': ['openrouter'],
      'claude-3-haiku': ['openrouter'],
      'yandexgpt': ['yandex'],
      'yandexgpt-lite': ['yandex']
    };

    return providersByModel[model] || [];
  }

  /**
   * Получить рекомендуемый провайдер для модели на основе предпочтений компании
   */
  async getRecommendedProvider(
    companyId: string,
    model: string
  ): Promise<{
    provider: string;
    fallbackProviders: string[];
    costLimit?: number;
    maxTokens?: number;
  }> {
    LoggerUtil.debug('auth-service', 'Getting recommended provider', {
      companyId,
      model
    });

    // Получаем предпочтение компании
    const preference = await this.getProviderPreferenceForModel(companyId, model);
    
    if (preference) {
      return {
        provider: preference.preferredProvider,
        fallbackProviders: preference.fallbackProviders,
        costLimit: preference.costLimit,
        maxTokens: preference.maxTokens
      };
    }

    // Если предпочтения нет, возвращаем первый доступный провайдер
    const availableProviders = await this.getAvailableProvidersForModel(model);
    
    if (availableProviders.length === 0) {
      throw new BadRequestException(`No providers available for model: ${model}`);
    }

    return {
      provider: availableProviders[0],
      fallbackProviders: availableProviders.slice(1)
    };
  }

  /**
   * Маппинг модели Prisma в DTO
   */
  private mapToResponse(preference: any): ProviderPreferenceResponse {
    return {
      id: preference.id,
      model: preference.model,
      preferredProvider: preference.preferredProvider,
      fallbackProviders: preference.fallbackProviders || [],
      costLimit: preference.costLimit,
      maxTokens: preference.maxTokens,
      isActive: preference.isActive,
      priority: preference.priority,
      metadata: preference.metadata,
      createdAt: preference.createdAt,
      updatedAt: preference.updatedAt
    };
  }
}
