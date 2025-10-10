import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { YooKassaService } from '../yookassa/yookassa.service';
import { CurrencyService } from '../currency/currency.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { Decimal } from '@prisma/client/runtime/library';

export interface CreatePaymentRequest {
  companyId: string;
  amount: number; // Сумма в рублях
  description?: string;
}

export interface CreatePaymentResponse {
  paymentId: string;
  paymentUrl: string;
  amount: number;
  amountUsd: number;
  status: string;
}

@Injectable()
export class PaymentService {
  private readonly MIN_AMOUNT = 100; // Минимальная сумма 100 рублей

  constructor(
    private readonly prisma: PrismaService,
    private readonly yooKassa: YooKassaService,
    private readonly currency: CurrencyService,
  ) {}

  /**
   * Создать платеж
   */
  async createPayment(data: CreatePaymentRequest): Promise<CreatePaymentResponse> {
    // Проверка минимальной суммы
    if (data.amount < this.MIN_AMOUNT) {
      throw new BadRequestException(`Минимальная сумма пополнения: ${this.MIN_AMOUNT} рублей`);
    }

    try {
      // Получаем курс валют
      const exchangeRate = await this.currency.getUsdToRubRate();
      const amountUsd = await this.currency.convertRubToUsd(data.amount);

      // Создаем запись в БД
      const payment = await this.prisma.payment.create({
        data: {
          companyId: data.companyId,
          amount: new Decimal(data.amount),
          amountUsd: new Decimal(amountUsd),
          currency: 'RUB',
          status: 'PENDING',
          description: data.description || 'Пополнение баланса',
          exchangeRate: new Decimal(exchangeRate),
        },
      });

      // Создаем платеж в ЮKassa
      const yooKassaPayment = await this.yooKassa.createPayment({
        amount: data.amount,
        returnUrl: `${process.env.FRONTEND_URL}/payments/success`,
        companyId: data.companyId,
      });

      // Обновляем запись с данными от ЮKassa
      const updatedPayment = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          yookassaId: yooKassaPayment.id,
          yookassaUrl: yooKassaPayment.confirmationUrl,
        },
      });

      LoggerUtil.info('payment-service', 'Payment created successfully', {
        paymentId: payment.id,
        companyId: data.companyId,
        amount: data.amount,
      });

      return {
        paymentId: payment.id,
        paymentUrl: yooKassaPayment.confirmationUrl!,
        amount: data.amount,
        amountUsd: amountUsd,
        status: 'PENDING',
      };
    } catch (error) {
      LoggerUtil.error('payment-service', 'Failed to create payment', error as Error);
      throw error;
    }
  }

  /**
   * Получить платеж по ID
   */
  async getPayment(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      throw new NotFoundException('Платеж не найден');
    }

    return payment;
  }

  /**
   * Получить платеж по YooKassa ID
   */
  async getPaymentByYooKassaId(yooKassaId: string) {
    const payment = await this.prisma.payment.findFirst({
      where: { yookassaId: yooKassaId },
    });

    return payment;
  }

  /**
   * Получить платежи компании
   */
  async getCompanyPayments(companyId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({
        where: { companyId },
      }),
    ]);

    return {
      payments,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Обновить статус платежа
   */
  async updatePaymentStatus(paymentId: string, status: string, yooKassaId?: string) {
    const updateData: any = { status };

    if (status === 'SUCCEEDED') {
      updateData.paidAt = new Date();
    }

    if (yooKassaId) {
      updateData.yookassaId = yooKassaId;
    }

    const payment = await this.prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
    });

    LoggerUtil.info('payment-service', 'Payment status updated', {
      paymentId,
      status,
    });

    return payment;
  }

  /**
   * Обработать успешный платеж
   */
  async processSuccessfulPayment(paymentId: string) {
    const payment = await this.getPayment(paymentId);

    if (payment.status !== 'PENDING') {
      throw new BadRequestException('Платеж уже обработан');
    }

    // Обновляем статус
    await this.updatePaymentStatus(paymentId, 'SUCCEEDED');

    // TODO: Здесь нужно будет интегрироваться с billing-service
    // для пополнения баланса компании
    LoggerUtil.info('payment-service', 'Payment processed successfully', {
      paymentId,
      companyId: payment.companyId,
      amount: payment.amount.toString(),
    });

    return payment;
  }
}
