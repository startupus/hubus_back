import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';

export type ProviderType = 'DOMESTIC' | 'FOREIGN';

export interface ProviderInfo {
  name: string;
  type: ProviderType;
  country: string;
  description?: string;
}

/**
 * Provider Classification Service
 * 
 * Классифицирует провайдеров ИИ на отечественные и зарубежные
 * для корректного биллинга и соблюдения российского законодательства
 */
@Injectable()
export class ProviderClassificationService {
  private readonly logger = new Logger(ProviderClassificationService.name);

  // Список отечественных провайдеров
  private readonly domesticProviders: Set<string> = new Set([
    'yandex',
    'sber',
    'gigachat',
    'kandinsky',
    'ruGPT',
    'rugpt',
    'rugpt3',
    'rugpt4',
    'sberbank',
    'sber',
    'yandexgpt',
    'yandex-gpt',
    'yandex_gpt',
    'giga',
    'giga-chat',
    'giga_chat',
    'kandinsky',
    'kandinsky-ai',
    'kandinsky_ai',
    'ru-gpt',
    'ru_gpt',
    'russian-gpt',
    'russian_gpt',
    'domestic',
    'local',
    'russia',
    'russian'
  ]);

  // Список зарубежных провайдеров
  private readonly foreignProviders: Set<string> = new Set([
    'openai',
    'anthropic',
    'google',
    'microsoft',
    'meta',
    'cohere',
    'huggingface',
    'replicate',
    'together',
    'together-ai',
    'together_ai',
    'openrouter',
    'open-router',
    'open_router',
    'groq',
    'perplexity',
    'mistral',
    'claude',
    'gpt',
    'gpt-3',
    'gpt-4',
    'gpt-3.5',
    'gpt-3.5-turbo',
    'gpt-4-turbo',
    'gpt-4o',
    'claude-3',
    'claude-3-sonnet',
    'claude-3-opus',
    'claude-3-haiku',
    'gemini',
    'gemini-pro',
    'gemini-1.5',
    'llama',
    'llama-2',
    'llama-3',
    'mixtral',
    'mixtral-8x7b',
    'mixtral-8x22b',
    'foreign',
    'international',
    'us',
    'usa',
    'american',
    'european',
    'europe'
  ]);

  // Дополнительная информация о провайдерах
  private readonly providerInfo: Map<string, ProviderInfo> = new Map([
    // Отечественные провайдеры
    ['yandex', { name: 'Yandex', type: 'DOMESTIC', country: 'Russia', description: 'Yandex GPT и другие ИИ-модели' }],
    ['sber', { name: 'Sber', type: 'DOMESTIC', country: 'Russia', description: 'GigaChat и другие ИИ-модели Сбера' }],
    ['gigachat', { name: 'GigaChat', type: 'DOMESTIC', country: 'Russia', description: 'ИИ-модель от Сбера' }],
    ['kandinsky', { name: 'Kandinsky', type: 'DOMESTIC', country: 'Russia', description: 'Модель генерации изображений от Сбера' }],
    ['rugpt', { name: 'RuGPT', type: 'DOMESTIC', country: 'Russia', description: 'Российская языковая модель' }],
    
    // Зарубежные провайдеры
    ['openai', { name: 'OpenAI', type: 'FOREIGN', country: 'USA', description: 'GPT-3, GPT-4 и другие модели' }],
    ['anthropic', { name: 'Anthropic', type: 'FOREIGN', country: 'USA', description: 'Claude и другие модели' }],
    ['google', { name: 'Google', type: 'FOREIGN', country: 'USA', description: 'Gemini и другие модели' }],
    ['microsoft', { name: 'Microsoft', type: 'FOREIGN', country: 'USA', description: 'Copilot и другие модели' }],
    ['meta', { name: 'Meta', type: 'FOREIGN', country: 'USA', description: 'LLaMA и другие модели' }],
    ['openrouter', { name: 'OpenRouter', type: 'FOREIGN', country: 'USA', description: 'Агрегатор ИИ-моделей' }],
    ['groq', { name: 'Groq', type: 'FOREIGN', country: 'USA', description: 'Быстрые ИИ-модели' }],
    ['mistral', { name: 'Mistral', type: 'FOREIGN', country: 'France', description: 'Европейские ИИ-модели' }],
    ['cohere', { name: 'Cohere', type: 'FOREIGN', country: 'Canada', description: 'Канадские ИИ-модели' }],
  ]);

