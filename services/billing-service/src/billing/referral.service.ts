import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getReferralEarnings(
    companyId: string,
    startDate?: string,
    endDate?: string,
    limit?: string
  ) {
    this.logger.log(`Getting referral earnings for company ${companyId}`);

    const where: any = {
      referralOwnerId: companyId,
      status: 'COMPLETED'
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
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

  async getReferralEarningsSummary(
    companyId: string,
    startDate?: string,
    endDate?: string
  ) {
    this.logger.log(`Getting referral earnings summary for company ${companyId}`);

    const where: any = {
      referralOwnerId: companyId,
      status: 'COMPLETED'
    };

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
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

  async getReferredCompanies(
    companyId: string,
    limit?: string
  ) {
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

  async createReferralTransaction(data: {
    referralOwnerId: string;
    originalTransactionId: string;
    inputTokens: number;
    outputTokens: number;
    inputTokenPrice: Decimal;
    outputTokenPrice: Decimal;
    description: string;
    metadata: any;
  }) {
    this.logger.log(`Creating referral transaction for owner ${data.referralOwnerId}`);

    // Рассчитываем сумму реферального бонуса (10% от стоимости)
    const inputPrice = data.inputTokenPrice instanceof Decimal ? data.inputTokenPrice : new Decimal(String(data.inputTokenPrice));
    const outputPrice = data.outputTokenPrice instanceof Decimal ? data.outputTokenPrice : new Decimal(String(data.outputTokenPrice));
    const referralBonus = inputPrice.mul(data.inputTokens).add(outputPrice.mul(data.outputTokens)).mul(0.1);

    const referralTransaction = await this.prisma.referralTransaction.create({
      data: {
        referralOwnerId: data.referralOwnerId,
        referralEarnerId: data.referralOwnerId, // В данном случае владелец и получатель - одно лицо
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

    // Начисляем бонус на баланс владельца реферала
    await this.updateReferralOwnerBalance(data.referralOwnerId, referralBonus);

    return referralTransaction;
  }

  /**
   * Обновить баланс владельца реферала
   */
  private async updateReferralOwnerBalance(ownerId: string, bonus: Decimal) {
    try {
      // Находим баланс владельца реферала
      const balance = await this.prisma.companyBalance.findUnique({
        where: { companyId: ownerId }
      });

      if (!balance) {
        this.logger.warn(`Balance not found for referral owner ${ownerId}`);
        return;
      }

      // Обновляем баланс
      await this.prisma.companyBalance.update({
        where: { companyId: ownerId },
        data: {
          balance: balance.balance.add(bonus)
        }
      });

      // Создаем транзакцию зачисления
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
    } catch (error) {
      this.logger.error(`Failed to update referral owner balance for ${ownerId}`, error);
      throw error;
    }
  }
}
