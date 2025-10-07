import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { UserBalanceDto } from '@ai-aggregator/shared';
export declare class BillingService {
    private readonly httpService;
    private readonly configService;
    private readonly billingServiceUrl;
    constructor(httpService: HttpService, configService: ConfigService);
    getBalance(userId: string): Promise<UserBalanceDto>;
    trackUsage(data: any): Promise<any>;
    getReport(userId: string): Promise<any>;
    createTransaction(data: any): Promise<any>;
    getTransactions(userId: string): Promise<any>;
    processPayment(data: any): Promise<any>;
    refundPayment(data: any): Promise<any>;
}
