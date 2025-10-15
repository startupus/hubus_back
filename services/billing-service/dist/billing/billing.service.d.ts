import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { ValidationService } from '../common/validation/validation.service';
import { RabbitMQClient } from '@ai-aggregator/shared';
import { ReferralService } from './referral.service';
import { Transaction, CreateTransactionRequest, CreateTransactionResponse, TrackUsageRequest, TrackUsageResponse, GetBalanceRequest, GetBalanceResponse, UpdateBalanceRequest, UpdateBalanceResponse, CalculateCostRequest, CalculateCostResponse, ProcessPaymentRequest, ProcessPaymentResponse, TransactionStatus, BillingReport } from '../types/billing.types';
import { Decimal } from '@prisma/client/runtime/library';
export declare class BillingService {
    private readonly prisma;
    private readonly cacheService;
    private readonly validationService;
    private readonly rabbitmq;
    private readonly referralService;
    private readonly logger;
    private readonly maxRetries;
    private readonly retryDelay;
    constructor(prisma: PrismaService, cacheService: CacheService, validationService: ValidationService, rabbitmq: RabbitMQClient, referralService: ReferralService);
    getBalance(request: GetBalanceRequest): Promise<GetBalanceResponse>;
    updateBalance(request: UpdateBalanceRequest): Promise<UpdateBalanceResponse>;
    trackUsage(request: TrackUsageRequest): Promise<TrackUsageResponse>;
    calculateCost(request: CalculateCostRequest): Promise<CalculateCostResponse>;
    createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse>;
    processPayment(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse>;
    getBillingReport(companyId: string, startDate: Date, endDate: Date): Promise<BillingReport>;
    private getPricingRules;
    private getDefaultPricing;
    private calculateTieredPricing;
    private calculateDiscounts;
    private groupByService;
    private groupByResource;
    private groupByDay;
    private isRetryableError;
    private delay;
    private validateAndNormalizeRequest;
    private generateTransactionId;
    private checkUsageLimits;
    private getUsageLimits;
    private auditOperation;
    getTransactions(companyId: string, limit?: number, offset?: number): Promise<Transaction[]>;
    getTransactionById(transactionId: string): Promise<Transaction | null>;
    getTransactionByPaymentId(paymentId: string): Promise<Transaction | null>;
    updateTransaction(transactionId: string, updateData: Partial<Transaction>): Promise<Transaction>;
    deleteTransaction(transactionId: string): Promise<Transaction>;
    determinePayerCompany(initiatorCompanyId: string): Promise<{
        payerId: string;
        initiatorId: string;
    }>;
    refundPayment(refundData: {
        transactionId: string;
        amount: Decimal;
        reason: string;
    }): Promise<{
        success: boolean;
        refundId?: string;
        status?: TransactionStatus;
        error?: string;
    }>;
    getCompanyUsersStatistics(companyId: string, startDate: Date, endDate: Date): Promise<{
        companyId: string;
        period: {
            start: Date;
            end: Date;
        };
        totals: {
            totalChildCompanies: number;
            totalRequests: number;
            totalCost: number;
            totalTransactions: number;
        };
        childCompanies: {
            company: {
                id: string;
                name: string;
                email: string;
                position: string;
                department: string;
                billingMode: import(".prisma/client").$Enums.BillingMode;
            };
            statistics: {
                totalRequests: number;
                totalCost: number;
                totalTransactions: number;
                byService: Record<string, {
                    count: number;
                    cost: number;
                }>;
            };
        }[];
    }>;
    private processReferralBonus;
    topUpBalance(request: {
        companyId: string;
        amount: number;
        currency?: string;
    }): Promise<{
        success: boolean;
        balance?: number;
        error?: string;
    }>;
    chargeForSubscription(companyId: string, amount: Decimal, planId: string): Promise<void>;
}
