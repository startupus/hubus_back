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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const shared_1 = require("@ai-aggregator/shared");
const library_1 = require("@prisma/client/runtime/library");
let PricingService = class PricingService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getPricingPlans(active) {
        try {
            const where = active !== undefined ? { isActive: active } : {};
            const plans = await this.prisma.pricingPlan.findMany({
                where,
                orderBy: { createdAt: 'desc' }
            });
            shared_1.LoggerUtil.info('billing-service', 'Pricing plans retrieved', { count: plans.length, active });
            return plans;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get pricing plans', error, { active });
            throw error;
        }
    }
    async getPricingPlan(id) {
        try {
            const plan = await this.prisma.pricingPlan.findUnique({
                where: { id }
            });
            if (!plan) {
                throw new common_1.NotFoundException('Pricing plan not found');
            }
            shared_1.LoggerUtil.info('billing-service', 'Pricing plan retrieved', { planId: id });
            return plan;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get pricing plan', error, { planId: id });
            throw error;
        }
    }
    async createPricingPlan(createPricingPlanDto) {
        try {
            let finalPrice = createPricingPlanDto.price ? new library_1.Decimal(createPricingPlanDto.price) : new library_1.Decimal(0);
            if (createPricingPlanDto.type === 'TOKEN_BASED' &&
                createPricingPlanDto.inputTokens &&
                createPricingPlanDto.outputTokens &&
                createPricingPlanDto.inputTokenPrice &&
                createPricingPlanDto.outputTokenPrice) {
                const inputCost = new library_1.Decimal(createPricingPlanDto.inputTokens).mul(createPricingPlanDto.inputTokenPrice);
                const outputCost = new library_1.Decimal(createPricingPlanDto.outputTokens).mul(createPricingPlanDto.outputTokenPrice);
                const totalCost = inputCost.add(outputCost);
                const discount = createPricingPlanDto.discountPercent || 10;
                const discountMultiplier = new library_1.Decimal(100 - Number(discount)).div(100);
                finalPrice = totalCost.mul(discountMultiplier);
            }
            const plan = await this.prisma.pricingPlan.create({
                data: {
                    name: createPricingPlanDto.name,
                    description: createPricingPlanDto.description,
                    type: createPricingPlanDto.type,
                    price: finalPrice,
                    currency: createPricingPlanDto.currency || 'USD',
                    billingCycle: createPricingPlanDto.billingCycle || 'MONTHLY',
                    isActive: createPricingPlanDto.isActive !== false,
                    inputTokens: createPricingPlanDto.inputTokens,
                    outputTokens: createPricingPlanDto.outputTokens,
                    inputTokenPrice: createPricingPlanDto.inputTokenPrice,
                    outputTokenPrice: createPricingPlanDto.outputTokenPrice,
                    discountPercent: createPricingPlanDto.discountPercent
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Pricing plan created', {
                planId: plan.id,
                name: plan.name,
                price: finalPrice.toString()
            });
            return plan;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to create pricing plan', error, {
                name: createPricingPlanDto.name,
                type: createPricingPlanDto.type
            });
            throw error;
        }
    }
    async updatePricingPlan(id, updatePricingPlanDto) {
        try {
            const existingPlan = await this.prisma.pricingPlan.findUnique({
                where: { id }
            });
            if (!existingPlan) {
                throw new common_1.NotFoundException('Pricing plan not found');
            }
            let finalPrice = updatePricingPlanDto.price ? new library_1.Decimal(updatePricingPlanDto.price) : existingPlan.price;
            if (updatePricingPlanDto.type === 'TOKEN_BASED' &&
                updatePricingPlanDto.inputTokens &&
                updatePricingPlanDto.outputTokens &&
                updatePricingPlanDto.inputTokenPrice &&
                updatePricingPlanDto.outputTokenPrice) {
                const inputCost = new library_1.Decimal(updatePricingPlanDto.inputTokens).mul(updatePricingPlanDto.inputTokenPrice);
                const outputCost = new library_1.Decimal(updatePricingPlanDto.outputTokens).mul(updatePricingPlanDto.outputTokenPrice);
                const totalCost = inputCost.add(outputCost);
                const discount = updatePricingPlanDto.discountPercent || existingPlan.discountPercent || 10;
                const discountMultiplier = new library_1.Decimal(100 - Number(discount)).div(100);
                finalPrice = totalCost.mul(discountMultiplier);
            }
            const updateData = {};
            if (updatePricingPlanDto.name !== undefined)
                updateData.name = updatePricingPlanDto.name;
            if (updatePricingPlanDto.description !== undefined)
                updateData.description = updatePricingPlanDto.description;
            if (updatePricingPlanDto.type !== undefined)
                updateData.type = updatePricingPlanDto.type;
            if (updatePricingPlanDto.currency !== undefined)
                updateData.currency = updatePricingPlanDto.currency;
            if (updatePricingPlanDto.billingCycle !== undefined)
                updateData.billingCycle = updatePricingPlanDto.billingCycle;
            if (updatePricingPlanDto.isActive !== undefined)
                updateData.isActive = updatePricingPlanDto.isActive;
            if (updatePricingPlanDto.inputTokens !== undefined)
                updateData.inputTokens = updatePricingPlanDto.inputTokens;
            if (updatePricingPlanDto.outputTokens !== undefined)
                updateData.outputTokens = updatePricingPlanDto.outputTokens;
            if (updatePricingPlanDto.inputTokenPrice !== undefined)
                updateData.inputTokenPrice = updatePricingPlanDto.inputTokenPrice;
            if (updatePricingPlanDto.outputTokenPrice !== undefined)
                updateData.outputTokenPrice = updatePricingPlanDto.outputTokenPrice;
            if (updatePricingPlanDto.discountPercent !== undefined)
                updateData.discountPercent = updatePricingPlanDto.discountPercent;
            updateData.price = finalPrice;
            const plan = await this.prisma.pricingPlan.update({
                where: { id },
                data: updateData
            });
            shared_1.LoggerUtil.info('billing-service', 'Pricing plan updated', { planId: id });
            return plan;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to update pricing plan', error, { planId: id });
            throw error;
        }
    }
    async deletePricingPlan(id) {
        try {
            const plan = await this.prisma.pricingPlan.findUnique({
                where: { id },
                include: { subscriptions: true }
            });
            if (!plan) {
                throw new common_1.NotFoundException('Pricing plan not found');
            }
            if (plan.subscriptions.length > 0) {
                throw new common_1.ConflictException('Cannot delete pricing plan with active subscriptions');
            }
            await this.prisma.pricingPlan.delete({
                where: { id }
            });
            shared_1.LoggerUtil.info('billing-service', 'Pricing plan deleted', { planId: id });
            return { success: true, message: 'Pricing plan deleted successfully' };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to delete pricing plan', error, { planId: id });
            throw error;
        }
    }
    async subscribeToPlan(subscribeToPlanDto) {
        try {
            const { companyId, planId, paymentMethodId } = subscribeToPlanDto;
            const company = await this.prisma.company.findUnique({
                where: { id: companyId }
            });
            if (!company) {
                throw new common_1.NotFoundException('Company not found');
            }
            const plan = await this.prisma.pricingPlan.findUnique({
                where: { id: planId }
            });
            if (!plan) {
                throw new common_1.NotFoundException('Pricing plan not found');
            }
            if (!plan.isActive) {
                throw new common_1.BadRequestException('Pricing plan is not active');
            }
            const existingSubscription = await this.prisma.subscription.findFirst({
                where: {
                    companyId,
                    status: 'ACTIVE',
                    currentPeriodEnd: { gt: new Date() }
                }
            });
            if (existingSubscription) {
                throw new common_1.ConflictException('Company already has an active subscription');
            }
            const now = new Date();
            const periodEnd = new Date(now);
            periodEnd.setMonth(periodEnd.getMonth() + 1);
            const subscription = await this.prisma.subscription.create({
                data: {
                    companyId,
                    planId,
                    price: plan.price,
                    currency: plan.currency,
                    currentPeriodStart: now,
                    currentPeriodEnd: periodEnd,
                    inputTokensLimit: plan.inputTokens,
                    outputTokensLimit: plan.outputTokens,
                    inputTokensUsed: 0,
                    outputTokensUsed: 0
                },
                include: {
                    plan: true
                }
            });
            await this.prisma.companyBalance.update({
                where: { companyId },
                data: {
                    balance: {
                        decrement: plan.price
                    }
                }
            });
            await this.prisma.transaction.create({
                data: {
                    companyId,
                    type: 'DEBIT',
                    amount: plan.price,
                    currency: plan.currency,
                    description: `Subscription to ${plan.name}`,
                    status: 'COMPLETED',
                    metadata: {
                        subscriptionId: subscription.id,
                        planId: plan.id,
                        planName: plan.name,
                        periodStart: now.toISOString(),
                        periodEnd: periodEnd.toISOString()
                    }
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Subscription created', {
                subscriptionId: subscription.id,
                companyId,
                planId,
                price: plan.price.toString()
            });
            return subscription;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to create subscription', error, {
                companyId: subscribeToPlanDto.companyId,
                planId: subscribeToPlanDto.planId
            });
            throw error;
        }
    }
    async getCompanySubscriptions(companyId) {
        try {
            const subscriptions = await this.prisma.subscription.findMany({
                where: { companyId },
                include: {
                    plan: true
                },
                orderBy: { createdAt: 'desc' }
            });
            shared_1.LoggerUtil.info('billing-service', 'Company subscriptions retrieved', {
                companyId,
                count: subscriptions.length
            });
            return subscriptions;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get company subscriptions', error, { companyId });
            throw error;
        }
    }
    async getActiveSubscription(companyId) {
        try {
            const subscription = await this.prisma.subscription.findFirst({
                where: {
                    companyId,
                    status: 'ACTIVE',
                    currentPeriodEnd: { gt: new Date() }
                },
                include: {
                    plan: true
                }
            });
            if (!subscription) {
                throw new common_1.NotFoundException('No active subscription found');
            }
            shared_1.LoggerUtil.info('billing-service', 'Active subscription retrieved', {
                companyId,
                subscriptionId: subscription.id
            });
            return subscription;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get active subscription', error, { companyId });
            throw error;
        }
    }
    async cancelSubscription(subscriptionId) {
        try {
            const subscription = await this.prisma.subscription.findUnique({
                where: { id: subscriptionId }
            });
            if (!subscription) {
                throw new common_1.NotFoundException('Subscription not found');
            }
            const updatedSubscription = await this.prisma.subscription.update({
                where: { id: subscriptionId },
                data: {
                    status: 'CANCELLED'
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Subscription cancelled', { subscriptionId });
            return updatedSubscription;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to cancel subscription', error, { subscriptionId });
            throw error;
        }
    }
    async getSubscriptionUsage(subscriptionId) {
        try {
            const subscription = await this.prisma.subscription.findUnique({
                where: { id: subscriptionId },
                include: { plan: true }
            });
            if (!subscription) {
                throw new common_1.NotFoundException('Subscription not found');
            }
            const inputTokensRemaining = (subscription.inputTokensLimit || 0) - subscription.inputTokensUsed;
            const outputTokensRemaining = (subscription.outputTokensLimit || 0) - subscription.outputTokensUsed;
            const totalTokensLimit = (subscription.inputTokensLimit || 0) + (subscription.outputTokensLimit || 0);
            const totalTokensUsed = subscription.inputTokensUsed + subscription.outputTokensUsed;
            const usagePercentage = totalTokensLimit > 0 ? (totalTokensUsed / totalTokensLimit) * 100 : 0;
            const usage = {
                inputTokensUsed: subscription.inputTokensUsed,
                outputTokensUsed: subscription.outputTokensUsed,
                inputTokensLimit: subscription.inputTokensLimit || 0,
                outputTokensLimit: subscription.outputTokensLimit || 0,
                inputTokensRemaining: Math.max(0, inputTokensRemaining),
                outputTokensRemaining: Math.max(0, outputTokensRemaining),
                usagePercentage: Math.round(usagePercentage * 100) / 100
            };
            shared_1.LoggerUtil.info('billing-service', 'Subscription usage retrieved', {
                subscriptionId,
                usagePercentage: usage.usagePercentage
            });
            return usage;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get subscription usage', error, { subscriptionId });
            throw error;
        }
    }
};
exports.PricingService = PricingService;
exports.PricingService = PricingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PricingService);
//# sourceMappingURL=pricing.service.js.map