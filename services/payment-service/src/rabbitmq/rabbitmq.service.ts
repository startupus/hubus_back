import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class RabbitMQService {
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;

  constructor(private readonly configService: ConfigService) {}

  async connect() {
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

      LoggerUtil.info('payment-service', 'Connected to RabbitMQ');
    } catch (error) {
      LoggerUtil.error('payment-service', 'Failed to connect to RabbitMQ', error as Error);
      throw error;
    }
  }

  async disconnect() {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      LoggerUtil.info('payment-service', 'Disconnected from RabbitMQ');
    } catch (error) {
      LoggerUtil.error('payment-service', 'Error disconnecting from RabbitMQ', error as Error);
    }
  }

  /**
   * Отправить сообщение о создании платежа
   */
  async publishPaymentCreated(paymentData: {
    paymentId: string;
    companyId: string;
    amount: number;
    currency: string;
    yookassaId?: string;
    description?: string;
  }) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      const queue = 'payment.created';
      await this.channel.assertQueue(queue, { durable: true });

      const message = {
        type: 'payment.created',
        paymentId: paymentData.paymentId,
        companyId: paymentData.companyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        yookassaId: paymentData.yookassaId,
        description: paymentData.description,
        timestamp: new Date().toISOString(),
        idempotencyKey: `payment_${paymentData.paymentId}_${Date.now()}`
      };

      await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
        messageId: message.idempotencyKey
      });

      LoggerUtil.info('payment-service', 'Payment created message sent', {
        paymentId: paymentData.paymentId,
        companyId: paymentData.companyId
      });
    } catch (error) {
      LoggerUtil.error('payment-service', 'Failed to publish payment created message', error as Error);
      throw error;
    }
  }

  /**
   * Отправить сообщение об успешном платеже для зачисления на баланс
   */
  async publishPaymentSucceeded(paymentData: {
    paymentId: string;
    companyId: string;
    amount: number;
    currency: string;
    yookassaId: string;
    paidAt: string;
  }) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      const queue = 'payment.succeeded';
      await this.channel.assertQueue(queue, { durable: true });

      const message = {
        type: 'payment.succeeded',
        paymentId: paymentData.paymentId,
        companyId: paymentData.companyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        yookassaId: paymentData.yookassaId,
        paidAt: paymentData.paidAt,
        timestamp: new Date().toISOString(),
        idempotencyKey: `payment_succeeded_${paymentData.paymentId}_${paymentData.yookassaId}`
      };

      await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
        messageId: message.idempotencyKey
      });

      LoggerUtil.info('payment-service', 'Payment succeeded message sent', {
        paymentId: paymentData.paymentId,
        companyId: paymentData.companyId,
        amount: paymentData.amount
      });
    } catch (error) {
      LoggerUtil.error('payment-service', 'Failed to publish payment succeeded message', error as Error);
      throw error;
    }
  }

  /**
   * Отправить сообщение о неудачном платеже
   */
  async publishPaymentFailed(paymentData: {
    paymentId: string;
    companyId: string;
    amount: number;
    currency: string;
    yookassaId?: string;
    reason: string;
  }) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      const queue = 'payment.failed';
      await this.channel.assertQueue(queue, { durable: true });

      const message = {
        type: 'payment.failed',
        paymentId: paymentData.paymentId,
        companyId: paymentData.companyId,
        amount: paymentData.amount,
        currency: paymentData.currency,
        yookassaId: paymentData.yookassaId,
        reason: paymentData.reason,
        timestamp: new Date().toISOString(),
        idempotencyKey: `payment_failed_${paymentData.paymentId}_${Date.now()}`
      };

      await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
        persistent: true,
        messageId: message.idempotencyKey
      });

      LoggerUtil.info('payment-service', 'Payment failed message sent', {
        paymentId: paymentData.paymentId,
        companyId: paymentData.companyId,
        reason: paymentData.reason
      });
    } catch (error) {
      LoggerUtil.error('payment-service', 'Failed to publish payment failed message', error as Error);
      throw error;
    }
  }

  /**
   * Подписаться на сообщения о статусе зачисления баланса
   */
  async subscribeToBalanceUpdates(callback: (message: any) => Promise<void>) {
    if (!this.channel) {
      throw new Error('RabbitMQ channel not available');
    }

    try {
      const queue = 'balance.updated';
      await this.channel.assertQueue(queue, { durable: true });

      await this.channel.consume(queue, async (msg) => {
        if (msg) {
          try {
            const message = JSON.parse(msg.content.toString());
            await callback(message);
            this.channel!.ack(msg);
          } catch (error) {
            LoggerUtil.error('payment-service', 'Error processing balance update message', error as Error);
            this.channel!.nack(msg, false, false);
          }
        }
      });

      LoggerUtil.info('payment-service', 'Subscribed to balance updates');
    } catch (error) {
      LoggerUtil.error('payment-service', 'Failed to subscribe to balance updates', error as Error);
      throw error;
    }
  }
}
