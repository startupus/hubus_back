import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';
import { RabbitMQService } from '@ai-aggregator/shared';
import { BillingService } from './billing.service';
import { PrismaService } from '../common/prisma/prisma.service';

/**
 * Critical Operations Service для биллинга
 * 
 * Обрабатывает критические операции через RabbitMQ:
 * - Списание средств с баланса
 * - Создание транзакций
 * - Обработка платежей
 * - Синхронизация данных
 */
@Injectable()
export class CriticalOperationsService {
  private readonly logger = new Logger(CriticalOperationsService.name);

  constructor(
    private readonly rabbitmqService: RabbitMQService,
    private readonly billingService: BillingService,
    private readonly prisma: PrismaService
  ) {}

  /**
   * Инициализация обработчиков критических операций
   */
  async initializeCriticalHandlers(): Promise<void> {
    try {
      // Обработчик списания средств
      await this.rabbitmqService.subscribeToCriticalMessages(
        'billing.debit.balance',
        this.handleDebitBalance.bind(this)
      );

      // Обработчик создания транзакций
      await this.rabbitmqService.subscribeToCriticalMessages(
        'billing.create.transaction',
        this.handleCreateTransaction.bind(this)
      );

      // Обработчик обработки платежей
      await this.rabbitmqService.subscribeToCriticalMessages(
        'billing.process.payment',
        this.handleProcessPayment.bind(this)
      );

      // Обработчик синхронизации данных
      await this.rabbitmqService.subscribeToCriticalMessages(
        'billing.sync.data',
        this.handleSyncData.bind(this)
      );

      LoggerUtil.info('billing-service', 'Critical operations handlers initialized');
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to initialize critical handlers', error as Error);
      throw error;
    }
  }

