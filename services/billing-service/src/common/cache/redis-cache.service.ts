import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerUtil } from '@ai-aggregator/shared';
import * as Redis from 'redis';

/**
 * Redis Cache Service для кэширования данных биллинга
 * 
 * Обеспечивает:
 * - Кэширование балансов пользователей
 * - Кэширование ценовых правил
 * - Кэширование курсов валют
 * - TTL для автоматического истечения кэша
 * - Connection pooling для высокой производительности
 */
@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly redisClient: Redis.RedisClientType;
  private readonly keyPrefix: string;
  private readonly defaultTTL: number;

  constructor(private readonly configService: ConfigService) {
    this.keyPrefix = this.configService.get('redis.keyPrefix', 'ai_aggregator:billing:');
    this.defaultTTL = this.configService.get('redis.ttl', 300);
    
    this.redisClient = Redis.createClient({
      url: this.configService.get('redis.url', 'redis://localhost:6379'),
      password: this.configService.get('redis.password'),
      database: this.configService.get('redis.db', 1), // Используем БД 1 для billing
      socket: {
        connectTimeout: 10000,
      },
      // Connection pooling settings
    });

    this.redisClient.on('error', (err) => {
      LoggerUtil.error('billing-service', 'Redis connection error', err);
    });

    this.redisClient.on('connect', () => {
      LoggerUtil.info('billing-service', 'Redis connected successfully');
    });

    this.redisClient.on('ready', () => {
      LoggerUtil.info('billing-service', 'Redis ready for operations');
    });

    this.redisClient.connect();
  }

  /**
   * Получить значение из кэша
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const fullKey = `${this.keyPrefix}${key}`;
      const data = await this.redisClient.get(fullKey);
      
      if (!data) {
        LoggerUtil.debug('billing-service', 'Cache miss', { key });
        return null;
      }

      LoggerUtil.debug('billing-service', 'Cache hit', { key });
      return JSON.parse(data) as T;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Cache get error', error as Error, { key });
      return null;
    }
  }

  /**
   * Сохранить значение в кэш
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    try {
      const fullKey = `${this.keyPrefix}${key}`;
      const data = JSON.stringify(value);
      const actualTTL = ttl || this.defaultTTL;
      
      const result = await this.redisClient.setEx(fullKey, actualTTL, data);
      
      if (result === 'OK') {
        LoggerUtil.debug('billing-service', 'Cache set', { key, ttl: actualTTL });
        return true;
      }
      
      return false;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Cache set error', error as Error, { key });
      return false;
    }
  }

  /**
   * Удалить значение из кэша
   */
  async delete(key: string): Promise<boolean> {
    try {
      const fullKey = `${this.keyPrefix}${key}`;
      const result = await this.redisClient.del(fullKey);
      
      LoggerUtil.debug('billing-service', 'Cache delete', { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Cache delete error', error as Error, { key });
      return false;
    }
  }

  /**
   * Удалить несколько ключей
   */
  async deleteMany(keys: string[]): Promise<number> {
    try {
      const fullKeys = keys.map(key => `${this.keyPrefix}${key}`);
      const result = await this.redisClient.del(fullKeys);
      
      LoggerUtil.debug('billing-service', 'Cache delete many', { 
        keys: keys.length, 
        deleted: result 
      });
      
      return result;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Cache delete many error', error as Error);
      return 0;
    }
  }

  /**
   * Очистить весь кэш
   */
  async clear(): Promise<boolean> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length === 0) {
        LoggerUtil.info('billing-service', 'Cache already empty');
        return true;
      }

      const result = await this.redisClient.del(keys);
      LoggerUtil.info('billing-service', 'Cache cleared', { deletedCount: result });
      
      return result > 0;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Cache clear error', error as Error);
      return false;
    }
  }

  /**
   * Получить размер кэша
   */
  async size(): Promise<number> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redisClient.keys(pattern);
      return keys.length;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Cache size error', error as Error);
      return 0;
    }
  }

  /**
   * Получить статистику кэша
   */
  async getStats(): Promise<{ 
    size: number; 
    memoryUsage: string; 
    hitRate?: number;
    keys: string[];
  }> {
    try {
      const [pattern, info] = await Promise.all([
        this.redisClient.keys(`${this.keyPrefix}*`),
        this.redisClient.info('memory')
      ]);

      return {
        size: pattern.length,
        memoryUsage: `${Math.round(parseInt(info) / 1024 / 1024 * 100) / 100} MB`,
        keys: pattern.map(key => key.replace(this.keyPrefix, ''))
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Cache stats error', error as Error);
      return {
        size: 0,
        memoryUsage: '0 MB',
        keys: []
      };
    }
  }

  // Специализированные методы для биллинга

  /**
   * Кэшировать баланс компании
   */
  async cacheCompanyBalance(companyId: string, balance: any): Promise<boolean> {
    const key = `balance:${companyId}`;
    return await this.set(key, balance, 2 * 60); // 2 минуты
  }

  /**
   * Получить кэшированный баланс компании
   */
  async getCachedCompanyBalance(companyId: string): Promise<any | null> {
    const key = `balance:${companyId}`;
    return await this.get(key);
  }

  /**
   * Инвалидировать кэш баланса компании
   */
  async invalidateCompanyBalance(companyId: string): Promise<boolean> {
    const key = `balance:${companyId}`;
    return await this.delete(key);
  }

  /**
   * Кэшировать ценовые правила
   */
  async cachePricingRules(service: string, resource: string, rules: any[]): Promise<boolean> {
    const key = `pricing:${service}:${resource}`;
    return await this.set(key, rules, 10 * 60); // 10 минут
  }

  /**
   * Получить кэшированные ценовые правила
   */
  async getCachedPricingRules(service: string, resource: string): Promise<any[] | null> {
    const key = `pricing:${service}:${resource}`;
    return await this.get(key);
  }

  /**
   * Кэшировать курс валют
   */
  async cacheCurrencyRate(from: string, to: string, rate: number): Promise<boolean> {
    const key = `currency:${from}:${to}`;
    return await this.set(key, rate, 60 * 60); // 1 час
  }

  /**
   * Получить кэшированный курс валют
   */
  async getCachedCurrencyRate(from: string, to: string): Promise<number | null> {
    const key = `currency:${from}:${to}`;
    return await this.get(key);
  }

  /**
   * Кэшировать транзакции компании
   */
  async cacheCompanyTransactions(companyId: string, transactions: any[], page: number = 1): Promise<boolean> {
    const key = `transactions:${companyId}:${page}`;
    return await this.set(key, transactions, 5 * 60); // 5 минут
  }

  /**
   * Получить кэшированные транзакции компании
   */
  async getCachedCompanyTransactions(companyId: string, page: number = 1): Promise<any[] | null> {
    const key = `transactions:${companyId}:${page}`;
    return await this.get(key);
  }

  /**
   * Инвалидировать кэш транзакций компании
   */
  async invalidateCompanyTransactions(companyId: string): Promise<boolean> {
    const pattern = `transactions:${companyId}:*`;
    const keys = await this.redisClient.keys(`${this.keyPrefix}${pattern}`);
    
    if (keys.length === 0) {
      return true;
    }

    const result = await this.redisClient.del(keys);
    return result > 0;
  }

  /**
   * Проверить соединение с Redis
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.redisClient.ping();
      return true;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Redis connection check failed', error as Error);
      return false;
    }
  }

  /**
   * Закрыть соединение
   */
  async disconnect(): Promise<void> {
    try {
      await this.redisClient.quit();
      LoggerUtil.info('billing-service', 'Redis connection closed');
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to close Redis connection', error as Error);
    }
  }
}
