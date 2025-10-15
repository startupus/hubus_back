import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';
import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../common/prisma/prisma.service';
import * as crypto from 'crypto';

@Injectable()
export class BalanceSecurityService {
  private readonly logger = new Logger(BalanceSecurityService.name);
  private processedOperations = new Map<string, { timestamp: number; amount: Decimal }>();

  constructor(private readonly prisma: PrismaService) {}

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

  /**
   * Безопасное списание средств
   */
  async secureDebitBalance(data: {
    companyId: string;
    amount: number;
    currency: string;
    description: string;
    metadata?: any;
  }): Promise<{ success: boolean; error?: string; transactionId?: string; balance?: number }> {
    try {
      // Проверка лимитов
      if (data.amount <= 0) {
        return {
          success: false,
          error: 'Сумма списания должна быть положительной'
        };
      }

      if (data.amount > 1000) {
        return {
          success: false,
          error: 'Превышен максимальный лимит списания'
        };
      }

      // Получаем текущий баланс компании
      const balance = await this.prisma.companyBalance.findUnique({
        where: { companyId: data.companyId }
      });

      if (!balance) {
        return {
          success: false,
          error: 'Баланс компании не найден'
        };
      }

      // Используем Decimal для точных вычислений
      // Убеждаемся, что currentBalance является Decimal объектом
      const currentBalance = balance.balance instanceof Decimal ? balance.balance : new Decimal(balance.balance);
      const amountToDebit = new Decimal(data.amount);
      
      // Отладочная информация
      LoggerUtil.info('billing-service', 'Balance calculation', {
        companyId: data.companyId,
        currentBalance: currentBalance.toString(),
        amountToDebit: amountToDebit.toString(),
        currentBalanceType: typeof currentBalance,
        isDecimal: currentBalance instanceof Decimal
      });
      
      const newBalance = currentBalance.minus(amountToDebit);

      // Отладочная информация
      LoggerUtil.debug('billing-service', 'Balance check debug', {
        companyId: data.companyId,
        currentBalance: currentBalance.toString(),
        amountToDebit: amountToDebit.toString(),
        newBalance: newBalance.toString(),
        isNegative: newBalance.lt(0)
      });

      if (newBalance.lt(0)) {
        LoggerUtil.error('billing-service', 'Insufficient balance detected', new Error('Insufficient balance'), {
          companyId: data.companyId,
          currentBalance: currentBalance.toString(),
          amountToDebit: amountToDebit.toString(),
          newBalance: newBalance.toString()
        });
        return {
          success: false,
          error: 'Недостаточно средств на балансе'
        };
      }

      // Регистрация операции
      const operationKey = this.generateOperationKey(data.companyId, Date.now().toString());
      this.registerOperation(operationKey, new Decimal(data.amount));

      // Создаем транзакцию списания
      const transaction = await this.prisma.transaction.create({
        data: {
          companyId: data.companyId,
          type: 'DEBIT',
          amount: new Decimal(data.amount),
          currency: data.currency,
          description: data.description,
          metadata: data.metadata || {},
          status: 'COMPLETED',
        }
      });

      // Обновляем баланс
      await this.prisma.companyBalance.update({
        where: { companyId: data.companyId },
        data: {
          balance: newBalance,
        }
      });

      LoggerUtil.info('billing-service', 'Secure debit operation completed', {
        companyId: data.companyId,
        amount: data.amount,
        newBalance,
        transactionId: transaction.id
      });

      return {
        success: true,
        transactionId: transaction.id,
        balance: newBalance.toNumber(),
      };

    } catch (error) {
      LoggerUtil.error('billing-service', 'Secure debit operation failed', error as Error, {
        companyId: data.companyId,
      });

      return {
        success: false,
        error: 'Внутренняя ошибка системы безопасности'
      };
    }
  }
}
