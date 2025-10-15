import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';
import { BillingService } from './billing.service';
import { SubscriptionBillingService } from './subscription-billing.service';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly billingService: BillingService,
    private readonly subscriptionBillingService: SubscriptionBillingService
  ) {}

  async getSubscriptionPlans() {
    this.logger.log('Getting subscription plans');

    try {
      // Получаем планы из базы данных
      const plans = await this.prisma.pricingPlan.findMany({
        where: {
          isActive: true,
          type: 'SUBSCRIPTION'
        },
        orderBy: {
          price: 'asc'
        }
      });

      // Если планы есть в БД, используем их
      if (plans.length > 0) {
        return {
          success: true,
          data: plans.map(plan => ({
            id: plan.id,
            name: plan.name,
            description: plan.description,
            price: plan.price.toString(),
            currency: plan.currency,
            billingCycle: plan.billingCycle.toLowerCase(),
            features: plan.features ? Object.values(plan.features as any) : [],
            limits: plan.limits || {},
            inputTokens: plan.inputTokens,
            outputTokens: plan.outputTokens,
            inputTokenPrice: plan.inputTokenPrice?.toString(),
            outputTokenPrice: plan.outputTokenPrice?.toString(),
            discountPercent: plan.discountPercent?.toString()
          }))
        };
      }

      // Если планов нет в БД, используем hardcoded планы
      this.logger.log('No plans in database, using hardcoded plans');
      return await this.getHardcodedPlans();
    } catch (error) {
      this.logger.error('Failed to get subscription plans, using hardcoded', error);
      // В случае ошибки используем hardcoded планы
      return await this.getHardcodedPlans();
    }
  }

  // Fallback метод для совместимости
  async getHardcodedPlans() {
    this.logger.log('Getting hardcoded subscription plans');

    // Возвращаем предопределенные планы подписок
    const plans = [
      {
        id: 'basic',
        name: 'Basic',
        description: 'Базовый план для небольших команд',
        price: '29.99',
        currency: 'USD',
        billingCycle: 'monthly',
        features: [
          'До 1000 запросов в месяц',
          'Базовые ИИ модели',
          'Email поддержка',
          'API доступ'
        ],
        limits: {
          monthlyRequests: 1000,
          maxUsers: 5,
          storage: '1GB'
        },
        inputTokens: 100000,
        outputTokens: 100000,
        inputTokenPrice: '0.0001',
        outputTokenPrice: '0.0002',
        discountPercent: '10'
      },
      {
        id: 'professional',
        name: 'Professional',
        description: 'Профессиональный план для растущих команд',
        price: '99.99',
        currency: 'USD',
        billingCycle: 'monthly',
        features: [
          'До 10000 запросов в месяц',
          'Все ИИ модели',
          'Приоритетная поддержка',
          'Расширенный API',
          'Аналитика и отчеты'
        ],
        limits: {
          monthlyRequests: 10000,
          maxUsers: 25,
          storage: '10GB'
        },
        inputTokens: 500000,
        outputTokens: 500000,
        inputTokenPrice: '0.00008',
        outputTokenPrice: '0.00015',
        discountPercent: '20'
      },
      {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Корпоративный план для больших организаций',
        price: '299.99',
        currency: 'USD',
        billingCycle: 'monthly',
        features: [
          'Неограниченные запросы',
          'Все ИИ модели',
          '24/7 поддержка',
          'Полный API доступ',
          'Расширенная аналитика',
          'Кастомные интеграции',
          'SLA гарантии'
        ],
        limits: {
          monthlyRequests: -1, // -1 означает неограниченно
          maxUsers: -1,
          storage: '100GB'
        },
        inputTokens: 2000000,
        outputTokens: 2000000,
        inputTokenPrice: '0.00005',
        outputTokenPrice: '0.0001',
        discountPercent: '30'
      }
    ];

    return {
      success: true,
      data: plans
    };
  }

  async getMySubscription(companyId: string) {
    this.logger.log(`Getting subscription for company ${companyId}`);

    // Проверяем, есть ли активная подписка
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        companyId,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    });

    this.logger.log(`Found subscription: ${subscription ? 'YES' : 'NO'}`);
    if (subscription) {
      this.logger.log(`Subscription details: id=${subscription.id}, planId=${subscription.planId}, status=${subscription.status}`);
    }

    if (!subscription) {
      return {
        success: true,
        data: {
          hasSubscription: false,
          subscription: null
        }
      };
    }

    return {
      success: true,
      data: {
        hasSubscription: true,
        subscription: {
          id: subscription.id,
          planId: subscription.planId,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          price: subscription.price.toString(),
          currency: subscription.currency,
          createdAt: subscription.createdAt
        }
      }
    };
  }

  async getSubscriptionUsage(companyId: string) {
    this.logger.log(`Getting subscription usage for company ${companyId}`);

    // Используем SubscriptionBillingService для получения детальной информации о токенах
    const usageInfo = await this.subscriptionBillingService.getSubscriptionUsage(companyId);

    if (!usageInfo) {
      return {
        success: true,
        data: {
          hasSubscription: false,
          usage: null
        }
      };
    }

    // Получаем дополнительную статистику использования
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date();
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const usageStats = await this.prisma.usageEvent.aggregate({
      where: {
        companyId,
        timestamp: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      _sum: {
        quantity: true,
        cost: true
      },
      _count: {
        id: true
      }
    });

    return {
      success: true,
      data: {
        hasSubscription: true,
        usage: {
          currentPeriod: {
            start: startOfMonth,
            end: endOfMonth
          },
          requests: usageStats._count.id || 0,
          totalCost: usageStats._sum.cost?.toString() || '0',
          quantity: usageStats._sum.quantity || 0,
          // Детальная информация о токенах из SubscriptionBillingService
          inputTokens: {
            used: usageInfo.inputTokensUsed,
            limit: usageInfo.inputTokensLimit,
            remaining: usageInfo.inputTokensRemaining
          },
          outputTokens: {
            used: usageInfo.outputTokensUsed,
            limit: usageInfo.outputTokensLimit,
            remaining: usageInfo.outputTokensRemaining
          },
          // Дополнительная информация
          totalTokensUsed: usageInfo.inputTokensUsed + usageInfo.outputTokensUsed,
          totalTokensLimit: usageInfo.inputTokensLimit + usageInfo.outputTokensLimit,
          usagePercentage: usageInfo.usagePercentage,
          periodEnd: usageInfo.periodEnd
        },
        subscription: {
          id: usageInfo.subscriptionId,
          planName: usageInfo.planName,
          status: 'ACTIVE'
        }
      }
    };
  }

  async subscribeToPlan(companyId: string, planId: string) {
    this.logger.log(`Subscribing company ${companyId} to plan ${planId}`);

    // Проверяем, что компания существует
    const company = await this.prisma.company.findUnique({
      where: { id: companyId }
    });

    if (!company) {
      throw new NotFoundException('Company not found');
    }

    // Проверяем, что план существует
    const plans = await this.getSubscriptionPlans();
    const plan = plans.data.find(p => p.id === planId);
    
    if (!plan) {
      throw new BadRequestException('Invalid plan ID');
    }

    // Отменяем существующую подписку, если есть
    await this.prisma.subscription.updateMany({
      where: {
        companyId,
        status: 'ACTIVE'
      },
      data: {
        status: 'CANCELLED',
        currentPeriodEnd: new Date()
      }
    });

    // Списываем средства с баланса
    const planPrice = parseFloat(plan.price);
    await this.billingService.chargeForSubscription(companyId, planPrice, planId);

    // Создаем новую подписку
    this.logger.log(`Creating subscription for company ${companyId} with plan ${planId}`);
    const currentPeriodStart = new Date();
    const currentPeriodEnd = new Date();
    currentPeriodEnd.setMonth(currentPeriodEnd.getMonth() + 1); // Месячная подписка

    this.logger.log(`Subscription data: companyId=${companyId}, planId=${planId}, price=${planPrice.toString()}, currency=${plan.currency}`);
    
    // Начисляем токены из плана
    const inputTokens = plan.inputTokens || 0;
    const outputTokens = plan.outputTokens || 0;
    
    this.logger.log(`Allocating tokens: inputTokens=${inputTokens}, outputTokens=${outputTokens}`);
    
    const subscription = await this.prisma.subscription.create({
      data: {
        companyId,
        planId,
        status: 'ACTIVE',
        currentPeriodStart,
        currentPeriodEnd,
        price: planPrice.toString(),
        currency: plan.currency,
        inputTokensLimit: inputTokens,
        outputTokensLimit: outputTokens
      }
    });

    this.logger.log(`Subscription created successfully with ID: ${subscription.id}`);

    return {
      success: true,
      data: {
        subscription: {
          id: subscription.id,
          planId: subscription.planId,
          status: subscription.status,
          currentPeriodStart: subscription.currentPeriodStart,
          currentPeriodEnd: subscription.currentPeriodEnd,
          price: subscription.price.toString(),
          currency: subscription.currency
        }
      }
    };
  }

  async cancelSubscription(companyId: string) {
    this.logger.log(`Cancelling subscription for company ${companyId}`);

    const subscription = await this.prisma.subscription.findFirst({
      where: {
        companyId,
        status: 'ACTIVE'
      },
      orderBy: { createdAt: 'desc' }
    });

    if (!subscription) {
      throw new NotFoundException('No active subscription found');
    }

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        status: 'CANCELLED',
        currentPeriodEnd: new Date()
      }
    });

    return {
      success: true,
      message: 'Subscription cancelled successfully'
    };
  }
}
