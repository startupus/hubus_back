import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * Cache Service для кэширования данных биллинга
 * 
 * Обеспечивает:
 * - Кэширование балансов пользователей
 * - Кэширование ценовых правил
 * - Кэширование курсов валют
 * - TTL для автоматического истечения кэша
 */
@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly cache = new Map<string, { value: any; expires: number }>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 минут

  /**
   * Получить значение из кэша
   */
  get<T>(key: string): T | null {
    try {
      const item = this.cache.get(key);
      
      if (!item) {
        return null;
      }

      // Проверяем, не истек ли TTL
      if (Date.now() > item.expires) {
        this.cache.delete(key);
        LoggerUtil.debug('billing-service', 'Cache expired', { key });
        return null;
      }

      LoggerUtil.debug('billing-service', 'Cache hit', { key });
      return item.value as T;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Cache get error', error as Error, { key });
      return null;
    }
  }

  /**
   * Сохранить значение в кэш
   */
  set<T>(key: string, value: T, ttl?: number): void {
    try {
      const expires = Date.now() + (ttl || this.defaultTTL);
      this.cache.set(key, { value, expires });
      
      LoggerUtil.debug('billing-service', 'Cache set', { key, ttl: ttl || this.defaultTTL });
    } catch (error) {
      LoggerUtil.error('billing-service', 'Cache set error', error as Error, { key });
    }
  }

  /**
   * Удалить значение из кэша
   */
  delete(key: string): boolean {
    try {
      const deleted = this.cache.delete(key);
      LoggerUtil.debug('billing-service', 'Cache delete', { key, deleted });
      return deleted;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Cache delete error', error as Error, { key });
      return false;
    }
  }

  /**
   * Очистить весь кэш
   */
  clear(): void {
    try {
      this.cache.clear();
      LoggerUtil.info('billing-service', 'Cache cleared');
    } catch (error) {
      LoggerUtil.error('billing-service', 'Cache clear error', error as Error);
    }
  }

  /**
   * Получить размер кэша
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Получить статистику кэша
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }

  /**
   * Очистить истекшие записи
   */
  cleanup(): void {
    try {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, item] of this.cache.entries()) {
        if (now > item.expires) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        LoggerUtil.info('billing-service', 'Cache cleanup completed', { cleaned });
      }
    } catch (error) {
      LoggerUtil.error('billing-service', 'Cache cleanup error', error as Error);
    }
  }

  // Специализированные методы для биллинга

  /**
   * Кэшировать баланс компании
   */
  cacheCompanyBalance(companyId: string, balance: any): void {
    const key = `balance:${companyId}`;
    this.set(key, balance, 2 * 60 * 1000); // 2 минуты
  }

  /**
   * Получить кэшированный баланс компании
   */
  getCachedCompanyBalance(companyId: string): any | null {
    const key = `balance:${companyId}`;
    return this.get(key);
  }

  /**
   * Инвалидировать кэш баланса компании
   */
  invalidateCompanyBalance(companyId: string): void {
    const key = `balance:${companyId}`;
    this.delete(key);
  }

  /**
   * Кэшировать ценовые правила
   */
  cachePricingRules(service: string, resource: string, rules: any[]): void {
    const key = `pricing:${service}:${resource}`;
    this.set(key, rules, 10 * 60 * 1000); // 10 минут
  }

  /**
   * Получить кэшированные ценовые правила
   */
  getCachedPricingRules(service: string, resource: string): any[] | null {
    const key = `pricing:${service}:${resource}`;
    return this.get(key);
  }

  /**
   * Кэшировать курс валют
   */
  cacheCurrencyRate(from: string, to: string, rate: number): void {
    const key = `currency:${from}:${to}`;
    this.set(key, rate, 60 * 60 * 1000); // 1 час
  }

  /**
   * Получить кэшированный курс валют
   */
  getCachedCurrencyRate(from: string, to: string): number | null {
    const key = `currency:${from}:${to}`;
    return this.get(key);
  }
}
