import { Decimal } from '@prisma/client/runtime/library';
export declare class ValidationService {
    private readonly logger;
    private readonly supportedCurrencies;
    private readonly minAmount;
    private readonly maxAmount;
    validateAmount(amount: number, currency?: string): void;
    validateCurrency(currency: string): void;
    validateUser(userId: string, prisma: any): Promise<void>;
    validatePaymentMethod(paymentMethodId: string, userId: string, prisma: any): Promise<void>;
    validateBalanceForOperation(currentBalance: Decimal, amount: number, operation: 'add' | 'subtract', creditLimit?: Decimal): void;
    validateTransaction(type: string, amount: number, currency: string, userId: string): void;
    validateUsage(service: string, resource: string, quantity: number): void;
    validateReportPeriod(startDate: Date, endDate: Date): void;
    validateMetadata(metadata: any): void;
    validateId(id: string, fieldName?: string): void;
    validateEmail(email: string): void;
    validatePhone(phone: string): void;
    validateIP(ip: string): void;
}
