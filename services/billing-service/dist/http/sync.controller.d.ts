import { PrismaService } from '../common/prisma/prisma.service';
export declare class SyncController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    syncCompany(data: {
        id: string;
        name: string;
        email: string;
        isActive?: boolean;
        billingMode?: 'SELF_PAID' | 'PARENT_PAID';
        initialBalance?: number;
        currency?: string;
    }): Promise<{
        success: boolean;
        message: string;
        companyId: string;
        company?: undefined;
    } | {
        success: boolean;
        message: string;
        company: {
            id: string;
            name: string;
            email: string;
            balance: string;
            currency: string;
        };
        companyId?: undefined;
    } | {
        success: boolean;
        message: string;
        companyId?: undefined;
        company?: undefined;
    }>;
}
