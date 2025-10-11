import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';
import { Decimal } from '@prisma/client/runtime/library';
import * as crypto from 'crypto';

@Injectable()
export class BalanceSecurityService {
  private readonly logger = new Logger(BalanceSecurityService.name);
  private processedOperations = new Map<string, { timestamp: number; amount: Decimal }>();

  /**
   * Валидация операции зачисления
   */
  validateCreditOperation(data: {
    companyId: string;
    amount: Decimal;
    paymentId: string;
    yookassaId: string;
  }): { valid: boolean; error?: string } {
    // Валидация ID компании
    if (!data.companyId || typeof data.companyId !== 'string') {
      return {
        valid: false,
        error: 'ID компании обязателен'
      };
    }

    // Валидация суммы
    if (!data.amount || data.amount.lte(0)) {
      return {
        valid: false,
        error: 'Сумма зачисления должна быть больше нуля'
      };
    }

    // Валидация ID платежа
    if (!data.paymentId || typeof data.paymentId !== 'string') {
      return {
        valid: false,
        error: 'ID платежа обязателен'
      };
    }

    // Валидация ID YooKassa
    if (!data.yookassaId || typeof data.yookassaId !== 'string') {
      return {
        valid: false,
        error: 'ID YooKassa обязателен'
      };
    }

    return { valid: true };
  }

  /**
   * Проверка на дублирование операции
   */
  checkDuplicateOperation(operationKey: string): { isDuplicate: boolean; error?: string } {
    const existing = this.processedOperations.get(operationKey);
    
    if (existing) {
      const timeDiff = Date.now() - existing.timestamp;
      const isRecent = timeDiff < 300000; // 5 минут

      if (isRecent) {
        return {
          isDuplicate: true,
          error: 'Операция уже была обработана недавно'
        };
      }
    }

    return { isDuplicate: false };
  }

  /**
   * Регистрация операции
   */
  registerOperation(operationKey: string, amount: Decimal): void {
    this.processedOperations.set(operationKey, {
      timestamp: Date.now(),
      amount
    });

    // Очистка старых записей (старше 1 часа)
    const oneHourAgo = Date.now() - 3600000;
    for (const [key, value] of this.processedOperations.entries()) {
      if (value.timestamp < oneHourAgo) {
        this.processedOperations.delete(key);
      }
    }
  }

  /**
   * Генерация ключа операции для идемпотентности
   */
  generateOperationKey(paymentId: string, yookassaId: string): string {
    const data = `${paymentId}_${yookassaId}`;
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Проверка лимитов зачисления
   */
  async validateCreditLimits(companyId: string, amount: Decimal): Promise<{ valid: boolean; error?: string }> {
    // В реальной реализации здесь должна быть проверка:
    // - Максимальная сумма зачисления за день
    // - Максимальная сумма зачисления за месяц
    // - Лимиты для новых компаний
    // - Подозрительные паттерны

    const amountNumber = amount.toNumber();

    // Максимальная сумма зачисления за раз
    const maxSingleCredit = 500000; // 500,000 рублей
    if (amountNumber > maxSingleCredit) {
      return {
        valid: false,
        error: `Превышен лимит зачисления за раз: ${maxSingleCredit} рублей`
      };
    }

    LoggerUtil.info('billing-service', 'Credit limits validation (stub)', {
      companyId,
      amount: amountNumber
    });

    return { valid: true };
  }

  /**
   * Аудит операции зачисления
   */
  async auditCreditOperation(data: {
    companyId: string;
    amount: Decimal;
    paymentId: string;
    yookassaId: string;
    transactionId: string;
    operator: string;
  }): Promise<void> {
    const auditData = {
      type: 'balance_credit',
      companyId: data.companyId,
      amount: data.amount.toString(),
      paymentId: data.paymentId,
      yookassaId: data.yookassaId,
      transactionId: data.transactionId,
      operator: data.operator,
      timestamp: new Date().toISOString(),
      ipAddress: 'system', // В реальной реализации получать из контекста
      userAgent: 'payment-service'
    };

    LoggerUtil.info('billing-service', 'Balance credit operation audited', auditData);

    // В реальной реализации здесь должно быть:
    // - Сохранение в таблицу аудита
    // - Отправка в систему мониторинга
    // - Уведомления о подозрительных операциях
  }

  /**
   * Проверка безопасности зачисления
   */
  async validateCreditSecurity(data: {
    companyId: string;
    amount: Decimal;
    paymentId: string;
    yookassaId: string;
  }): Promise<{ valid: boolean; error?: string; riskScore?: number }> {
    let riskScore = 0;

    // Базовая валидация
    const validation = this.validateCreditOperation(data);
    if (!validation.valid) {
      return validation;
    }

    // Проверка на дублирование
    const operationKey = this.generateOperationKey(data.paymentId, data.yookassaId);
    const duplicateCheck = this.checkDuplicateOperation(operationKey);
    if (duplicateCheck.isDuplicate) {
      return {
        valid: false,
        error: duplicateCheck.error
      };
    }

    // Проверка лимитов
    const limitsValidation = await this.validateCreditLimits(data.companyId, data.amount);
    if (!limitsValidation.valid) {
      return limitsValidation;
    }

    // Анализ рисков
    const amountNumber = data.amount.toNumber();
    
    if (amountNumber > 100000) {
      riskScore += 15; // Высокая сумма
    }

    if (amountNumber > 500000) {
      riskScore += 25; // Очень высокая сумма
    }

    // В реальной реализации здесь должна быть проверка:
    // - Частота зачислений для компании
    // - Паттерны платежей
    // - Геолокация платежа
    // - Время операции (ночные часы)

    const isHighRisk = riskScore > 30;
    const isValid = !isHighRisk;

    LoggerUtil.info('billing-service', 'Credit security validation', {
      companyId: data.companyId,
      amount: amountNumber,
      paymentId: data.paymentId,
      riskScore,
      isValid
    });

    return {
      valid: isValid,
      error: isHighRisk ? 'Операция зачисления заблокирована системой безопасности' : undefined,
      riskScore
    };
  }

  /**
   * Безопасное зачисление средств
   */
  async secureCreditBalance(data: {
    companyId: string;
    amount: Decimal;
    paymentId: string;
    yookassaId: string;
    description: string;
  }): Promise<{ success: boolean; error?: string; transactionId?: string }> {
    try {
      // Проверка безопасности
      const securityValidation = await this.validateCreditSecurity(data);
      if (!securityValidation.valid) {
        return {
          success: false,
          error: securityValidation.error
        };
      }

      // Регистрация операции
      const operationKey = this.generateOperationKey(data.paymentId, data.yookassaId);
      this.registerOperation(operationKey, data.amount);

      // Аудит операции
      await this.auditCreditOperation({
        ...data,
        transactionId: 'pending', // Будет обновлен после создания транзакции
        operator: 'payment-service'
      });

      LoggerUtil.info('billing-service', 'Secure credit operation approved', {
        companyId: data.companyId,
        amount: data.amount.toString(),
        paymentId: data.paymentId,
        riskScore: securityValidation.riskScore
      });

      return {
        success: true,
        transactionId: 'pending' // Будет обновлен вызывающим кодом
      };

    } catch (error) {
      LoggerUtil.error('billing-service', 'Secure credit operation failed', error as Error, {
        companyId: data.companyId,
        paymentId: data.paymentId
      });

      return {
        success: false,
        error: 'Внутренняя ошибка системы безопасности'
      };
    }
  }
}
