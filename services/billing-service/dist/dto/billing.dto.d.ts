import { TransactionType } from '../types/billing.types';
export declare class GetBalanceDto {
    userId: string;
}
export declare class UpdateBalanceDto {
    userId: string;
    amount: number;
    operation: 'add' | 'subtract';
    description?: string;
    reference?: string;
}
export declare class CreateTransactionDto {
    userId: string;
    type: TransactionType;
    amount: number;
    currency?: string;
    description?: string;
    reference?: string;
    metadata?: Record<string, any>;
    paymentMethodId?: string;
}
export declare class TrackUsageDto {
    userId: string;
    service: string;
    resource: string;
    quantity?: number;
    unit?: string;
    metadata?: Record<string, any>;
}
export declare class CalculateCostDto {
    userId: string;
    service: string;
    resource: string;
    quantity: number;
    metadata?: Record<string, any>;
}
export declare class ProcessPaymentDto {
    userId: string;
    amount: number;
    currency?: string;
    paymentMethodId?: string;
    description?: string;
    metadata?: Record<string, any>;
}
export declare class BillingReportDto {
    userId: string;
    startDate: string;
    endDate: string;
}
