"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var ReferralService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReferralService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../common/prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
let ReferralService = ReferralService_1 = class ReferralService {
    constructor(prisma) {
        this.prisma = prisma;
        this.logger = new common_1.Logger(ReferralService_1.name);
    }
    async getReferralEarnings(companyId, startDate, endDate, limit) {
        this.logger.log(`Getting referral earnings for company ${companyId}`);
        const where = {
            referralOwnerId: companyId,
            status: 'COMPLETED'
        };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const take = limit ? parseInt(limit) : 50;
        const earnings = await this.prisma.referralTransaction.findMany({
            where,
            orderBy: { createdAt: 'desc' },
            take,
            include: {
                referralEarner: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                }
            }
        });
        const totalEarnings = await this.prisma.referralTransaction.aggregate({
            where,
            _sum: { amount: true },
            _count: { id: true }
        });
        return {
            success: true,
            data: earnings.map(earning => ({
                id: earning.id,
                amount: earning.amount.toString(),
                currency: earning.currency,
                inputTokens: earning.inputTokens,
                outputTokens: earning.outputTokens,
                inputTokenRate: earning.inputTokenRate.toString(),
                outputTokenRate: earning.outputTokenRate.toString(),
                description: earning.description,
                status: earning.status,
                createdAt: earning.createdAt,
                referralEarner: earning.referralEarner
            })),
            summary: {
                totalAmount: totalEarnings._sum.amount?.toString() || '0',
                totalCount: totalEarnings._count.id || 0
            }
        };
    }
    async getReferralEarningsSummary(companyId, startDate, endDate) {
        this.logger.log(`Getting referral earnings summary for company ${companyId}`);
        const where = {
            referralOwnerId: companyId,
            status: 'COMPLETED'
        };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = new Date(startDate);
            if (endDate)
                where.createdAt.lte = new Date(endDate);
        }
        const [totalEarnings, monthlyEarnings, referredCompanies] = await Promise.all([
            this.prisma.referralTransaction.aggregate({
                where,
                _sum: { amount: true },
                _count: { id: true }
            }),
            this.prisma.referralTransaction.groupBy({
                by: ['createdAt'],
                where,
                _sum: { amount: true },
                _count: { id: true },
                orderBy: { createdAt: 'desc' }
            }),
            this.prisma.referralTransaction.findMany({
                where,
                select: {
                    referralEarnerId: true,
                    referralEarner: {
                        select: {
                            id: true,
                            name: true,
                            email: true
                        }
                    }
                },
                distinct: ['referralEarnerId']
            })
        ]);
        return {
            success: true,
            data: {
                totalEarnings: totalEarnings._sum.amount?.toString() || '0',
                totalTransactions: totalEarnings._count.id || 0,
                referredCompaniesCount: referredCompanies.length,
                monthlyBreakdown: monthlyEarnings.map(month => ({
                    month: month.createdAt,
                    amount: month._sum.amount?.toString() || '0',
                    transactions: month._count.id || 0
                })),
                referredCompanies: referredCompanies.map(ref => ref.referralEarner)
            }
        };
    }
    async getReferredCompanies(companyId, limit) {
        this.logger.log(`Getting referred companies for company ${companyId}`);
        const take = limit ? parseInt(limit) : 50;
        const referredCompanies = await this.prisma.company.findMany({
            where: {
                referredBy: companyId
            },
            select: {
                id: true,
                name: true,
                email: true,
                createdAt: true,
                isActive: true,
                referralCodeId: true
            },
            orderBy: { createdAt: 'desc' },
            take
        });
        return {
            success: true,
            data: referredCompanies
        };
    }
    async createReferralTransaction(data) {
        this.logger.log(`Creating referral transaction for owner ${data.referralOwnerId}`);
        const inputPrice = data.inputTokenPrice instanceof library_1.Decimal ? data.inputTokenPrice : new library_1.Decimal(String(data.inputTokenPrice));
        const outputPrice = data.outputTokenPrice instanceof library_1.Decimal ? data.outputTokenPrice : new library_1.Decimal(String(data.outputTokenPrice));
        const referralBonus = inputPrice.mul(data.inputTokens).add(outputPrice.mul(data.outputTokens)).mul(0.1);
        const referralTransaction = await this.prisma.referralTransaction.create({
            data: {
                referralOwnerId: data.referralOwnerId,
                referralEarnerId: data.referralOwnerId,
                originalTransactionId: data.originalTransactionId,
                amount: referralBonus,
                inputTokens: data.inputTokens,
                outputTokens: data.outputTokens,
                inputTokenRate: data.inputTokenPrice,
                outputTokenRate: data.outputTokenPrice,
                description: data.description,
                metadata: data.metadata,
                status: 'COMPLETED'
            }
        });
        await this.updateReferralOwnerBalance(data.referralOwnerId, referralBonus);
        return referralTransaction;
    }
    async updateReferralOwnerBalance(ownerId, bonus) {
        try {
            const balance = await this.prisma.companyBalance.findUnique({
                where: { companyId: ownerId }
            });
            if (!balance) {
                this.logger.warn(`Balance not found for referral owner ${ownerId}`);
                return;
            }
            await this.prisma.companyBalance.update({
                where: { companyId: ownerId },
                data: {
                    balance: balance.balance.add(bonus)
                }
            });
            await this.prisma.transaction.create({
                data: {
                    companyId: ownerId,
                    type: 'CREDIT',
                    amount: bonus,
                    currency: 'USD',
                    description: `Referral bonus: ${bonus.toString()} USD`,
                    status: 'COMPLETED',
                    processedAt: new Date(),
                    metadata: {
                        type: 'referral_bonus',
                        source: 'referral_system'
                    }
                }
            });
            this.logger.log(`Referral bonus credited to ${ownerId}: ${bonus.toString()} USD`);
        }
        catch (error) {
            this.logger.error(`Failed to update referral owner balance for ${ownerId}`, error);
            throw error;
        }
    }
};
exports.ReferralService = ReferralService;
exports.ReferralService = ReferralService = ReferralService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReferralService);
//# sourceMappingURL=referral.service.js.map