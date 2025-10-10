import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly configService: ConfigService) {
    super({
      datasources: {
        db: {
          url: configService.get('PAYMENT_DATABASE_URL'),
        },
      },
      log: [
        { level: 'query', emit: 'event' },
        { level: 'error', emit: 'event' },
        { level: 'info', emit: 'event' },
        { level: 'warn', emit: 'event' },
      ],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      LoggerUtil.info('payment-service', 'Database connected successfully');
    } catch (error) {
      LoggerUtil.warn('payment-service', 'Failed to connect to database, working in stub mode', { error: error.message });
      // Не падаем, если база недоступна - работаем в режиме заглушки
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      LoggerUtil.info('payment-service', 'Database disconnected successfully');
    } catch (error) {
      LoggerUtil.error('payment-service', 'Error disconnecting from database', error as Error);
    }
  }
}
