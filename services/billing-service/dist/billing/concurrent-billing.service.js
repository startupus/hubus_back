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
var ConcurrentBillingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConcurrentBillingService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
const shared_2 = require("@ai-aggregator/shared");
const prisma_service_1 = require("../common/prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let ConcurrentBillingService = ConcurrentBillingService_1 = class ConcurrentBillingService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ConcurrentBillingService_1.name);
        this.balanceCache = new shared_2.ConcurrentCache();
        this.pricingCache = new shared_2.ConcurrentCache();
        this.currencyCache = new shared_2.ConcurrentCache();
        this.transactionCounter = new shared_2.AtomicCounter(0);
        this.totalRevenue = new shared_2.AtomicCounter(0);
        this.activeUsers = new shared_2.AtomicCounter(0);
        this.transactionQueue = new shared_2.ConcurrentQueue();
        this.userLocks = new shared_2.ConcurrentMap();
        this.startTransactionProcessor();
    }
    async getBalance(companyId) {
        try {
            const cached = this.balanceCache.get(companyId);
            if (cached && (Date.now() - cached.lastUpdated.getTime()) < 60000) {
                shared_1.LoggerUtil.debug('billing-service', 'Balance retrieved from cache', { companyId });
                return { balance: cached.balance, currency: cached.currency };
            }
            const userLock = this.getUserLock(companyId);
            await this.acquireLock(userLock);
            try {
                const balance = await this.prisma.companyBalance.findUnique({
                    where: { companyId: companyId }
                });
                if (!balance) {
                    const newBalance = await this.prisma.companyBalance.create({
                        data: {
                            companyId: companyId,
                            balance: 0,
                            currency: 'USD',
                            creditLimit: 0
                        }
                    });
                    this.balanceCache.set(companyId, {
                        balance: newBalance.balance,
                        currency: newBalance.currency,
                        lastUpdated: new Date()
                    });
                    return { balance: newBalance.balance, currency: newBalance.currency };
                }
                this.balanceCache.set(companyId, {
                    balance: balance.balance,
                    currency: balance.currency,
                    lastUpdated: new Date()
                });
                shared_1.LoggerUtil.info('billing-service', 'Balance retrieved successfully', {
                    companyId,
                    balance: balance.balance.toString()
                });
                return { balance: balance.balance, currency: balance.currency };
            }
            finally {
                this.releaseLock(userLock);
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get balance', error, { companyId });
            throw error;
        }
    }
    async updateBalance(companyId, amount, type, description, metadata) {
        try {
            const userLock = this.getUserLock(companyId);
            await this.acquireLock(userLock);
            try {
                const currentBalance = await this.prisma.companyBalance.findUnique({
                    where: { companyId: companyId }
                });
                if (!currentBalance) {
                    throw new Error(`User balance not found: ${companyId}`);
                }
                let newBalance;
                if (type === 'DEBIT') {
                    newBalance = currentBalance.balance.minus(amount);
                    if (newBalance.lt(0)) {
                        throw new Error(`Insufficient balance: ${currentBalance.balance.toString()}, requested: ${amount.toString()}`);
                    }
                }
                else {
                    newBalance = currentBalance.balance.plus(amount);
                }
                const updatedBalance = await this.prisma.companyBalance.update({
                    where: { companyId: companyId },
                    data: { balance: newBalance }
                });
                const transaction = await this.prisma.transaction.create({
                    data: {
                        companyId: currentBalance.companyId,
                        type,
                        amount,
                        currency: currentBalance.currency,
                        description,
                        metadata: metadata || {}
                    }
                });
                this.balanceCache.set(companyId, {
                    balance: newBalance,
                    currency: currentBalance.currency,
                    lastUpdated: new Date()
                });
                this.transactionCounter.increment();
                if (type === 'CREDIT') {
                    this.totalRevenue.increment();
                }
                shared_1.LoggerUtil.info('billing-service', 'Balance updated successfully', {
                    companyId,
                    type,
                    amount: amount.toString(),
                    newBalance: newBalance.toString(),
                    transactionId: transaction.id
                });
                return {
                    success: true,
                    newBalance,
                    transactionId: transaction.id
                };
            }
            finally {
                this.releaseLock(userLock);
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to update balance', error, { companyId });
            return {
                success: false,
                newBalance: new library_1.Decimal(0)
            };
        }
    }
    async processTransactionAsync(companyId, amount, type, description, metadata) {
        try {
            const success = this.transactionQueue.enqueue({
                companyId,
                amount,
                type,
                description,
                metadata
            });
            if (success) {
                shared_1.LoggerUtil.debug('billing-service', 'Transaction queued for processing', { companyId, type });
                return true;
            }
            else {
                shared_1.LoggerUtil.warn('billing-service', 'Transaction queue is full', { companyId });
                return false;
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to queue transaction', error, { companyId });
            return false;
        }
    }
    async processBatchTransactions(transactions) {
        try {
            const tasks = transactions.map(transaction => () => this.updateBalance(transaction.userId, transaction.amount, transaction.type, transaction.description, transaction.metadata));
            const results = await Promise.all(tasks.map(task => task()));
            return results.map(result => ({
                success: result.success,
                transactionId: result.transactionId,
                error: result.success ? undefined : 'Transaction failed'
            }));
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process batch transactions', error);
            return transactions.map(() => ({
                success: false,
                error: 'Batch processing failed'
            }));
        }
    }
    async getPricing(service, resource, quantity) {
        try {
            const cacheKey = `${service}:${resource}`;
            const cached = this.pricingCache.get(cacheKey);
            if (cached && (Date.now() - cached.lastUpdated.getTime()) < 300000) {
                shared_1.LoggerUtil.debug('billing-service', 'Pricing retrieved from cache', { service, resource });
                return { price: cached.price, currency: cached.currency };
            }
            const pricingRule = await this.prisma.pricingRule.findFirst({
                where: {
                    service,
                    resource,
                    isActive: true
                },
                orderBy: { priority: 'desc' }
            });
            if (!pricingRule) {
                throw new Error(`Pricing rule not found for ${service}:${resource}`);
            }
            const price = pricingRule.price.times(quantity);
            this.pricingCache.set(cacheKey, {
                price,
                currency: pricingRule.currency,
                lastUpdated: new Date()
            });
            shared_1.LoggerUtil.info('billing-service', 'Pricing calculated', {
                service,
                resource,
                quantity,
                price: price.toString(),
                currency: pricingRule.currency
            });
            return { price, currency: pricingRule.currency };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get pricing', error, { service, resource });
            throw error;
        }
    }
    async getCurrencyRate(fromCurrency, toCurrency) {
        try {
            if (fromCurrency === toCurrency) {
                return 1.0;
            }
            const cacheKey = `${fromCurrency}:${toCurrency}`;
            const cached = this.currencyCache.get(cacheKey);
            if (cached && (Date.now() - cached.lastUpdated.getTime()) < 3600000) {
                shared_1.LoggerUtil.debug('billing-service', 'Currency rate retrieved from cache', { fromCurrency, toCurrency });
                return cached.rate;
            }
            const currencyRate = await this.prisma.currencyRate.findFirst({
                where: {
                    fromCurrency,
                    toCurrency,
                    timestamp: {
                        gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
                    }
                },
                orderBy: { timestamp: 'desc' }
            });
            if (!currencyRate) {
                shared_1.LoggerUtil.warn('billing-service', 'Currency rate not found, using default', { fromCurrency, toCurrency });
                return 1.0;
            }
            const rate = currencyRate.rate.toNumber();
            this.currencyCache.set(cacheKey, {
                rate,
                lastUpdated: new Date()
            });
            shared_1.LoggerUtil.info('billing-service', 'Currency rate retrieved', {
                fromCurrency,
                toCurrency,
                rate
            });
            return rate;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to get currency rate', error, { fromCurrency, toCurrency });
            return 1.0;
        }
    }
    startTransactionProcessor() {
        const processTransactions = async () => {
            while (true) {
                try {
                    const transaction = this.transactionQueue.dequeueBlocking(1000);
                    if (!transaction) {
                        continue;
                    }
                    await this.updateBalance(transaction.companyId, transaction.amount, transaction.type, transaction.description, transaction.metadata);
                    shared_1.LoggerUtil.debug('billing-service', 'Transaction processed from queue', {
                        companyId: transaction.companyId,
                        type: transaction.type
                    });
                }
                catch (error) {
                    shared_1.LoggerUtil.error('billing-service', 'Failed to process transaction from queue', error);
                }
            }
        };
        setImmediate(processTransactions);
    }
    getUserLock(userId) {
        if (!this.userLocks.has(userId)) {
            this.userLocks.set(userId, new Int32Array(new SharedArrayBuffer(4)));
        }
        return this.userLocks.get(userId);
    }
    async acquireLock(lock) {
        while (!Atomics.compareExchange(lock, 0, 0, 1)) {
            Atomics.wait(lock, 0, 1);
        }
    }
    releaseLock(lock) {
        Atomics.store(lock, 0, 0);
        Atomics.notify(lock, 0, 1);
    }
    getStats() {
        return {
            totalTransactions: this.transactionCounter.get(),
            totalRevenue: this.totalRevenue.get(),
            activeUsers: this.activeUsers.get(),
            queueSize: this.transactionQueue.size(),
            cacheStats: {
                balanceCache: this.balanceCache.size(),
                pricingCache: this.pricingCache.size(),
                currencyCache: this.currencyCache.size()
            }
        };
    }
    async clearCache() {
        try {
            this.balanceCache.cleanup();
            this.pricingCache.cleanup();
            this.currencyCache.cleanup();
            shared_1.LoggerUtil.info('billing-service', 'Cache cleared successfully');
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to clear cache', error);
        }
    }
};
exports.ConcurrentBillingService = ConcurrentBillingService;
exports.ConcurrentBillingService = ConcurrentBillingService = ConcurrentBillingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConcurrentBillingService);
//# sourceMappingURL=concurrent-billing.service.js.map