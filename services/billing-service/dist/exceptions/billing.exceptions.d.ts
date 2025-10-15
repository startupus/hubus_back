import { HttpException, HttpStatus } from '@nestjs/common';
export declare class BillingException extends HttpException {
    constructor(message: string, status?: HttpStatus);
}
export declare class InsufficientBalanceException extends BillingException {
    constructor(required: number, available: number, currency?: string);
}
export declare class CreditLimitExceededException extends BillingException {
    constructor(amount: number, limit: number, currency?: string);
}
export declare class InvalidCurrencyException extends BillingException {
    constructor(currency: string);
}
export declare class InvalidAmountException extends BillingException {
    constructor(amount: number);
}
export declare class InvalidTransactionTypeException extends BillingException {
    constructor(type: string);
}
export declare class InvalidTransactionStatusException extends BillingException {
    constructor(status: string);
}
export declare class CompanyNotFoundException extends BillingException {
    constructor(companyId: string);
}
export declare class PaymentMethodNotFoundException extends BillingException {
    constructor(paymentMethodId: string);
}
export declare class PaymentProviderException extends BillingException {
    constructor(provider: string, message: string);
}
export declare class CostCalculationException extends BillingException {
    constructor(service: string, resource: string, message: string);
}
export declare class ReportGenerationException extends BillingException {
    constructor(companyId: string, message: string);
}
