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
                companyId: data.companyId,
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
                companyId: data.companyId
            });
            return false;
        }
    }
    async publishCreateTransaction(data) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Publishing create transaction request', {
                companyId: data.companyId,
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
                companyId: data.companyId
            });
            return false;
        }
    }
    async publishProcessPayment(data) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Publishing process payment request', {
                companyId: data.companyId,
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
                companyId: data.companyId
            });
            return false;
        }
    }
    async handleDebitBalance(message) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Processing debit balance', {
                messageId: message.messageId,
                companyId: message.companyId,
                amount: message.amount
            });
            const company = await this.prisma.company.findUnique({
                where: { id: message.companyId },
                include: { balance: true }
            });
            if (!company || !company.balance) {
                shared_1.LoggerUtil.error('billing-service', 'Company balance not found', null, { companyId: message.companyId });
                return false;
            }
            const balance = company.balance;
            if (balance.balance < message.amount) {
                shared_1.LoggerUtil.error('billing-service', 'Insufficient balance', null, {
                    companyId: message.companyId,
                    currentBalance: balance.balance,
                    requestedAmount: message.amount
                });
                return false;
            }
            const updatedBalance = await this.prisma.companyBalance.update({
                where: { companyId: company.id },
                data: {
                    balance: Number(balance.balance) - message.amount
                }
            });
            await this.prisma.transaction.create({
                data: {
                    companyId: company.id,
                    type: 'DEBIT',
                    amount: message.amount,
                    currency: message.currency,
                    description: message.reason,
                    metadata: message.metadata || {}
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Debit balance processed successfully', {
                messageId: message.messageId,
                companyId: message.companyId,
                newBalance: updatedBalance.balance
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process debit balance', error, {
                messageId: message.messageId,
                companyId: message.companyId
            });
            return false;
        }
    }
    async handleCreateTransaction(message) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Processing create transaction', {
                messageId: message.messageId,
                companyId: message.companyId,
                type: message.type,
                amount: message.amount
            });
            const companyId = message.companyId;
            const transaction = await this.prisma.transaction.create({
                data: {
                    companyId: companyId,
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
                companyId: message.companyId
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to create transaction', error, {
                messageId: message.messageId,
                companyId: message.companyId
            });
            return false;
        }
    }
    async handleProcessPayment(message) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Processing payment', {
                messageId: message.messageId,
                companyId: message.companyId,
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
            const company = await this.prisma.company.findUnique({
                where: { id: message.companyId },
                include: { balance: true }
            });
            if (!company || !company.balance) {
                shared_1.LoggerUtil.error('billing-service', 'Company balance not found for payment', null, {
                    companyId: message.companyId
                });
                return false;
            }
            const balance = company.balance;
            const updatedBalance = await this.prisma.companyBalance.update({
                where: { companyId: company.id },
                data: {
                    balance: balance.balance + message.amount
                }
            });
            await this.prisma.transaction.create({
                data: {
                    companyId: company.id,
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
                companyId: message.companyId,
                newBalance: updatedBalance.balance
            });
            return true;
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process payment', error, {
                messageId: message.messageId,
                companyId: message.companyId
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