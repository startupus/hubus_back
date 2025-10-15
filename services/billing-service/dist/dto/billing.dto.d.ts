import { TransactionType } from '../types/billing.types';
export declare class GetBalanceDto {
    companyId: string;
}
export declare class UpdateBalanceDto {
    companyId: string;
    amount: number;
    operation: 'add' | 'subtract';
    description?: string;
    reference?: string;
    currency?: string;
    metadata?: Record<string, any>;
}
export declare class CreateTransactionDto {
    companyId: string;
    type: TransactionType;
    amount: number;
    currency?: string;
    description?: string;
    reference?: string;
    metadata?: Record<string, any>;
    paymentMethodId?: string;
}
export declare class TrackUsageDto {
    companyId: string;
    service: string;
    resource: string;
    quantity?: number;
    unit?: string;
    metadata?: Record<string, any>;
}
export declare class CalculateCostDto {
    companyId: string;
    service: string;
    resource: string;
    quantity: number;
    metadata?: Record<string, any>;
}
export declare class ProcessPaymentDto {
    companyId: string;
    amount: number;
    currency?: string;
    paymentMethodId?: string;
    description?: string;
    metadata?: Record<string, any>;
}
export declare class BillingReportDto {
    companyId: string;
    startDate: string;
    endDate: string;
}
