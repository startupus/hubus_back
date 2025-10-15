import { PrismaService } from '../common/prisma/prisma.service';
import { BillingService } from './billing.service';
export declare class SubscriptionService {
    private readonly prisma;
    private readonly billingService;
    private readonly logger;
    constructor(prisma: PrismaService, billingService: BillingService);
    getSubscriptionPlans(): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string;
            price: string;
            currency: string;
            billingCycle: string;
            features: unknown[];
            limits: string | number | true | import("@prisma/client/runtime/library").JsonObject | import("@prisma/client/runtime/library").JsonArray;
            inputTokens: number;
            outputTokens: number;
            inputTokenPrice: string;
            outputTokenPrice: string;
            discountPercent: string;
        }[];
        error?: undefined;
    } | {
        success: boolean;
        error: string;
        data?: undefined;
    }>;
    getHardcodedPlans(): Promise<{
        success: boolean;
        data: {
            id: string;
            name: string;
            description: string;
            price: string;
            currency: string;
            billingCycle: string;
            features: string[];
            limits: {
                monthlyRequests: number;
                maxUsers: number;
                storage: string;
            };
        }[];
    }>;
    getMySubscription(companyId: string): Promise<{
        success: boolean;
        data: {
            hasSubscription: boolean;
            subscription: {
                id: string;
                planId: string;
                status: import(".prisma/client").$Enums.SubscriptionStatus;
                currentPeriodStart: Date;
                currentPeriodEnd: Date;
                price: string;
                currency: string;
                createdAt: Date;
            };
        };
    }>;
    getSubscriptionUsage(companyId: string): Promise<{
        success: boolean;
        data: {
            hasSubscription: boolean;
            usage: any;
            subscription?: undefined;
        };
    } | {
        success: boolean;
        data: {
            hasSubscription: boolean;
            usage: {
                currentPeriod: {
                    start: Date;
                    end: Date;
                };
                requests: number;
                totalCost: string;
                quantity: number;
            };
            subscription: {
                id: string;
                planId: string;
                status: import(".prisma/client").$Enums.SubscriptionStatus;
            };
        };
    }>;
    subscribeToPlan(companyId: string, planId: string): Promise<{
        success: boolean;
        data: {
            subscription: {
                id: string;
                planId: string;
                status: import(".prisma/client").$Enums.SubscriptionStatus;
                currentPeriodStart: Date;
                currentPeriodEnd: Date;
                price: string;
                currency: string;
            };
        };
    }>;
    cancelSubscription(companyId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
