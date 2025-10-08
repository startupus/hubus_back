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
const billing_types_1 = require("../types/billing.types");
const library_1 = require("@prisma/client/runtime/library");
const billing_exceptions_1 = require("../exceptions/billing.exceptions");
let BillingService = BillingService_1 = class BillingService {
    constructor(prisma, cacheService, validationService, rabbitmq) {
        this.prisma = prisma;
        this.cacheService = cacheService;
        this.validationService = validationService;
        this.rabbitmq = rabbitmq;
        this.logger = new common_1.Logger(BillingService_1.name);
        this.maxRetries = 3;
        this.retryDelay = 1000;
    }
    async getBalance(request) {
        try {
            this.validationService.validateId(request.userId, 'User ID');
            shared_1.LoggerUtil.debug('billing-service', 'Getting user balance', { userId: request.userId });
            const cachedBalance = this.cacheService.getCachedUserBalance(request.userId);
            if (cachedBalance) {
                shared_1.LoggerUtil.debug('billing-service', 'Balance retrieved from cache', { userId: request.userId });
                return {
                    success: true,
                    balance: cachedBalance
                };
            }
            await this.validationService.validateUser(request.userId, this.prisma);
            const balance = await this.prisma.companyBalance.findUnique({
                where: { companyId: request.userId }
            });
            if (!balance) {
                const newBalance = await this.prisma.companyBalance.create({
                    data: {
                        companyId: request.userId,
                        balance: 0,
                        currency: 'USD',
                        creditLimit: 0
                    }
                });
                this.cacheService.cacheUserBalance(request.userId, newBalance);
                shared_1.LoggerUtil.info('billing-service', 'New balance created', { userId: request.userId });
                return {
                    success: true,
                    balance: newBalance
                };
            }
            this.cacheService.cacheUserBalance(request.userId, balance);
            shared_1.LoggerUtil.info('billing-service', 'Balance retrieved successfully', {
                userId: request.userId,
                balance: balance.balance.toString()
            });
            return {
                success: true,
                balance: balance
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get balance', error, { userId: request.userId });
            if (error instanceof billing_exceptions_1.UserNotFoundException) {
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
                this.validationService.validateId(request.userId, 'User ID');
                this.validationService.validateAmount(request.amount);
                this.validationService.validateMetadata(request.metadata);
                shared_1.LoggerUtil.debug('billing-service', 'Updating user balance', {
                    userId: request.userId,
                    amount: request.amount,
                    operation: request.operation,
                    attempt
                });
                await this.validationService.validateUser(request.userId, this.prisma);
                const result = await this.prisma.$transaction(async (tx) => {
                    const currentBalance = await tx.companyBalance.findUnique({
                        where: { companyId: request.userId }
                    });
                    if (!currentBalance) {
                        throw new common_1.NotFoundException('User balance not found');
                    }
                    this.validationService.validateBalanceForOperation(currentBalance.balance, request.amount, request.operation, currentBalance.creditLimit);
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
                        where: { companyId: request.userId },
                        data: {
                            balance: newBalance,
                            lastUpdated: new Date()
                        }
                    });
                    const transaction = await tx.transaction.create({
                        data: {
                            companyId: currentBalance.companyId,
                            userId: request.userId,
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
                this.cacheService.invalidateUserBalance(request.userId);
                shared_1.LoggerUtil.info('billing-service', 'Balance updated successfully', {
                    userId: request.userId,
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
                    userId: request.userId,
                    attempt,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        shared_1.LoggerUtil.error('billing-service', 'Failed to update balance after retries', lastError, {
            userId: request.userId,
            attempts: this.maxRetries
        });
        return {
            success: false,
            error: lastError instanceof Error ? lastError.message : 'Unknown error'
        };
    }
    async trackUsage(request) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Tracking usage', {
                userId: request.userId,
                service: request.service,
                resource: request.resource,
                quantity: request.quantity
            });
            const costCalculation = await this.calculateCost({
                userId: request.userId,
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
                    companyId: request.companyId || 'default-company',
                    userId: request.userId,
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
                userId: request.userId,
                amount: costCalculation.cost,
                operation: 'subtract',
                description: `Usage: ${request.service}/${request.resource}`,
                reference: usageEvent.id
            });
            shared_1.LoggerUtil.info('billing-service', 'Usage tracked successfully', {
                userId: request.userId,
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
            shared_1.LoggerUtil.error('billing-service', 'Failed to track usage', error, { userId: request.userId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async calculateCost(request) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Calculating cost', {
                userId: request.userId,
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
            shared_1.LoggerUtil.error('billing-service', 'Failed to calculate cost', error, { userId: request.userId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async createTransaction(request) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Creating transaction', {
                userId: request.userId,
                type: request.type,
                amount: request.amount
            });
            const transaction = await this.prisma.transaction.create({
                data: {
                    companyId: request.companyId || 'default-company',
                    userId: request.userId,
                    type: request.type,
                    amount: new library_1.Decimal(request.amount),
                    currency: request.currency || 'USD',
                    description: request.description,
                    reference: request.reference,
                    status: billing_types_1.TransactionStatus.PENDING,
                    metadata: request.metadata,
                    paymentMethodId: request.paymentMethodId
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Transaction created successfully', {
                transactionId: transaction.id,
                userId: request.userId,
                amount: request.amount
            });
            try {
                await this.rabbitmq.publishCriticalMessage('analytics.events', {
                    eventType: 'transaction_created',
                    userId: request.userId,
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
            shared_1.LoggerUtil.error('billing-service', 'Failed to create transaction', error, { userId: request.userId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async processPayment(request) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Processing payment', {
                userId: request.userId,
                amount: request.amount,
                paymentMethodId: request.paymentMethodId
            });
            const transactionResult = await this.createTransaction({
                userId: request.userId,
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
                userId: request.userId,
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
                userId: request.userId,
                amount: request.amount
            });
            return {
                success: true,
                transaction: transactionResult.transaction
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process payment', error, { userId: request.userId });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async getBillingReport(userId, startDate, endDate) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Generating billing report', { userId, startDate, endDate });
            const usageEvents = await this.prisma.usageEvent.findMany({
                where: {
                    userId,
                    timestamp: {
                        gte: startDate,
                        lte: endDate
                    }
                }
            });
            const transactions = await this.prisma.transaction.findMany({
                where: {
                    userId,
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
                userId,
                period: { start: startDate, end: endDate },
                totalUsage,
                totalCost,
                currency: 'USD',
                breakdown,
                transactions: transactions
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to generate billing report', error, { userId });
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
    async checkUsageLimits(userId, service, resource) {
        try {
            const limits = await this.getUsageLimits(userId, service, resource);
            if (!limits)
                return true;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const todayUsage = await this.prisma.usageEvent.aggregate({
                where: {
                    userId,
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
            shared_1.LoggerUtil.error('billing-service', 'Usage limits check failed', error, { userId, service, resource });
            return false;
        }
    }
    async getUsageLimits(userId, service, resource) {
        return null;
    }
    async auditOperation(operation, userId, details) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Audit operation', {
                operation,
                userId,
                details,
                timestamp: new Date().toISOString()
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Audit operation failed', error, { operation, userId });
        }
    }
    async getTransactions(userId, limit = 50, offset = 0) {
        try {
            const transactions = await this.prisma.transaction.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            });
            return transactions;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get transactions', error, { userId });
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
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = BillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        cache_service_1.CacheService,
        validation_service_1.ValidationService,
        shared_2.RabbitMQClient])
], BillingService);
//# sourceMappingURL=billing.service.js.map