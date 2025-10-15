import { PrismaService } from '../common/prisma/prisma.service';
import { PricingRule, DiscountRule, CostBreakdown } from '../types/billing.types';
import { ProviderClassificationService, ProviderType } from './provider-classification.service';
export declare class PricingService {
    private readonly prisma;
    private readonly providerClassification;
    private readonly logger;
    constructor(prisma: PrismaService, providerClassification: ProviderClassificationService);
    calculateCost(service: string, resource: string, quantity: number, companyId?: string, metadata?: {
        provider?: string;
        model?: string;
        tokens?: {
            prompt?: number;
            completion?: number;
            total?: number;
        };
        [key: string]: any;
    }): Promise<number>;
    calculateUsageCost(service: string, resource: string, quantity: number, companyId?: string, metadata?: {
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
    getPricingRulesForProvider(service: string, resource: string, provider: string, model: string): Promise<PricingRule[]>;
    getApplicableDiscounts(companyId?: string, amount?: number, quantity?: number, providerType?: ProviderType): Promise<DiscountRule[]>;
    getTaxRate(providerType?: ProviderType): number;
    getDefaultPricing(service: string, resource: string): number;
    createPricingRule(rule: {
        name: string;
        service: string;
        resource: string;
        provider?: string;
        model?: string;
        providerType: 'DOMESTIC' | 'FOREIGN';
        type: 'PER_TOKEN' | 'PER_REQUEST' | 'FIXED';
        price: number;
        currency?: string;
        limits?: any;
        discounts?: any;
        priority?: number;
        validFrom?: Date;
        validTo?: Date;
    }): Promise<{
        success: boolean;
        rule?: PricingRule;
        error?: string;
    }>;
    getAllPricingRules(): Promise<PricingRule[]>;
    updatePricingRule(id: string, updates: Partial<{
        name: string;
        price: number;
        currency: string;
        limits: any;
        discounts: any;
        priority: number;
        validFrom: Date;
        validTo: Date;
        isActive: boolean;
    }>): Promise<{
        success: boolean;
        rule?: PricingRule;
        error?: string;
    }>;
    deletePricingRule(id: string): Promise<{
        success: boolean;
        error?: string;
    }>;
}
