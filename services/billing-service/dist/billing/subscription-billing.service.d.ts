import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export interface AIRequestData {
    companyId: string;
    inputTokens: number;
    outputTokens: number;
    inputTokenPrice: number;
    outputTokenPrice: number;
    provider: string;
    model: string;
    metadata?: Record<string, any>;
}
export interface BillingResult {
    success: boolean;
    amountCharged: Decimal;
    tokensUsed: {
        input: number;
        output: number;
    };
    billingMethod: 'subscription' | 'pay_as_you_go';
    subscriptionId?: string;
    transactionId?: string;
    remainingTokens?: {
        input: number;
        output: number;
    };
}
export declare class SubscriptionBillingService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    processAIRequest(request: AIRequestData): Promise<BillingResult>;
    private processWithSubscription;
    private processPayAsYouGo;
    private getActiveSubscription;
    private updateSubscriptionUsage;
    getSubscriptionUsage(companyId: string): Promise<{
        subscriptionId: string;
        planName: string;
        inputTokensUsed: number;
        outputTokensUsed: number;
        inputTokensLimit: number;
        outputTokensLimit: number;
        inputTokensRemaining: number;
        outputTokensRemaining: number;
        usagePercentage: number;
        periodEnd: Date;
    }>;
}
