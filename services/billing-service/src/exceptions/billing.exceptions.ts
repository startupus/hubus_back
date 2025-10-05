import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * Базовое исключение для биллинга
 */
export class BillingException extends HttpException {
  constructor(message: string, status: HttpStatus = HttpStatus.BAD_REQUEST) {
    super(message, status);
  }
}

/**
 * Исключение при недостаточном балансе
 */
export class InsufficientBalanceException extends BillingException {
  constructor(required: number, available: number, currency: string = 'USD') {
    super(
      `Insufficient balance: required ${required} ${currency}, available ${available} ${currency}`,
      HttpStatus.PAYMENT_REQUIRED
    );
  }
}

/**
 * Исключение при превышении кредитного лимита
 */
export class CreditLimitExceededException extends BillingException {
  constructor(amount: number, limit: number, currency: string = 'USD') {
    super(
      `Credit limit exceeded: attempted ${amount} ${currency}, limit ${limit} ${currency}`,
      HttpStatus.PAYMENT_REQUIRED
    );
  }
}

/**
 * Исключение при неверной валюте
 */
export class InvalidCurrencyException extends BillingException {
  constructor(currency: string) {
    super(`Invalid currency: ${currency}`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Исключение при неверной сумме
 */
export class InvalidAmountException extends BillingException {
  constructor(amount: number) {
    super(`Invalid amount: ${amount}. Amount must be positive`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Исключение при неверном типе транзакции
 */
export class InvalidTransactionTypeException extends BillingException {
  constructor(type: string) {
    super(`Invalid transaction type: ${type}`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Исключение при неверном статусе транзакции
 */
export class InvalidTransactionStatusException extends BillingException {
  constructor(status: string) {
    super(`Invalid transaction status: ${status}`, HttpStatus.BAD_REQUEST);
  }
}

/**
 * Исключение при неверном пользователе
 */
export class UserNotFoundException extends BillingException {
  constructor(userId: string) {
    super(`User not found: ${userId}`, HttpStatus.NOT_FOUND);
  }
}

/**
 * Исключение при неверном способе оплаты
 */
export class PaymentMethodNotFoundException extends BillingException {
  constructor(paymentMethodId: string) {
    super(`Payment method not found: ${paymentMethodId}`, HttpStatus.NOT_FOUND);
  }
}

/**
 * Исключение при неверном провайдере платежей
 */
export class PaymentProviderException extends BillingException {
  constructor(provider: string, message: string) {
    super(`Payment provider error (${provider}): ${message}`, HttpStatus.BAD_GATEWAY);
  }
}

/**
 * Исключение при неверном расчете стоимости
 */
export class CostCalculationException extends BillingException {
  constructor(service: string, resource: string, message: string) {
    super(`Cost calculation error for ${service}/${resource}: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}

/**
 * Исключение при неверном отчете
 */
export class ReportGenerationException extends BillingException {
  constructor(userId: string, message: string) {
    super(`Report generation error for user ${userId}: ${message}`, HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
