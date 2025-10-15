import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
export declare class ReferralService {
    private readonly prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    getReferralEarnings(companyId: string, startDate?: string, endDate?: string, limit?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            amount: string;
            currency: string;
            inputTokens: number;
            outputTokens: number;
            inputTokenRate: string;
            outputTokenRate: string;
            description: string;
            status: import(".prisma/client").$Enums.ReferralTransactionStatus;
            createdAt: Date;
            referralEarner: {
                id: string;
                name: string;
                email: string;
            };
        }[];
        summary: {
            totalAmount: string;
            totalCount: number;
        };
    }>;
    getReferralEarningsSummary(companyId: string, startDate?: string, endDate?: string): Promise<{
        success: boolean;
        data: {
            totalEarnings: string;
            totalTransactions: number;
            referredCompaniesCount: number;
            monthlyBreakdown: {
                month: Date;
                amount: string;
                transactions: number;
            }[];
            referredCompanies: {
                id: string;
                name: string;
                email: string;
            }[];
        };
    }>;
    getReferredCompanies(companyId: string, limit?: string): Promise<{
        success: boolean;
        data: {
            id: string;
            createdAt: Date;
            name: string;
            email: string;
            isActive: boolean;
            referralCodeId: string;
        }[];
    }>;
    createReferralTransaction(data: {
        referralOwnerId: string;
        originalTransactionId: string;
        inputTokens: number;
        outputTokens: number;
        inputTokenPrice: Decimal;
        outputTokenPrice: Decimal;
        description: string;
        metadata: any;
    }): Promise<{
        description: string | null;
        amount: Decimal;
        id: string;
        referralOwnerId: string;
        referralEarnerId: string;
        originalTransactionId: string;
        currency: string;
        inputTokens: number;
        outputTokens: number;
        inputTokenRate: Decimal;
        outputTokenRate: Decimal;
        status: import(".prisma/client").$Enums.ReferralTransactionStatus;
        metadata: import("@prisma/client/runtime/library").JsonValue | null;
        processedAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    private updateReferralOwnerBalance;
}
