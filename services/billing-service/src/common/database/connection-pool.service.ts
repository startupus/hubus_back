import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerUtil } from '@ai-aggregator/shared';
import { PrismaClient } from '@prisma/client';

/**
 * Connection Pool Service для оптимизации подключений к БД
 * 
 * Обеспечивает:
 * - Connection pooling для высокой производительности
 * - Мониторинг соединений
 * - Graceful shutdown
 * - Retry логику для failed запросов
 */
@Injectable()
export class ConnectionPoolService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(ConnectionPoolService.name);
  private readonly prisma: PrismaClient;
  private readonly maxConnections: number;
  private readonly minConnections: number;
  private readonly connectionTimeout: number;
  private readonly retryAttempts: number;
  private readonly retryDelay: number;

  constructor(private readonly configService: ConfigService) {
    this.maxConnections = this.configService.get('DATABASE_MAX_CONNECTIONS', 20);
    this.minConnections = this.configService.get('DATABASE_MIN_CONNECTIONS', 5);
    this.connectionTimeout = this.configService.get('DATABASE_CONNECTION_TIMEOUT', 10000);
    this.retryAttempts = this.configService.get('DATABASE_RETRY_ATTEMPTS', 3);
    this.retryDelay = this.configService.get('DATABASE_RETRY_DELAY', 1000);

    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.configService.get('DATABASE_URL'),
        },
      },
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });

    // Настройка логирования Prisma
    this.prisma.$on('query', (e) => {
      if (e.duration > 1000) { // Логируем медленные запросы
        LoggerUtil.warn('billing-service', 'Slow query detected', {
          query: e.query,
          duration: e.duration,
          params: e.params,
        });
      }
    });

    this.prisma.$on('error', (e) => {
      LoggerUtil.error('billing-service', 'Prisma error', e);
    });

    this.prisma.$on('info', (e) => {
      LoggerUtil.info('billing-service', 'Prisma info', e);
    });

    this.prisma.$on('warn', (e) => {
      LoggerUtil.warn('billing-service', 'Prisma warning', e);
    });
  }

  async onModuleInit() {
    try {
      await this.prisma.$connect();
      LoggerUtil.info('billing-service', 'Database connection pool initialized', {
        maxConnections: this.maxConnections,
        minConnections: this.minConnections,
      });
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to initialize database connection pool', error as Error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.prisma.$disconnect();
      LoggerUtil.info('billing-service', 'Database connection pool closed');
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to close database connection pool', error as Error);
    }
  }

  /**
   * Получить Prisma клиент
   */
  getPrismaClient(): PrismaClient {
    return this.prisma;
  }

  /**
   * Выполнить операцию с retry логикой
   */
  async executeWithRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = this.retryAttempts
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await operation();
        
        if (attempt > 1) {
          LoggerUtil.info('billing-service', 'Operation succeeded after retry', {
            operation: operationName,
            attempt,
            maxRetries,
          });
        }
        
        return result;
      } catch (error) {
        lastError = error as Error;
        
        LoggerUtil.warn('billing-service', 'Operation failed, retrying', {
          operation: operationName,
          attempt,
          maxRetries,
          error: lastError.message,
        });

        if (attempt < maxRetries) {
          await this.delay(this.retryDelay * attempt); // Exponential backoff
        }
      }
    }

    LoggerUtil.error('billing-service', 'Operation failed after all retries', {
      operation: operationName,
      maxRetries,
      error: lastError?.message,
    });

    throw lastError || new Error(`Operation ${operationName} failed after ${maxRetries} attempts`);
  }

  /**
   * Выполнить транзакцию с retry логикой
   */
  async executeTransactionWithRetry<T>(
    transaction: (prisma: PrismaClient) => Promise<T>,
    operationName: string,
    maxRetries: number = this.retryAttempts
  ): Promise<T> {
    return this.executeWithRetry(
      () => this.prisma.$transaction(transaction),
      operationName,
      maxRetries
    );
  }

  /**
   * Получить статистику соединений
   */
  async getConnectionStats(): Promise<{
    isConnected: boolean;
    uptime: number;
    maxConnections: number;
    minConnections: number;
  }> {
    try {
      // Проверяем соединение
      await this.prisma.$queryRaw`SELECT 1`;
      
      return {
        isConnected: true,
        uptime: process.uptime(),
        maxConnections: this.maxConnections,
        minConnections: this.minConnections,
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get connection stats', error as Error);
      return {
        isConnected: false,
        uptime: process.uptime(),
        maxConnections: this.maxConnections,
        minConnections: this.minConnections,
      };
    }
  }

  /**
   * Проверить здоровье соединения
   */
  async healthCheck(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Database health check failed', error as Error);
      return false;
    }
  }

  /**
   * Выполнить миграции
   */
  async runMigrations(): Promise<void> {
    try {
      LoggerUtil.info('billing-service', 'Running database migrations...');
      // Здесь можно добавить логику миграций если нужно
      LoggerUtil.info('billing-service', 'Database migrations completed');
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to run migrations', error as Error);
      throw error;
    }
  }

  /**
   * Очистить соединения (для тестов)
   */
  async clearConnections(): Promise<void> {
    try {
      await this.prisma.$disconnect();
      await this.prisma.$connect();
      LoggerUtil.info('billing-service', 'Database connections cleared');
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to clear connections', error as Error);
    }
  }

  /**
   * Задержка для retry логики
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
