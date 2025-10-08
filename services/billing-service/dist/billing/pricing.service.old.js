"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PricingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const shared_1 = require("@ai-aggregator/shared");
const provider_classification_service_1 = require("./provider-classification.service");
let PricingService = PricingService_1 = class PricingService {
    constructor(prisma, providerClassification) {
        this.prisma = prisma;
        this.providerClassification = providerClassification;
        this.logger = new common_1.Logger(PricingService_1.name);
    }
    async calculateCost(service, resource, quantity, userId, metadata) {
        const result = await this.calculateUsageCost(service, resource, quantity, userId, metadata);
        return result.cost || 0;
    }
    async calculateUsageCost(service, resource, quantity, userId, metadata) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Calculating usage cost', {
                service,
                resource,
                quantity,
                userId
            });
            const pricingRules = await this.getApplicablePricingRules(service, resource, userId);
            if (!pricingRules || pricingRules.length === 0) {
                const defaultCost = this.getDefaultPricing(service, resource);
                const totalCost = defaultCost * quantity;
                return {
                    success: true,
                    cost: totalCost,
                    currency: 'USD',
                    breakdown: {
                        baseCost: defaultCost,
                        usageCost: totalCost,
                        tax: 0,
                        discounts: 0,
                        total: totalCost,
                        currency: 'USD'
                    }
                };
            }
            let totalCost = 0;
            const breakdown = {
                baseCost: 0,
                usageCost: 0,
                tax: 0,
                discounts: 0,
                total: 0,
                currency: 'USD'
            };
            for (const rule of pricingRules) {
                const ruleCost = this.calculateRuleCost(rule, quantity, metadata);
                breakdown.usageCost += ruleCost;
                totalCost += ruleCost;
            }
            const discounts = await this.getApplicableDiscounts(userId, totalCost, metadata);
            const discountAmount = this.calculateDiscountAmount(discounts, totalCost);
            breakdown.discounts = discountAmount;
            totalCost -= discountAmount;
            const taxRate = await this.getTaxRate(userId, service);
            const taxAmount = totalCost * taxRate;
            breakdown.tax = taxAmount;
            totalCost += taxAmount;
            breakdown.total = totalCost;
            shared_1.LoggerUtil.info('billing-service', 'Cost calculated successfully', {
                service,
                resource,
                quantity,
                totalCost,
                currency: 'USD'
            });
            return {
                success: true,
                cost: totalCost,
                currency: 'USD',
                breakdown
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to calculate usage cost', error, {
                service,
                resource,
                quantity,
                userId
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getPricingRules(service, resource) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Getting pricing rules from database', { service, resource });
            const whereClause = {
                service,
                isActive: true,
                OR: [
                    { validFrom: null },
                    { validFrom: { lte: new Date() } }
                ],
                AND: [
                    { OR: [{ validTo: null }, { validTo: { gte: new Date() } }] }
                ]
            };
            if (resource) {
                whereClause.OR = [
                    { resource },
                    { resource: null }
                ];
            }
            const rules = await this.prisma.pricingRule.findMany({
                where: whereClause,
                orderBy: [
                    { priority: 'desc' },
                    { createdAt: 'desc' }
                ]
            });
            shared_1.LoggerUtil.info('billing-service', 'Pricing rules retrieved', {
                service,
                resource,
                count: rules.length,
                rules: rules.map(r => ({ id: r.id, name: r.name, price: r.price, type: r.type }))
            });
            return rules.map(rule => ({
                id: rule.id,
                name: rule.name,
                service: rule.service,
                resource: rule.resource,
                type: rule.type,
                price: rule.price.toNumber(),
                currency: rule.currency,
                limits: rule.limits,
                discounts: rule.discounts
            }));
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get pricing rules', error, { service, resource });
            return [];
        }
    }
    async createPricingRule(rule) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Creating pricing rule in database', { rule });
            const newRule = await this.prisma.pricingRule.create({
                data: {
                    name: rule.name,
                    service: rule.service,
                    resource: rule.resource,
                    type: rule.type,
                    price: rule.price,
                    currency: rule.currency,
                    limits: rule.limits,
                    discounts: rule.discounts,
                    priority: 0,
                    isActive: true
                }
            });
            const createdRule = {
                id: newRule.id,
                name: newRule.name,
                service: newRule.service,
                resource: newRule.resource,
                type: newRule.type,
                price: newRule.price.toNumber(),
                currency: newRule.currency,
                limits: newRule.limits,
                discounts: newRule.discounts
            };
            shared_1.LoggerUtil.info('billing-service', 'Pricing rule created successfully', {
                ruleId: newRule.id,
                service: newRule.service,
                resource: newRule.resource,
                price: newRule.price
            });
            return {
                success: true,
                rule: createdRule
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to create pricing rule', error, { rule });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async applyDiscount(userId, cost, discountCode, metadata) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Applying discount', { userId, cost, discountCode });
            const discounts = await this.getApplicableDiscounts(userId, cost, metadata, discountCode);
            const discountAmount = this.calculateDiscountAmount(discounts, cost);
            const discountedCost = Math.max(0, cost - discountAmount);
            shared_1.LoggerUtil.info('billing-service', 'Discount applied successfully', {
                userId,
                originalCost: cost,
                discountAmount,
                discountedCost
            });
            return {
                success: true,
                discountedCost,
                discountAmount
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to apply discount', error, { userId, cost, discountCode });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getCurrencyRate(fromCurrency, toCurrency) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Getting currency rate from database', { fromCurrency, toCurrency });
            if (fromCurrency === toCurrency) {
                return 1.0;
            }
            const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
            const cachedRate = await this.prisma.currencyRate.findFirst({
                where: {
                    fromCurrency,
                    toCurrency,
                    timestamp: { gte: oneHourAgo }
                },
                orderBy: { timestamp: 'desc' }
            });
            if (cachedRate) {
                shared_1.LoggerUtil.info('billing-service', 'Currency rate retrieved from cache', {
                    fromCurrency,
                    toCurrency,
                    rate: cachedRate.rate.toNumber(),
                    timestamp: cachedRate.timestamp
                });
                return cachedRate.rate.toNumber();
            }
            const freshRate = await this.fetchFreshCurrencyRate(fromCurrency, toCurrency);
            await this.prisma.currencyRate.create({
                data: {
                    fromCurrency,
                    toCurrency,
                    rate: freshRate,
                    timestamp: new Date()
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Fresh currency rate retrieved and cached', {
                fromCurrency,
                toCurrency,
                rate: freshRate
            });
            return freshRate;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get currency rate', error, { fromCurrency, toCurrency });
            return 1.0;
        }
    }
    async fetchFreshCurrencyRate(fromCurrency, toCurrency) {
        try {
            const mockRates = {
                'USD': { 'EUR': 0.85, 'RUB': 95.0, 'BTC': 0.000025 },
                'EUR': { 'USD': 1.18, 'RUB': 112.0, 'BTC': 0.000030 },
                'RUB': { 'USD': 0.011, 'EUR': 0.009, 'BTC': 0.00000026 }
            };
            const baseRate = mockRates[fromCurrency]?.[toCurrency] || 1.0;
            const variation = (Math.random() - 0.5) * 0.02;
            return baseRate * (1 + variation);
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to fetch fresh currency rate', error);
            return 1.0;
        }
    }
    async getApplicablePricingRules(service, resource, userId) {
        return await this.getPricingRules(service, resource);
    }
    async getApplicableDiscounts(userId, cost, metadata, discountCode) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Getting applicable discounts from database', {
                userId,
                cost,
                discountCode
            });
            const whereClause = {
                isActive: true,
                OR: [
                    { validFrom: null },
                    { validFrom: { lte: new Date() } }
                ],
                AND: [
                    { OR: [{ validTo: null }, { validTo: { gte: new Date() } }] }
                ]
            };
            if (discountCode) {
                whereClause.code = discountCode;
            }
            else {
                whereClause.OR = [
                    { userId },
                    { isGlobal: true },
                    { userTier: await this.getUserTier(userId) }
                ];
            }
            whereClause.OR = [
                { minAmount: null },
                { minAmount: { lte: cost } }
            ];
            whereClause.AND.push({
                OR: [
                    { maxAmount: null },
                    { maxAmount: { gte: cost } }
                ]
            });
            const discounts = await this.prisma.discountRule.findMany({
                where: whereClause,
                orderBy: [
                    { value: 'desc' },
                    { createdAt: 'desc' }
                ]
            });
            shared_1.LoggerUtil.info('billing-service', 'Applicable discounts retrieved', {
                userId,
                count: discounts.length,
                discounts: discounts.map(d => ({
                    id: d.id,
                    name: d.name,
                    type: d.type,
                    value: d.value.toNumber()
                }))
            });
            return discounts.map(discount => ({
                id: discount.id,
                name: discount.name,
                code: discount.code,
                type: discount.type,
                value: discount.value.toNumber(),
                currency: discount.currency,
                conditions: {
                    minAmount: discount.minAmount?.toNumber(),
                    maxAmount: discount.maxAmount?.toNumber(),
                    validFrom: discount.validFrom,
                    validTo: discount.validTo,
                    usageLimit: discount.usageLimit,
                    usageCount: discount.usageCount
                }
            }));
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get applicable discounts', error, { userId });
            return [];
        }
    }
    async getUserTier(userId) {
        try {
            return 'standard';
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get user tier', error, { userId });
            return 'standard';
        }
    }
    calculateRuleCost(rule, quantity, metadata) {
        switch (rule.type) {
            case 'fixed':
                return rule.price;
            case 'per_unit':
                return rule.price * quantity;
            case 'tiered':
                return this.calculateTieredCost(rule, quantity);
            default:
                return rule.price * quantity;
        }
    }
    calculateTieredCost(rule, quantity) {
        return rule.price * quantity;
    }
    calculateDiscountAmount(discounts, cost) {
        let totalDiscount = 0;
        for (const discount of discounts) {
            let discountAmount = 0;
            switch (discount.type) {
                case 'percentage':
                    discountAmount = cost * (discount.value / 100);
                    break;
                case 'fixed':
                    discountAmount = discount.value;
                    break;
            }
            if (discount.conditions) {
                if (discount.conditions.minAmount && cost < discount.conditions.minAmount) {
                    continue;
                }
                if (discount.conditions.minQuantity && cost < discount.conditions.minQuantity) {
                    continue;
                }
                if (discount.conditions.validFrom && new Date() < discount.conditions.validFrom) {
                    continue;
                }
                if (discount.conditions.validTo && new Date() > discount.conditions.validTo) {
                    continue;
                }
            }
            totalDiscount += discountAmount;
        }
        return Math.min(totalDiscount, cost);
    }
    async getTaxRate(userId, service) {
        return 0.0;
    }
    getDefaultPricing(service, resource) {
        const defaultPricing = {
            'ai-chat': {
                'gpt-4': 0.03,
                'gpt-3.5-turbo': 0.002,
                'claude-3': 0.015,
                'default': 0.01
            },
            'ai-image': {
                'dall-e-3': 0.04,
                'midjourney': 0.02,
                'default': 0.03
            },
            'api': {
                'request': 0.001,
                'data': 0.0001,
                'default': 0.001
            }
        };
        return defaultPricing[service]?.[resource] || defaultPricing[service]?.default || 0.01;
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = PricingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        provider_classification_service_1.ProviderClassificationService])
], PricingService);
//# sourceMappingURL=pricing.service.old.js.map