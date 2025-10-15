import { Decimal } from '@prisma/client/runtime/library';
import { PrismaService } from '../common/prisma/prisma.service';
export declare class BalanceSecurityService {
    private readonly prisma;
    private readonly logger;
    private processedOperations;
    constructor(prisma: PrismaService);
    validateCreditOperation(data: {
        companyId: string;
        amount: Decimal;
        paymentId: string;
        yookassaId: string;
    }): {
        valid: boolean;
        error?: string;
    };
    checkDuplicateOperation(operationKey: string): {
        isDuplicate: boolean;
        error?: string;
    };
    registerOperation(operationKey: string, amount: Decimal): void;
    generateOperationKey(paymentId: string, yookassaId: string): string;
    validateCreditLimits(companyId: string, amount: Decimal): Promise<{
        valid: boolean;
        error?: string;
    }>;
    auditCreditOperation(data: {
        companyId: string;
        amount: Decimal;
        paymentId: string;
        yookassaId: string;
        transactionId: string;
        operator: string;
    }): Promise<void>;
    validateCreditSecurity(data: {
        companyId: string;
        amount: Decimal;
        paymentId: string;
        yookassaId: string;
    }): Promise<{
        valid: boolean;
        error?: string;
        riskScore?: number;
    }>;
    secureCreditBalance(data: {
        companyId: string;
        amount: Decimal;
        paymentId: string;
        yookassaId: string;
        description: string;
    }): Promise<{
        success: boolean;
        error?: string;
        transactionId?: string;
    }>;
    secureDebitBalance(data: {
        companyId: string;
        amount: number;
        currency: string;
        description: string;
        metadata?: any;
    }): Promise<{
        success: boolean;
        error?: string;
        transactionId?: string;
        balance?: number;
    }>;
}