  /**
   * Критическое списание средств с баланса
   */
  async publishDebitBalance(data: {
    userId: string;
    amount: number;
    currency: string;
    reason: string;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      LoggerUtil.info('billing-service', 'Publishing debit balance request', { 
        userId: data.userId, 
        amount: data.amount 
      });

      return await this.rabbitmqService.publishCriticalMessage(
        'billing.debit.balance',
        {
          operation: 'debit_balance',
          ...data,
          timestamp: new Date().toISOString()
        },
        {
          persistent: true,
          priority: 10, // Высокий приоритет для списания
          expiration: '300000' // 5 минут TTL
        }
      );
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to publish debit balance', error as Error, { 
        userId: data.userId 
      });
      return false;
    }
  }

  /**
   * Критическое создание транзакции
   */
  async publishCreateTransaction(data: {
    userId: string;
    type: 'DEBIT' | 'CREDIT';
    amount: number;
    currency: string;
    description: string;
    provider?: string;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      LoggerUtil.info('billing-service', 'Publishing create transaction request', { 
        userId: data.userId, 
        type: data.type,
        amount: data.amount 
      });

      return await this.rabbitmqService.publishCriticalMessage(
        'billing.create.transaction',
        {
          operation: 'create_transaction',
          ...data,
          timestamp: new Date().toISOString()
        },
        {
          persistent: true,
          priority: 8, // Высокий приоритет для транзакций
          expiration: '600000' // 10 минут TTL
        }
      );
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to publish create transaction', error as Error, { 
        userId: data.userId 
      });
      return false;
    }
  }

  /**
   * Критическая обработка платежа
   */
  async publishProcessPayment(data: {
    userId: string;
    paymentMethod: string;
    amount: number;
    currency: string;
    paymentId: string;
    metadata?: Record<string, any>;
  }): Promise<boolean> {
    try {
      LoggerUtil.info('billing-service', 'Publishing process payment request', { 
        userId: data.userId, 
        paymentId: data.paymentId,
        amount: data.amount 
      });

      return await this.rabbitmqService.publishCriticalMessage(
        'billing.process.payment',
        {
          operation: 'process_payment',
          ...data,
          timestamp: new Date().toISOString()
        },
        {
          persistent: true,
          priority: 9, // Очень высокий приоритет для платежей
          expiration: '900000' // 15 минут TTL
        }
      );
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to publish process payment', error as Error, { 
        userId: data.userId 
      });
      return false;
    }
  }

  /**
   * Обработчик списания средств
   */
  private async handleDebitBalance(message: any): Promise<boolean> {
    try {
      LoggerUtil.info('billing-service', 'Processing debit balance', { 
        messageId: message.messageId,
        userId: message.userId,
        amount: message.amount
      });

      // Проверяем баланс пользователя
      const balance = await this.prisma.userBalance.findUnique({
        where: { userId: message.userId }
      });

      if (!balance) {
        LoggerUtil.error('billing-service', 'User balance not found', null, { userId: message.userId });
        return false;
      }

      if (balance.balance < message.amount) {
        LoggerUtil.error('billing-service', 'Insufficient balance', null, { 
          userId: message.userId,
          currentBalance: balance.balance,
          requestedAmount: message.amount
        });
        return false;
      }

      // Выполняем списание
      const updatedBalance = await this.prisma.userBalance.update({
        where: { userId: message.userId },
        data: {
          balance: balance.balance - message.amount
        }
      });

      // Создаем транзакцию
      await this.prisma.transaction.create({
        data: {
          userId: message.userId,
          type: 'DEBIT',
          amount: message.amount,
          currency: message.currency,
          description: message.reason,
          metadata: message.metadata || {}
        }
      });

      LoggerUtil.info('billing-service', 'Debit balance processed successfully', { 
        messageId: message.messageId,
        userId: message.userId,
        newBalance: updatedBalance.balance
      });

      return true;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to process debit balance', error as Error, { 
        messageId: message.messageId,
        userId: message.userId
      });
      return false;
    }
  }

  /**
   * Обработчик создания транзакции
   */
  private async handleCreateTransaction(message: any): Promise<boolean> {
    try {
      LoggerUtil.info('billing-service', 'Processing create transaction', { 
        messageId: message.messageId,
        userId: message.userId,
        type: message.type,
        amount: message.amount
      });

      // Создаем транзакцию
      const transaction = await this.prisma.transaction.create({
        data: {
          userId: message.userId,
          type: message.type,
          amount: message.amount,
          currency: message.currency,
          description: message.description,
          provider: message.provider,
          metadata: message.metadata || {}
        }
      });

      LoggerUtil.info('billing-service', 'Transaction created successfully', { 
        messageId: message.messageId,
        transactionId: transaction.id,
        userId: message.userId
      });

      return true;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to create transaction', error as Error, { 
        messageId: message.messageId,
        userId: message.userId
      });
      return false;
  }

  /**
   * Обработчик обработки платежа
   */
  private async handleProcessPayment(message: any): Promise<boolean> {
    try {
      LoggerUtil.info('billing-service', 'Processing payment', { 
        messageId: message.messageId,
        userId: message.userId,
        paymentId: message.paymentId,
        amount: message.amount
      });

      // Проверяем, не обработан ли уже этот платеж
      const existingTransaction = await this.prisma.transaction.findFirst({
        where: {
          metadata: {
            path: ['paymentId'],
            equals: message.paymentId
          }
        }
      });

      if (existingTransaction) {
        LoggerUtil.warn('billing-service', 'Payment already processed', { 
          messageId: message.messageId,
          paymentId: message.paymentId
        });
        return true; // Уже обработан
      }

      // Пополняем баланс
      const balance = await this.prisma.userBalance.findUnique({
        where: { userId: message.userId }
      });

      if (!balance) {
        LoggerUtil.error('billing-service', 'User balance not found for payment', null, { 
          userId: message.userId 
        });
        return false;
      }

      const updatedBalance = await this.prisma.userBalance.update({
        where: { userId: message.userId },
        data: {
          balance: balance.balance + message.amount
        }
      });

      // Создаем транзакцию
      await this.prisma.transaction.create({
        data: {
          userId: message.userId,
          type: 'CREDIT',
          amount: message.amount,
          currency: message.currency,
          description: `Payment via ${message.paymentMethod}`,
          metadata: {
            paymentId: message.paymentId,
            paymentMethod: message.paymentMethod,
            ...message.metadata
          }
        }
      });

      LoggerUtil.info('billing-service', 'Payment processed successfully', { 
        messageId: message.messageId,
        userId: message.userId,
        newBalance: updatedBalance.balance
      });

      return true;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to process payment', error as Error, { 
        messageId: message.messageId,
        userId: message.userId
      });
      return false;
    }
  }

  /**
   * Обработчик синхронизации данных
   */
  private async handleSyncData(message: any): Promise<boolean> {
    try {
      LoggerUtil.info('billing-service', 'Processing data sync', { 
        messageId: message.messageId,
        operation: message.operation
      });

      // Здесь можно добавить логику синхронизации данных
      // Например, синхронизация с внешними системами, обновление кэша и т.д.

      LoggerUtil.info('billing-service', 'Data sync completed', { 
        messageId: message.messageId
      });

      return true;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to sync data', error as Error, { 
        messageId: message.messageId
      });
      return false;
    }
  }
}
