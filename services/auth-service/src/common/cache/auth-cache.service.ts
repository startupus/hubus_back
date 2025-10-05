import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '@ai-aggregator/shared';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * Auth Cache Service для кэширования данных аутентификации
 * 
 * Кэширует:
 * - JWT токены и их валидацию
 * - API ключи и их статус
 * - Пользовательские сессии
 * - Rate limiting данные
 */
@Injectable()
export class AuthCacheService {
  private readonly logger = new Logger(AuthCacheService.name);
  private readonly TOKEN_PREFIX = 'auth:token:';
  private readonly API_KEY_PREFIX = 'auth:apikey:';
  private readonly SESSION_PREFIX = 'auth:session:';
  private readonly RATE_LIMIT_PREFIX = 'auth:ratelimit:';

  constructor(private readonly redisService: RedisService) {}

  /**
   * Кэширование JWT токена
   */
  async cacheToken(token: string, userId: string, expiresIn: number): Promise<boolean> {
    try {
      const key = `${this.TOKEN_PREFIX}${token}`;
      const data = {
        userId,
        issuedAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
      };

      const success = await this.redisService.set(key, data, expiresIn);
      
      if (success) {
        LoggerUtil.debug('auth-service', 'Token cached successfully', { userId, expiresIn });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to cache token', error as Error, { userId });
      return false;
    }
  }

  /**
   * Получение данных JWT токена из кэша
   */
  async getTokenData(token: string): Promise<{ userId: string; issuedAt: string; expiresAt: string } | null> {
    try {
      const key = `${this.TOKEN_PREFIX}${token}`;
      const data = await this.redisService.get<{ userId: string; issuedAt: string; expiresAt: string }>(key);
      
      if (data) {
        LoggerUtil.debug('auth-service', 'Token data retrieved from cache', { userId: data.userId });
      }
      
      return data;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get token data', error as Error, { token });
      return null;
    }
  }

  /**
   * Удаление JWT токена из кэша
   */
  async invalidateToken(token: string): Promise<boolean> {
    try {
      const key = `${this.TOKEN_PREFIX}${token}`;
      const success = await this.redisService.delete(key);
      
      if (success) {
        LoggerUtil.debug('auth-service', 'Token invalidated successfully');
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to invalidate token', error as Error, { token });
      return false;
    }
  }

  /**
   * Кэширование API ключа
   */
  async cacheApiKey(apiKey: string, userId: string, permissions: string[], expiresIn: number): Promise<boolean> {
    try {
      const key = `${this.API_KEY_PREFIX}${apiKey}`;
      const data = {
        userId,
        permissions,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
      };

      const success = await this.redisService.set(key, data, expiresIn);
      
      if (success) {
        LoggerUtil.debug('auth-service', 'API key cached successfully', { userId, permissions });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to cache API key', error as Error, { userId });
      return false;
    }
  }

  /**
   * Получение данных API ключа из кэша
   */
  async getApiKeyData(apiKey: string): Promise<{ userId: string; permissions: string[]; createdAt: string; expiresAt: string } | null> {
    try {
      const key = `${this.API_KEY_PREFIX}${apiKey}`;
      const data = await this.redisService.get<{ userId: string; permissions: string[]; createdAt: string; expiresAt: string }>(key);
      
      if (data) {
        LoggerUtil.debug('auth-service', 'API key data retrieved from cache', { userId: data.userId });
      }
      
      return data;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get API key data', error as Error, { apiKey });
      return null;
    }
  }

  /**
   * Удаление API ключа из кэша
   */
  async invalidateApiKey(apiKey: string): Promise<boolean> {
    try {
      const key = `${this.API_KEY_PREFIX}${apiKey}`;
      const success = await this.redisService.delete(key);
      
      if (success) {
        LoggerUtil.debug('auth-service', 'API key invalidated successfully');
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to invalidate API key', error as Error, { apiKey });
      return false;
    }
  }

  /**
   * Кэширование пользовательской сессии
   */
  async cacheUserSession(sessionId: string, userId: string, data: any, expiresIn: number): Promise<boolean> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      const sessionData = {
        userId,
        data,
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString()
      };

      const success = await this.redisService.set(key, sessionData, expiresIn);
      
      if (success) {
        LoggerUtil.debug('auth-service', 'User session cached successfully', { userId, sessionId });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to cache user session', error as Error, { userId, sessionId });
      return false;
    }
  }

  /**
   * Получение пользовательской сессии из кэша
   */
  async getUserSession(sessionId: string): Promise<{ userId: string; data: any; createdAt: string; expiresAt: string } | null> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      const data = await this.redisService.get<{ userId: string; data: any; createdAt: string; expiresAt: string }>(key);
      
      if (data) {
        LoggerUtil.debug('auth-service', 'User session retrieved from cache', { userId: data.userId, sessionId });
      }
      
      return data;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get user session', error as Error, { sessionId });
      return null;
    }
  }

  /**
   * Удаление пользовательской сессии из кэша
   */
  async invalidateUserSession(sessionId: string): Promise<boolean> {
    try {
      const key = `${this.SESSION_PREFIX}${sessionId}`;
      const success = await this.redisService.delete(key);
      
      if (success) {
        LoggerUtil.debug('auth-service', 'User session invalidated successfully', { sessionId });
      }
      
      return success;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to invalidate user session', error as Error, { sessionId });
      return false;
    }
  }

  /**
   * Rate limiting - проверка лимитов
   */
  async checkRateLimit(identifier: string, limit: number, windowSeconds: number): Promise<{
    allowed: boolean;
    remaining: number;
    resetTime: number;
  }> {
    try {
      const key = `${this.RATE_LIMIT_PREFIX}${identifier}`;
      const now = Date.now();
      const windowStart = now - (windowSeconds * 1000);

      // Получаем текущие запросы
      const requests = await this.redisService.get<number[]>(key) || [];
      
      // Фильтруем запросы в текущем окне
      const validRequests = requests.filter(timestamp => timestamp > windowStart);
      
      if (validRequests.length >= limit) {
        return {
          allowed: false,
          remaining: 0,
          resetTime: windowStart + (windowSeconds * 1000)
        };
      }

      // Добавляем новый запрос
      validRequests.push(now);
      await this.redisService.set(key, validRequests, windowSeconds);

      return {
        allowed: true,
        remaining: limit - validRequests.length,
        resetTime: now + (windowSeconds * 1000)
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to check rate limit', error as Error, { identifier });
      return {
        allowed: true, // В случае ошибки разрешаем запрос
        remaining: limit,
        resetTime: Date.now() + (windowSeconds * 1000)
      };
    }
  }

  /**
   * Очистка всех кэшированных данных пользователя
   */
  async clearUserCache(userId: string): Promise<boolean> {
    try {
      // Очищаем токены пользователя
      const tokenPattern = `${this.TOKEN_PREFIX}*`;
      const tokenKeys = await this.redisService.keys(tokenPattern);
      const userTokens = tokenKeys.filter(key => {
        const data = this.redisService.get(key);
        return data && (data as any).userId === userId;
      });

      if (userTokens.length > 0) {
        await this.redisService.mdelete(userTokens);
      }

      // Очищаем API ключи пользователя
      const apiKeyPattern = `${this.API_KEY_PREFIX}*`;
      const apiKeyKeys = await this.redisService.keys(apiKeyPattern);
      const userApiKeys = apiKeyKeys.filter(key => {
        const data = this.redisService.get(key);
        return data && (data as any).userId === userId;
      });

      if (userApiKeys.length > 0) {
        await this.redisService.mdelete(userApiKeys);
      }

      // Очищаем сессии пользователя
      const sessionPattern = `${this.SESSION_PREFIX}*`;
      const sessionKeys = await this.redisService.keys(sessionPattern);
      const userSessions = sessionKeys.filter(key => {
        const data = this.redisService.get(key);
        return data && (data as any).userId === userId;
      });

      if (userSessions.length > 0) {
        await this.redisService.mdelete(userSessions);
      }

      LoggerUtil.info('auth-service', 'User cache cleared successfully', { 
        userId,
        clearedTokens: userTokens.length,
        clearedApiKeys: userApiKeys.length,
        clearedSessions: userSessions.length
      });

      return true;
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to clear user cache', error as Error, { userId });
      return false;
    }
  }

  /**
   * Получение статистики кэша
   */
  async getCacheStats(): Promise<{
    totalTokens: number;
    totalApiKeys: number;
    totalSessions: number;
    totalRateLimits: number;
  }> {
    try {
      const tokenKeys = await this.redisService.keys(`${this.TOKEN_PREFIX}*`);
      const apiKeyKeys = await this.redisService.keys(`${this.API_KEY_PREFIX}*`);
      const sessionKeys = await this.redisService.keys(`${this.SESSION_PREFIX}*`);
      const rateLimitKeys = await this.redisService.keys(`${this.RATE_LIMIT_PREFIX}*`);

      return {
        totalTokens: tokenKeys.length,
        totalApiKeys: apiKeyKeys.length,
        totalSessions: sessionKeys.length,
        totalRateLimits: rateLimitKeys.length
      };
    } catch (error) {
      LoggerUtil.error('auth-service', 'Failed to get cache stats', error as Error);
      return {
        totalTokens: 0,
        totalApiKeys: 0,
        totalSessions: 0,
        totalRateLimits: 0
      };
    }
  }
}
