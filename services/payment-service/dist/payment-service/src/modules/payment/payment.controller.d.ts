import { PaymentService, CreatePaymentRequest } from './payment.service';
export declare class PaymentController {
    private readonly paymentService;
    constructor(paymentService: PaymentService);
    createPayment(data: CreatePaymentRequest): Promise<import("./payment.service").CreatePaymentResponse>;
    getPayment(id: string): Promise<{
        id: string;
        createdAt: Date;
        description: string | null;
        companyId: string;
        amount: import(".prisma/client/runtime/library").Decimal;
        amountUsd: import(".prisma/client/runtime/library").Decimal | null;
        currency: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        yookassaId: string | null;
        yookassaUrl: string | null;
        commission: import(".prisma/client/runtime/library").Decimal | null;
        exchangeRate: import(".prisma/client/runtime/library").Decimal | null;
        updatedAt: Date;
        paidAt: Date | null;
    }>;
    getCompanyPayments(companyId: string, page?: number, limit?: number): Promise<{
        payments: {
            id: string;
            createdAt: Date;
            description: string | null;
            companyId: string;
            amount: import(".prisma/client/runtime/library").Decimal;
            amountUsd: import(".prisma/client/runtime/library").Decimal | null;
            currency: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            yookassaId: string | null;
            yookassaUrl: string | null;
            commission: import(".prisma/client/runtime/library").Decimal | null;
            exchangeRate: import(".prisma/client/runtime/library").Decimal | null;
            updatedAt: Date;
            paidAt: Date | null;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            pages: number;
        };
    }>;
}
