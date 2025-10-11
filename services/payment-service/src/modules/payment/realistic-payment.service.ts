import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RabbitMQService } from '../../rabbitmq/rabbitmq.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class RealisticPaymentService {
  private readonly logger = new Logger(RealisticPaymentService.name);
  private isDatabaseAvailable = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly rabbitMQ: RabbitMQService,
  ) {
    // Проверяем доступность базы данных
    this.checkDatabaseAvailability();
  }

  private async checkDatabaseAvailability() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      this.isDatabaseAvailable = true;
      this.logger.log('Database is available, using real storage');
    } catch (error) {
      this.isDatabaseAvailable = false;
      this.logger.warn('Database is not available, using in-memory storage');
    }
  }

  /**
   * Создать платеж
   */
  async createPayment(data: {
    companyId: string;
    amount: number;
    currency?: string;
    description?: string;
  }) {
    const paymentId = this.generatePaymentId();
    const currency = data.currency || 'RUB';
    const amount = new Decimal(data.amount);
    
    LoggerUtil.info('payment-service', 'Creating payment', {
      companyId: data.companyId,
      amount: data.amount,
      currency,
      paymentId
    });

    const paymentData = {
      id: paymentId,
      companyId: data.companyId,
      amount,
      currency,
      status: 'PENDING' as const,
      description: data.description || `Пополнение баланса на ${data.amount} ${currency}`,
      yookassaId: null,
      yookassaUrl: `https://yookassa.ru/payment/${paymentId}`,
      commission: this.calculateCommission(data.amount),
      exchangeRate: currency === 'RUB' ? new Decimal(1) : await this.getExchangeRate('USD', 'RUB'),
      createdAt: new Date(),
      updatedAt: new Date(),
      paidAt: null
    };

    if (this.isDatabaseAvailable) {
      try {
        const payment = await this.prisma.payment.create({
          data: paymentData
        });

        // Отправляем сообщение в RabbitMQ о создании платежа
        await this.rabbitMQ.publishPaymentCreated({
          paymentId: payment.id,
          companyId: payment.companyId,
          amount: payment.amount.toNumber(),
          currency: payment.currency,
          yookassaId: payment.yookassaId,
          description: payment.description
        });

        return this.formatPaymentResponse(payment);
      } catch (error) {
        this.logger.error('Failed to save payment to database, using in-memory storage', error);
        this.isDatabaseAvailable = false;
      }
    }

    // Fallback to in-memory storage
    const result = this.createPaymentInMemory(paymentData);
    
    // Отправляем сообщение в RabbitMQ даже для in-memory платежей
    try {
      await this.rabbitMQ.publishPaymentCreated({
        paymentId: paymentData.id,
        companyId: paymentData.companyId,
        amount: paymentData.amount.toNumber(),
        currency: paymentData.currency,
        yookassaId: paymentData.yookassaId,
        description: paymentData.description
      });
    } catch (error) {
      this.logger.error('Failed to publish payment created message', error);
    }

    return result;
  }

  /**
   * Получить платеж по ID
   */
  async getPayment(paymentId: string, companyId: string) {
    if (this.isDatabaseAvailable) {
      try {
        const payment = await this.prisma.payment.findFirst({
          where: {
            id: paymentId,
            companyId: companyId
          }
        });

        if (!payment) {
          throw new Error('Payment not found');
        }

        return this.formatPaymentResponse(payment);
      } catch (error) {
        this.logger.error('Failed to get payment from database', error);
        this.isDatabaseAvailable = false;
      }
    }

    // Fallback to in-memory storage
    return this.getPaymentFromMemory(paymentId, companyId);
  }

  /**
   * Получить платежи компании
   */
  async getCompanyPayments(companyId: string, limit = 50, offset = 0) {
    if (this.isDatabaseAvailable) {
      try {
        const payments = await this.prisma.payment.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset
        });

        return payments.map(payment => this.formatPaymentResponse(payment));
      } catch (error) {
        this.logger.error('Failed to get payments from database', error);
        this.isDatabaseAvailable = false;
      }
    }

    // Fallback to in-memory storage
    return this.getCompanyPaymentsFromMemory(companyId, limit, offset);
  }

  /**
   * Обработать webhook от ЮKassa
   */
  async processWebhook(webhookData: any) {
    const paymentId = webhookData?.object?.id || webhookData?.payment_id;
    const status = this.mapYooKassaStatus(webhookData?.event || webhookData?.status);
    const amount = webhookData?.object?.amount?.value || webhookData?.amount;

    LoggerUtil.info('payment-service', 'Processing YooKassa webhook', {
      paymentId,
      status,
      amount
    });

    if (this.isDatabaseAvailable) {
      try {
        const payment = await this.prisma.payment.findFirst({
          where: { yookassaId: paymentId }
        });

        if (payment) {
          await this.prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: status as any,
              paidAt: status === 'SUCCEEDED' ? new Date() : null,
              updatedAt: new Date()
            }
          });

          // Если платеж успешен, отправляем сообщение в RabbitMQ для зачисления на баланс
          if (status === 'SUCCEEDED') {
            await this.rabbitMQ.publishPaymentSucceeded({
              paymentId: payment.id,
              companyId: payment.companyId,
              amount: payment.amount.toNumber(),
              currency: payment.currency,
              yookassaId: paymentId,
              paidAt: new Date().toISOString()
            });
          }

          return { success: true, paymentId, status, amount };
        }
      } catch (error) {
        this.logger.error('Failed to process webhook in database', error);
        this.isDatabaseAvailable = false;
      }
    }

    // Fallback to in-memory storage
    return this.processWebhookInMemory(paymentId, status, amount);
  }

  /**
   * Получить статистику платежей
   */
  async getPaymentStats(companyId: string) {
    if (this.isDatabaseAvailable) {
      try {
        const stats = await this.prisma.payment.aggregate({
          where: { companyId },
          _sum: { amount: true },
          _count: { id: true }
        });

        const successfulPayments = await this.prisma.payment.count({
          where: { 
            companyId,
            status: 'SUCCEEDED'
          }
        });

        return {
          totalAmount: stats._sum.amount || 0,
          totalCount: stats._count.id || 0,
          successfulCount: successfulPayments,
          successRate: stats._count.id > 0 ? (successfulPayments / stats._count.id) * 100 : 0
        };
      } catch (error) {
        this.logger.error('Failed to get payment stats from database', error);
        this.isDatabaseAvailable = false;
      }
    }

    // Fallback to in-memory storage
    return this.getPaymentStatsFromMemory(companyId);
  }

  // Private helper methods

  private generatePaymentId(): string {
    return `yk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateCommission(amount: number): Decimal {
    // Комиссия ЮKassa: 2.9% + 15 руб
    const percentage = new Decimal(0.029);
    const fixed = new Decimal(15);
    return new Decimal(amount).mul(percentage).add(fixed);
  }

  private async getExchangeRate(from: string, to: string): Promise<Decimal> {
    // Заглушка для получения курса валют
    // В реальной реализации здесь будет вызов API ЦБ РФ
    return new Decimal(95.5); // Примерный курс USD/RUB
  }

  private mapYooKassaStatus(event: string): string {
    const statusMap: Record<string, string> = {
      'payment.succeeded': 'SUCCEEDED',
      'payment.canceled': 'CANCELED',
      'payment.waiting_for_capture': 'PENDING',
      'payment.captured': 'SUCCEEDED',
      'payment.failed': 'FAILED'
    };
    return statusMap[event] || 'PENDING';
  }

  private formatPaymentResponse(payment: any) {
    return {
      id: payment.id,
      status: payment.status.toLowerCase(),
      confirmationUrl: payment.yookassaUrl,
      amount: payment.amount.toString(),
      currency: payment.currency,
      description: payment.description,
      createdAt: payment.createdAt,
      paidAt: payment.paidAt
    };
  }

  private async creditCompanyBalance(companyId: string, amount: Decimal) {
    // Заглушка для пополнения баланса в billing-service
    // В реальной реализации здесь будет HTTP вызов к billing-service
    // Теперь зачисление происходит через RabbitMQ в billing-service
    LoggerUtil.info('payment-service', 'Balance credit request sent via RabbitMQ', {
      companyId,
      amount: amount.toString()
    });
  }

  // In-memory storage fallback methods

  private static inMemoryPayments: any[] = [];

  private createPaymentInMemory(paymentData: any) {
    RealisticPaymentService.inMemoryPayments.push(paymentData);
    return this.formatPaymentResponse(paymentData);
  }

  private getPaymentFromMemory(paymentId: string, companyId: string) {
    const payment = RealisticPaymentService.inMemoryPayments.find(
      p => p.id === paymentId && p.companyId === companyId
    );
    if (!payment) {
      throw new Error('Payment not found');
    }
    return this.formatPaymentResponse(payment);
  }

  private getCompanyPaymentsFromMemory(companyId: string, limit: number, offset: number) {
    return RealisticPaymentService.inMemoryPayments
      .filter(p => p.companyId === companyId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(offset, offset + limit)
      .map(payment => this.formatPaymentResponse(payment));
  }

  private processWebhookInMemory(paymentId: string, status: string, amount: string) {
    const payment = RealisticPaymentService.inMemoryPayments.find(p => p.id === paymentId);
    if (payment) {
      payment.status = status;
      payment.paidAt = status === 'SUCCEEDED' ? new Date() : null;
      payment.updatedAt = new Date();
    }
    return { success: true, paymentId, status, amount };
  }

  private getPaymentStatsFromMemory(companyId: string) {
    const payments = RealisticPaymentService.inMemoryPayments.filter(p => p.companyId === companyId);
    const totalAmount = payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
    const successfulCount = payments.filter(p => p.status === 'SUCCEEDED').length;
    
    return {
      totalAmount,
      totalCount: payments.length,
      successfulCount,
      successRate: payments.length > 0 ? (successfulCount / payments.length) * 100 : 0
    };
  }
}
