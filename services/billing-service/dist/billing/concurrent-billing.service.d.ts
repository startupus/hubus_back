import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class ConcurrentBillingService {
    private readonly prisma;
    private readonly logger;
    private readonly balanceCache;
    private readonly pricingCache;
    private readonly currencyCache;
    private readonly transactionCounter;
    private readonly totalRevenue;
    private readonly activeUsers;
    private readonly transactionQueue;
    private readonly userLocks;
    constructor(prisma: PrismaService);
    getBalance(userId: string): Promise<{
        balance: Decimal;
        currency: string;
    }>;
    updateBalance(userId: string, amount: Decimal, type: 'DEBIT' | 'CREDIT', description: string, metadata?: any): Promise<{
        success: boolean;
        newBalance: Decimal;
        transactionId?: string;
    }>;
    processTransactionAsync(userId: string, amount: Decimal, type: 'DEBIT' | 'CREDIT', description: string, metadata?: any): Promise<boolean>;
    processBatchTransactions(transactions: Array<{
        userId: string;
        amount: Decimal;
        type: 'DEBIT' | 'CREDIT';
        description: string;
        metadata?: any;
    }>): Promise<Array<{
        success: boolean;
        transactionId?: string;
        error?: string;
    }>>;
    getPricing(service: string, resource: string, quantity: number): Promise<{
        price: Decimal;
        currency: string;
    }>;
    getCurrencyRate(fromCurrency: string, toCurrency: string): Promise<number>;
    private startTransactionProcessor;
    private getUserLock;
    private acquireLock;
    private releaseLock;
    getStats(): {
        totalTransactions: number;
        totalRevenue: number;
        activeUsers: number;
        queueSize: number;
        cacheStats: {
            balanceCache: number;
            pricingCache: number;
            currencyCache: number;
        };
    };
    clearCache(): Promise<void>;
}
