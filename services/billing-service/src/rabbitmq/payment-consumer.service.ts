import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { LoggerUtil } from '@ai-aggregator/shared';
import { BillingService } from '../billing/billing.service';
import { BalanceSecurityService } from '../security/balance-security.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PaymentConsumerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PaymentConsumerService.name);
  private connection: any = null;
  private channel: any = null;
  private processedMessages = new Set<string>(); // Для идемпотентности

  constructor(
    private readonly configService: ConfigService,
    private readonly billingService: BillingService,
    private readonly balanceSecurity: BalanceSecurityService,
  ) {}

  async onModuleInit() {
    await this.connect();
    await this.setupConsumers();
  }

  async onModuleDestroy() {
    await this.disconnect();
  }

  private async connect() {
    try {
      const rabbitmqUrl = this.configService.get('RABBITMQ_URL', 'amqp://user:password@rabbitmq:5672');
      
      this.connection = await amqp.connect(rabbitmqUrl);
      this.channel = await this.connection.createChannel();

      // Обработка закрытия соединения
      this.connection.on('close', () => {
        this.logger.warn('RabbitMQ connection closed, attempting to reconnect...');
        setTimeout(() => this.connect(), 5000);
      });

      this.connection.on('error', (error) => {
        this.logger.error('RabbitMQ connection error', error);
      });

      LoggerUtil.info('billing-service', 'Connected to RabbitMQ for payment processing');
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to connect to RabbitMQ', error as Error);
      throw error;
    }
  }

  private async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      LoggerUtil.info('billing-service', 'Disconnected from RabbitMQ');
    } catch (error) {
      LoggerUtil.error('billing-service', 'Error disconnecting from RabbitMQ', error as Error);
    }
  }

  private async setupConsumers() {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    // Очередь для успешных платежей
    await this.channel.assertQueue('payment.succeeded', { durable: true });
    await this.channel.consume('payment.succeeded', async (msg) => {
      if (msg) {
        try {
          const message = JSON.parse(msg.content.toString());
          await this.handlePaymentSucceeded(message);
          this.channel!.ack(msg);
        } catch (error) {
          LoggerUtil.error('billing-service', 'Error processing payment succeeded message', error as Error);
          this.channel!.nack(msg, false, false);
        }
      }
    });

    // Очередь для неудачных платежей
    await this.channel.assertQueue('payment.failed', { durable: true });
    await this.channel.consume('payment.failed', async (msg) => {
      if (msg) {
        try {
          const message = JSON.parse(msg.content.toString());
          await this.handlePaymentFailed(message);
          this.channel!.ack(msg);
        } catch (error) {
          LoggerUtil.error('billing-service', 'Error processing payment failed message', error as Error);
          this.channel!.nack(msg, false, false);
        }
      }
    });

    LoggerUtil.info('billing-service', 'Payment consumers setup completed');
  }

  /**
   * Обработка успешного платежа
   */
  private async handlePaymentSucceeded(message: any) {
    const { paymentId, companyId, amount, currency, yookassaId, paidAt, idempotencyKey } = message;

    // Проверка идемпотентности
    if (this.processedMessages.has(idempotencyKey)) {
      LoggerUtil.warn('billing-service', 'Duplicate payment message ignored', { idempotencyKey });
      return;
    }

    try {
      LoggerUtil.info('billing-service', 'Processing successful payment', {
        paymentId,
        companyId,
        amount,
        currency,
        yookassaId
      });

      // Проверяем, не обработан ли уже этот платеж
      const existingTransaction = await this.billingService.getTransactionByPaymentId(paymentId);
      if (existingTransaction) {
        LoggerUtil.warn('billing-service', 'Payment already processed', { paymentId });
        this.processedMessages.add(idempotencyKey);
        return;
      }

      // Безопасное зачисление средств
      const secureCreditResult = await this.balanceSecurity.secureCreditBalance({
        companyId,
        amount: new Decimal(amount),
        paymentId,
        yookassaId,
        description: `Payment received via YooKassa (${yookassaId})`
      });

      if (!secureCreditResult.success) {
        throw new Error(secureCreditResult.error || 'Secure credit operation failed');
      }

      // Создаем транзакцию зачисления
      const transactionResult = await this.billingService.createTransaction({
        companyId,
        type: 'CREDIT' as any,
        amount: parseFloat(amount.toString()),
        currency,
        description: `Payment received via YooKassa (${yookassaId})`,
        metadata: {
          paymentId,
          yookassaId,
          paidAt,
          source: 'payment-service',
          securityValidated: true
        }
      });

      if (!transactionResult.success || !transactionResult.transaction) {
        throw new Error('Failed to create transaction');
      }

      // Обновляем баланс
      const balanceResult = await this.billingService.updateBalance({
        companyId,
        amount: parseFloat(amount.toString()),
        operation: 'add',
        description: 'Payment received',
        reference: transactionResult.transaction.id
      });

      if (!balanceResult.success) {
        throw new Error('Failed to update balance');
      }

      // Отправляем подтверждение обратно в payment-service
      await this.publishBalanceUpdated({
        paymentId,
        companyId,
        amount,
        currency,
        transactionId: transactionResult.transaction.id,
        newBalance: balanceResult.balance?.balance || new Decimal(0)
      });

      // Помечаем сообщение как обработанное
      this.processedMessages.add(idempotencyKey);

      LoggerUtil.info('billing-service', 'Payment processed successfully', {
        paymentId,
        companyId,
        amount,
        transactionId: transactionResult.transaction.id
      });

    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to process payment', error as Error, {
        paymentId,
        companyId,
        amount
      });
      throw error;
    }
  }

  /**
   * Обработка неудачного платежа
   */
  private async handlePaymentFailed(message: any) {
    const { paymentId, companyId, amount, currency, reason, idempotencyKey } = message;

    // Проверка идемпотентности
    if (this.processedMessages.has(idempotencyKey)) {
      LoggerUtil.warn('billing-service', 'Duplicate payment failed message ignored', { idempotencyKey });
      return;
    }

    try {
      LoggerUtil.info('billing-service', 'Processing failed payment', {
        paymentId,
        companyId,
        amount,
        reason
      });

      // Логируем неудачный платеж (можно создать отдельную таблицу для failed payments)
      // Пока просто логируем

      this.processedMessages.add(idempotencyKey);

      LoggerUtil.info('billing-service', 'Failed payment logged', {
        paymentId,
        companyId,
        reason
      });

    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to process payment failure', error as Error, {
        paymentId,
        companyId,
        reason
      });
    }
  }

  /**
   * Отправка подтверждения об обновлении баланса
   */
  private async publishBalanceUpdated(data: {
    paymentId: string;
    companyId: string;
    amount: number;
    currency: string;
    transactionId: string;
    newBalance: Decimal;
  }) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      const queue = 'balance.updated';
      await this.channel.assertQueue(queue, { durable: true });

      const message = {
        type: 'balance.updated',
        paymentId: data.paymentId,
        companyId: data.companyId,
        amount: data.amount,
        currency: data.currency,
        transactionId: data.transactionId,
        newBalance: data.newBalance.toString(),
        timestamp: new Date().toISOString()
      };

      await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true
      });

      LoggerUtil.info('billing-service', 'Balance updated message sent', {
        paymentId: data.paymentId,
        companyId: data.companyId,
        newBalance: data.newBalance.toString()
      });
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to publish balance updated message', error as Error);
    }
  }
}
