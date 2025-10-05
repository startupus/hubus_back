import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';
import { LoggerUtil } from '../utils/logger.util';

/**
 * Redis Service для кэширования данных
 * 
 * Обеспечивает:
 * - Кэширование часто запрашиваемых данных
 * - TTL для автоматического истечения
 * - Сериализация/десериализация JSON
 * - Мониторинг производительности
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: RedisClientType | null = null;
  private readonly defaultTTL = 300; // 5 минут по умолчанию

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    await this.connect();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  /**
   * Подключение к Redis
   */
  private async connect(): Promise<void> {
    try {
      const redisUrl = this.configService.get<string>('REDIS_URL');
      if (!redisUrl) {
        throw new Error('REDIS_URL is not configured');
      }

      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => Math.min(retries * 50, 1000)
        }
      });

      this.client.on('error', (err) => {
        LoggerUtil.error('shared', 'Redis client error', err);
      });

      this.client.on('connect', () => {
        LoggerUtil.info('shared', 'Redis connected successfully', { url: redisUrl });
      });

      this.client.on('reconnect', () => {
        LoggerUtil.info('shared', 'Redis reconnected');
      });

      await this.client.connect();
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to connect to Redis', error as Error);
      throw error;
    }
  }

  /**
   * Отключение от Redis
   */
  private async disconnect(): Promise<void> {
    try {
      if (this.client) {
        await this.client.quit();
        this.client = null;
      }
      LoggerUtil.info('shared', 'Redis disconnected successfully');
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to disconnect from Redis', error as Error);
    }
  }

  /**
   * Получить значение из кэша
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client) {
      LoggerUtil.warn('shared', 'Redis client not available');
      return null;
    }

    try {
      const value = await this.client.get(key);
      if (!value) {
        LoggerUtil.debug('shared', 'Cache miss', { key });
        return null;
      }

      const parsed = JSON.parse(value);
      LoggerUtil.debug('shared', 'Cache hit', { key });
      return parsed as T;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to get from cache', error as Error, { key });
      return null;
    }
  }

  /**
   * Сохранить значение в кэш
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<boolean> {
    if (!this.client) {
      LoggerUtil.warn('shared', 'Redis client not available');
      return false;
    }

    try {
      const serialized = JSON.stringify(value);
      const actualTTL = ttl || this.defaultTTL;
      
      await this.client.setEx(key, actualTTL, serialized);
      
      LoggerUtil.debug('shared', 'Cache set', { key, ttl: actualTTL });
      return true;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to set cache', error as Error, { key });
      return false;
    }
  }

  /**
   * Удалить значение из кэша
   */
  async delete(key: string): Promise<boolean> {
    if (!this.client) {
      LoggerUtil.warn('shared', 'Redis client not available');
      return false;
    }

    try {
      const result = await this.client.del(key);
      LoggerUtil.debug('shared', 'Cache delete', { key, deleted: result > 0 });
      return result > 0;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to delete from cache', error as Error, { key });
      return false;
    }
  }

  /**
   * Проверить существование ключа
   */
  async exists(key: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to check key existence', error as Error, { key });
      return false;
    }
  }

  /**
   * Получить TTL ключа
   */
  async getTTL(key: string): Promise<number> {
    if (!this.client) {
      return -1;
    }

    try {
      return await this.client.ttl(key);
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to get TTL', error as Error, { key });
      return -1;
    }
  }

  /**
   * Установить TTL для ключа
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.expire(key, ttl);
      LoggerUtil.debug('shared', 'TTL set', { key, ttl, success: result });
      return result;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to set TTL', error as Error, { key, ttl });
      return false;
    }
  }

  /**
   * Получить несколько значений
   */
  async mget<T>(keys: string[]): Promise<(T | null)[]> {
    if (!this.client || keys.length === 0) {
      return [];
    }

    try {
      const values = await this.client.mGet(keys);
      return values.map(value => value ? JSON.parse(value) : null) as (T | null)[];
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to get multiple values', error as Error, { keys });
      return keys.map(() => null);
    }
  }

  /**
   * Сохранить несколько значений
   */
  async mset<T>(keyValuePairs: Record<string, T>, ttl?: number): Promise<boolean> {
    if (!this.client || Object.keys(keyValuePairs).length === 0) {
      return false;
    }

    try {
      const serializedPairs: Record<string, string> = {};
      for (const [key, value] of Object.entries(keyValuePairs)) {
        serializedPairs[key] = JSON.stringify(value);
      }

      await this.client.mSet(serializedPairs);

      // Устанавливаем TTL для всех ключей
      if (ttl) {
        const actualTTL = ttl || this.defaultTTL;
        for (const key of Object.keys(keyValuePairs)) {
          await this.client.expire(key, actualTTL);
        }
      }

      LoggerUtil.debug('shared', 'Multiple values set', { 
        count: Object.keys(keyValuePairs).length,
        ttl: ttl || this.defaultTTL
      });
      return true;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to set multiple values', error as Error);
      return false;
    }
  }

  /**
   * Удалить несколько ключей
   */
  async mdelete(keys: string[]): Promise<number> {
    if (!this.client || keys.length === 0) {
      return 0;
    }

    try {
      const result = await this.client.del(keys);
      LoggerUtil.debug('shared', 'Multiple keys deleted', { keys, deleted: result });
      return result;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to delete multiple keys', error as Error, { keys });
      return 0;
    }
  }

  /**
   * Получить все ключи по паттерну
   */
  async keys(pattern: string): Promise<string[]> {
    if (!this.client) {
      return [];
    }

    try {
      const keys = await this.client.keys(pattern);
      LoggerUtil.debug('shared', 'Keys retrieved', { pattern, count: keys.length });
      return keys;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to get keys', error as Error, { pattern });
      return [];
    }
  }

  /**
   * Очистить все ключи по паттерну
   */
  async clearPattern(pattern: string): Promise<number> {
    if (!this.client) {
      return 0;
    }

    try {
      const keys = await this.client.keys(pattern);
      if (keys.length === 0) {
        return 0;
      }

      const deleted = await this.client.del(keys);
      LoggerUtil.info('shared', 'Pattern cleared', { pattern, deleted });
      return deleted;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to clear pattern', error as Error, { pattern });
      return 0;
    }
  }

  /**
   * Получить информацию о Redis
   */
  async getInfo(): Promise<{
    connected: boolean;
    memory: any;
    stats: any;
  }> {
    if (!this.client) {
      try {
        const info = await this.client.info();
        const memory = await this.client.info('memory');
        const stats = await this.client.info('stats');
        
        return {
          connected: true,
          memory: this.parseInfo(memory),
          stats: this.parseInfo(stats)
        };
      } catch (error) {
        LoggerUtil.error('shared', 'Failed to get Redis info', error as Error);
      }
    }

    return {
      connected: false,
      memory: {},
      stats: {}
    };
  }

  /**
   * Парсинг информации Redis
   */
  private parseInfo(info: string): Record<string, any> {
    const result: Record<string, any> = {};
    const lines = info.split('\r\n');
    
    for (const line of lines) {
      if (line.includes(':')) {
        const [key, value] = line.split(':');
        result[key] = isNaN(Number(value)) ? value : Number(value);
      }
    }
    
    return result;
  }

  /**
   * Проверка состояния соединения
   */
  isConnected(): boolean {
    return this.client !== null && this.client.isReady;
  }

  /**
   * Получить клиент Redis (для продвинутых операций)
   */
  getClient(): RedisClientType | null {
    return this.client;
  }

  // Дополнительные методы для совместимости с тестами

  /**
   * Удалить ключ (алиас для delete)
   */
  async del(key: string): Promise<boolean> {
    return this.delete(key);
  }

  /**
   * Получить несколько значений (алиас для mget)
   */
  async getMultiple<T>(keys: string[]): Promise<(T | null)[]> {
    return this.mget<T>(keys);
  }

  /**
   * Сохранить несколько значений (алиас для mset)
   */
  async setMultiple<T>(keyValuePairs: Record<string, T>, ttl?: number): Promise<boolean> {
    return this.mset(keyValuePairs, ttl);
  }

  /**
   * Получить значение из хэша
   */
  async getHash(key: string, field: string): Promise<string | null> {
    if (!this.client) {
      return null;
    }

    try {
      return await this.client.hGet(key, field);
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to get hash field', error as Error, { key, field });
      return null;
    }
  }

  /**
   * Установить значение в хэш
   */
  async setHash(key: string, field: string, value: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.hSet(key, field, value);
      return result >= 0;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to set hash field', error as Error, { key, field });
      return false;
    }
  }

  /**
   * Получить все поля хэша
   */
  async getAllHash(key: string): Promise<Record<string, string>> {
    if (!this.client) {
      return {};
    }

    try {
      return await this.client.hGetAll(key);
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to get all hash fields', error as Error, { key });
      return {};
    }
  }

  /**
   * Установить все поля хэша
   */
  async setAllHash(key: string, hash: Record<string, string>): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.hSet(key, hash);
      return true;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to set all hash fields', error as Error, { key });
      return false;
    }
  }

  /**
   * Удалить поле из хэша
   */
  async deleteHash(key: string, field: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.hDel(key, field);
      return result > 0;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to delete hash field', error as Error, { key, field });
      return false;
    }
  }

  /**
   * Увеличить значение
   */
  async increment(key: string, amount: number = 1): Promise<number> {
    if (!this.client) {
      return 0;
    }

    try {
      return await this.client.incrBy(key, amount);
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to increment value', error as Error, { key, amount });
      return 0;
    }
  }

  /**
   * Уменьшить значение
   */
  async decrement(key: string, amount: number = 1): Promise<number> {
    if (!this.client) {
      return 0;
    }

    try {
      return await this.client.decrBy(key, amount);
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to decrement value', error as Error, { key, amount });
      return 0;
    }
  }

  /**
   * Получить ключи по паттерну (алиас для keys)
   */
  async getKeys(pattern: string): Promise<string[]> {
    return this.keys(pattern);
  }

  /**
   * Удалить несколько ключей (алиас для mdelete)
   */
  async deleteKeys(keys: string[]): Promise<number> {
    return this.mdelete(keys);
  }

  /**
   * Установить TTL (алиас для expire)
   */
  async setTTL(key: string, ttl: number): Promise<boolean> {
    return this.expire(key, ttl);
  }

  /**
   * Очистить все ключи
   */
  async clear(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      await this.client.flushAll();
      return true;
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to clear all keys', error as Error);
      return false;
    }
  }

  /**
   * Ping Redis
   */
  async ping(): Promise<string> {
    if (!this.client) {
      throw new Error('Redis connection failed');
    }

    try {
      return await this.client.ping();
    } catch (error) {
      LoggerUtil.error('shared', 'Failed to ping Redis', error as Error);
      throw new Error('Redis connection failed');
    }
  }
}
