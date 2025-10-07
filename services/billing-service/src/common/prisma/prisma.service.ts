import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '../../../node_modules/.prisma/client';
import { LoggerUtil } from '@ai-aggregator/shared';

/**
 * Prisma Service for Billing Service
 * 
 * Handles database connections and operations for billing-related entities:
 * - User balances and transactions
 * - Usage events and billing reports
 * - Payment methods and invoices
 * - Pricing plans and discounts
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({
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
      LoggerUtil.info('billing-service', 'Database connected successfully');
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to connect to database', error as Error);
      throw error;
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
      LoggerUtil.info('billing-service', 'Database disconnected successfully');
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to disconnect from database', error as Error);
    }
  }
}
