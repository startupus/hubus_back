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
var SubscriptionBillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SubscriptionBillingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const shared_1 = require("@ai-aggregator/shared");
const library_1 = require("@prisma/client/runtime/library");
let SubscriptionBillingService = SubscriptionBillingService_1 = class SubscriptionBillingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(SubscriptionBillingService_1.name);
    }
    async processAIRequest(request) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Processing AI request billing', {
                companyId: request.companyId,
                inputTokens: request.inputTokens,
                outputTokens: request.outputTokens
            });
            const activeSubscription = await this.getActiveSubscription(request.companyId);
            if (activeSubscription) {
                return await this.processWithSubscription(activeSubscription, request);
            }
            else {
                return await this.processPayAsYouGo(request);
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process AI request billing', error, {
                companyId: request.companyId
            });
            throw error;
        }
    }
    async processWithSubscription(subscription, request) {
        try {
            const { inputTokens, outputTokens } = request;
            const inputTokensRemaining = (subscription.inputTokensLimit || 0) - subscription.inputTokensUsed;
            const outputTokensRemaining = (subscription.outputTokensLimit || 0) - subscription.outputTokensUsed;
            const inputTokensFromSubscription = Math.min(inputTokens, inputTokensRemaining);
            const outputTokensFromSubscription = Math.min(outputTokens, outputTokensRemaining);
            const inputTokensToPay = inputTokens - inputTokensFromSubscription;
            const outputTokensToPay = outputTokens - outputTokensFromSubscription;
            let totalAmountCharged = new library_1.Decimal(0);
            let payAsYouGoTransactionId;
            if (inputTokensFromSubscription > 0 || outputTokensFromSubscription > 0) {
                await this.updateSubscriptionUsage(subscription.id, inputTokensFromSubscription, outputTokensFromSubscription);
                shared_1.LoggerUtil.info('billing-service', 'Subscription tokens used', {
                    subscriptionId: subscription.id,
                    inputTokensUsed: inputTokensFromSubscription,
                    outputTokensUsed: outputTokensFromSubscription
                });
            }
            if (inputTokensToPay > 0 || outputTokensToPay > 0) {
                const payAsYouGoResult = await this.processPayAsYouGo({
                    ...request,
                    inputTokens: inputTokensToPay,
                    outputTokens: outputTokensToPay
                });
                totalAmountCharged = payAsYouGoResult.amountCharged;
                payAsYouGoTransactionId = payAsYouGoResult.transactionId;
            }
            const newInputTokensUsed = subscription.inputTokensUsed + inputTokensFromSubscription;
            const newOutputTokensUsed = subscription.outputTokensUsed + outputTokensFromSubscription;
            const inputTokensRemainingAfter = (subscription.inputTokensLimit || 0) - newInputTokensUsed;
            const outputTokensRemainingAfter = (subscription.outputTokensLimit || 0) - newOutputTokensUsed;
            shared_1.LoggerUtil.info('billing-service', 'AI request processed with subscription', {
                companyId: request.companyId,
                subscriptionId: subscription.id,
                totalAmountCharged: totalAmountCharged.toString(),
                inputTokensRemaining: inputTokensRemainingAfter,
                outputTokensRemaining: outputTokensRemainingAfter
            });
            return {
                success: true,
                amountCharged: totalAmountCharged,
                tokensUsed: {
                    input: inputTokens,
                    output: outputTokens
                },
                billingMethod: 'subscription',
                subscriptionId: subscription.id,
                transactionId: payAsYouGoTransactionId,
                remainingTokens: {
                    input: Math.max(0, inputTokensRemainingAfter),
                    output: Math.max(0, outputTokensRemainingAfter)
                }
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process with subscription', error, {
                subscriptionId: subscription.id
            });
            throw error;
        }
    }
    async processPayAsYouGo(request) {
        try {
            const { companyId, inputTokens, outputTokens, inputTokenPrice, outputTokenPrice } = request;
            const inputCost = new library_1.Decimal(inputTokens).mul(inputTokenPrice);
            const outputCost = new library_1.Decimal(outputTokens).mul(outputTokenPrice);
            const totalCost = inputCost.add(outputCost);
            const companyBalance = await this.prisma.companyBalance.findUnique({
                where: { companyId }
            });
            if (!companyBalance) {
                throw new common_1.NotFoundException('Company balance not found');
            }
            if (companyBalance.balance.lt(totalCost)) {
                throw new common_1.BadRequestException('Insufficient balance');
            }
            const newBalance = companyBalance.balance.sub(totalCost);
            await this.prisma.companyBalance.update({
                where: { companyId },
                data: { balance: newBalance }
            });
            const transaction = await this.prisma.transaction.create({
                data: {
                    companyId,
                    type: 'DEBIT',
                    amount: totalCost,
                    currency: 'USD',
                    description: `AI request - ${inputTokens} input + ${outputTokens} output tokens`,
                    status: 'COMPLETED',
                    metadata: {
                        inputTokens,
                        outputTokens,
                        inputTokenPrice,
                        outputTokenPrice,
                        provider: request.provider,
                        model: request.model,
                        ...request.metadata
                    }
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Pay-as-you-go billing processed', {
                companyId,
                amountCharged: totalCost.toString(),
                transactionId: transaction.id
            });
            return {
                success: true,
                amountCharged: totalCost,
                tokensUsed: {
                    input: inputTokens,
                    output: outputTokens
                },
                billingMethod: 'pay_as_you_go',
                transactionId: transaction.id
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process pay-as-you-go billing', error, {
                companyId: request.companyId
            });
            throw error;
        }
    }
    async getActiveSubscription(companyId) {
        return await this.prisma.subscription.findFirst({
            where: {
                companyId,
                status: 'ACTIVE',
                currentPeriodEnd: { gt: new Date() }
            },
            include: {
                plan: true
            }
        });
    }
    async updateSubscriptionUsage(subscriptionId, inputTokens, outputTokens) {
        await this.prisma.subscription.update({
            where: { id: subscriptionId },
            data: {
                inputTokensUsed: {
                    increment: inputTokens
                },
                outputTokensUsed: {
                    increment: outputTokens
                }
            }
        });
    }
    async getSubscriptionUsage(companyId) {
        const subscription = await this.getActiveSubscription(companyId);
        if (!subscription) {
            return null;
        }
        const inputTokensRemaining = (subscription.inputTokensLimit || 0) - subscription.inputTokensUsed;
        const outputTokensRemaining = (subscription.outputTokensLimit || 0) - subscription.outputTokensUsed;
        const totalTokensLimit = (subscription.inputTokensLimit || 0) + (subscription.outputTokensLimit || 0);
        const totalTokensUsed = subscription.inputTokensUsed + subscription.outputTokensUsed;
        const usagePercentage = totalTokensLimit > 0 ? (totalTokensUsed / totalTokensLimit) * 100 : 0;
        return {
            subscriptionId: subscription.id,
            planName: subscription.plan.name,
            inputTokensUsed: subscription.inputTokensUsed,
            outputTokensUsed: subscription.outputTokensUsed,
            inputTokensLimit: subscription.inputTokensLimit || 0,
            outputTokensLimit: subscription.outputTokensLimit || 0,
            inputTokensRemaining: Math.max(0, inputTokensRemaining),
            outputTokensRemaining: Math.max(0, outputTokensRemaining),
            usagePercentage: Math.round(usagePercentage * 100) / 100,
            periodEnd: subscription.currentPeriodEnd
        };
    }
};
exports.SubscriptionBillingService = SubscriptionBillingService;
exports.SubscriptionBillingService = SubscriptionBillingService = SubscriptionBillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SubscriptionBillingService);
//# sourceMappingURL=subscription-billing.service.js.map