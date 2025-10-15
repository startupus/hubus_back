"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var PaymentConsumerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentConsumerService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const amqp = __importStar(require("amqplib"));
const shared_1 = require("@ai-aggregator/shared");
const billing_service_1 = require("../billing/billing.service");
const balance_security_service_1 = require("../security/balance-security.service");
const library_1 = require("@prisma/client/runtime/library");
let PaymentConsumerService = PaymentConsumerService_1 = class PaymentConsumerService {
    constructor(configService, billingService, balanceSecurity) {
        this.configService = configService;
        this.billingService = billingService;
        this.balanceSecurity = balanceSecurity;
        this.logger = new common_1.Logger(PaymentConsumerService_1.name);
        this.connection = null;
        this.channel = null;
        this.processedMessages = new Set();
    }
    async onModuleInit() {
        await this.connect();
        await this.setupConsumers();
    }
    async onModuleDestroy() {
        await this.disconnect();
    }
    async connect() {
        try {
            const rabbitmqUrl = this.configService.get('RABBITMQ_URL', 'amqp://user:password@rabbitmq:5672');
            this.connection = await amqp.connect(rabbitmqUrl);
            this.channel = await this.connection.createChannel();
            this.connection.on('close', () => {
                this.logger.warn('RabbitMQ connection closed, attempting to reconnect...');
                setTimeout(() => this.connect(), 5000);
            });
            this.connection.on('error', (error) => {
                this.logger.error('RabbitMQ connection error', error);
            });
            shared_1.LoggerUtil.info('billing-service', 'Connected to RabbitMQ for payment processing');
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to connect to RabbitMQ', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            if (this.channel) {
                await this.channel.close();
                this.channel = null;
            }
            if (this.connection) {
                await this.connection.close();
                this.connection = null;
            }
            shared_1.LoggerUtil.info('billing-service', 'Disconnected from RabbitMQ');
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Error disconnecting from RabbitMQ', error);
        }
    }
    async setupConsumers() {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not available');
        }
        await this.channel.assertQueue('payment.succeeded', { durable: true });
        await this.channel.consume('payment.succeeded', async (msg) => {
            if (msg) {
                try {
                    const message = JSON.parse(msg.content.toString());
                    await this.handlePaymentSucceeded(message);
                    this.channel.ack(msg);
                }
                catch (error) {
                    shared_1.LoggerUtil.error('billing-service', 'Error processing payment succeeded message', error);
                    this.channel.nack(msg, false, false);
                }
            }
        });
        await this.channel.assertQueue('payment.failed', { durable: true });
        await this.channel.consume('payment.failed', async (msg) => {
            if (msg) {
                try {
                    const message = JSON.parse(msg.content.toString());
                    await this.handlePaymentFailed(message);
                    this.channel.ack(msg);
                }
                catch (error) {
                    shared_1.LoggerUtil.error('billing-service', 'Error processing payment failed message', error);
                    this.channel.nack(msg, false, false);
                }
            }
        });
        await this.channel.assertQueue('billing.usage', { durable: true });
        await this.channel.consume('billing.usage', async (msg) => {
            if (msg) {
                try {
                    shared_1.LoggerUtil.debug('billing-service', 'Received billing usage message', {
                        content: msg.content.toString(),
                        contentLength: msg.content.length,
                        contentType: typeof msg.content
                    });
                    const message = JSON.parse(msg.content.toString());
                    await this.handleBillingUsage(message);
                    this.channel.ack(msg);
                }
                catch (error) {
                    shared_1.LoggerUtil.error('billing-service', 'Error processing billing usage message', error, {
                        content: msg.content?.toString(),
                        contentLength: msg.content?.length
                    });
                    this.channel.nack(msg, false, false);
                }
            }
        });
        shared_1.LoggerUtil.info('billing-service', 'Payment consumers setup completed');
    }
    async handlePaymentSucceeded(message) {
        const { paymentId, companyId, amount, currency, yookassaId, paidAt, idempotencyKey } = message;
        if (this.processedMessages.has(idempotencyKey)) {
            shared_1.LoggerUtil.warn('billing-service', 'Duplicate payment message ignored', { idempotencyKey });
            return;
        }
        try {
            shared_1.LoggerUtil.info('billing-service', 'Processing successful payment', {
                paymentId,
                companyId,
                amount,
                currency,
                yookassaId
            });
            const existingTransaction = await this.billingService.getTransactionByPaymentId(paymentId);
            if (existingTransaction) {
                shared_1.LoggerUtil.warn('billing-service', 'Payment already processed', { paymentId });
                this.processedMessages.add(idempotencyKey);
                return;
            }
            const secureCreditResult = await this.balanceSecurity.secureCreditBalance({
                companyId,
                amount: new library_1.Decimal(amount),
                paymentId,
                yookassaId,
                description: `Payment received via YooKassa (${yookassaId})`
            });
            if (!secureCreditResult.success) {
                throw new Error(secureCreditResult.error || 'Secure credit operation failed');
            }
            const transactionResult = await this.billingService.createTransaction({
                companyId,
                type: 'CREDIT',
                amount: parseFloat(amount.toString()),
                currency,
                description: `Payment received via YooKassa (${yookassaId})`,
                metadata: {
                    paymentId,
                    yookassaId,
                    paidAt,
                    source: 'payment-service',
                    securityValidated: true
                }
            });
            if (!transactionResult.success || !transactionResult.transaction) {
                throw new Error('Failed to create transaction');
            }
            const balanceResult = await this.billingService.updateBalance({
                companyId,
                amount: parseFloat(amount.toString()),
                operation: 'add',
                description: 'Payment received',
                reference: transactionResult.transaction.id
            });
            if (!balanceResult.success) {
                throw new Error('Failed to update balance');
            }
            await this.publishBalanceUpdated({
                paymentId,
                companyId,
                amount,
                currency,
                transactionId: transactionResult.transaction.id,
                newBalance: balanceResult.balance?.balance || new library_1.Decimal(0)
            });
            this.processedMessages.add(idempotencyKey);
            shared_1.LoggerUtil.info('billing-service', 'Payment processed successfully', {
                paymentId,
                companyId,
                amount,
                transactionId: transactionResult.transaction.id
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process payment', error, {
                paymentId,
                companyId,
                amount
            });
            throw error;
        }
    }
    async handlePaymentFailed(message) {
        const { paymentId, companyId, amount, currency, reason, idempotencyKey } = message;
        if (this.processedMessages.has(idempotencyKey)) {
            shared_1.LoggerUtil.warn('billing-service', 'Duplicate payment failed message ignored', { idempotencyKey });
            return;
        }
        try {
            shared_1.LoggerUtil.info('billing-service', 'Processing failed payment', {
                paymentId,
                companyId,
                amount,
                reason
            });
            this.processedMessages.add(idempotencyKey);
            shared_1.LoggerUtil.info('billing-service', 'Failed payment logged', {
                paymentId,
                companyId,
                reason
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process payment failure', error, {
                paymentId,
                companyId,
                reason
            });
        }
    }
    async publishBalanceUpdated(data) {
        if (!this.channel) {
            throw new Error('RabbitMQ channel not available');
        }
        try {
            const queue = 'balance.updated';
            await this.channel.assertQueue(queue, { durable: true });
            const message = {
                type: 'balance.updated',
                paymentId: data.paymentId,
                companyId: data.companyId,
                amount: data.amount,
                currency: data.currency,
                transactionId: data.transactionId,
                newBalance: data.newBalance.toString(),
                timestamp: new Date().toISOString()
            };
            await this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
                persistent: true
            });
            shared_1.LoggerUtil.info('billing-service', 'Balance updated message sent', {
                paymentId: data.paymentId,
                companyId: data.companyId,
                newBalance: data.newBalance.toString()
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to publish balance updated message', error);
        }
    }
    async handleBillingUsage(message) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Processing billing usage event', {
                userId: message.userId,
                service: message.service,
                resource: message.resource,
                tokens: message.tokens,
                cost: message.cost,
                provider: message.provider,
                model: message.model
            });
            const idempotencyKey = `${message.userId}-${message.timestamp}`;
            if (this.processedMessages.has(idempotencyKey)) {
                shared_1.LoggerUtil.warn('billing-service', 'Duplicate billing usage message ignored', { idempotencyKey });
                return;
            }
            const trackUsageResult = await this.billingService.trackUsage({
                companyId: message.userId,
                service: message.service,
                resource: message.resource,
                quantity: message.tokens,
                unit: 'tokens',
                metadata: {
                    provider: message.provider,
                    model: message.model,
                    timestamp: message.timestamp,
                    currency: message.metadata?.currency || 'USD'
                }
            });
            if (!trackUsageResult.success) {
                shared_1.LoggerUtil.error('billing-service', 'Failed to track usage', new Error(trackUsageResult.error || 'Unknown error'), {
                    userId: message.userId,
                    cost: message.cost,
                });
                throw new Error(trackUsageResult.error || 'Failed to track usage');
            }
            this.processedMessages.add(idempotencyKey);
            shared_1.LoggerUtil.info('billing-service', 'Billing usage event processed successfully', {
                userId: message.userId,
                tokens: message.tokens,
                cost: message.cost,
                usageEventId: trackUsageResult.usageEvent?.id,
                calculatedCost: trackUsageResult.cost,
            });
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process billing usage event', error);
            throw error;
        }
    }
};
exports.PaymentConsumerService = PaymentConsumerService;
exports.PaymentConsumerService = PaymentConsumerService = PaymentConsumerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        billing_service_1.BillingService,
        balance_security_service_1.BalanceSecurityService])
], PaymentConsumerService);
//# sourceMappingURL=payment-consumer.service.js.map