  /**
   * Определяет тип провайдера (отечественный или зарубежный)
   */
  classifyProvider(provider: string): ProviderType {
    const normalizedProvider = this.normalizeProviderName(provider);
    
    if (this.domesticProviders.has(normalizedProvider)) {
      LoggerUtil.info('billing-service', 'Provider classified as domestic', {
        provider,
        normalizedProvider,
        type: 'DOMESTIC'
      });
      return 'DOMESTIC';
    }
    
    if (this.foreignProviders.has(normalizedProvider)) {
      LoggerUtil.info('billing-service', 'Provider classified as foreign', {
        provider,
        normalizedProvider,
        type: 'FOREIGN'
      });
      return 'FOREIGN';
    }
    
    // По умолчанию считаем зарубежным, если не определен
    LoggerUtil.warn('billing-service', 'Unknown provider, defaulting to foreign', {
      provider,
      normalizedProvider,
      type: 'FOREIGN'
    });
    return 'FOREIGN';
  }

  /**
   * Получает информацию о провайдере
   */
  getProviderInfo(provider: string): ProviderInfo | null {
    const normalizedProvider = this.normalizeProviderName(provider);
    return this.providerInfo.get(normalizedProvider) || null;
  }

  /**
   * Получает все известные провайдеры
   */
  getAllProviders(): ProviderInfo[] {
    return Array.from(this.providerInfo.values());
  }

  /**
   * Получает провайдеров по типу
   */
  getProvidersByType(type: ProviderType): ProviderInfo[] {
    return Array.from(this.providerInfo.values()).filter(info => info.type === type);
  }

  /**
   * Добавляет новый провайдер
   */
  addProvider(provider: string, info: ProviderInfo): void {
    const normalizedProvider = this.normalizeProviderName(provider);
    
    if (info.type === 'DOMESTIC') {
      this.domesticProviders.add(normalizedProvider);
    } else {
      this.foreignProviders.add(normalizedProvider);
    }
    
    this.providerInfo.set(normalizedProvider, info);
    
    LoggerUtil.info('billing-service', 'Provider added', {
      provider,
      normalizedProvider,
      info
    });
  }

  /**
   * Обновляет информацию о провайдере
   */
  updateProvider(provider: string, info: Partial<ProviderInfo>): void {
    const normalizedProvider = this.normalizeProviderName(provider);
    const existingInfo = this.providerInfo.get(normalizedProvider);
    
    if (!existingInfo) {
      LoggerUtil.warn('billing-service', 'Provider not found for update', {
        provider,
        normalizedProvider
      });
      return;
    }
    
    const updatedInfo = { ...existingInfo, ...info };
    this.providerInfo.set(normalizedProvider, updatedInfo);
    
    // Обновляем классификацию если изменился тип
    if (info.type && info.type !== existingInfo.type) {
      if (info.type === 'DOMESTIC') {
        this.domesticProviders.add(normalizedProvider);
        this.foreignProviders.delete(normalizedProvider);
      } else {
        this.foreignProviders.add(normalizedProvider);
        this.domesticProviders.delete(normalizedProvider);
      }
    }
    
    LoggerUtil.info('billing-service', 'Provider updated', {
      provider,
      normalizedProvider,
      oldInfo: existingInfo,
      newInfo: updatedInfo
    });
  }

  /**
   * Удаляет провайдера
   */
  removeProvider(provider: string): void {
    const normalizedProvider = this.normalizeProviderName(provider);
    
    this.domesticProviders.delete(normalizedProvider);
    this.foreignProviders.delete(normalizedProvider);
    this.providerInfo.delete(normalizedProvider);
    
    LoggerUtil.info('billing-service', 'Provider removed', {
      provider,
      normalizedProvider
    });
  }

  /**
   * Нормализует имя провайдера для сравнения
   */
  private normalizeProviderName(provider: string): string {
    return provider.toLowerCase()
      .replace(/[^a-z0-9]/g, '') // Убираем все не-буквенно-цифровые символы
      .trim();
  }

  /**
   * Проверяет, является ли провайдер отечественным
   */
  isDomestic(provider: string): boolean {
    return this.classifyProvider(provider) === 'DOMESTIC';
  }

  /**
   * Проверяет, является ли провайдер зарубежным
   */
  isForeign(provider: string): boolean {
    return this.classifyProvider(provider) === 'FOREIGN';
  }

  /**
   * Получает статистику по провайдерам
   */
  getProviderStats(): {
    total: number;
    domestic: number;
    foreign: number;
    unknown: number;
  } {
    const allProviders = Array.from(this.providerInfo.values());
    const domestic = allProviders.filter(p => p.type === 'DOMESTIC').length;
    const foreign = allProviders.filter(p => p.type === 'FOREIGN').length;
    
    return {
      total: allProviders.length,
      domestic,
      foreign,
      unknown: 0 // Пока не отслеживаем неизвестные
    };
  }
}
