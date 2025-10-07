import { BillingService } from './billing.service';
import { UserBalanceDto } from '@ai-aggregator/shared';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
    getBalance(userId: string): Promise<UserBalanceDto>;
    trackUsage(data: any): Promise<any>;
    getReport(userId: string): Promise<any>;
    createTransaction(data: any): Promise<any>;
    getTransactions(userId: string): Promise<any>;
    processPayment(data: any): Promise<any>;
    refundPayment(data: any): Promise<any>;
}
