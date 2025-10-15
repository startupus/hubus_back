import { PricingType, BillingCycle } from '@prisma/client';
export declare class CreatePricingPlanDto {
    name: string;
    description?: string;
    type: PricingType;
    price?: number;
    currency?: string;
    billingCycle?: BillingCycle;
    isActive?: boolean;
    inputTokens?: number;
    outputTokens?: number;
    inputTokenPrice?: number;
    outputTokenPrice?: number;
    discountPercent?: number;
}
export declare class UpdatePricingPlanDto {
    name?: string;
    description?: string;
    type?: PricingType;
    price?: number;
    currency?: string;
    billingCycle?: BillingCycle;
    isActive?: boolean;
    inputTokens?: number;
    outputTokens?: number;
    inputTokenPrice?: number;
    outputTokenPrice?: number;
    discountPercent?: number;
}
export declare class SubscribeToPlanDto {
    companyId: string;
    planId: string;
    paymentMethodId?: string;
}
export declare class SubscriptionUsageDto {
    inputTokensUsed: number;
    outputTokensUsed: number;
    inputTokensLimit: number;
    outputTokensLimit: number;
    inputTokensRemaining: number;
    outputTokensRemaining: number;
    usagePercentage: number;
}
