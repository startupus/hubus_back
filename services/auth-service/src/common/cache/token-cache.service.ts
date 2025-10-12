import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerUtil } from '@ai-aggregator/shared';
import * as Redis from 'redis';

/**
 * Token Cache Service для кэширования JWT токенов
 * 
 * Обеспечивает:
 * - Кэширование access и refresh токенов
 * - Валидацию токенов без обращения к БД
 * - Автоматическое истечение токенов
 * - Статистику использования кэша
 */
@Injectable()
export class TokenCacheService {
  private readonly logger = new Logger(TokenCacheService.name);
  private readonly redisClient: Redis.RedisClientType;
  private readonly keyPrefix: string;
  private readonly defaultTTL: number;

  constructor(private readonly configService: ConfigService) {
    this.keyPrefix = this.configService.get('redis.keyPrefix', 'ai_aggregator:auth:');
    this.defaultTTL = this.configService.get('redis.ttl', 300);
    
    this.redisClient = Redis.createClient({
      url: this.configService.get('redis.url', 'redis://localhost:6379'),
      password: this.configService.get('redis.password'),
      database: this.configService.get('redis.db', 0),
    });

    this.redisClient.on('error', (err) => {
      LoggerUtil.error('auth-service', 'Redis connection error', err);
    });

    this.redisClient.on('connect', () => {
      LoggerUtil.info('auth-service', 'Redis connected successfully');
    });

    this.redisClient.connect();
  }

  /**
   * Кэшировать access токен
   */
  async cacheAccessToken(token: string, payload: any, ttl?: number): Promise<boolean> {
    try {
      const key = `${this.keyPrefix}access:${token}`;
      const data = {
        ...payload,
        cachedAt: new Date().toISOString(),
        type: 'access'
      };

      const success = await this.redisClient.setEx(key, ttl || this.defaultTTL, JSON.stringify(data));
      
      if (success) {
        LoggerUtil.debug('auth-service', 'Access token cached', { 
          userId: payload.sub,
          ttl: ttl || this.defaultTTL 
        });
      }
      
      return success === 'OK';
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to cache access token', error as Error);
      return false;
    }
  }

  /**
   * Кэшировать refresh токен
   */
  async cacheRefreshToken(token: string, payload: any, ttl?: number): Promise<boolean> {
    try {
      const key = `${this.keyPrefix}refresh:${token}`;
      const data = {
        ...payload,
        cachedAt: new Date().toISOString(),
        type: 'refresh'
      };

      // Refresh токены живут дольше
      const refreshTTL = ttl || (this.defaultTTL * 24); // 24 часа по умолчанию
      const success = await this.redisClient.setEx(key, refreshTTL, JSON.stringify(data));
      
      if (success) {
        LoggerUtil.debug('auth-service', 'Refresh token cached', { 
          userId: payload.sub,
          ttl: refreshTTL 
        });
      }
      
      return success === 'OK';
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to cache refresh token', error as Error);
      return false;
    }
  }

  /**
   * Получить кэшированный токен
   */
  async getCachedToken(token: string, type: 'access' | 'refresh'): Promise<any | null> {
    try {
      const key = `${this.keyPrefix}${type}:${token}`;
      const data = await this.redisClient.get(key);
      
      if (!data) {
        LoggerUtil.debug('auth-service', 'Token not found in cache', { type, token: token.substring(0, 10) + '...' });
        return null;
      }

      const parsed = JSON.parse(data);
      LoggerUtil.debug('auth-service', 'Token found in cache', { 
        type, 
        userId: parsed.sub,
        cachedAt: parsed.cachedAt 
      });
      
      return parsed;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get cached token', error as Error);
      return null;
    }
  }

  /**
   * Инвалидировать токен
   */
  async invalidateToken(token: string, type: 'access' | 'refresh'): Promise<boolean> {
    try {
      const key = `${this.keyPrefix}${type}:${token}`;
      const result = await this.redisClient.del(key);
      
      LoggerUtil.debug('auth-service', 'Token invalidated', { 
        type, 
        token: token.substring(0, 10) + '...',
        deleted: result > 0 
      });
      
      return result > 0;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to invalidate token', error as Error);
      return false;
    }
  }

  /**
   * Инвалидировать все токены пользователя
   */
  async invalidateUserTokens(userId: string): Promise<number> {
    try {
      const accessPattern = `${this.keyPrefix}access:*`;
      const refreshPattern = `${this.keyPrefix}refresh:*`;
      
      const [accessKeys, refreshKeys] = await Promise.all([
        this.redisClient.keys(accessPattern),
        this.redisClient.keys(refreshPattern)
      ]);

      const allKeys = [...accessKeys, ...refreshKeys];
      let deletedCount = 0;

      // Проверяем каждый ключ на принадлежность пользователю
      for (const key of allKeys) {
        const data = await this.redisClient.get(key);
        if (data) {
          const parsed = JSON.parse(data);
          if (parsed.sub === userId) {
            await this.redisClient.del(key);
            deletedCount++;
          }
        }
      }

      LoggerUtil.info('auth-service', 'User tokens invalidated', { 
        userId, 
        deletedCount 
      });
      
      return deletedCount;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to invalidate user tokens', error as Error);
      return 0;
    }
  }

  /**
   * Получить статистику кэша
   */
  async getCacheStats(): Promise<{
    totalKeys: number;
    accessTokens: number;
    refreshTokens: number;
    memoryUsage: string;
  }> {
    try {
      const [accessKeys, refreshKeys, info] = await Promise.all([
        this.redisClient.keys(`${this.keyPrefix}access:*`),
        this.redisClient.keys(`${this.keyPrefix}refresh:*`),
        this.redisClient.info('memory')
      ]);

      return {
        totalKeys: accessKeys.length + refreshKeys.length,
        accessTokens: accessKeys.length,
        refreshTokens: refreshKeys.length,
        memoryUsage: `${Math.round(parseInt(info) / 1024 / 1024 * 100) / 100} MB`
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get cache stats', error as Error);
      return {
        totalKeys: 0,
        accessTokens: 0,
        refreshTokens: 0,
        memoryUsage: '0 MB'
      };
    }
  }

  /**
   * Очистить весь кэш токенов
   */
  async clearAllTokens(): Promise<number> {
    try {
      const pattern = `${this.keyPrefix}*`;
      const keys = await this.redisClient.keys(pattern);
      
      if (keys.length === 0) {
        return 0;
      }

      const result = await this.redisClient.del(keys);
      
      LoggerUtil.info('auth-service', 'All tokens cleared from cache', { 
        deletedCount: result 
      });
      
      return result;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to clear all tokens', error as Error);
      return 0;
    }
  }

  /**
   * Проверить соединение с Redis
   */
  async isConnected(): Promise<boolean> {
    try {
      await this.redisClient.ping();
      return true;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Redis connection check failed', error as Error);
      return false;
    }
  }

  /**
   * Закрыть соединение
   */
  async disconnect(): Promise<void> {
    try {
      await this.redisClient.quit();
      LoggerUtil.info('auth-service', 'Redis connection closed');
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to close Redis connection', error as Error);
    }
  }
}
