import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';

export interface AnonymizationSettings {
  id: string;
  provider: string;
  model: string;
  enabled: boolean;
  preserveMetadata: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateAnonymizationSettingsDto {
  provider: string;
  model: string;
  enabled: boolean;
  preserveMetadata?: boolean;
  createdBy: string;
}

export interface UpdateAnonymizationSettingsDto {
  enabled?: boolean;
  preserveMetadata?: boolean;
  updatedBy: string;
}

@Injectable()
export class AnonymizationService {
  private readonly logger = new Logger(AnonymizationService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Получить настройки обезличивания для конкретного провайдера и модели
   */
  async getSettings(provider: string, model: string): Promise<AnonymizationSettings | null> {
    try {
      const settings = await this.prisma.anonymizationSettings.findFirst({
        where: {
          provider,
          model,
        },
        orderBy: { updatedAt: 'desc' },
      });

      return settings ? this.transformSettings(settings) : null;
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to get anonymization settings', error as Error, {
        provider,
        model,
      });
      return null;
    }
  }

  /**
   * Получить все настройки обезличивания
   */
  async getAllSettings(): Promise<AnonymizationSettings[]> {
    try {
      const settings = await this.prisma.anonymizationSettings.findMany({
        orderBy: { updatedAt: 'desc' },
      });

      return settings.map(s => this.transformSettings(s));
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to get all anonymization settings', error as Error);
      return [];
    }
  }

