import { PaymentMethodType, TransactionStatus } from '../types/billing.types';
export declare class PaymentGatewayService {
    private readonly logger;
    constructor();
    processPayment(amount: number, currency: string, paymentMethod: {
        type: PaymentMethodType;
        provider: string;
        externalId: string;
        metadata?: Record<string, any>;
    }, description?: string): Promise<{
        success: boolean;
        transactionId?: string;
        status?: TransactionStatus;
        error?: string;
        metadata?: Record<string, any>;
    }>;
    createPaymentIntent(amount: number, currency: string, paymentMethod: {
        type: PaymentMethodType;
        provider: string;
        externalId: string;
    }, metadata?: Record<string, any>): Promise<{
        success: boolean;
        clientSecret?: string;
        paymentIntentId?: string;
        error?: string;
    }>;
    verifyPayment(transactionId: string, provider: string): Promise<{
        success: boolean;
        status?: TransactionStatus;
        amount?: number;
        currency?: string;
        error?: string;
    }>;
    refundPayment(transactionId: string, amount: number, reason?: string): Promise<{
        success: boolean;
        refundId?: string;
        status?: TransactionStatus;
        error?: string;
    }>;
    private processStripePayment;
    private createStripePaymentIntent;
    private verifyStripePayment;
    private processPayPalPayment;
    private createPayPalOrder;
    private verifyPayPalPayment;
    private processYooMoneyPayment;
    private verifyYooMoneyPayment;
    private processCryptoPayment;
    private verifyCryptoPayment;
}
