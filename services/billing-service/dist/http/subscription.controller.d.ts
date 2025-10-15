import { SubscriptionService } from '../billing/subscription.service';
export declare class SubscriptionController {
    private readonly subscriptionService;
    constructor(subscriptionService: SubscriptionService);
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
    subscribeToPlan(data: {
        companyId: string;
        planId: string;
    }): Promise<{
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
    cancelSubscription(data: {
        companyId: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
}
