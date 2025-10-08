"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportGenerationException = exports.CostCalculationException = exports.PaymentProviderException = exports.PaymentMethodNotFoundException = exports.UserNotFoundException = exports.InvalidTransactionStatusException = exports.InvalidTransactionTypeException = exports.InvalidAmountException = exports.InvalidCurrencyException = exports.CreditLimitExceededException = exports.InsufficientBalanceException = exports.BillingException = void 0;
const common_1 = require("@nestjs/common");
class BillingException extends common_1.HttpException {
    constructor(message, status = common_1.HttpStatus.BAD_REQUEST) {
        super(message, status);
    }
}
exports.BillingException = BillingException;
class InsufficientBalanceException extends BillingException {
    constructor(required, available, currency = 'USD') {
        super(`Insufficient balance: required ${required} ${currency}, available ${available} ${currency}`, common_1.HttpStatus.PAYMENT_REQUIRED);
    }
}
exports.InsufficientBalanceException = InsufficientBalanceException;
class CreditLimitExceededException extends BillingException {
    constructor(amount, limit, currency = 'USD') {
        super(`Credit limit exceeded: attempted ${amount} ${currency}, limit ${limit} ${currency}`, common_1.HttpStatus.PAYMENT_REQUIRED);
    }
}
exports.CreditLimitExceededException = CreditLimitExceededException;
class InvalidCurrencyException extends BillingException {
    constructor(currency) {
        super(`Invalid currency: ${currency}`, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InvalidCurrencyException = InvalidCurrencyException;
class InvalidAmountException extends BillingException {
    constructor(amount) {
        super(`Invalid amount: ${amount}. Amount must be positive`, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InvalidAmountException = InvalidAmountException;
class InvalidTransactionTypeException extends BillingException {
    constructor(type) {
        super(`Invalid transaction type: ${type}`, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InvalidTransactionTypeException = InvalidTransactionTypeException;
class InvalidTransactionStatusException extends BillingException {
    constructor(status) {
        super(`Invalid transaction status: ${status}`, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InvalidTransactionStatusException = InvalidTransactionStatusException;
class UserNotFoundException extends BillingException {
    constructor(userId) {
        super(`User not found: ${userId}`, common_1.HttpStatus.NOT_FOUND);
    }
}
exports.UserNotFoundException = UserNotFoundException;
class PaymentMethodNotFoundException extends BillingException {
    constructor(paymentMethodId) {
        super(`Payment method not found: ${paymentMethodId}`, common_1.HttpStatus.NOT_FOUND);
    }
}
exports.PaymentMethodNotFoundException = PaymentMethodNotFoundException;
class PaymentProviderException extends BillingException {
    constructor(provider, message) {
        super(`Payment provider error (${provider}): ${message}`, common_1.HttpStatus.BAD_GATEWAY);
    }
}
exports.PaymentProviderException = PaymentProviderException;
class CostCalculationException extends BillingException {
    constructor(service, resource, message) {
        super(`Cost calculation error for ${service}/${resource}: ${message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.CostCalculationException = CostCalculationException;
class ReportGenerationException extends BillingException {
    constructor(userId, message) {
        super(`Report generation error for user ${userId}: ${message}`, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
exports.ReportGenerationException = ReportGenerationException;
//# sourceMappingURL=billing.exceptions.js.map