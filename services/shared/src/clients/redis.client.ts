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
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = axios.create({
      timeout: 10000,
      maxRedirects: 3,
    });
  }

  async set(key: string, value: any, ttl?: number): Promise<boolean> {
    try {
      const response = await this.axiosInstance.post<{ success: boolean }>(`${this.REDIS_SERVICE_URL}/api/redis/set`, {
        key,
        value,
        ttl
      });
      return response.data.success;
    } catch (error) {
      console.error('Redis set error:', error);
      return false;
    }
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const response = await this.axiosInstance.get<{ data: T | null }>(`${this.REDIS_SERVICE_URL}/api/redis/get/${encodeURIComponent(key)}`);
      return response.data.data;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async mdelete(keys: string[]): Promise<number> {
    try {
      const response = await this.axiosInstance.post<{ deleted: number }>(`${this.REDIS_SERVICE_URL}/api/redis/mdelete`, { keys });
      return response.data.deleted;
    } catch (error) {
      console.error('Redis mdelete error:', error);
      return 0;
    }
  }

  async keys(pattern: string): Promise<string[]> {
    try {
      const response = await this.axiosInstance.get<{ keys: string[] }>(`${this.REDIS_SERVICE_URL}/api/redis/keys/${encodeURIComponent(pattern)}`);
      return response.data.keys;
    } catch (error) {
      console.error('Redis keys error:', error);
      return [];
    }
  }

  async clearPattern(pattern: string): Promise<number> {
    try {
      const response = await this.axiosInstance.delete<{ deleted: number }>(`${this.REDIS_SERVICE_URL}/api/redis/clear-pattern/${encodeURIComponent(pattern)}`);
      return response.data.deleted;
    } catch (error) {
      console.error('Redis clearPattern error:', error);
      return 0;
    }
  }
}