  /**
   * Создать или обновить настройки обезличивания
   */
  async upsertSettings(dto: CreateAnonymizationSettingsDto): Promise<AnonymizationSettings> {
    try {
      const settings = await this.prisma.anonymizationSettings.upsert({
        where: {
          provider_model: {
            provider: dto.provider,
            model: dto.model,
          },
        },
        update: {
          enabled: dto.enabled,
          preserveMetadata: dto.preserveMetadata ?? true,
          updatedBy: dto.createdBy,
          updatedAt: new Date(),
        },
        create: {
          provider: dto.provider,
          model: dto.model,
          enabled: dto.enabled,
          preserveMetadata: dto.preserveMetadata ?? true,
          createdBy: dto.createdBy,
          updatedBy: dto.createdBy,
        },
      });

      LoggerUtil.info('api-gateway', 'Anonymization settings upserted', {
        provider: dto.provider,
        model: dto.model,
        enabled: dto.enabled,
        createdBy: dto.createdBy,
      });

      return this.transformSettings(settings);
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to upsert anonymization settings', error as Error, {
        provider: dto.provider,
        model: dto.model,
        createdBy: dto.createdBy,
      });
      throw error;
    }
  }

  /**
   * Обновить настройки обезличивания
   */
  async updateSettings(
    id: string,
    dto: UpdateAnonymizationSettingsDto
  ): Promise<AnonymizationSettings | null> {
    try {
      const settings = await this.prisma.anonymizationSettings.update({
        where: { id },
        data: {
          enabled: dto.enabled,
          preserveMetadata: dto.preserveMetadata,
          updatedBy: dto.updatedBy,
          updatedAt: new Date(),
        },
      });

      LoggerUtil.info('api-gateway', 'Anonymization settings updated', {
        id,
        enabled: dto.enabled,
        updatedBy: dto.updatedBy,
      });

      return this.transformSettings(settings);
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to update anonymization settings', error as Error, {
        id,
        updatedBy: dto.updatedBy,
      });
      throw error;
    }
  }

  /**
   * Удалить настройки обезличивания
   */
  async deleteSettings(id: string, deletedBy: string): Promise<boolean> {
    try {
      await this.prisma.anonymizationSettings.delete({
        where: { id },
      });

      LoggerUtil.info('api-gateway', 'Anonymization settings deleted', {
        id,
        deletedBy,
      });

      return true;
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to delete anonymization settings', error as Error, {
        id,
        deletedBy,
      });
      return false;
    }
  }

  /**
   * Проверить, нужно ли обезличивать запрос для конкретного провайдера и модели
   */
  async shouldAnonymize(provider: string, model: string): Promise<boolean> {
    try {
      const settings = await this.getSettings(provider, model);
      
      // Если нет настроек для конкретной модели, проверяем общие настройки для провайдера
      if (!settings) {
        const providerSettings = await this.prisma.anonymizationSettings.findFirst({
          where: {
            provider,
            model: '*', // Общие настройки для провайдера
          },
          orderBy: { updatedAt: 'desc' },
        });

        return providerSettings ? providerSettings.enabled : false;
      }

      return settings.enabled;
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to check anonymization settings', error as Error, {
        provider,
        model,
      });
      return false;
    }
  }

  /**
   * Получить настройки обезличивания с возможностью поиска
   */
  async searchSettings(params: {
    provider?: string;
    model?: string;
    enabled?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<{ data: AnonymizationSettings[]; total: number }> {
    try {
      const { provider, model, enabled, limit = 50, offset = 0 } = params;

      const where: any = {};
      if (provider) where.provider = { contains: provider };
      if (model) where.model = { contains: model };
      if (enabled !== undefined) where.enabled = enabled;

      const [settings, total] = await Promise.all([
        this.prisma.anonymizationSettings.findMany({
          where,
          orderBy: { updatedAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.anonymizationSettings.count({ where }),
      ]);

      return {
        data: settings.map(s => this.transformSettings(s)),
        total,
      };
    } catch (error) {
      LoggerUtil.error('api-gateway', 'Failed to search anonymization settings', error as Error, {
        params,
      });
      return { data: [], total: 0 };
    }
  }

  /**
   * Трансформация данных из Prisma в интерфейс
   */
  private transformSettings(settings: any): AnonymizationSettings {
    return {
      id: settings.id,
      provider: settings.provider,
      model: settings.model,
      enabled: settings.enabled,
      preserveMetadata: settings.preserveMetadata,
      createdBy: settings.createdBy,
      createdAt: settings.createdAt,
      updatedAt: settings.updatedAt,
    };
  }

  // ==================== МЕТОДЫ ОБЕЗЛИЧИВАНИЯ ДАННЫХ ====================

  /**
   * Обезличивание сообщений чата
   */
  anonymizeChatMessages(messages: any[]): { data: any[]; mapping: Record<string, string> } {
    const mapping: Record<string, string> = {};
    let counter = 1;

    const anonymizedMessages = messages.map(message => ({
      ...message,
      content: this.anonymizeText(message.content, mapping, counter++)
    }));

    return {
      data: anonymizedMessages,
      mapping
    };
  }

  /**
   * Деобезличивание сообщений чата
   */
  deanonymizeChatMessages(messages: any[], mapping: Record<string, string>): any[] {
    const reverseMapping = this.createReverseMapping(mapping);

    return messages.map(message => ({
      ...message,
      content: this.deanonymizeText(message.content, reverseMapping)
    }));
  }

  /**
   * Обезличивание текста
   */
  anonymizeText(text: string, mapping: Record<string, string> = {}, counter: number = 1): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    // Паттерны для поиска персональных данных
    const patterns = [
      // Email адреса
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      // Телефонные номера (различные форматы)
      /(\+?7|8)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}/g,
      // Имена (простые паттерны)
      /\b[А-ЯЁ][а-яё]+\s+[А-ЯЁ][а-яё]+\b/g,
      // Адреса (упрощенные)
      /\b[А-ЯЁ][а-яё]+\s+(улица|ул\.|проспект|пр\.|переулок|пер\.|площадь|пл\.)\s+[А-ЯЁа-яё0-9\s,.-]+/gi,
      // ИНН, СНИЛС и другие документы
      /\b\d{10,12}\b/g,
      // IP адреса
      /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/g,
      // URL
      /https?:\/\/[^\s]+/g
    ];

    let anonymizedText = text;

    patterns.forEach(pattern => {
      anonymizedText = anonymizedText.replace(pattern, (match) => {
        if (mapping[match]) {
          return mapping[match];
        }

        const anonymizedValue = this.generateAnonymizedValue(match, counter++);
        mapping[match] = anonymizedValue;
        return anonymizedValue;
      });
    });

    return anonymizedText;
  }

  /**
   * Деобезличивание текста
   */
  deanonymizeText(text: string, reverseMapping: Record<string, string>): string {
    if (!text || typeof text !== 'string') {
      return text;
    }

    let deanonymizedText = text;

    Object.entries(reverseMapping).forEach(([anonymized, original]) => {
      const regex = new RegExp(anonymized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      deanonymizedText = deanonymizedText.replace(regex, original);
    });

    return deanonymizedText;
  }

  /**
   * Создание обратного маппинга
   */
  private createReverseMapping(mapping: Record<string, string>): Record<string, string> {
    const reverseMapping: Record<string, string> = {};
    Object.entries(mapping).forEach(([original, anonymized]) => {
      reverseMapping[anonymized] = original;
    });
    return reverseMapping;
  }

  /**
   * Генерация обезличенного значения
   */
  private generateAnonymizedValue(originalValue: string, counter: number): string {
    // Определяем тип данных и генерируем соответствующее обезличенное значение
    if (originalValue.includes('@')) {
      return `user${counter}@example.com`;
    } else if (/^(\+?7|8)?[\s\-]?\(?[0-9]{3}\)?[\s\-]?[0-9]{3}[\s\-]?[0-9]{2}[\s\-]?[0-9]{2}$/.test(originalValue)) {
      return `+7 (XXX) XXX-XX-XX`;
    } else if (/^https?:\/\//.test(originalValue)) {
      return `https://example.com`;
    } else if (/^\d{10,12}$/.test(originalValue)) {
      return `XXXXXXXXXXXX`;
    } else if (/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/.test(originalValue)) {
      return `XXX.XXX.XXX.XXX`;
    } else {
      return `[ОБЕЗЛИЧЕНО_${counter}]`;
    }
  }
}
