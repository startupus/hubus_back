import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * Rate Limiting Guard для ограничения частоты запросов
 * 
 * Обеспечивает:
 * - Ограничение по IP адресу
 * - Ограничение по пользователю
 * - Разные лимиты для разных операций
 * - Временные окна для сброса счетчиков
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly requestCounts = new Map<string, { count: number; resetTime: number }>();
  private readonly defaultLimits = {
    'getBalance': { requests: 100, window: 60000 }, // 100 запросов в минуту
    'updateBalance': { requests: 10, window: 60000 }, // 10 запросов в минуту
    'createTransaction': { requests: 20, window: 60000 }, // 20 запросов в минуту
    'processPayment': { requests: 5, window: 60000 }, // 5 запросов в минуту
    'trackUsage': { requests: 1000, window: 60000 }, // 1000 запросов в минуту
    'calculateCost': { requests: 200, window: 60000 }, // 200 запросов в минуту
  };

  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const handler = context.getHandler();
    const className = context.getClass().name;

    // Получаем лимиты из декоратора или используем дефолтные
    const rateLimit = this.reflector.get<{ requests: number; window: number }>('rateLimit', handler) ||
                     this.getDefaultLimit(handler.name) ||
                     this.defaultLimits['getBalance'];

    // Определяем ключ для rate limiting
    const key = this.getRateLimitKey(request, handler.name);

    // Проверяем лимиты
    if (!this.checkRateLimit(key, rateLimit)) {
      LoggerUtil.warn('billing-service', 'Rate limit exceeded', {
        key,
        limit: rateLimit,
        ip: request.ip,
        companyId: request.user?.id || 'anonymous'
      });

      throw new HttpException(
        `Rate limit exceeded. Maximum ${rateLimit.requests} requests per ${rateLimit.window / 1000} seconds`,
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    return true;
  }

  /**
   * Получить ключ для rate limiting
   */
  private getRateLimitKey(request: any, operation: string): string {
    const ip = request.ip || 'unknown';
    const companyId = request.user?.id || request.body?.companyId || 'anonymous';
    
    // Для критических операций используем комбинированный ключ
    const criticalOperations = ['updateBalance', 'processPayment', 'createTransaction'];
    
    if (criticalOperations.includes(operation)) {
      return `${operation}:${companyId}:${ip}`;
    }
    
    // Для остальных операций используем только IP
    return `${operation}:${ip}`;
  }

  /**
   * Проверить лимиты
   */
  private checkRateLimit(key: string, limit: { requests: number; window: number }): boolean {
    const now = Date.now();
    const current = this.requestCounts.get(key);

    if (!current) {
      // Первый запрос
      this.requestCounts.set(key, { count: 1, resetTime: now + limit.window });
      return true;
    }

    if (now > current.resetTime) {
      // Время сброса истекло
      this.requestCounts.set(key, { count: 1, resetTime: now + limit.window });
      return true;
    }

    if (current.count >= limit.requests) {
      // Лимит превышен
      return false;
    }

    // Увеличиваем счетчик
    current.count++;
    this.requestCounts.set(key, current);
    return true;
  }

  /**
   * Получить дефолтный лимит для операции
   */
  private getDefaultLimit(operation: string): { requests: number; window: number } | null {
    return this.defaultLimits[operation] || null;
  }

  /**
   * Очистить истекшие записи
   */
  cleanup(): void {
    const now = Date.now();
    
    for (const [key, value] of this.requestCounts.entries()) {
      if (now > value.resetTime) {
        this.requestCounts.delete(key);
      }
    }
  }

  /**
   * Получить статистику rate limiting
   */
  getStats(): { totalKeys: number; activeKeys: number } {
    const now = Date.now();
    let activeKeys = 0;

    for (const [key, value] of this.requestCounts.entries()) {
      if (now <= value.resetTime) {
        activeKeys++;
      }
    }

    return {
      totalKeys: this.requestCounts.size,
      activeKeys
    };
  }
}
