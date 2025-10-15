import { RabbitMQClient } from '@ai-aggregator/shared';
import { BillingService } from './billing.service';
import { PrismaService } from '../common/prisma/prisma.service';
export declare class CriticalOperationsService {
    private readonly rabbitmqService;
    private readonly billingService;
    private readonly prisma;
    private readonly logger;
    constructor(rabbitmqService: RabbitMQClient, billingService: BillingService, prisma: PrismaService);
    initializeCriticalHandlers(): Promise<void>;
    publishDebitBalance(data: {
        companyId: string;
        amount: number;
        currency: string;
        reason: string;
        metadata?: Record<string, any>;
    }): Promise<boolean>;
    publishCreateTransaction(data: {
        companyId: string;
        type: 'DEBIT' | 'CREDIT';
        amount: number;
        currency: string;
        description: string;
        provider?: string;
        metadata?: Record<string, any>;
    }): Promise<boolean>;
    publishProcessPayment(data: {
        companyId: string;
        paymentMethod: string;
        amount: number;
        currency: string;
        paymentId: string;
        metadata?: Record<string, any>;
    }): Promise<boolean>;
    private handleDebitBalance;
    private handleCreateTransaction;
    private handleProcessPayment;
    private handleSyncData;
}
