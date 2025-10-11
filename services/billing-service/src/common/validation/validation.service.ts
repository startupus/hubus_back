import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';
import { 
  InsufficientBalanceException, 
  InvalidAmountException, 
  InvalidCurrencyException,
  CompanyNotFoundException,
  PaymentMethodNotFoundException
} from '../../exceptions/billing.exceptions';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Validation Service для валидации данных биллинга
 * 
 * Обеспечивает:
 * - Валидацию сумм и валют
 * - Проверку балансов и лимитов
 * - Валидацию пользователей и способов оплаты
 * - Проверку бизнес-правил
 */
@Injectable()
export class ValidationService {
  private readonly logger = new Logger(ValidationService.name);
  private readonly supportedCurrencies = ['USD', 'EUR', 'RUB', 'BTC', 'ETH'];
  private readonly minAmount = 0.001; // Минимальная сумма для AI токенов
  private readonly maxAmount = 1000000;

  /**
   * Валидация суммы
   */
  validateAmount(amount: number, currency: string = 'USD'): void {
    if (!amount || amount <= 0) {
      throw new InvalidAmountException(amount);
    }

    if (amount < this.minAmount) {
      throw new InvalidAmountException(amount);
    }

    if (amount > this.maxAmount) {
      throw new InvalidAmountException(amount);
    }

    // Проверяем, что сумма не содержит слишком много знаков после запятой
    const decimalPlaces = (amount.toString().split('.')[1] || '').length;
    if (decimalPlaces > 4) {
      throw new InvalidAmountException(amount);
    }
  }

  /**
   * Валидация валюты
   */
  validateCurrency(currency: string): void {
    if (!currency || !this.supportedCurrencies.includes(currency.toUpperCase())) {
      throw new InvalidCurrencyException(currency);
    }
  }

  /**
   * Валидация компании
   */
  async validateCompany(companyId: string, prisma: any): Promise<void> {
    if (!companyId || typeof companyId !== 'string') {
      throw new CompanyNotFoundException(companyId);
    }

    try {
      const company = await prisma.company.findUnique({
        where: { id: companyId },
        select: { id: true, isActive: true }
      });

      if (!company) {
        throw new CompanyNotFoundException(companyId);
      }

      if (!company.isActive) {
        throw new CompanyNotFoundException(companyId);
      }
    } catch (error) {
      if (error instanceof CompanyNotFoundException) {
        throw error;
      }
      LoggerUtil.error('billing-service', 'Company validation error', error as Error, { companyId });
      throw new CompanyNotFoundException(companyId);
    }
  }

  /**
   * Валидация способа оплаты
   */
  async validatePaymentMethod(paymentMethodId: string, companyId: string, prisma: any): Promise<void> {
    if (!paymentMethodId) {
      return; // Способ оплаты не обязателен
    }

    try {
      const paymentMethod = await prisma.paymentMethod.findFirst({
        where: { 
          id: paymentMethodId,
          companyId: companyId
        },
        select: { id: true, isActive: true }
      });

      if (!paymentMethod) {
        throw new PaymentMethodNotFoundException(paymentMethodId);
      }
    } catch (error) {
      if (error instanceof PaymentMethodNotFoundException) {
        throw error;
      }
      LoggerUtil.error('billing-service', 'Payment method validation error', error as Error, { paymentMethodId, companyId });
      throw new PaymentMethodNotFoundException(paymentMethodId);
    }
  }

  /**
   * Валидация баланса для операции
   */
  validateBalanceForOperation(
    currentBalance: Decimal,
    amount: number,
    operation: 'add' | 'subtract',
    creditLimit?: Decimal
  ): void {
    const balance = currentBalance.toNumber();
    const credit = creditLimit?.toNumber() || 0;

    if (operation === 'subtract') {
      const newBalance = balance - amount;
      const minBalance = -credit;

      if (newBalance < minBalance) {
        throw new InsufficientBalanceException(amount, balance, 'USD');
      }
    }

    if (operation === 'add' && amount <= 0) {
      throw new InvalidAmountException(amount);
    }
  }

  /**
   * Валидация транзакции
   */
  validateTransaction(
    type: string,
    amount: number,
    currency: string,
    companyId: string
  ): void {
    this.validateAmount(amount, currency);
    this.validateCurrency(currency);

    if (!companyId || typeof companyId !== 'string') {
      throw new Error('Invalid company ID');
    }

    const validTypes = ['CREDIT', 'DEBIT', 'REFUND', 'CHARGEBACK'];
    if (!validTypes.includes(type)) {
      throw new Error(`Invalid transaction type: ${type}`);
    }
  }

  /**
   * Валидация использования
   */
  validateUsage(
    service: string,
    resource: string,
    quantity: number
  ): void {
    if (!service || typeof service !== 'string') {
      throw new Error('Invalid service');
    }

    if (!resource || typeof resource !== 'string') {
      throw new Error('Invalid resource');
    }

    if (!quantity || quantity <= 0 || quantity > 10000) {
      throw new Error('Invalid quantity');
    }
  }

  /**
   * Валидация отчета
   */
  validateReportPeriod(startDate: Date, endDate: Date): void {
    if (!startDate || !endDate) {
      throw new Error('Invalid date range');
    }

    if (startDate >= endDate) {
      throw new Error('Start date must be before end date');
    }

    const maxPeriod = 365 * 24 * 60 * 60 * 1000; // 1 год
    if (endDate.getTime() - startDate.getTime() > maxPeriod) {
      throw new Error('Report period too long');
    }
  }

  /**
   * Валидация метаданных
   */
  validateMetadata(metadata: any): void {
    if (metadata && typeof metadata !== 'object') {
      throw new Error('Invalid metadata format');
    }

    if (metadata && Object.keys(metadata).length > 50) {
      throw new Error('Too many metadata fields');
    }

    // Проверяем размер метаданных
    if (metadata && JSON.stringify(metadata).length > 10000) {
      throw new Error('Metadata too large');
    }
  }

  /**
   * Валидация ID
   */
  validateId(id: string, fieldName: string = 'ID'): void {
    if (!id || typeof id !== 'string') {
      throw new Error(`Invalid ${fieldName}`);
    }

    if (id.length < 1 || id.length > 100) {
      throw new Error(`Invalid ${fieldName} length`);
    }

    // Проверяем, что ID содержит только допустимые символы (включая UUID формат)
    if (!/^[a-zA-Z0-9_-]+$/.test(id) && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
      throw new Error(`Invalid ${fieldName} format`);
    }
  }

  /**
   * Валидация email
   */
  validateEmail(email: string): void {
    if (!email || typeof email !== 'string') {
      throw new Error('Invalid email');
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new Error('Invalid email format');
    }
  }

  /**
   * Валидация номера телефона
   */
  validatePhone(phone: string): void {
    if (!phone || typeof phone !== 'string') {
      throw new Error('Invalid phone');
    }

    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    if (!phoneRegex.test(phone)) {
      throw new Error('Invalid phone format');
    }
  }

  /**
   * Валидация IP адреса
   */
  validateIP(ip: string): void {
    if (!ip || typeof ip !== 'string') {
      throw new Error('Invalid IP');
    }

    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
    const ipv6Regex = /^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (!ipv4Regex.test(ip) && !ipv6Regex.test(ip)) {
      throw new Error('Invalid IP format');
    }
  }
}
