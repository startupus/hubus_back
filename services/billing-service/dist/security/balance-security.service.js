"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var BalanceSecurityService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BalanceSecurityService = void 0;
const common_1 = require("@nestjs/common");
const shared_1 = require("@ai-aggregator/shared");
const library_1 = require("@prisma/client/runtime/library");
const prisma_service_1 = require("../common/prisma/prisma.service");
const crypto = __importStar(require("crypto"));
let BalanceSecurityService = BalanceSecurityService_1 = class BalanceSecurityService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(BalanceSecurityService_1.name);
        this.processedOperations = new Map();
    }
    validateCreditOperation(data) {
        if (!data.companyId || typeof data.companyId !== 'string') {
            return {
                valid: false,
                error: 'ID компании обязателен'
            };
        }
        if (!data.amount || data.amount.lte(0)) {
            return {
                valid: false,
                error: 'Сумма зачисления должна быть больше нуля'
            };
        }
        if (!data.paymentId || typeof data.paymentId !== 'string') {
            return {
                valid: false,
                error: 'ID платежа обязателен'
            };
        }
        if (!data.yookassaId || typeof data.yookassaId !== 'string') {
            return {
                valid: false,
                error: 'ID YooKassa обязателен'
            };
        }
        return { valid: true };
    }
    checkDuplicateOperation(operationKey) {
        const existing = this.processedOperations.get(operationKey);
        if (existing) {
            const timeDiff = Date.now() - existing.timestamp;
            const isRecent = timeDiff < 300000;
            if (isRecent) {
                return {
                    isDuplicate: true,
                    error: 'Операция уже была обработана недавно'
                };
            }
        }
        return { isDuplicate: false };
    }
    registerOperation(operationKey, amount) {
        this.processedOperations.set(operationKey, {
            timestamp: Date.now(),
            amount
        });
        const oneHourAgo = Date.now() - 3600000;
        for (const [key, value] of this.processedOperations.entries()) {
            if (value.timestamp < oneHourAgo) {
                this.processedOperations.delete(key);
            }
        }
    }
    generateOperationKey(paymentId, yookassaId) {
        const data = `${paymentId}_${yookassaId}`;
        return crypto.createHash('sha256').update(data).digest('hex');
    }
    async validateCreditLimits(companyId, amount) {
        const amountNumber = amount.toNumber();
        const maxSingleCredit = 500000;
        if (amountNumber > maxSingleCredit) {
            return {
                valid: false,
                error: `Превышен лимит зачисления за раз: ${maxSingleCredit} рублей`
            };
        }
        shared_1.LoggerUtil.info('billing-service', 'Credit limits validation (stub)', {
            companyId,
            amount: amountNumber
        });
        return { valid: true };
    }
    async auditCreditOperation(data) {
        const auditData = {
            type: 'balance_credit',
            companyId: data.companyId,
            amount: data.amount.toString(),
            paymentId: data.paymentId,
            yookassaId: data.yookassaId,
            transactionId: data.transactionId,
            operator: data.operator,
            timestamp: new Date().toISOString(),
            ipAddress: 'system',
            userAgent: 'payment-service'
        };
        shared_1.LoggerUtil.info('billing-service', 'Balance credit operation audited', auditData);
    }
    async validateCreditSecurity(data) {
        let riskScore = 0;
        const validation = this.validateCreditOperation(data);
        if (!validation.valid) {
            return validation;
        }
        const operationKey = this.generateOperationKey(data.paymentId, data.yookassaId);
        const duplicateCheck = this.checkDuplicateOperation(operationKey);
        if (duplicateCheck.isDuplicate) {
            return {
                valid: false,
                error: duplicateCheck.error
            };
        }
        const limitsValidation = await this.validateCreditLimits(data.companyId, data.amount);
        if (!limitsValidation.valid) {
            return limitsValidation;
        }
        const amountNumber = data.amount.toNumber();
        if (amountNumber > 100000) {
            riskScore += 15;
        }
        if (amountNumber > 500000) {
            riskScore += 25;
        }
        const isHighRisk = riskScore > 30;
        const isValid = !isHighRisk;
        shared_1.LoggerUtil.info('billing-service', 'Credit security validation', {
            companyId: data.companyId,
            amount: amountNumber,
            paymentId: data.paymentId,
            riskScore,
            isValid
        });
        return {
            valid: isValid,
            error: isHighRisk ? 'Операция зачисления заблокирована системой безопасности' : undefined,
            riskScore
        };
    }
    async secureCreditBalance(data) {
        try {
            const securityValidation = await this.validateCreditSecurity(data);
            if (!securityValidation.valid) {
                return {
                    success: false,
                    error: securityValidation.error
                };
            }
            const operationKey = this.generateOperationKey(data.paymentId, data.yookassaId);
            this.registerOperation(operationKey, data.amount);
            await this.auditCreditOperation({
                ...data,
                transactionId: 'pending',
                operator: 'payment-service'
            });
            shared_1.LoggerUtil.info('billing-service', 'Secure credit operation approved', {
                companyId: data.companyId,
                amount: data.amount.toString(),
                paymentId: data.paymentId,
                riskScore: securityValidation.riskScore
            });
            return {
                success: true,
                transactionId: 'pending'
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Secure credit operation failed', error, {
                companyId: data.companyId,
                paymentId: data.paymentId
            });
            return {
                success: false,
                error: 'Внутренняя ошибка системы безопасности'
            };
        }
    }
    async secureDebitBalance(data) {
        try {
            if (data.amount <= 0) {
                return {
                    success: false,
                    error: 'Сумма списания должна быть положительной'
                };
            }
            if (data.amount > 1000) {
                return {
                    success: false,
                    error: 'Превышен максимальный лимит списания'
                };
            }
            const balance = await this.prisma.companyBalance.findUnique({
                where: { companyId: data.companyId }
            });
            if (!balance) {
                return {
                    success: false,
                    error: 'Баланс компании не найден'
                };
            }
            const currentBalance = balance.balance instanceof library_1.Decimal ? balance.balance : new library_1.Decimal(balance.balance);
            const amountToDebit = new library_1.Decimal(data.amount);
            shared_1.LoggerUtil.info('billing-service', 'Balance calculation', {
                companyId: data.companyId,
                currentBalance: currentBalance.toString(),
                amountToDebit: amountToDebit.toString(),
                currentBalanceType: typeof currentBalance,
                isDecimal: currentBalance instanceof library_1.Decimal
            });
            const newBalance = currentBalance.minus(amountToDebit);
            shared_1.LoggerUtil.debug('billing-service', 'Balance check debug', {
                companyId: data.companyId,
                currentBalance: currentBalance.toString(),
                amountToDebit: amountToDebit.toString(),
                newBalance: newBalance.toString(),
                isNegative: newBalance.lt(0)
            });
            if (newBalance.lt(0)) {
                shared_1.LoggerUtil.error('billing-service', 'Insufficient balance detected', new Error('Insufficient balance'), {
                    companyId: data.companyId,
                    currentBalance: currentBalance.toString(),
                    amountToDebit: amountToDebit.toString(),
                    newBalance: newBalance.toString()
                });
                return {
                    success: false,
                    error: 'Недостаточно средств на балансе'
                };
            }
            const operationKey = this.generateOperationKey(data.companyId, Date.now().toString());
            this.registerOperation(operationKey, new library_1.Decimal(data.amount));
            const transaction = await this.prisma.transaction.create({
                data: {
                    companyId: data.companyId,
                    type: 'DEBIT',
                    amount: new library_1.Decimal(data.amount),
                    currency: data.currency,
                    description: data.description,
                    metadata: data.metadata || {},
                    status: 'COMPLETED',
                }
            });
            await this.prisma.companyBalance.update({
                where: { companyId: data.companyId },
                data: {
                    balance: newBalance,
                }
            });
            shared_1.LoggerUtil.info('billing-service', 'Secure debit operation completed', {
                companyId: data.companyId,
                amount: data.amount,
                newBalance,
                transactionId: transaction.id
            });
            return {
                success: true,
                transactionId: transaction.id,
                balance: newBalance.toNumber(),
            };
        }
        catch (error) {
            shared_1.LoggerUtil.error('billing-service', 'Secure debit operation failed', error, {
                companyId: data.companyId,
            });
            return {
                success: false,
                error: 'Внутренняя ошибка системы безопасности'
            };
        }
    }
};
exports.BalanceSecurityService = BalanceSecurityService;
exports.BalanceSecurityService = BalanceSecurityService = BalanceSecurityService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BalanceSecurityService);
//# sourceMappingURL=balance-security.service.js.map