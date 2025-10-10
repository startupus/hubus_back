import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { Decimal } from '@prisma/client/runtime/library';

export interface AIRequestData {
  companyId: string;
  inputTokens: number;
  outputTokens: number;
  inputTokenPrice: number;
  outputTokenPrice: number;
  provider: string;
  model: string;
  metadata?: Record<string, any>;
}

export interface BillingResult {
  success: boolean;
  amountCharged: Decimal;
  tokensUsed: {
    input: number;
    output: number;
  };
  billingMethod: 'subscription' | 'pay_as_you_go';
  subscriptionId?: string;
  transactionId?: string;
  remainingTokens?: {
    input: number;
    output: number;
  };
}

@Injectable()
export class SubscriptionBillingService {
  private readonly logger = new Logger(SubscriptionBillingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Process AI request billing with subscription support
   */
  async processAIRequest(request: AIRequestData): Promise<BillingResult> {
    try {
      LoggerUtil.info('billing-service', 'Processing AI request billing', {
        companyId: request.companyId,
        inputTokens: request.inputTokens,
        outputTokens: request.outputTokens
      });

      // Check if company has active subscription
      const activeSubscription = await this.getActiveSubscription(request.companyId);

      if (activeSubscription) {
        return await this.processWithSubscription(activeSubscription, request);
      } else {
        return await this.processPayAsYouGo(request);
      }
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to process AI request billing', error as Error, {
        companyId: request.companyId
      });
      throw error;
    }
  }

  /**
   * Process billing with active subscription
   */
  private async processWithSubscription(subscription: any, request: AIRequestData): Promise<BillingResult> {
    try {
      const { inputTokens, outputTokens } = request;
      
      // Check if subscription has enough tokens
      const inputTokensRemaining = (subscription.inputTokensLimit || 0) - subscription.inputTokensUsed;
      const outputTokensRemaining = (subscription.outputTokensLimit || 0) - subscription.outputTokensUsed;

      // Calculate tokens that can be covered by subscription
      const inputTokensFromSubscription = Math.min(inputTokens, inputTokensRemaining);
      const outputTokensFromSubscription = Math.min(outputTokens, outputTokensRemaining);
      
      // Calculate tokens that need to be paid separately
      const inputTokensToPay = inputTokens - inputTokensFromSubscription;
      const outputTokensToPay = outputTokens - outputTokensFromSubscription;

      let totalAmountCharged = new Decimal(0);
      let payAsYouGoTransactionId: string | undefined;

      // Update subscription token usage
      if (inputTokensFromSubscription > 0 || outputTokensFromSubscription > 0) {
        await this.updateSubscriptionUsage(subscription.id, inputTokensFromSubscription, outputTokensFromSubscription);
        LoggerUtil.info('billing-service', 'Subscription tokens used', {
          subscriptionId: subscription.id,
          inputTokensUsed: inputTokensFromSubscription,
          outputTokensUsed: outputTokensFromSubscription
        });
      }

      // Process pay-as-you-go billing for remaining tokens
      if (inputTokensToPay > 0 || outputTokensToPay > 0) {
        const payAsYouGoResult = await this.processPayAsYouGo({
          ...request,
          inputTokens: inputTokensToPay,
          outputTokens: outputTokensToPay
        });
        
        totalAmountCharged = payAsYouGoResult.amountCharged;
        payAsYouGoTransactionId = payAsYouGoResult.transactionId;
      }

      // Calculate remaining tokens
      const newInputTokensUsed = subscription.inputTokensUsed + inputTokensFromSubscription;
      const newOutputTokensUsed = subscription.outputTokensUsed + outputTokensFromSubscription;
      const inputTokensRemainingAfter = (subscription.inputTokensLimit || 0) - newInputTokensUsed;
      const outputTokensRemainingAfter = (subscription.outputTokensLimit || 0) - newOutputTokensUsed;

      LoggerUtil.info('billing-service', 'AI request processed with subscription', {
        companyId: request.companyId,
        subscriptionId: subscription.id,
        totalAmountCharged: totalAmountCharged.toString(),
        inputTokensRemaining: inputTokensRemainingAfter,
        outputTokensRemaining: outputTokensRemainingAfter
      });

      return {
        success: true,
        amountCharged: totalAmountCharged,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens
        },
        billingMethod: 'subscription',
        subscriptionId: subscription.id,
        transactionId: payAsYouGoTransactionId,
        remainingTokens: {
          input: Math.max(0, inputTokensRemainingAfter),
          output: Math.max(0, outputTokensRemainingAfter)
        }
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to process with subscription', error as Error, {
        subscriptionId: subscription.id
      });
      throw error;
    }
  }

  /**
   * Process pay-as-you-go billing
   */
  private async processPayAsYouGo(request: AIRequestData): Promise<BillingResult> {
    try {
      const { companyId, inputTokens, outputTokens, inputTokenPrice, outputTokenPrice } = request;
      
      // Calculate cost
      const inputCost = new Decimal(inputTokens).mul(inputTokenPrice);
      const outputCost = new Decimal(outputTokens).mul(outputTokenPrice);
      const totalCost = inputCost.add(outputCost);

      // Check company balance
      const companyBalance = await this.prisma.companyBalance.findUnique({
        where: { companyId }
      });

      if (!companyBalance) {
        throw new NotFoundException('Company balance not found');
      }

      if (companyBalance.balance.lt(totalCost)) {
        throw new BadRequestException('Insufficient balance');
      }

      // Deduct from balance
      const newBalance = companyBalance.balance.sub(totalCost);
      
      await this.prisma.companyBalance.update({
        where: { companyId },
        data: { balance: newBalance }
      });

      // Create transaction
      const transaction = await this.prisma.transaction.create({
        data: {
          companyId,
          type: 'DEBIT',
          amount: totalCost,
          currency: 'USD',
          description: `AI request - ${inputTokens} input + ${outputTokens} output tokens`,
          status: 'COMPLETED',
          metadata: {
            inputTokens,
            outputTokens,
            inputTokenPrice,
            outputTokenPrice,
            provider: request.provider,
            model: request.model,
            ...request.metadata
          }
        }
      });

      LoggerUtil.info('billing-service', 'Pay-as-you-go billing processed', {
        companyId,
        amountCharged: totalCost.toString(),
        transactionId: transaction.id
      });

      return {
        success: true,
        amountCharged: totalCost,
        tokensUsed: {
          input: inputTokens,
          output: outputTokens
        },
        billingMethod: 'pay_as_you_go',
        transactionId: transaction.id
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to process pay-as-you-go billing', error as Error, {
        companyId: request.companyId
      });
      throw error;
    }
  }

  /**
   * Get active subscription for company
   */
  private async getActiveSubscription(companyId: string) {
    return await this.prisma.subscription.findFirst({
      where: {
        companyId,
        status: 'ACTIVE',
        currentPeriodEnd: { gt: new Date() }
      },
      include: {
        plan: true
      }
    });
  }

  /**
   * Update subscription token usage
   */
  private async updateSubscriptionUsage(subscriptionId: string, inputTokens: number, outputTokens: number) {
    await this.prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        inputTokensUsed: {
          increment: inputTokens
        },
        outputTokensUsed: {
          increment: outputTokens
        }
      }
    });
  }

  /**
   * Get subscription usage statistics
   */
  async getSubscriptionUsage(companyId: string) {
    const subscription = await this.getActiveSubscription(companyId);
    
    if (!subscription) {
      return null;
    }

    const inputTokensRemaining = (subscription.inputTokensLimit || 0) - subscription.inputTokensUsed;
    const outputTokensRemaining = (subscription.outputTokensLimit || 0) - subscription.outputTokensUsed;
    
    const totalTokensLimit = (subscription.inputTokensLimit || 0) + (subscription.outputTokensLimit || 0);
    const totalTokensUsed = subscription.inputTokensUsed + subscription.outputTokensUsed;
    const usagePercentage = totalTokensLimit > 0 ? (totalTokensUsed / totalTokensLimit) * 100 : 0;

    return {
      subscriptionId: subscription.id,
      planName: subscription.plan.name,
      inputTokensUsed: subscription.inputTokensUsed,
      outputTokensUsed: subscription.outputTokensUsed,
      inputTokensLimit: subscription.inputTokensLimit || 0,
      outputTokensLimit: subscription.outputTokensLimit || 0,
      inputTokensRemaining: Math.max(0, inputTokensRemaining),
      outputTokensRemaining: Math.max(0, outputTokensRemaining),
      usagePercentage: Math.round(usagePercentage * 100) / 100,
      periodEnd: subscription.currentPeriodEnd
    };
  }
}
