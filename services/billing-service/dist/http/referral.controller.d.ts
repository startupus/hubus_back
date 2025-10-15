import { ReferralService } from '../billing/referral.service';
export declare class ReferralController {
    private readonly referralService;
    constructor(referralService: ReferralService);
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
}
