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
var PaymentGatewayService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentGatewayService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
const billing_types_1 = require("../types/billing.types");
let PaymentGatewayService = PaymentGatewayService_1 = class PaymentGatewayService {
    constructor() {
        this.logger = new common_1.Logger(PaymentGatewayService_1.name);
    }
    async processPayment(amount, currency, paymentMethod, description) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Processing payment with gateway', {
                amount,
                currency,
                provider: paymentMethod.provider,
                type: paymentMethod.type
            });
            switch (paymentMethod.provider) {
                case 'stripe':
                    return await this.processStripePayment(amount, currency, paymentMethod, description);
                case 'paypal':
                    return await this.processPayPalPayment(amount, currency, paymentMethod, description);
                case 'yoomoney':
                    return await this.processYooMoneyPayment(amount, currency, paymentMethod, description);
                case 'crypto':
                    return await this.processCryptoPayment(amount, currency, paymentMethod, description);
                default:
                    throw new Error(`Unsupported payment provider: ${paymentMethod.provider}`);
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Payment processing failed', error, {
                amount,
                currency,
                provider: paymentMethod.provider
            });
            return {
                success: false,
                status: billing_types_1.TransactionStatus.FAILED,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async createPaymentIntent(amount, currency, paymentMethod, metadata) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Creating payment intent', {
                amount,
                currency,
                provider: paymentMethod.provider
            });
            switch (paymentMethod.provider) {
                case 'stripe':
                    return await this.createStripePaymentIntent(amount, currency, paymentMethod, metadata);
                case 'paypal':
                    return await this.createPayPalOrder(amount, currency, paymentMethod, metadata);
                default:
                    throw new Error(`Payment intent not supported for provider: ${paymentMethod.provider}`);
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to create payment intent', error, {
                amount,
                currency,
                provider: paymentMethod.provider
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async verifyPayment(transactionId, provider) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Verifying payment', { transactionId, provider });
            switch (provider) {
                case 'stripe':
                    return await this.verifyStripePayment(transactionId);
                case 'paypal':
                    return await this.verifyPayPalPayment(transactionId);
                case 'yoomoney':
                    return await this.verifyYooMoneyPayment(transactionId);
                case 'crypto':
                    return await this.verifyCryptoPayment(transactionId);
                default:
                    throw new Error(`Unsupported payment provider: ${provider}`);
            }
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to verify payment', error, {
                transactionId,
                provider
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async refundPayment(transactionId, amount, reason) {
        try {
            shared_1.LoggerUtil.debug('billing-service', 'Processing refund', { transactionId, amount, reason });
            return {
                success: true,
                refundId: `refund_${Date.now()}`,
                status: billing_types_1.TransactionStatus.REFUNDED
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Failed to process refund', error, {
                transactionId,
                amount
            });
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }
    async processStripePayment(amount, currency, paymentMethod, description) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Stripe payment processed (mock)', {
                amount,
                currency,
                paymentMethodId: paymentMethod.externalId
            });
            return {
                success: true,
                transactionId: `pi_${Date.now()}`,
                status: billing_types_1.TransactionStatus.COMPLETED,
                metadata: {
                    provider: 'stripe',
                    paymentIntentId: `pi_${Date.now()}`
                }
            };
        }
        catch (error) {
            throw new Error(`Stripe payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createStripePaymentIntent(amount, currency, paymentMethod, metadata) {
        try {
            return {
                success: true,
                clientSecret: `pi_${Date.now()}_secret_${Math.random().toString(36).substr(2, 9)}`,
                paymentIntentId: `pi_${Date.now()}`
            };
        }
        catch (error) {
            throw new Error(`Stripe payment intent creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async verifyStripePayment(transactionId) {
        try {
            return {
                success: true,
                status: billing_types_1.TransactionStatus.COMPLETED,
                amount: 100.00,
                currency: 'USD'
            };
        }
        catch (error) {
            throw new Error(`Stripe payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async processPayPalPayment(amount, currency, paymentMethod, description) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'PayPal payment processed (mock)', {
                amount,
                currency,
                paymentMethodId: paymentMethod.externalId
            });
            return {
                success: true,
                transactionId: `paypal_${Date.now()}`,
                status: billing_types_1.TransactionStatus.COMPLETED,
                metadata: {
                    provider: 'paypal',
                    orderId: `paypal_${Date.now()}`
                }
            };
        }
        catch (error) {
            throw new Error(`PayPal payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createPayPalOrder(amount, currency, paymentMethod, metadata) {
        try {
            return {
                success: true,
                clientSecret: `paypal_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                paymentIntentId: `paypal_${Date.now()}`
            };
        }
        catch (error) {
            throw new Error(`PayPal order creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async verifyPayPalPayment(transactionId) {
        try {
            return {
                success: true,
                status: billing_types_1.TransactionStatus.COMPLETED,
                amount: 100.00,
                currency: 'USD'
            };
        }
        catch (error) {
            throw new Error(`PayPal payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async processYooMoneyPayment(amount, currency, paymentMethod, description) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'YooMoney payment processed (mock)', {
                amount,
                currency,
                paymentMethodId: paymentMethod.externalId
            });
            return {
                success: true,
                transactionId: `yoomoney_${Date.now()}`,
                status: billing_types_1.TransactionStatus.COMPLETED,
                metadata: {
                    provider: 'yoomoney',
                    operationId: `yoomoney_${Date.now()}`
                }
            };
        }
        catch (error) {
            throw new Error(`YooMoney payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async verifyYooMoneyPayment(transactionId) {
        try {
            return {
                success: true,
                status: billing_types_1.TransactionStatus.COMPLETED,
                amount: 100.00,
                currency: 'RUB'
            };
        }
        catch (error) {
            throw new Error(`YooMoney payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async processCryptoPayment(amount, currency, paymentMethod, description) {
        try {
            shared_1.LoggerUtil.info('billing-service', 'Crypto payment processed (mock)', {
                amount,
                currency,
                paymentMethodId: paymentMethod.externalId
            });
            return {
                success: true,
                transactionId: `crypto_${Date.now()}`,
                status: billing_types_1.TransactionStatus.COMPLETED,
                metadata: {
                    provider: 'crypto',
                    blockchain: 'ethereum',
                    txHash: `0x${Math.random().toString(16).substr(2, 64)}`
                }
            };
        }
        catch (error) {
            throw new Error(`Crypto payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async verifyCryptoPayment(transactionId) {
        try {
            return {
                success: true,
                status: billing_types_1.TransactionStatus.COMPLETED,
                amount: 100.00,
                currency: 'BTC'
            };
        }
        catch (error) {
            throw new Error(`Crypto payment verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
};
exports.PaymentGatewayService = PaymentGatewayService;
exports.PaymentGatewayService = PaymentGatewayService = PaymentGatewayService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PaymentGatewayService);
//# sourceMappingURL=payment-gateway.service.js.map