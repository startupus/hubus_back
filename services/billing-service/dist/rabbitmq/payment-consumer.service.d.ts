import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BillingService } from '../billing/billing.service';
import { BalanceSecurityService } from '../security/balance-security.service';
export declare class PaymentConsumerService implements OnModuleInit, OnModuleDestroy {
    private readonly configService;
    private readonly billingService;
    private readonly balanceSecurity;
    private readonly logger;
    private connection;
    private channel;
    private processedMessages;
    constructor(configService: ConfigService, billingService: BillingService, balanceSecurity: BalanceSecurityService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): Promise<void>;
    private connect;
    private disconnect;
    private setupConsumers;
    private handlePaymentSucceeded;
    private handlePaymentFailed;
    private publishBalanceUpdated;
    private handleBillingUsage;
}
