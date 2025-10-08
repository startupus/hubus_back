import { PrismaService } from '../common/prisma/prisma.service';
import { PricingRule, CostBreakdown } from '../types/billing.types';
import { ProviderClassificationService, ProviderType } from './provider-classification.service';
export declare class PricingService {
    private readonly prisma;
    private readonly providerClassification;
    private readonly logger;
    constructor(prisma: PrismaService, providerClassification: ProviderClassificationService);
    calculateCost(service: string, resource: string, quantity: number, userId?: string, metadata?: Record<string, any>): Promise<number>;
    calculateUsageCost(service: string, resource: string, quantity: number, userId?: string, metadata?: {
        provider?: string;
        model?: string;
        tokens?: {
            prompt?: number;
            completion?: number;
            total?: number;
        };
        [key: string]: any;
    }): Promise<{
        success: boolean;
        cost?: number;
        currency?: string;
        breakdown?: CostBreakdown;
        providerType?: ProviderType;
        error?: string;
    }>;
    getPricingRules(service: string, resource?: string): Promise<PricingRule[]>;
    createPricingRule(rule: Omit<PricingRule, 'id'>): Promise<{
        success: boolean;
        rule?: PricingRule;
        error?: string;
    }>;
    applyDiscount(userId: string, cost: number, discountCode?: string, metadata?: Record<string, any>): Promise<{
        success: boolean;
        discountedCost?: number;
        discountAmount?: number;
        error?: string;
    }>;
    getCurrencyRate(fromCurrency: string, toCurrency: string): Promise<number>;
    private fetchFreshCurrencyRate;
    private getApplicablePricingRules;
    private getApplicableDiscounts;
    private getUserTier;
    private calculateRuleCost;
    private calculateTieredCost;
    private calculateDiscountAmount;
    private getTaxRate;
    private getDefaultPricing;
}
