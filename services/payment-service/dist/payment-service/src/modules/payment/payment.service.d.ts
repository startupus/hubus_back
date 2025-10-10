import { PrismaService } from '../../common/prisma/prisma.service';
import { YooKassaService } from '../yookassa/yookassa.service';
import { CurrencyService } from '../currency/currency.service';
export interface CreatePaymentRequest {
    companyId: string;
    amount: number;
    description?: string;
}
export interface CreatePaymentResponse {
    paymentId: string;
    paymentUrl: string;
    amount: number;
    amountUsd: number;
    status: string;
}
export declare class PaymentService {
    private readonly prisma;
    private readonly yooKassa;
    private readonly currency;
    private readonly MIN_AMOUNT;
    constructor(prisma: PrismaService, yooKassa: YooKassaService, currency: CurrencyService);
    createPayment(data: CreatePaymentRequest): Promise<CreatePaymentResponse>;
    getPayment(paymentId: string): Promise<{
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
    getPaymentByYooKassaId(yooKassaId: string): Promise<{
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
    updatePaymentStatus(paymentId: string, status: string, yooKassaId?: string): Promise<{
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
    processSuccessfulPayment(paymentId: string): Promise<{
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
}
