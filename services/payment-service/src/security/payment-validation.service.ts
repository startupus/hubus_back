import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';
import * as crypto from 'crypto';

@Injectable()
export class PaymentValidationService {
  private readonly logger = new Logger(PaymentValidationService.name);

  /**
   * Валидация суммы платежа
   */
  validatePaymentAmount(amount: number, currency: string = 'RUB'): { valid: boolean; error?: string } {
    const minAmount = 100; // Минимальная сумма в рублях
    const maxAmount = 1000000; // Максимальная сумма в рублях

    if (amount < minAmount) {
      return {
        valid: false,
        error: `Минимальная сумма платежа: ${minAmount} ${currency}`
      };
    }

    if (amount > maxAmount) {
      return {
        valid: false,
        error: `Максимальная сумма платежа: ${maxAmount} ${currency}`
      };
    }

    // Проверка на целое число (для рублей)
    if (currency === 'RUB' && !Number.isInteger(amount)) {
      return {
        valid: false,
        error: 'Сумма в рублях должна быть целым числом'
      };
    }

    return { valid: true };
  }

  /**
   * Валидация ID компании
   */
  validateCompanyId(companyId: string): { valid: boolean; error?: string } {
    if (!companyId || typeof companyId !== 'string') {
      return {
        valid: false,
        error: 'ID компании обязателен'
      };
    }

    // UUID валидация
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(companyId)) {
      return {
        valid: false,
        error: 'Неверный формат ID компании'
      };
    }

    return { valid: true };
  }

  /**
   * Валидация webhook от YooKassa
   */
  validateYooKassaWebhook(webhookData: any, signature?: string): { valid: boolean; error?: string } {
    if (!webhookData || typeof webhookData !== 'object') {
      return {
        valid: false,
        error: 'Неверный формат данных webhook'
      };
    }

    // Проверяем обязательные поля
    const requiredFields = ['event', 'object'];
    for (const field of requiredFields) {
      if (!webhookData[field]) {
        return {
          valid: false,
          error: `Отсутствует обязательное поле: ${field}`
        };
      }
    }

    // Проверяем структуру объекта платежа
    if (!webhookData.object.id || !webhookData.object.status) {
      return {
        valid: false,
        error: 'Неверная структура объекта платежа'
      };
    }

    // В production здесь должна быть проверка подписи
    if (signature) {
      const isValidSignature = this.verifyWebhookSignature(webhookData, signature);
      if (!isValidSignature) {
        return {
          valid: false,
          error: 'Неверная подпись webhook'
        };
      }
    }

    return { valid: true };
  }

  /**
   * Проверка подписи webhook (заглушка)
   */
  private verifyWebhookSignature(webhookData: any, signature: string): boolean {
    // В реальной реализации здесь должна быть проверка HMAC подписи
    // Пока возвращаем true для заглушки
    LoggerUtil.warn('payment-service', 'Webhook signature verification is disabled (stub mode)');
    return true;
  }

  /**
   * Генерация idempotency key
   */
  generateIdempotencyKey(paymentId: string, companyId: string): string {
    const data = `${paymentId}_${companyId}_${Date.now()}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Валидация idempotency key
   */
  validateIdempotencyKey(key: string): { valid: boolean; error?: string } {
    if (!key || typeof key !== 'string') {
      return {
        valid: false,
        error: 'Idempotency key обязателен'
      };
    }

    if (key.length !== 64) { // SHA256 hash length
      return {
        valid: false,
        error: 'Неверный формат idempotency key'
      };
    }

    return { valid: true };
  }

  /**
   * Проверка лимитов платежей для компании
   */
  async validatePaymentLimits(companyId: string, amount: number): Promise<{ valid: boolean; error?: string }> {
    // В реальной реализации здесь должна быть проверка:
    // - Дневной лимит платежей
    // - Месячный лимит платежей
    // - Количество платежей в час
    // - Подозрительная активность

    LoggerUtil.info('payment-service', 'Payment limits validation (stub)', {
      companyId,
      amount
    });

    // Заглушка - всегда разрешаем
    return { valid: true };
  }

  /**
   * Проверка безопасности платежа
   */
  async validatePaymentSecurity(paymentData: {
    companyId: string;
    amount: number;
    currency: string;
    ipAddress?: string;
    userAgent?: string;
  }): Promise<{ valid: boolean; error?: string; riskScore?: number }> {
    let riskScore = 0;

    // Валидация основных параметров
    const amountValidation = this.validatePaymentAmount(paymentData.amount, paymentData.currency);
    if (!amountValidation.valid) {
      return amountValidation;
    }

    const companyValidation = this.validateCompanyId(paymentData.companyId);
    if (!companyValidation.valid) {
      return companyValidation;
    }

    // Проверка лимитов
    const limitsValidation = await this.validatePaymentLimits(paymentData.companyId, paymentData.amount);
    if (!limitsValidation.valid) {
      return limitsValidation;
    }

    // Анализ рисков (заглушка)
    if (paymentData.amount > 100000) {
      riskScore += 20; // Высокая сумма
    }

    if (paymentData.currency !== 'RUB') {
      riskScore += 10; // Иностранная валюта
    }

    // В реальной реализации здесь должна быть проверка:
    // - IP адрес (геолокация, VPN, Tor)
    // - User Agent (подозрительные браузеры)
    // - Частота платежей
    // - Паттерны поведения

    const isHighRisk = riskScore > 50;
    const isValid = !isHighRisk;

    LoggerUtil.info('payment-service', 'Payment security validation', {
      companyId: paymentData.companyId,
      amount: paymentData.amount,
      riskScore,
      isValid
    });

    return {
      valid: isValid,
      error: isHighRisk ? 'Платеж заблокирован системой безопасности' : undefined,
      riskScore
    };
  }
}
