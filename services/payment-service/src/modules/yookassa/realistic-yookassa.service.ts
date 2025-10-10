import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerUtil } from '@ai-aggregator/shared';

@Injectable()
export class RealisticYooKassaService {
  private readonly logger = new Logger(RealisticYooKassaService.name);
  private readonly shopId: string;
  private readonly secretKey: string;
  private readonly isStubMode: boolean;

  constructor(private readonly configService: ConfigService) {
    this.shopId = this.configService.get('YOOKASSA_SHOP_ID') || 'stub_shop_id';
    this.secretKey = this.configService.get('YOOKASSA_SECRET_KEY') || 'stub_secret_key';
    this.isStubMode = !this.shopId || this.shopId === 'stub_shop_id';
    
    if (this.isStubMode) {
      this.logger.warn('YooKassa running in stub mode - no real payments will be processed');
    }
  }

  /**
   * Создать платеж в ЮKassa
   */
  async createPayment(data: {
    amount: number;
    currency: string;
    returnUrl: string;
    companyId: string;
    description?: string;
  }) {
    const paymentId = this.generatePaymentId();
    const confirmationUrl = this.generateConfirmationUrl(paymentId, data.returnUrl);
    
    LoggerUtil.info('payment-service', 'Creating YooKassa payment', {
      companyId: data.companyId,
      amount: data.amount,
      currency: data.currency,
      paymentId,
      isStubMode: this.isStubMode
    });

    if (this.isStubMode) {
      return this.createStubPayment(paymentId, data);
    }

    // В реальной реализации здесь будет вызов YooKassa API
    // const payment = await this.yooKassaClient.createPayment({
    //   amount: {
    //     value: data.amount.toFixed(2),
    //     currency: data.currency
    //   },
    //   confirmation: {
    //     type: 'redirect',
    //     return_url: data.returnUrl
    //   },
    //   description: data.description || `Пополнение баланса на ${data.amount} ${data.currency}`,
    //   metadata: {
    //     companyId: data.companyId
    //   }
    // });

    return this.createStubPayment(paymentId, data);
  }

  /**
   * Получить информацию о платеже
   */
  async getPayment(paymentId: string) {
    LoggerUtil.info('payment-service', 'Getting YooKassa payment info', {
      paymentId,
      isStubMode: this.isStubMode
    });

    if (this.isStubMode) {
      return this.getStubPayment(paymentId);
    }

    // В реальной реализации здесь будет вызов YooKassa API
    // return await this.yooKassaClient.getPayment(paymentId);

    return this.getStubPayment(paymentId);
  }

  /**
   * Отменить платеж
   */
  async cancelPayment(paymentId: string) {
    LoggerUtil.info('payment-service', 'Canceling YooKassa payment', {
      paymentId,
      isStubMode: this.isStubMode
    });

    if (this.isStubMode) {
      return this.cancelStubPayment(paymentId);
    }

    // В реальной реализации здесь будет вызов YooKassa API
    // return await this.yooKassaClient.cancelPayment(paymentId);

    return this.cancelStubPayment(paymentId);
  }

  /**
   * Проверить подпись webhook'а
   */
  async verifyWebhookSignature(webhookData: any, signature: string): Promise<boolean> {
    if (this.isStubMode) {
      // В режиме заглушки всегда возвращаем true
      return true;
    }

    // В реальной реализации здесь будет проверка подписи
    // const expectedSignature = this.calculateSignature(webhookData);
    // return signature === expectedSignature;

    return true;
  }

  /**
   * Получить настройки магазина
   */
  async getShopSettings() {
    return {
      shopId: this.shopId,
      isStubMode: this.isStubMode,
      supportedCurrencies: ['RUB', 'USD', 'EUR'],
      minAmount: 1,
      maxAmount: 1000000,
      commission: {
        percentage: 2.9,
        fixed: 15,
        currency: 'RUB'
      }
    };
  }

  // Private helper methods

  private generatePaymentId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `yk_${timestamp}_${random}`;
  }

  private generateConfirmationUrl(paymentId: string, returnUrl: string): string {
    if (this.isStubMode) {
      return `${returnUrl}?payment_id=${paymentId}&status=pending&stub=true`;
    }
    return `https://yookassa.ru/payment/${paymentId}`;
  }

  private createStubPayment(paymentId: string, data: any) {
    return {
      id: paymentId,
      status: 'pending',
      confirmation: {
        type: 'redirect',
        confirmation_url: this.generateConfirmationUrl(paymentId, data.returnUrl)
      },
      amount: {
        value: data.amount.toFixed(2),
        currency: data.currency
      },
      description: data.description || `Пополнение баланса на ${data.amount} ${data.currency}`,
      metadata: {
        companyId: data.companyId
      },
      created_at: new Date().toISOString(),
      paid: false,
      refundable: false,
      test: this.isStubMode
    };
  }

  private getStubPayment(paymentId: string) {
    // Имитируем различные статусы платежей
    const statuses = ['pending', 'succeeded', 'canceled', 'failed'];
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    return {
      id: paymentId,
      status: randomStatus,
      amount: {
        value: '1000.00',
        currency: 'RUB'
      },
      description: 'Пополнение баланса на 1000 RUB',
      created_at: new Date().toISOString(),
      paid: randomStatus === 'succeeded',
      refundable: randomStatus === 'succeeded',
      test: this.isStubMode
    };
  }

  private cancelStubPayment(paymentId: string) {
    return {
      id: paymentId,
      status: 'canceled',
      cancelled_at: new Date().toISOString(),
      test: this.isStubMode
    };
  }

  private calculateSignature(data: any): string {
    // В реальной реализации здесь будет расчет HMAC подписи
    const crypto = require('crypto');
    const stringData = JSON.stringify(data);
    return crypto
      .createHmac('sha256', this.secretKey)
      .update(stringData)
      .digest('hex');
  }
}
