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
var CriticalOperationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CriticalOperationsService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
const billing_service_1 = require("./billing.service");
const prisma_service_1 = require("../common/prisma/prisma.service");
let CriticalOperationsService = CriticalOperationsService_1 = class CriticalOperationsService {
    constructor(rabbitmqService, billingService, prisma) {
        this.rabbitmqService = rabbitmqService;
        this.billingService = billingService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(CriticalOperationsService_1.name);
    }
    async initializeCriticalHandlers() {
        try {
            await this.rabbitmqService.subscribeToCriticalMessages('billing.debit.balance', this.handleDebitBalance.bind(this));
            await this.rabbitmqService.subscribeToCriticalMessages('billing.create.transaction', this.handleCreateTransaction.bind(this));
            await this.rabbitmqService.subscribeToCriticalMessages('billing.process.payment', this.handleProcessPayment.bind(this));
            await this.rabbitmqService.subscribeToCriticalMessages('billing.sync.data', this.handleSyncData.bind(this));
            shared_1.LoggerUtil.info('billing-service', 'Critical operations handlers initialized');
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to initialize critical handlers', error);
            throw error;
        }
    }
    async publishDebitBalance(data) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Publishing debit balance request', {
                userId: data.userId,
                amount: data.amount
            });
            return await this.rabbitmqService.publishCriticalMessage('billing.debit.balance', {
                operation: 'debit_balance',
                ...data,
                timestamp: new Date().toISOString(),
                options: {
                    persistent: true,
                    priority: 10,
                    expiration: '300000'
                }
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to publish debit balance', error, {
                userId: data.userId
            });
            return false;
        }
    }
    async publishCreateTransaction(data) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Publishing create transaction request', {
                userId: data.userId,
                type: data.type,
                amount: data.amount
            });
            return await this.rabbitmqService.publishCriticalMessage('billing.create.transaction', {
                operation: 'create_transaction',
                ...data,
                timestamp: new Date().toISOString(),
                options: {
                    persistent: true,
                    priority: 8,
                    expiration: '600000'
                }
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to publish create transaction', error, {
                userId: data.userId
            });
            return false;
        }
    }
    async publishProcessPayment(data) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Publishing process payment request', {
                userId: data.userId,
                paymentId: data.paymentId,
                amount: data.amount
            });
            return await this.rabbitmqService.publishCriticalMessage('billing.process.payment', {
                operation: 'process_payment',
                ...data,
                timestamp: new Date().toISOString(),
                options: {
                    persistent: true,
                    priority: 9,
                    expiration: '900000'
                }
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to publish process payment', error, {
                userId: data.userId
            });
            return false;
        }
    }
    async handleDebitBalance(message) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Processing debit balance', {
                messageId: message.messageId,
                userId: message.userId,
                amount: message.amount
            });
            const user = await this.prisma.user.findUnique({
                where: { id: message.userId },
                include: { company: { include: { balance: true } } }
            });
            if (!user || !user.company || !user.company.balance) {
                shared_1.LoggerUtil.error('billing-service', 'User or company balance not found', null, { userId: message.userId });
                return false;
            }
            const balance = user.company.balance;
            if (balance.balance < message.amount) {
                shared_1.LoggerUtil.error('billing-service', 'Insufficient balance', null, {
                    userId: message.userId,
                    currentBalance: balance.balance,
                    requestedAmount: message.amount
                });
                return false;
            }
            const updatedBalance = await this.prisma.companyBalance.update({
                where: { companyId: user.companyId },
                data: {
                    balance: Number(balance.balance) - message.amount
                }
            });
            await this.prisma.transaction.create({
                data: {
                    companyId: user.companyId,
                    userId: message.userId,
                    type: 'DEBIT',
                    amount: message.amount,
                    currency: message.currency,
                    description: message.reason,
                    metadata: message.metadata || {}
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Debit balance processed successfully', {
                messageId: message.messageId,
                userId: message.userId,
                newBalance: updatedBalance.balance
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process debit balance', error, {
                messageId: message.messageId,
                userId: message.userId
            });
            return false;
        }
    }
    async handleCreateTransaction(message) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Processing create transaction', {
                messageId: message.messageId,
                userId: message.userId,
                type: message.type,
                amount: message.amount
            });
            const user = await this.prisma.user.findUnique({
                where: { id: message.userId }
            });
            if (!user) {
                shared_1.LoggerUtil.error('billing-service', 'User not found for transaction', null, { userId: message.userId });
                return false;
            }
            const transaction = await this.prisma.transaction.create({
                data: {
                    companyId: user.companyId,
                    userId: message.userId,
                    type: message.type,
                    amount: message.amount,
                    currency: message.currency,
                    description: message.description,
                    metadata: message.metadata || {}
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Transaction created successfully', {
                messageId: message.messageId,
                transactionId: transaction.id,
                userId: message.userId
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to create transaction', error, {
                messageId: message.messageId,
                userId: message.userId
            });
            return false;
        }
    }
    async handleProcessPayment(message) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Processing payment', {
                messageId: message.messageId,
                userId: message.userId,
                paymentId: message.paymentId,
                amount: message.amount
            });
            const existingTransaction = await this.prisma.transaction.findFirst({
                where: {
                    metadata: {
                        path: ['paymentId'],
                        equals: message.paymentId
                    }
                }
            });
            if (existingTransaction) {
                shared_1.LoggerUtil.warn('billing-service', 'Payment already processed', {
                    messageId: message.messageId,
                    paymentId: message.paymentId
                });
                return true;
            }
            const user = await this.prisma.user.findUnique({
                where: { id: message.userId },
                include: { company: { include: { balance: true } } }
            });
            if (!user || !user.company || !user.company.balance) {
                shared_1.LoggerUtil.error('billing-service', 'User or company balance not found for payment', null, {
                    userId: message.userId
                });
                return false;
            }
            const balance = user.company.balance;
            const updatedBalance = await this.prisma.companyBalance.update({
                where: { companyId: user.companyId },
                data: {
                    balance: balance.balance + message.amount
                }
            });
            await this.prisma.transaction.create({
                data: {
                    companyId: user.companyId,
                    userId: message.userId,
                    type: 'CREDIT',
                    amount: message.amount,
                    currency: message.currency,
                    description: `Payment via ${message.paymentMethod}`,
                    metadata: {
                        paymentId: message.paymentId,
                        paymentMethod: message.paymentMethod,
                        ...message.metadata
                    }
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Payment processed successfully', {
                messageId: message.messageId,
                userId: message.userId,
                newBalance: updatedBalance.balance
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process payment', error, {
                messageId: message.messageId,
                userId: message.userId
            });
            return false;
        }
    }
    async handleSyncData(message) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Processing data sync', {
                messageId: message.messageId,
                operation: message.operation
            });
            shared_1.LoggerUtil.info('billing-service', 'Data sync completed', {
                messageId: message.messageId
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to sync data', error, {
                messageId: message.messageId
            });
            return false;
        }
    }
};
exports.CriticalOperationsService = CriticalOperationsService;
exports.CriticalOperationsService = CriticalOperationsService = CriticalOperationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [shared_1.RabbitMQClient,
        billing_service_1.BillingService,
        prisma_service_1.PrismaService])
], CriticalOperationsService);
//# sourceMappingURL=critical-operations.service.js.map