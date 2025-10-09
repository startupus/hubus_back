import { BillingService } from '../billing/billing.service';
import { PricingService } from '../billing/pricing.service';
import { PaymentGatewayService } from '../billing/payment-gateway.service';
import { GetBalanceDto, UpdateBalanceDto, TrackUsageDto } from '../dto/billing.dto';
import { CreateTransactionRequest, CalculateCostRequest, ProcessPaymentRequest } from '../types/billing.types';
export declare class HttpController {
    private readonly billingService;
    private readonly pricingService;
    private readonly paymentGatewayService;
    constructor(billingService: BillingService, pricingService: PricingService, paymentGatewayService: PaymentGatewayService);
    getBalance(params: GetBalanceDto): Promise<{
        success: boolean;
        message: string;
        balance: import("../types/billing.types").UserBalance;
    }>;
    updateBalance(data: UpdateBalanceDto): Promise<{
        success: boolean;
        message: string;
        balance: any;
        transaction?: undefined;
    } | {
        success: boolean;
        message: string;
        balance: import("../types/billing.types").UserBalance;
        transaction: import("../types/billing.types").Transaction;
    }>;
    createTransaction(data: CreateTransactionRequest): Promise<{
        success: boolean;
        message: string;
        transaction: import("../types/billing.types").Transaction;
    }>;
    getTransactionHistory(userId: string, page?: number, limit?: number): Promise<{
        success: boolean;
        message: string;
        transactions: any[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    calculateCost(data: CalculateCostRequest): Promise<{
        success: boolean;
        message: string;
        cost: {
            service: string;
            resource: string;
            quantity: number;
            totalCost: number;
            currency: string;
            breakdown: import("../types/billing.types").CostBreakdown;
        };
    }>;
    processPayment(data: ProcessPaymentRequest): Promise<{
        success: boolean;
        message: string;
        transaction: any;
        paymentUrl?: undefined;
    } | {
        success: boolean;
        message: string;
        transaction: import("../types/billing.types").Transaction;
        paymentUrl: string;
    }>;
    trackUsage(data: TrackUsageDto): Promise<{
        success: boolean;
        message: string;
        usageEvent: any;
        cost?: undefined;
    } | {
        success: boolean;
        message: string;
        usageEvent: import("../types/billing.types").UsageEvent;
        cost: number;
    }>;
    getBillingReport(userId: string, startDate: string, endDate: string): Promise<{
        success: boolean;
        message: string;
        report: import("../types/billing.types").BillingReport;
    }>;
    getCompanyBalance(companyId: string): Promise<{
        success: boolean;
        message: string;
        balance: import("../types/billing.types").UserBalance;
    }>;
    getCompanyTransactions(companyId: string, limit?: number, offset?: number): Promise<{
        success: boolean;
        message: string;
        transactions: import("../types/billing.types").Transaction[];
    }>;
    getCompanyUsersStatistics(companyId: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        message: string;
        statistics: {
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
        };
    }>;
    getCompanyBillingReport(companyId: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        message: string;
        report: import("../types/billing.types").BillingReport;
    }>;
}
