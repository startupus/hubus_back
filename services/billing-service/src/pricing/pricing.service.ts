import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { CreatePricingPlanDto, UpdatePricingPlanDto, SubscribeToPlanDto, SubscriptionUsageDto } from './dto/pricing.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async getPricingPlans(active?: boolean) {
    try {
      const where = active !== undefined ? { isActive: active } : {};
      
      const plans = await this.prisma.pricingPlan.findMany({
        where,
        orderBy: { createdAt: 'desc' }
      });

      LoggerUtil.info('billing-service', 'Pricing plans retrieved', { count: plans.length, active });
      return plans;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get pricing plans', error as Error, { active });
      throw error;
    }
  }

  async getPricingPlan(id: string) {
    try {
      const plan = await this.prisma.pricingPlan.findUnique({
        where: { id }
      });

      if (!plan) {
        throw new NotFoundException('Pricing plan not found');
      }

      LoggerUtil.info('billing-service', 'Pricing plan retrieved', { planId: id });
      return plan;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get pricing plan', error as Error, { planId: id });
      throw error;
    }
  }

  async createPricingPlan(createPricingPlanDto: CreatePricingPlanDto) {
    try {
      // Calculate price with discount if it's a token-based plan
      let finalPrice = createPricingPlanDto.price ? new Decimal(createPricingPlanDto.price) : new Decimal(0);
      
      if (createPricingPlanDto.type === 'TOKEN_BASED' && 
          createPricingPlanDto.inputTokens && 
          createPricingPlanDto.outputTokens &&
          createPricingPlanDto.inputTokenPrice &&
          createPricingPlanDto.outputTokenPrice) {
        
        const inputCost = new Decimal(createPricingPlanDto.inputTokens).mul(createPricingPlanDto.inputTokenPrice);
        const outputCost = new Decimal(createPricingPlanDto.outputTokens).mul(createPricingPlanDto.outputTokenPrice);
        const totalCost = inputCost.add(outputCost);
        
        // Apply discount (default 10% if not specified)
        const discount = createPricingPlanDto.discountPercent || 10;
        const discountMultiplier = new Decimal(100 - Number(discount)).div(100);
        finalPrice = totalCost.mul(discountMultiplier);
      }

      const plan = await this.prisma.pricingPlan.create({
        data: {
          name: createPricingPlanDto.name,
          description: createPricingPlanDto.description,
          type: createPricingPlanDto.type,
          price: finalPrice,
          currency: createPricingPlanDto.currency || 'USD',
          billingCycle: createPricingPlanDto.billingCycle || 'MONTHLY',
          isActive: createPricingPlanDto.isActive !== false,
          inputTokens: createPricingPlanDto.inputTokens,
          outputTokens: createPricingPlanDto.outputTokens,
          inputTokenPrice: createPricingPlanDto.inputTokenPrice,
          outputTokenPrice: createPricingPlanDto.outputTokenPrice,
          discountPercent: createPricingPlanDto.discountPercent
        }
      });

      LoggerUtil.info('billing-service', 'Pricing plan created', { 
        planId: plan.id, 
        name: plan.name,
        price: finalPrice.toString()
      });
      
      return plan;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to create pricing plan', error as Error, { 
        name: createPricingPlanDto.name,
        type: createPricingPlanDto.type 
      });
      throw error;
    }
  }

  async updatePricingPlan(id: string, updatePricingPlanDto: UpdatePricingPlanDto) {
    try {
      const existingPlan = await this.prisma.pricingPlan.findUnique({
        where: { id }
      });

      if (!existingPlan) {
        throw new NotFoundException('Pricing plan not found');
      }

      // Recalculate price if token-based plan is being updated
      let finalPrice = updatePricingPlanDto.price ? new Decimal(updatePricingPlanDto.price) : existingPlan.price;
      
      if (updatePricingPlanDto.type === 'TOKEN_BASED' && 
          updatePricingPlanDto.inputTokens && 
          updatePricingPlanDto.outputTokens &&
          updatePricingPlanDto.inputTokenPrice &&
          updatePricingPlanDto.outputTokenPrice) {
        
        const inputCost = new Decimal(updatePricingPlanDto.inputTokens).mul(updatePricingPlanDto.inputTokenPrice);
        const outputCost = new Decimal(updatePricingPlanDto.outputTokens).mul(updatePricingPlanDto.outputTokenPrice);
        const totalCost = inputCost.add(outputCost);
        
        const discount = updatePricingPlanDto.discountPercent || existingPlan.discountPercent || 10;
        const discountMultiplier = new Decimal(100 - Number(discount)).div(100);
        finalPrice = totalCost.mul(discountMultiplier);
      }

      const updateData: any = {};
      if (updatePricingPlanDto.name !== undefined) updateData.name = updatePricingPlanDto.name;
      if (updatePricingPlanDto.description !== undefined) updateData.description = updatePricingPlanDto.description;
      if (updatePricingPlanDto.type !== undefined) updateData.type = updatePricingPlanDto.type;
      if (updatePricingPlanDto.currency !== undefined) updateData.currency = updatePricingPlanDto.currency;
      if (updatePricingPlanDto.billingCycle !== undefined) updateData.billingCycle = updatePricingPlanDto.billingCycle;
      if (updatePricingPlanDto.isActive !== undefined) updateData.isActive = updatePricingPlanDto.isActive;
      if (updatePricingPlanDto.inputTokens !== undefined) updateData.inputTokens = updatePricingPlanDto.inputTokens;
      if (updatePricingPlanDto.outputTokens !== undefined) updateData.outputTokens = updatePricingPlanDto.outputTokens;
      if (updatePricingPlanDto.inputTokenPrice !== undefined) updateData.inputTokenPrice = updatePricingPlanDto.inputTokenPrice;
      if (updatePricingPlanDto.outputTokenPrice !== undefined) updateData.outputTokenPrice = updatePricingPlanDto.outputTokenPrice;
      if (updatePricingPlanDto.discountPercent !== undefined) updateData.discountPercent = updatePricingPlanDto.discountPercent;
      updateData.price = finalPrice;

      const plan = await this.prisma.pricingPlan.update({
        where: { id },
        data: updateData
      });

      LoggerUtil.info('billing-service', 'Pricing plan updated', { planId: id });
      return plan;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to update pricing plan', error as Error, { planId: id });
      throw error;
    }
  }

  async deletePricingPlan(id: string) {
    try {
      const plan = await this.prisma.pricingPlan.findUnique({
        where: { id },
        include: { subscriptions: true }
      });

      if (!plan) {
        throw new NotFoundException('Pricing plan not found');
      }

      if (plan.subscriptions.length > 0) {
        throw new ConflictException('Cannot delete pricing plan with active subscriptions');
      }

      await this.prisma.pricingPlan.delete({
        where: { id }
      });

      LoggerUtil.info('billing-service', 'Pricing plan deleted', { planId: id });
      return { success: true, message: 'Pricing plan deleted successfully' };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to delete pricing plan', error as Error, { planId: id });
      throw error;
    }
  }

  async subscribeToPlan(subscribeToPlanDto: SubscribeToPlanDto) {
    try {
      const { companyId, planId, paymentMethodId } = subscribeToPlanDto;

      // Check if company exists
      const company = await this.prisma.company.findUnique({
        where: { id: companyId }
      });

      if (!company) {
        throw new NotFoundException('Company not found');
      }

      // Check if plan exists and is active
      const plan = await this.prisma.pricingPlan.findUnique({
        where: { id: planId }
      });

      if (!plan) {
        throw new NotFoundException('Pricing plan not found');
      }

      if (!plan.isActive) {
        throw new BadRequestException('Pricing plan is not active');
      }

      // Check if company already has an active subscription
      const existingSubscription = await this.prisma.subscription.findFirst({
        where: {
          companyId,
          status: 'ACTIVE',
          currentPeriodEnd: { gt: new Date() }
        }
      });

      if (existingSubscription) {
        throw new ConflictException('Company already has an active subscription');
      }

      // Calculate subscription period
      const now = new Date();
      const periodEnd = new Date(now);
      periodEnd.setMonth(periodEnd.getMonth() + 1); // Monthly subscription

      // Create subscription
      const subscription = await this.prisma.subscription.create({
        data: {
          companyId,
          planId,
          price: plan.price,
          currency: plan.currency,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          inputTokensLimit: plan.inputTokens,
          outputTokensLimit: plan.outputTokens,
          inputTokensUsed: 0,
          outputTokensUsed: 0
        },
        include: {
          plan: true
        }
      });

      // Deduct payment from company balance
      await this.prisma.companyBalance.update({
        where: { companyId },
        data: {
          balance: {
            decrement: plan.price
          }
        }
      });

      // Create transaction record
      await this.prisma.transaction.create({
        data: {
          companyId,
          type: 'DEBIT',
          amount: plan.price,
          currency: plan.currency,
          description: `Subscription to ${plan.name}`,
          status: 'COMPLETED',
          metadata: {
            subscriptionId: subscription.id,
            planId: plan.id,
            planName: plan.name,
            periodStart: now.toISOString(),
            periodEnd: periodEnd.toISOString()
          }
        }
      });

      LoggerUtil.info('billing-service', 'Subscription created', { 
        subscriptionId: subscription.id,
        companyId,
        planId,
        price: plan.price.toString()
      });

      return subscription;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to create subscription', error as Error, { 
        companyId: subscribeToPlanDto.companyId,
        planId: subscribeToPlanDto.planId 
      });
      throw error;
    }
  }

  async getCompanySubscriptions(companyId: string) {
    try {
      const subscriptions = await this.prisma.subscription.findMany({
        where: { companyId },
        include: {
          plan: true
        },
        orderBy: { createdAt: 'desc' }
      });

      LoggerUtil.info('billing-service', 'Company subscriptions retrieved', { 
        companyId, 
        count: subscriptions.length 
      });
      
      return subscriptions;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get company subscriptions', error as Error, { companyId });
      throw error;
    }
  }

  async getActiveSubscription(companyId: string) {
    try {
      const subscription = await this.prisma.subscription.findFirst({
        where: {
          companyId,
          status: 'ACTIVE',
          currentPeriodEnd: { gt: new Date() }
        },
        include: {
          plan: true
        }
      });

      if (!subscription) {
        throw new NotFoundException('No active subscription found');
      }

      LoggerUtil.info('billing-service', 'Active subscription retrieved', { 
        companyId, 
        subscriptionId: subscription.id 
      });
      
      return subscription;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get active subscription', error as Error, { companyId });
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId }
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      const updatedSubscription = await this.prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'CANCELLED'
        }
      });

      LoggerUtil.info('billing-service', 'Subscription cancelled', { subscriptionId });
      return updatedSubscription;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to cancel subscription', error as Error, { subscriptionId });
      throw error;
    }
  }

  async getSubscriptionUsage(subscriptionId: string): Promise<SubscriptionUsageDto> {
    try {
      const subscription = await this.prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { plan: true }
      });

      if (!subscription) {
        throw new NotFoundException('Subscription not found');
      }

      const inputTokensRemaining = (subscription.inputTokensLimit || 0) - subscription.inputTokensUsed;
      const outputTokensRemaining = (subscription.outputTokensLimit || 0) - subscription.outputTokensUsed;
      
      const totalTokensLimit = (subscription.inputTokensLimit || 0) + (subscription.outputTokensLimit || 0);
      const totalTokensUsed = subscription.inputTokensUsed + subscription.outputTokensUsed;
      const usagePercentage = totalTokensLimit > 0 ? (totalTokensUsed / totalTokensLimit) * 100 : 0;

      const usage: SubscriptionUsageDto = {
        inputTokensUsed: subscription.inputTokensUsed,
        outputTokensUsed: subscription.outputTokensUsed,
        inputTokensLimit: subscription.inputTokensLimit || 0,
        outputTokensLimit: subscription.outputTokensLimit || 0,
        inputTokensRemaining: Math.max(0, inputTokensRemaining),
        outputTokensRemaining: Math.max(0, outputTokensRemaining),
        usagePercentage: Math.round(usagePercentage * 100) / 100
      };

      LoggerUtil.info('billing-service', 'Subscription usage retrieved', { 
        subscriptionId,
        usagePercentage: usage.usagePercentage
      });
      
      return usage;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get subscription usage', error as Error, { subscriptionId });
      throw error;
    }
  }
}
