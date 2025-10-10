export interface BillingRecord {
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
    timestamp: Date;
    metadata?: Record<string, unknown>;
}
export interface UserBalance {
    userId: string;
    balance: number;
    currency: string;
    lastUpdated: Date;
}
export interface BillingTransaction {
    id: string;
    userId: string;
    type: 'charge' | 'refund' | 'deposit' | 'withdrawal';
    amount: number;
    currency: string;
    description: string;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}
export interface CostCalculation {
    provider: string;
    model: string;
    inputTokens: number;
    outputTokens: number;
    inputCost: number;
    outputCost: number;
    totalCost: number;
    currency: string;
}
export interface BillingLimits {
    userId: string;
    dailyLimit: number;
    monthlyLimit: number;
    perRequestLimit: number;
    currency: string;
}
export interface UsageStats {
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
    startDate: Date;
    endDate: Date;
}
export type Currency = 'USD' | 'EUR' | 'RUB';
export interface PricingTier {
    name: string;
    description: string;
    monthlyPrice: number;
    currency: Currency;
    includedTokens: number;
    overageRate: number;
    features: string[];
}
export interface BillingEvent {
    type: 'charge' | 'refund' | 'limit_exceeded' | 'payment_failed';
    userId: string;
    amount?: number;
    currency?: Currency;
    metadata?: Record<string, unknown>;
    timestamp: Date;
}
