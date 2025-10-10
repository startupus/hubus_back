import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class SimplePaymentService {
  private readonly logger = new Logger(SimplePaymentService.name);
  private static payments: any[] = [];

  /**
   * Создать платеж (заглушка)
   */
  async createPayment(data: {
    companyId: string;
    amount: number;
    currency?: string;
  }) {
    const paymentId = `stub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    LoggerUtil.info('payment-service', 'Payment creation (stub)', {
      companyId: data.companyId,
      amount: data.amount,
      paymentId
    });

    const payment = {
      id: paymentId,
      companyId: data.companyId,
      amount: data.amount,
      currency: data.currency || 'RUB',
      status: 'pending',
      createdAt: new Date().toISOString(),
      yookassaId: null,
      yookassaUrl: `https://yookassa.ru/payment/${paymentId}`,
      description: `Пополнение баланса на ${data.amount} ${data.currency || 'RUB'}`
    };

    SimplePaymentService.payments.push(payment);

    return {
      id: payment.id,
      status: payment.status,
      confirmationUrl: payment.yookassaUrl,
      amount: payment.amount.toString(),
      currency: payment.currency
    };
  }

  /**
   * Получить платеж по ID
   */
  async getPayment(paymentId: string) {
    const payment = SimplePaymentService.payments.find(p => p.id === paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }
    return payment;
  }

  /**
   * Получить платежи компании
   */
  async getCompanyPayments(companyId: string) {
    console.log('Getting payments for company:', companyId);
    console.log('All payments:', SimplePaymentService.payments);
    const filtered = SimplePaymentService.payments.filter(p => p.companyId === companyId);
    console.log('Filtered payments:', filtered);
    return filtered;
  }

  /**
   * Обработать webhook от ЮKassa (заглушка)
   */
  async processWebhook(webhookData: any) {
    LoggerUtil.info('payment-service', 'YooKassa webhook processing (stub)', {
      webhookData
    });

    const paymentId = webhookData?.object?.id || 'stub-payment-id';
    const payment = SimplePaymentService.payments.find(p => p.id === paymentId);
    
    if (payment) {
      payment.status = 'succeeded';
      payment.paidAt = new Date().toISOString();
    }

    return {
      success: true,
      paymentId: paymentId,
      status: 'succeeded',
      amount: webhookData?.object?.amount?.value || '0',
      currency: webhookData?.object?.amount?.currency || 'RUB'
    };
  }
}
