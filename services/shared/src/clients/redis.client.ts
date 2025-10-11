import { Injectable } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';

export interface RedisSetRequest {
  key: string;
  value: any;
  ttl?: number;
}

export interface RedisGetRequest {
  key: string;
}

export interface RedisDeleteRequest {
  keys: string[];
}

export interface RedisKeysRequest {
  pattern: string;
}

export interface RedisClearPatternRequest {
  pattern: string;
}

@Injectable()
export class RedisClient {
  private readonly REDIS_SERVICE_URL = process.env.REDIS_SERVICE_URL || 'http://redis-service:3009';
  private axiosInstance: AxiosInstance | null = null;

  private getAxiosInstance(): AxiosInstance {
    if (!this.axiosInstance) {
      this.axiosInstance = axios.create({
        timeout: 10000,
        maxRedirects: 3,
      });
    }
    return this.axiosInstance;
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      // Проверяем доступность redis-service
      const response = await this.getAxiosInstance().post<{ success: boolean }>(`${this.REDIS_SERVICE_URL}/api/redis/set`, {
        key,
        value,
        ttl
      }, {
        timeout: 5000 // 5 секунд таймаут
      });
      return response.data.success;
    } catch (error) {
      console.warn('Redis set error (fallback to false):', error.message);
      return false; // Fallback к false вместо ошибки
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const response = await this.getAxiosInstance().get<{ data: T | null }>(`${this.REDIS_SERVICE_URL}/api/redis/get/${encodeURIComponent(key)}`, {
        timeout: 5000
      });
      return response.data.data;
    } catch (error) {
      console.warn('Redis get error (fallback to null):', error.message);
      return null;
    }
  }

  async mdelete(keys: string[]): Promise<number> {
    try {
      const response = await this.getAxiosInstance().post<{ deleted: number }>(`${this.REDIS_SERVICE_URL}/api/redis/mdelete`, { keys }, {
        timeout: 5000
      });
      return response.data.deleted;
    } catch (error) {
      console.warn('Redis mdelete error (fallback to 0):', error.message);
      return 0;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const response = await this.getAxiosInstance().get<{ keys: string[] }>(`${this.REDIS_SERVICE_URL}/api/redis/keys/${encodeURIComponent(pattern)}`, {
        timeout: 5000
      });
      return response.data.keys;
    } catch (error) {
      console.warn('Redis keys error (fallback to []):', error.message);
      return [];
    }
  }

  async clearPattern(pattern: string): Promise<number> {
    try {
      const response = await this.getAxiosInstance().delete<{ deleted: number }>(`${this.REDIS_SERVICE_URL}/api/redis/clear-pattern/${encodeURIComponent(pattern)}`, {
        timeout: 5000
      });
      return response.data.deleted;
    } catch (error) {
      console.warn('Redis clearPattern error (fallback to 0):', error.message);
      return 0;
    }
  }
}
