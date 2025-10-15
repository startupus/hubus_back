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
    async calculateCost(service, resource, quantity, companyId, metadata) {
        const result = await this.calculateUsageCost(service, resource, quantity, companyId, metadata);
        return result.cost || 0;
    }
    async calculateUsageCost(service, resource, quantity, companyId, metadata) {
        try {
            const provider = metadata?.provider || 'unknown';
            const model = metadata?.model || 'unknown';
            const tokens = metadata?.tokens || { total: quantity };
            shared_1.LoggerUtil.debug('billing-service', 'Calculating usage cost (OpenRouter style)', {
                service,
                resource,
                quantity,
                provider,
                model,
                tokens,
                companyId
            });
            const providerType = this.providerClassification.classifyProvider(provider);
            const providerInfo = this.providerClassification.getProviderInfo(provider);
            const pricingRules = await this.getPricingRulesForProvider(service, resource, provider, model);
            if (pricingRules.length === 0) {
                shared_1.LoggerUtil.warn('billing-service', 'No pricing rules found for provider/model', {
                    service,
                    resource,
                    provider,
                    model
                });
                return {
                    success: false,
                    error: `No pricing rules found for ${provider}/${model}`
                };
            }
            let baseCost = 0;
            let currency = 'USD';
            for (const rule of pricingRules) {
                if (rule.type === 'per_token') {
                    const tokenCount = tokens.total || quantity;
                    baseCost += Number(rule.price) * tokenCount;
                }
                else if (rule.type === 'per_unit') {
                    baseCost += Number(rule.price) * quantity;
                }
                else if (rule.type === 'fixed') {
                    baseCost += Number(rule.price);
                }
                currency = rule.currency;
            }
            const discounts = await this.getApplicableDiscounts(companyId, baseCost, quantity, providerType);
            let discountAmount = 0;
            for (const discount of discounts) {
                if (discount.type === 'percentage') {
                    discountAmount += baseCost * (Number(discount.value) / 100);
                }
                else if (discount.type === 'fixed') {
                    discountAmount += Number(discount.value);
                }
            }
            const taxRate = this.getTaxRate(providerType);
            const taxableAmount = baseCost - discountAmount;
            const tax = taxableAmount * taxRate;
            const totalCost = baseCost - discountAmount + tax;
            const breakdown = {
                baseCost,
                usageCost: baseCost,
                tax,
                discounts: discountAmount,
                total: totalCost,
                currency
            };
            shared_1.LoggerUtil.info('billing-service', 'Usage cost calculated (OpenRouter style)', {
                service,
                resource,
                quantity,
                provider,
                model,
                providerType,
                tokens,
                companyId,
                cost: totalCost,
                currency,
                breakdown
            });
            return {
                success: true,
                cost: totalCost,
                currency,
                breakdown,
                providerType
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to calculate usage cost', error, {
                service,
                resource,
                quantity,
                companyId,
                provider: metadata?.provider
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async getPricingRulesForProvider(service, resource, provider, model) {
        try {
            const rules = await this.prisma.pricingRule.findMany({
                where: {
                    service,
                    resource,
                    provider,
                    model,
                    isActive: true,
                    OR: [
                        { validFrom: null },
                        { validFrom: { lte: new Date() } }
                    ],
                    AND: [
                        {
                            OR: [
                                { validTo: null },
                                { validTo: { gte: new Date() } }
                            ]
                        }
                    ]
                },
                orderBy: { priority: 'desc' }
            });
            return rules.map(rule => ({
                id: rule.id,
                name: rule.name,
                service: rule.service,
                resource: rule.resource || '',
                provider: rule.provider,
                model: rule.model,
                providerType: rule.providerType,
                type: rule.type,
                price: Number(rule.price),
                currency: rule.currency,
                limits: rule.limits,
                discounts: rule.discounts
            }));
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get pricing rules for provider', error, {
                service,
                resource,
                provider,
                model
            });
            return [];
        }
    }
    async getApplicableDiscounts(companyId, amount, quantity, providerType) {
        try {
            const now = new Date();
            const discounts = await this.prisma.discountRule.findMany({
                where: {
                    isActive: true,
                    AND: [
                        {
                            OR: [
                                { validFrom: null },
                                { validFrom: { lte: now } }
                            ]
                        },
                        {
                            OR: [
                                { validTo: null },
                                { validTo: { gte: now } }
                            ]
                        },
                        {
                            OR: [
                                { isGlobal: true }
                            ]
                        }
                    ]
                },
                orderBy: { value: 'desc' }
            });
            return discounts
                .filter(discount => {
                if (discount.minAmount && amount && amount < Number(discount.minAmount)) {
                    return false;
                }
                if (discount.maxAmount && amount && amount > Number(discount.maxAmount)) {
                    return false;
                }
                if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
                    return false;
                }
                return true;
            })
                .map(discount => ({
                id: discount.id,
                name: discount.name,
                type: discount.type,
                value: Number(discount.value),
                conditions: {
                    minAmount: discount.minAmount ? Number(discount.minAmount) : undefined,
                    maxAmount: discount.maxAmount ? Number(discount.maxAmount) : undefined,
                    validFrom: discount.validFrom,
                    validTo: discount.validTo
                }
            }));
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get applicable discounts', error, {
                companyId,
                amount,
                quantity
            });
            return [];
        }
    }
    getTaxRate(providerType) {
        if (providerType === 'DOMESTIC') {
            return 0.20;
        }
        else if (providerType === 'FOREIGN') {
            return 0.0;
        }
        return 0.0;
    }
    getDefaultPricing(service, resource) {
        const defaultPricing = {
            'ai': {
                'chat_completion': 0.00002,
                'text_generation': 0.00002,
                'image_generation': 0.02,
                'embedding': 0.0001,
                'default': 0.00002
            },
            'api': {
                'request': 0.001,
                'default': 0.001
            }
        };
        return defaultPricing[service]?.[resource] || defaultPricing[service]?.default || 0.01;
    }
    async createPricingRule(rule) {
        try {
            const createdRule = await this.prisma.pricingRule.create({
                data: {
                    name: rule.name,
                    service: rule.service,
                    resource: rule.resource,
                    provider: rule.provider,
                    model: rule.model,
                    providerType: rule.providerType,
                    type: rule.type,
                    price: rule.price,
                    currency: rule.currency || 'USD',
                    limits: rule.limits,
                    discounts: rule.discounts,
                    priority: rule.priority || 0,
                    validFrom: rule.validFrom,
                    validTo: rule.validTo
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Pricing rule created', {
                ruleId: createdRule.id,
                service: rule.service,
                resource: rule.resource,
                provider: rule.provider,
                model: rule.model
            });
            return {
                success: true,
                rule: {
                    id: createdRule.id,
                    name: createdRule.name,
                    service: createdRule.service,
                    resource: createdRule.resource || '',
                    provider: createdRule.provider,
                    model: createdRule.model,
                    providerType: createdRule.providerType,
                    type: createdRule.type,
                    price: Number(createdRule.price),
                    currency: createdRule.currency,
                    limits: createdRule.limits,
                    discounts: createdRule.discounts
                }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to create pricing rule', error, {
                rule
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async getAllPricingRules() {
        try {
            const rules = await this.prisma.pricingRule.findMany({
                where: { isActive: true },
                orderBy: [
                    { service: 'asc' },
                    { resource: 'asc' },
                    { provider: 'asc' },
                    { model: 'asc' },
                    { priority: 'desc' }
                ]
            });
            return rules.map(rule => ({
                id: rule.id,
                name: rule.name,
                service: rule.service,
                resource: rule.resource || '',
                provider: rule.provider,
                model: rule.model,
                providerType: rule.providerType,
                type: rule.type,
                price: Number(rule.price),
                currency: rule.currency,
                limits: rule.limits,
                discounts: rule.discounts
            }));
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get all pricing rules', error);
            return [];
        }
    }
    async updatePricingRule(id, updates) {
        try {
            const updatedRule = await this.prisma.pricingRule.update({
                where: { id },
                data: updates
            });
            shared_1.LoggerUtil.info('billing-service', 'Pricing rule updated', {
                ruleId: id,
                updates
            });
            return {
                success: true,
                rule: {
                    id: updatedRule.id,
                    name: updatedRule.name,
                    service: updatedRule.service,
                    resource: updatedRule.resource || '',
                    provider: updatedRule.provider,
                    model: updatedRule.model,
                    providerType: updatedRule.providerType,
                    type: updatedRule.type,
                    price: Number(updatedRule.price),
                    currency: updatedRule.currency,
                    limits: updatedRule.limits,
                    discounts: updatedRule.discounts
                }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to update pricing rule', error, {
                ruleId: id,
                updates
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
    async deletePricingRule(id) {
        try {
            await this.prisma.pricingRule.delete({
                where: { id }
            });
            shared_1.LoggerUtil.info('billing-service', 'Pricing rule deleted', {
                ruleId: id
            });
            return { success: true };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to delete pricing rule', error, {
                ruleId: id
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error occurred'
            };
        }
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = PricingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        provider_classification_service_1.ProviderClassificationService])
], PricingService);
//# sourceMappingURL=pricing.service.js.map