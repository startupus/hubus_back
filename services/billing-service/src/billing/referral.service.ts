import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

export interface ReferralBonusCalculation {
  inputTokens: number;
  outputTokens: number;
  inputTokenRate: number; // 10% = 0.1
  outputTokenRate: number; // 5% = 0.05
  inputBonus: Decimal;
  outputBonus: Decimal;
  totalBonus: Decimal;
}

export interface CreateReferralTransactionDto {
  referralOwnerId: string; // Компания, которая получила реферала
  originalTransactionId: string;
  inputTokens: number;
  outputTokens: number;
  inputTokenPrice: Decimal; // Цена за входной токен
  outputTokenPrice: Decimal; // Цена за выходной токен
  description?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ReferralService {
  private readonly logger = new Logger(ReferralService.name);

  // Ставки реферальных бонусов
  private readonly INPUT_TOKEN_RATE = 0.10; // 10%
  private readonly OUTPUT_TOKEN_RATE = 0.05; // 5%

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate referral bonus for a transaction
   */
  calculateReferralBonus(
    inputTokens: number,
    outputTokens: number,
    inputTokenPrice: Decimal,
    outputTokenPrice: Decimal
  ): ReferralBonusCalculation {
    const inputBonus = new Decimal(inputTokens).mul(inputTokenPrice).mul(this.INPUT_TOKEN_RATE);
    const outputBonus = new Decimal(outputTokens).mul(outputTokenPrice).mul(this.OUTPUT_TOKEN_RATE);
    const totalBonus = inputBonus.add(outputBonus);

    return {
      inputTokens,
      outputTokens,
      inputTokenRate: this.INPUT_TOKEN_RATE,
      outputTokenRate: this.OUTPUT_TOKEN_RATE,
      inputBonus,
      outputBonus,
      totalBonus,
    };
  }

  /**
   * Create referral transaction and process bonus
   */
  async createReferralTransaction(dto: CreateReferralTransactionDto): Promise<void> {
    try {
      // Find the referrer company
      const referrerCompany = await this.prisma.company.findUnique({
        where: { id: dto.referralOwnerId },
        include: { referredCompanies: true },
      });

      if (!referrerCompany) {
        throw new NotFoundException('Referrer company not found');
      }

      // Find the company that made the original transaction
      const originalTransaction = await this.prisma.transaction.findUnique({
        where: { id: dto.originalTransactionId },
        include: { company: true },
      });

      if (!originalTransaction) {
        throw new NotFoundException('Original transaction not found');
      }

      // Check if the company that made the transaction is a referral of the referrer
      const isReferral = referrerCompany.referredCompanies.some(
        refCompany => refCompany.id === originalTransaction.companyId
      );

      if (!isReferral) {
        this.logger.warn('Company is not a referral of the referrer', {
          referrerId: dto.referralOwnerId,
          transactionCompanyId: originalTransaction.companyId,
        });
        return;
      }

      // Calculate referral bonus
      const bonusCalculation = this.calculateReferralBonus(
        dto.inputTokens,
        dto.outputTokens,
        dto.inputTokenPrice,
        dto.outputTokenPrice
      );

      // Skip if no bonus to award
      if (bonusCalculation.totalBonus.lte(0)) {
        this.logger.debug('No referral bonus to award', {
          inputTokens: dto.inputTokens,
          outputTokens: dto.outputTokens,
        });
        return;
      }

      // Create referral transaction
      const referralTransaction = await this.prisma.referralTransaction.create({
        data: {
          referralOwnerId: dto.referralOwnerId,
          referralEarnerId: dto.referralOwnerId, // The referrer earns the bonus
          originalTransactionId: dto.originalTransactionId,
          amount: bonusCalculation.totalBonus,
          inputTokens: dto.inputTokens,
          outputTokens: dto.outputTokens,
          inputTokenRate: bonusCalculation.inputTokenRate,
          outputTokenRate: bonusCalculation.outputTokenRate,
          description: dto.description || `Referral bonus for ${dto.inputTokens} input + ${dto.outputTokens} output tokens`,
          metadata: {
            ...dto.metadata,
            inputTokenPrice: dto.inputTokenPrice.toString(),
            outputTokenPrice: dto.outputTokenPrice.toString(),
            calculation: {
              inputTokens: bonusCalculation.inputTokens,
              outputTokens: bonusCalculation.outputTokens,
              inputTokenRate: bonusCalculation.inputTokenRate,
              outputTokenRate: bonusCalculation.outputTokenRate,
              inputBonus: bonusCalculation.inputBonus.toString(),
              outputBonus: bonusCalculation.outputBonus.toString(),
              totalBonus: bonusCalculation.totalBonus.toString(),
            },
          },
        },
      });

      // Process the bonus by adding it to the referrer's balance
      await this.processReferralBonus(dto.referralOwnerId, bonusCalculation.totalBonus, referralTransaction.id);

      this.logger.log('Referral transaction created and processed', {
        referralTransactionId: referralTransaction.id,
        referrerId: dto.referralOwnerId,
        amount: bonusCalculation.totalBonus.toString(),
        inputTokens: dto.inputTokens,
        outputTokens: dto.outputTokens,
      });
    } catch (error) {
      this.logger.error('Failed to create referral transaction', error, {
        dto,
      });
      throw error;
    }
  }

  /**
   * Process referral bonus by updating company balance
   */
  private async processReferralBonus(
    companyId: string,
    amount: Decimal,
    referralTransactionId: string
  ): Promise<void> {
    try {
      // Update company balance
      await this.prisma.companyBalance.update({
        where: { companyId },
        data: {
          balance: {
            increment: amount,
          },
          lastUpdated: new Date(),
        },
      });

      // Create a regular transaction for the bonus
      await this.prisma.transaction.create({
        data: {
          companyId,
          type: 'CREDIT',
          amount,
          currency: 'USD',
          description: `Referral bonus - Transaction ID: ${referralTransactionId}`,
          status: 'COMPLETED',
          reference: `REF_BONUS_${referralTransactionId}`,
          metadata: {
            type: 'referral_bonus',
            referralTransactionId,
          },
          processedAt: new Date(),
        },
      });

      // Update referral transaction status
      await this.prisma.referralTransaction.update({
        where: { id: referralTransactionId },
        data: {
          status: 'COMPLETED',
          processedAt: new Date(),
        },
      });

      this.logger.log('Referral bonus processed', {
        companyId,
        amount: amount.toString(),
        referralTransactionId,
      });
    } catch (error) {
      this.logger.error('Failed to process referral bonus', error, {
        companyId,
        amount: amount.toString(),
        referralTransactionId,
      });
      throw error;
    }
  }

  /**
   * Get referral statistics for a company
   */
  async getReferralStats(companyId: string): Promise<{
    totalReferrals: number;
    totalEarnings: Decimal;
    totalTransactions: number;
    recentTransactions: any[];
  }> {
    try {
      const [referralCount, earnings, transactions, recentTransactions] = await Promise.all([
        // Count total referrals
        this.prisma.company.count({
          where: { referredBy: companyId },
        }),
        
        // Sum total earnings from referral transactions
        this.prisma.referralTransaction.aggregate({
          where: { referralEarnerId: companyId, status: 'COMPLETED' },
          _sum: { amount: true },
        }),
        
        // Count total referral transactions
        this.prisma.referralTransaction.count({
          where: { referralEarnerId: companyId },
        }),
        
        // Get recent referral transactions
        this.prisma.referralTransaction.findMany({
          where: { referralEarnerId: companyId },
          include: {
            referralOwner: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        }),
      ]);

      return {
        totalReferrals: referralCount,
        totalEarnings: earnings._sum.amount || new Decimal(0),
        totalTransactions: transactions,
        recentTransactions,
      };
    } catch (error) {
      this.logger.error('Failed to get referral stats', error, { companyId });
      throw error;
    }
  }

  /**
   * Get referral transactions for a company
   */
  async getReferralTransactions(
    companyId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{
    transactions: any[];
    total: number;
  }> {
    try {
      const [transactions, total] = await Promise.all([
        this.prisma.referralTransaction.findMany({
          where: { referralEarnerId: companyId },
          include: {
            referralOwner: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip: offset,
        }),
        this.prisma.referralTransaction.count({
          where: { referralEarnerId: companyId },
        }),
      ]);

      return { transactions, total };
    } catch (error) {
      this.logger.error('Failed to get referral transactions', error, { companyId });
      throw error;
    }
  }
}
