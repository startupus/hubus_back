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
var BillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const cache_service_1 = require("../common/cache/cache.service");
const validation_service_1 = require("../common/validation/validation.service");
const shared_1 = require("@ai-aggregator/shared");
const shared_2 = require("@ai-aggregator/shared");
const referral_service_1 = require("./referral.service");
const billing_types_1 = require("../types/billing.types");
const library_1 = require("@prisma/client/runtime/library");
const billing_exceptions_1 = require("../exceptions/billing.exceptions");
let BillingService = BillingService_1 = class BillingService {
    constructor(prisma, cacheService, validationService, rabbitmq, referralService) {
        this.prisma = prisma;
        this.cacheService = cacheService;
        this.validationService = validationService;
        this.rabbitmq = rabbitmq;
        this.referralService = referralService;
        this.logger = new common_1.Logger(BillingService_1.name);
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }
    async getBalance(request) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'getBalance method called', { companyId: request.companyId });
            this.validationService.validateId(request.companyId, 'User ID');
            shared_1.LoggerUtil.debug('billing-service', 'Getting user balance', { companyId: request.companyId });
            shared_1.LoggerUtil.debug('billing-service', 'Getting fresh balance from database', { companyId: request.companyId });
            const cachedBalance = this.cacheService.getCachedCompanyBalance(request.companyId);
            if (cachedBalance) {
                shared_1.LoggerUtil.debug('billing-service', 'Found cached balance but ignoring it', {
                    companyId: request.companyId,
                    cachedBalance: cachedBalance.balance.toString()
                });
            }
            await this.validationService.validateCompany(request.companyId, this.prisma);
            const balance = await this.prisma.companyBalance.findUnique({
                where: { companyId: request.companyId }
            });
            if (!balance) {
                const newBalance = await this.prisma.companyBalance.create({
                    data: {
                        company: {
                            connect: { id: request.companyId }
                        },
                        balance: 0,
                        currency: 'USD',
                        creditLimit: 0
                    }
                });
                this.cacheService.cacheCompanyBalance(request.companyId, newBalance);
                shared_1.LoggerUtil.info('billing-service', 'New balance created', { companyId: request.companyId });
                return {
                    success: true,
                    balance: newBalance
                };
            }
            shared_1.LoggerUtil.info('billing-service', 'Balance retrieved successfully', {
                companyId: request.companyId,
                balance: balance.balance.toString()
            });
            return {
                success: true,
                balance: balance
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get balance', error, { companyId: request.companyId });
            if (error instanceof billing_exceptions_1.CompanyNotFoundException) {
                return {
                    success: false,
                    error: error.message
                };
            }
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async updateBalance(request) {
        let lastError = null;
        for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
            try {
                this.validationService.validateId(request.companyId, 'User ID');
                this.validationService.validateAmount(request.amount);
                this.validationService.validateMetadata(request.metadata);
                shared_1.LoggerUtil.debug('billing-service', 'Updating user balance', {
                    companyId: request.companyId,
                    amount: request.amount,
                    operation: request.operation,
                    attempt
                });
                await this.validationService.validateCompany(request.companyId, this.prisma);
                const result = await this.prisma.$transaction(async (tx) => {
                    const currentBalance = await tx.companyBalance.findUnique({
                        where: { companyId: request.companyId }
                    });
                    if (!currentBalance) {
                        throw new common_1.NotFoundException('User balance not found');
                    }
                    this.validationService.validateBalanceForOperation(currentBalance.balance, request.amount, request.operation, currentBalance.creditLimit || new library_1.Decimal(0));
                    shared_1.LoggerUtil.debug('billing-service', 'Creating amount from request', {
                        originalAmount: request.amount,
                        amountType: typeof request.amount,
                        amountString: String(request.amount)
                    });
                    const amount = new library_1.Decimal(request.amount);
                    shared_1.LoggerUtil.debug('billing-service', 'Decimal amount created', {
                        amount: amount.toString(),
                        amountValue: amount.toNumber()
                    });
                    const newBalance = request.operation === 'add'
                        ? currentBalance.balance.add(amount)
                        : currentBalance.balance.sub(amount);
                    const updatedBalance = await tx.companyBalance.update({
                        where: { companyId: request.companyId },
                        data: {
                            balance: newBalance,
                            lastUpdated: new Date()
                        }
                    });
                    const transaction = await tx.transaction.create({
                        data: {
                            company: {
                                connect: { id: currentBalance.companyId }
                            },
                            type: request.operation === 'add' ? billing_types_1.TransactionType.CREDIT : billing_types_1.TransactionType.DEBIT,
                            amount: amount,
                            currency: currentBalance.currency,
                            description: request.description || `Balance ${request.operation}`,
                            reference: request.reference,
                            status: billing_types_1.TransactionStatus.COMPLETED,
                            processedAt: new Date(),
                            metadata: request.metadata
                        }
                    });
                    return { updatedBalance, transaction };
                });
                this.cacheService.invalidateCompanyBalance(request.companyId);
                shared_1.LoggerUtil.debug('billing-service', 'Checking referral bonus conditions', {
                    operation: request.operation,
                    hasInputTokens: !!request.metadata?.inputTokens,
                    hasOutputTokens: !!request.metadata?.outputTokens,
                    inputTokens: request.metadata?.inputTokens,
                    outputTokens: request.metadata?.outputTokens,
                    companyId: request.companyId,
                    metadata: request.metadata
                });
                shared_1.LoggerUtil.debug('billing-service', 'Referral bonus condition check', {
                    operationCheck: request.operation === 'subtract',
                    inputTokensCheck: !!request.metadata?.inputTokens,
                    inputTokensValue: request.metadata?.inputTokens,
                    conditionResult: request.operation === 'subtract' && request.metadata?.inputTokens
                });
                if (request.operation === 'subtract' && request.metadata?.inputTokens) {
                    shared_1.LoggerUtil.debug('billing-service', 'Processing referral bonus', {
                        companyId: request.companyId,
                        transactionId: result.transaction.id,
                        inputTokens: request.metadata.inputTokens,
                        outputTokens: request.metadata.outputTokens
                    });
                    try {
                        await this.processReferralBonus(request.companyId, result.transaction.id, request.metadata.inputTokens, request.metadata.outputTokens, request.metadata.inputTokenPrice, request.metadata.outputTokenPrice);
                    }
                    catch (referralError) {
                        shared_1.LoggerUtil.warn('billing-service', 'Failed to process referral bonus', {
                            companyId: request.companyId,
                            transactionId: result.transaction.id,
                            error: referralError instanceof Error ? referralError.message : String(referralError),
                        });
                    }
                }
                shared_1.LoggerUtil.info('billing-service', 'Balance updated successfully', {
                    companyId: request.companyId,
                    newBalance: result.updatedBalance.balance.toString(),
                    operation: request.operation,
                    attempt
                });
                return {
                    success: true,
                    balance: result.updatedBalance,
                    transaction: result.transaction
                };
            }
            catch (error) {
                lastError = error;
                if (attempt === this.maxRetries || !this.isRetryableError(error)) {
                    break;
                }
                await this.delay(this.retryDelay * attempt);
                shared_1.LoggerUtil.warn('billing-service', 'Balance update retry', {
                    companyId: request.companyId,
                    attempt,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        shared_1.LoggerUtil.error('billing-service', 'Failed to update balance after retries', lastError, {
            companyId: request.companyId,
            attempts: this.maxRetries
        });
        return {
            success: false,
            error: lastError instanceof Error ? lastError.message : 'Unknown error'
        };
    }
    async trackUsage(request) {
        try {
            const initiatorCompanyId = request.companyId;
            shared_1.LoggerUtil.debug('billing-service', 'Tracking usage', {
                initiatorCompanyId,
                service: request.service,
                resource: request.resource,
                quantity: request.quantity
            });
            shared_1.LoggerUtil.debug('billing-service', 'Determining payer company', {
                initiatorCompanyId
            });
            const { payerId, initiatorId } = await this.determinePayerCompany(initiatorCompanyId);
            shared_1.LoggerUtil.debug('billing-service', 'Payer determined', {
                initiatorId,
                payerId,
                willChargeFrom: payerId
            });
            const costCalculation = await this.calculateCost({
                companyId: payerId,
                service: request.service,
                resource: request.resource,
                quantity: request.quantity || 1,
                metadata: request.metadata
            });
            if (!costCalculation.success || !costCalculation.cost) {
                throw new common_1.BadRequestException('Failed to calculate cost');
            }
            const usageEvent = await this.prisma.usageEvent.create({
                data: {
                    company: {
                        connect: { id: payerId }
                    },
                    initiatorCompany: initiatorId ? {
                        connect: { id: initiatorId }
                    } : undefined,
                    service: request.service,
                    resource: request.resource,
                    quantity: request.quantity || 1,
                    unit: request.unit || 'request',
                    cost: new library_1.Decimal(costCalculation.cost),
                    currency: costCalculation.currency || 'USD',
                    metadata: request.metadata
                }
            });
            await this.updateBalance({
                companyId: payerId,
                amount: costCalculation.cost,
                operation: 'subtract',
                description: `Usage by ${initiatorId === payerId ? 'self' : initiatorId}: ${request.service}/${request.resource}`,
                reference: usageEvent.id,
                metadata: {
                    ...request.metadata,
                    inputTokens: request.quantity || 0,
                    outputTokens: 0,
                    inputTokenPrice: new library_1.Decimal(costCalculation.cost).div(request.quantity || 1),
                    outputTokenPrice: new library_1.Decimal(0)
                }
            });
            await this.prisma.transaction.create({
                data: {
                    company: {
                        connect: { id: payerId }
                    },
                    initiatorCompany: initiatorId && initiatorId !== payerId ? {
                        connect: { id: initiatorId }
                    } : undefined,
                    type: 'DEBIT',
                    amount: new library_1.Decimal(costCalculation.cost),
                    currency: costCalculation.currency || 'USD',
                    description: `Usage: ${request.service}/${request.resource}`,
                    status: 'COMPLETED',
                    reference: `${usageEvent.id}-tx`,
                    processedAt: new Date()
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Usage tracked successfully', {
                payerId,
                initiatorId,
                service: request.service,
                resource: request.resource,
                cost: costCalculation.cost
            });
            return {
                success: true,
                usageEvent: usageEvent,
                cost: costCalculation.cost
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to track usage', error, { companyId: request.companyId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async calculateCost(request) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Calculating cost', {
                companyId: request.companyId,
                service: request.service,
                resource: request.resource,
                quantity: request.quantity
            });
            const pricingRules = await this.getPricingRules(request.service, request.resource);
            if (!pricingRules || pricingRules.length === 0) {
                const defaultCost = this.getDefaultPricing(request.service, request.resource);
                const totalCost = defaultCost * request.quantity;
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
                let ruleCost = 0;
                switch (rule.type) {
                    case 'fixed':
                        ruleCost = rule.price;
                        break;
                    case 'per_unit':
                        ruleCost = rule.price * request.quantity;
                        break;
                    case 'tiered':
                        ruleCost = this.calculateTieredPricing(rule, request.quantity);
                        break;
                }
                if (rule.discounts && rule.discounts.length > 0) {
                    const discountAmount = this.calculateDiscounts(rule.discounts, ruleCost, request);
                    ruleCost -= discountAmount;
                    breakdown.discounts += discountAmount;
                }
                totalCost += ruleCost;
                breakdown.usageCost += ruleCost;
            }
            breakdown.total = totalCost;
            return {
                success: true,
                cost: totalCost,
                currency: 'USD',
                breakdown
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to calculate cost', error, { companyId: request.companyId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async createTransaction(request) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Creating transaction', {
                companyId: request.companyId,
                type: request.type,
                amount: request.amount,
                fullRequest: request
            });
            if (!request.companyId) {
                throw new Error('companyId is required');
            }
            const transaction = await this.prisma.transaction.create({
                data: {
                    company: {
                        connect: { id: request.companyId }
                    },
                    type: request.type,
                    amount: new library_1.Decimal(request.amount),
                    currency: request.currency || 'USD',
                    description: request.description,
                    reference: request.reference,
                    status: billing_types_1.TransactionStatus.PENDING,
                    metadata: request.metadata,
                    paymentMethod: request.paymentMethodId ? {
                        connect: { id: request.paymentMethodId }
                    } : undefined
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Transaction created successfully', {
                transactionId: transaction.id,
                companyId: request.companyId,
                amount: request.amount
            });
            try {
                await this.rabbitmq.publishCriticalMessage('analytics.events', {
                    eventType: 'transaction_created',
                    companyId: request.companyId,
                    transactionId: transaction.id,
                    amount: request.amount,
                    type: request.type,
                    timestamp: new Date().toISOString(),
                    metadata: {
                        service: 'billing-service',
                        currency: request.currency || 'USD',
                        description: request.description
                    }
                });
            }
            catch (rabbitError) {
                shared_1.LoggerUtil.warn('billing-service', 'Failed to send analytics event', { error: rabbitError });
            }
            return {
                success: true,
                transaction: transaction
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to create transaction', error, { companyId: request.companyId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async processPayment(request) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Processing payment', {
                companyId: request.companyId,
                amount: request.amount,
                paymentMethodId: request.paymentMethodId
            });
            const transactionResult = await this.createTransaction({
                companyId: request.companyId,
                type: billing_types_1.TransactionType.CREDIT,
                amount: request.amount,
                currency: request.currency,
                description: request.description || 'Payment',
                metadata: request.metadata,
                paymentMethodId: request.paymentMethodId
            });
            if (!transactionResult.success || !transactionResult.transaction) {
                throw new common_1.BadRequestException('Failed to create transaction');
            }
            const balanceResult = await this.updateBalance({
                companyId: request.companyId,
                amount: request.amount,
                operation: 'add',
                description: 'Payment received',
                reference: transactionResult.transaction.id
            });
            if (!balanceResult.success) {
                throw new common_1.BadRequestException('Failed to update balance');
            }
            await this.prisma.transaction.update({
                where: { id: transactionResult.transaction.id },
                data: {
                    status: billing_types_1.TransactionStatus.COMPLETED,
                    processedAt: new Date()
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Payment processed successfully', {
                transactionId: transactionResult.transaction.id,
                companyId: request.companyId,
                amount: request.amount
            });
            return {
                success: true,
                transaction: transactionResult.transaction
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process payment', error, { companyId: request.companyId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getBillingReport(companyId, startDate, endDate) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Generating billing report', { companyId, startDate, endDate });
            const usageEvents = await this.prisma.usageEvent.findMany({
                where: {
                    companyId,
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            const transactions = await this.prisma.transaction.findMany({
                where: {
                    companyId,
                    createdAt: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            const totalUsage = usageEvents.reduce((sum, event) => sum + event.quantity, 0);
            const totalCost = usageEvents.reduce((sum, event) => sum + Number(event.cost), 0);
            const breakdown = {
                byService: this.groupByService(usageEvents),
                byResource: this.groupByResource(usageEvents),
                byDay: this.groupByDay(usageEvents)
            };
            return {
                companyId: companyId,
                period: { start: startDate, end: endDate },
                totalUsage,
                totalCost,
                currency: 'USD',
                breakdown,
                transactions: transactions
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to generate billing report', error, { companyId });
            throw error;
        }
    }
    async getPricingRules(service, resource) {
        return [];
    }
    getDefaultPricing(service, resource) {
        const defaultPricing = {
            'ai-chat': {
                'gpt-4': 0.03,
                'gpt-3.5-turbo': 0.002,
                'claude-3': 0.015
            },
            'ai-image': {
                'dall-e-3': 0.04,
                'midjourney': 0.02
            },
            'api': {
                'request': 0.001,
                'data': 0.0001
            }
        };
        return defaultPricing[service]?.[resource] || 0.01;
    }
    calculateTieredPricing(rule, quantity) {
        return rule.price * quantity;
    }
    calculateDiscounts(discounts, cost, request) {
        return 0;
    }
    groupByService(events) {
        return events.reduce((acc, event) => {
            acc[event.service] = (acc[event.service] || 0) + event.quantity;
            return acc;
        }, {});
    }
    groupByResource(events) {
        return events.reduce((acc, event) => {
            acc[event.resource] = (acc[event.resource] || 0) + event.quantity;
            return acc;
        }, {});
    }
    groupByDay(events) {
        return events.reduce((acc, event) => {
            const day = event.timestamp.toISOString().split('T')[0];
            acc[day] = (acc[day] || 0) + event.quantity;
            return acc;
        }, {});
    }
    isRetryableError(error) {
        if (!error)
            return false;
        const retryableErrors = [
            'P2002',
            'P2034',
            'P2025',
            'ECONNRESET',
            'ETIMEDOUT',
            'ENOTFOUND'
        ];
        const errorMessage = error.message || error.code || '';
        return retryableErrors.some(retryableError => errorMessage.includes(retryableError));
    }
    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    validateAndNormalizeRequest(request) {
        const normalized = { ...request };
        Object.keys(normalized).forEach(key => {
            if (typeof normalized[key] === 'string') {
                normalized[key] = normalized[key].trim();
            }
        });
        return normalized;
    }
    generateTransactionId() {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substr(2, 9);
        return `txn_${timestamp}_${random}`;
    }
    async checkUsageLimits(companyId, service, resource) {
        try {
            const limits = await this.getUsageLimits(companyId, service, resource);
            if (!limits)
                return true;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayUsage = await this.prisma.usageEvent.aggregate({
                where: {
                    companyId,
                    service,
                    resource,
                    timestamp: { gte: today }
                },
                _sum: { quantity: true }
            });
            if (limits.daily && todayUsage._sum.quantity && todayUsage._sum.quantity >= limits.daily) {
                throw new Error('Daily usage limit exceeded');
            }
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Usage limits check failed', error, { companyId, service, resource });
            return false;
        }
    }
    async getUsageLimits(companyId, service, resource) {
        return null;
    }
    async auditOperation(operation, companyId, details) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Audit operation', {
                operation,
                companyId,
                details,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Audit operation failed', error, { operation, companyId });
        }
    }
    async getTransactions(companyId, limit = 50, offset = 0) {
        try {
            const transactions = await this.prisma.transaction.findMany({
                where: { companyId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            });
            return transactions;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get transactions', error, { companyId });
            throw error;
        }
    }
    async getTransactionById(transactionId) {
        try {
            const transaction = await this.prisma.transaction.findUnique({
                where: { id: transactionId }
            });
            return transaction;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get transaction by ID', error, { transactionId });
            throw error;
        }
    }
    async getTransactionByPaymentId(paymentId) {
        try {
            const transaction = await this.prisma.transaction.findFirst({
                where: {
                    metadata: {
                        path: ['paymentId'],
                        equals: paymentId
                    }
                }
            });
            return transaction;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get transaction by payment ID', error, { paymentId });
            return null;
        }
    }
    async updateTransaction(transactionId, updateData) {
        try {
            const updatedTransaction = await this.prisma.transaction.update({
                where: { id: transactionId },
                data: updateData
            });
            return updatedTransaction;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to update transaction', error, { transactionId });
            throw error;
        }
    }
    async deleteTransaction(transactionId) {
        try {
            const deletedTransaction = await this.prisma.transaction.delete({
                where: { id: transactionId }
            });
            return deletedTransaction;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to delete transaction', error, { transactionId });
            throw error;
        }
    }
    async determinePayerCompany(initiatorCompanyId) {
        try {
            const company = await this.prisma.company.findUnique({
                where: { id: initiatorCompanyId },
                include: {
                    parentCompany: {
                        select: { id: true }
                    }
                }
            });
            if (!company) {
                throw new billing_exceptions_1.CompanyNotFoundException(`Company not found: ${initiatorCompanyId}`);
            }
            if (company.billingMode === 'PARENT_PAID' && company.parentCompany) {
                shared_1.LoggerUtil.debug('billing-service', 'Billing mode: PARENT_PAID', {
                    initiatorId: initiatorCompanyId,
                    payerId: company.parentCompany.id
                });
                return {
                    payerId: company.parentCompany.id,
                    initiatorId: initiatorCompanyId
                };
            }
            shared_1.LoggerUtil.debug('billing-service', 'Billing mode: SELF_PAID', {
                companyId: initiatorCompanyId
            });
            return {
                payerId: initiatorCompanyId,
                initiatorId: initiatorCompanyId
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to determine payer company', error, { initiatorCompanyId });
            throw error;
        }
    }
    async refundPayment(refundData) {
        try {
            return {
                success: true,
                refundId: `refund_${Date.now()}`,
                status: 'COMPLETED'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process refund', error, { refundData });
            return {
                success: false,
                error: 'Refund failed'
            };
        }
    }
    async getCompanyUsersStatistics(companyId, startDate, endDate) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Getting company child companies statistics', {
                companyId,
                startDate,
                endDate
            });
            const childCompanies = await this.prisma.company.findMany({
                where: { parentCompanyId: companyId },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    position: true,
                    department: true,
                    billingMode: true,
                }
            });
            const childCompaniesStatistics = await Promise.all(childCompanies.map(async (child) => {
                const usageEvents = await this.prisma.usageEvent.findMany({
                    where: {
                        initiatorCompanyId: child.id,
                        timestamp: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                });
                const transactions = await this.prisma.transaction.findMany({
                    where: {
                        initiatorCompanyId: child.id,
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                });
                const totalRequests = usageEvents.length;
                const totalCost = usageEvents.reduce((sum, event) => sum + Number(event.cost), 0);
                const totalTransactions = transactions.length;
                const byService = usageEvents.reduce((acc, event) => {
                    if (!acc[event.service]) {
                        acc[event.service] = {
                            count: 0,
                            cost: 0
                        };
                    }
                    acc[event.service].count += 1;
                    acc[event.service].cost += Number(event.cost);
                    return acc;
                }, {});
                return {
                    company: {
                        id: child.id,
                        name: child.name,
                        email: child.email,
                        position: child.position,
                        department: child.department,
                        billingMode: child.billingMode,
                    },
                    statistics: {
                        totalRequests,
                        totalCost,
                        totalTransactions,
                        byService
                    }
                };
            }));
            const totalUsageEvents = await this.prisma.usageEvent.findMany({
                where: {
                    companyId: companyId,
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            const companyTotals = {
                totalChildCompanies: childCompanies.length,
                totalRequests: totalUsageEvents.length,
                totalCost: totalUsageEvents.reduce((sum, event) => sum + Number(event.cost), 0),
                totalTransactions: await this.prisma.transaction.count({
                    where: {
                        companyId: companyId,
                        createdAt: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                }),
            };
            return {
                companyId,
                period: { start: startDate, end: endDate },
                totals: companyTotals,
                childCompanies: childCompaniesStatistics
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get company child companies statistics', error, { companyId });
            throw error;
        }
    }
    async processReferralBonus(companyId, transactionId, inputTokens, outputTokens, inputTokenPrice, outputTokenPrice) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'processReferralBonus called', {
                companyId,
                transactionId,
                inputTokens,
                outputTokens
            });
            const company = await this.prisma.company.findUnique({
                where: { id: companyId },
                select: { referredBy: true },
            });
            shared_1.LoggerUtil.debug('billing-service', 'Company found', {
                companyId,
                referredBy: company?.referredBy
            });
            if (!company?.referredBy) {
                shared_1.LoggerUtil.debug('billing-service', 'Company is not a referral, skipping', { companyId });
                return;
            }
            const defaultInputPrice = new library_1.Decimal('0.00003');
            const defaultOutputPrice = new library_1.Decimal('0.00006');
            const inputPrice = inputTokenPrice ? new library_1.Decimal(inputTokenPrice.toString()) : defaultInputPrice;
            const outputPrice = outputTokenPrice ? new library_1.Decimal(outputTokenPrice.toString()) : defaultOutputPrice;
            await this.referralService.createReferralTransaction({
                referralOwnerId: company.referredBy,
                originalTransactionId: transactionId,
                inputTokens,
                outputTokens,
                inputTokenPrice: inputPrice,
                outputTokenPrice: outputPrice,
                description: `Referral bonus for AI request (${inputTokens} input + ${outputTokens} output tokens)`,
                metadata: {
                    transactionId,
                    companyId,
                    inputTokens,
                    outputTokens,
                },
            });
            shared_1.LoggerUtil.info('billing-service', 'Referral bonus processed', {
                companyId,
                referrerId: company.referredBy,
                transactionId,
                inputTokens,
                outputTokens,
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process referral bonus', error, {
                companyId,
                transactionId,
                inputTokens,
                outputTokens,
            });
            throw error;
        }
    }
    async topUpBalance(request) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'topUpBalance method called', {
                companyId: request.companyId,
                amount: request.amount
            });
            this.validationService.validateId(request.companyId, 'Company ID');
            if (request.amount <= 0) {
                throw new billing_exceptions_1.InvalidAmountException(request.amount);
            }
            const amount = new library_1.Decimal(request.amount);
            const currentBalance = await this.prisma.companyBalance.findUnique({
                where: { companyId: request.companyId }
            });
            if (!currentBalance) {
                throw new billing_exceptions_1.CompanyNotFoundException(`Company with ID ${request.companyId} not found`);
            }
            const newBalance = currentBalance.balance.add(amount);
            const updatedBalance = await this.prisma.companyBalance.update({
                where: { companyId: request.companyId },
                data: {
                    balance: newBalance,
                    lastUpdated: new Date()
                }
            });
            await this.prisma.transaction.create({
                data: {
                    company: {
                        connect: { id: request.companyId }
                    },
                    type: billing_types_1.TransactionType.CREDIT,
                    amount: amount,
                    currency: request.currency || 'USD',
                    description: `Balance top-up: +$${request.amount}`,
                    status: billing_types_1.TransactionStatus.COMPLETED,
                    reference: `topup-${Date.now()}`,
                    processedAt: new Date()
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Balance topped up successfully', {
                companyId: request.companyId,
                amount: request.amount,
                newBalance: newBalance.toString()
            });
            return {
                success: true,
                balance: newBalance.toNumber()
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to top up balance', error, {
                companyId: request.companyId,
                amount: request.amount
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async chargeForSubscription(companyId, amount, planId) {
        this.logger.log(`Charging ${amount} for subscription plan ${planId} for company ${companyId}`);
        const balance = await this.getBalance({ companyId });
        if (new library_1.Decimal(balance.balance.toString()).lt(amount)) {
            throw new common_1.BadRequestException('Insufficient balance for subscription');
        }
        await this.prisma.companyBalance.update({
            where: { companyId },
            data: {
                balance: {
                    decrement: amount
                }
            }
        });
        await this.prisma.transaction.create({
            data: {
                companyId,
                type: 'DEBIT',
                amount: amount.toNumber(),
                description: `Subscription payment for plan ${planId}`,
                metadata: {
                    planId,
                    type: 'subscription_payment'
                }
            }
        });
        this.logger.log(`Successfully charged ${amount} for subscription plan ${planId}`);
    }
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        validation_service_1.ValidationService,
        shared_2.RabbitMQClient,
        referral_service_1.ReferralService])
], BillingService);
//# sourceMappingURL=billing.service.js.map