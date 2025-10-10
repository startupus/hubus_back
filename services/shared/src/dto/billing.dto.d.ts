export declare class BillingRecordDto {
    id: string;
    userId: string;
    provider: string;
    model: string;
    cost: number;
    tokens: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
    requestId: string;
    timestamp: string;
    metadata?: Record<string, unknown>;
}
export declare class UserBalanceDto {
    userId: string;
    balance: number;
    currency: string;
    lastUpdated: string;
}
export declare class BillingTransactionDto {
    id: string;
    userId: string;
    type: 'charge' | 'refund' | 'deposit' | 'withdrawal';
    amount: number;
    currency: string;
    description: string;
    metadata?: Record<string, unknown>;
    timestamp: string;
}
export declare class DepositDto {
    amount: number;
    currency: string;
    description?: string;
}
export declare class WithdrawalDto {
    amount: number;
    currency: string;
    description?: string;
}
export declare class BillingLimitsDto {
    userId: string;
    dailyLimit: number;
    monthlyLimit: number;
    perRequestLimit: number;
    currency: string;
}
export declare class UpdateBillingLimitsDto {
    dailyLimit?: number;
    monthlyLimit?: number;
    perRequestLimit?: number;
}
export declare class UsageStatsDto {
    userId: string;
    period: 'daily' | 'weekly' | 'monthly';
    totalRequests: number;
    totalTokens: number;
    totalCost: number;
    providerBreakdown: Record<string, {
        requests: number;
        tokens: number;
        cost: number;
    }>;
    startDate: string;
    endDate: string;
}
export declare class PricingTierDto {
    name: string;
    description: string;
    monthlyPrice: number;
    currency: string;
    includedTokens: number;
    overageRate: number;
    features: string[];
}
