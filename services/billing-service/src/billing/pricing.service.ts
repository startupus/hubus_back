import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { PricingRule, DiscountRule, CostBreakdown } from '../types/billing.types';

/**
 * Pricing Service
 * 
 * Manages pricing rules, discounts, and cost calculations:
 * - Dynamic pricing based on usage patterns
 * - Tiered pricing for volume discounts
 * - Promotional discounts and coupons
 * - Currency conversion
 * - Tax calculations
 */
@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Calculate cost for usage (alias for calculateUsageCost)
   */
  async calculateCost(
    service: string,
    resource: string,
    quantity: number,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<number> {
    const result = await this.calculateUsageCost(service, resource, quantity, userId, metadata);
    return result.cost || 0;
  }

  /**
   * Calculate cost for usage
   */
  async calculateUsageCost(
    service: string,
    resource: string,
    quantity: number,
    userId?: string,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    cost?: number;
    currency?: string;
    breakdown?: CostBreakdown;
    error?: string;
  }> {
    try {
      LoggerUtil.debug('billing-service', 'Calculating usage cost', {
        service,
        resource,
        quantity,
        userId
      });

      // Get applicable pricing rules
      const pricingRules = await this.getApplicablePricingRules(service, resource, userId);
      
      if (!pricingRules || pricingRules.length === 0) {
        // Use default pricing
        const defaultCost = this.getDefaultPricing(service, resource);
        const totalCost = defaultCost * quantity;

        return {
          success: true,
          cost: totalCost,
          currency: 'USD',
          breakdown: {
            baseCost: defaultCost,
            usageCost: totalCost,
            tax: 0,
            discounts: 0,
            total: totalCost,
            currency: 'USD'
          }
        };
      }

      // Calculate cost based on rules
      let totalCost = 0;
      const breakdown: CostBreakdown = {
        baseCost: 0,
        usageCost: 0,
        tax: 0,
        discounts: 0,
        total: 0,
        currency: 'USD'
      };

      for (const rule of pricingRules) {
        const ruleCost = this.calculateRuleCost(rule, quantity, metadata);
        breakdown.usageCost += ruleCost;
        totalCost += ruleCost;
      }

      // Apply discounts
      const discounts = await this.getApplicableDiscounts(userId, totalCost, metadata);
      const discountAmount = this.calculateDiscountAmount(discounts, totalCost);
      breakdown.discounts = discountAmount;
      totalCost -= discountAmount;

      // Apply tax
      const taxRate = await this.getTaxRate(userId, service);
      const taxAmount = totalCost * taxRate;
      breakdown.tax = taxAmount;
      totalCost += taxAmount;

      breakdown.total = totalCost;

      LoggerUtil.info('billing-service', 'Cost calculated successfully', {
        service,
        resource,
        quantity,
        totalCost,
        currency: 'USD'
      });

      return {
        success: true,
        cost: totalCost,
        currency: 'USD',
        breakdown
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to calculate usage cost', error as Error, {
        service,
        resource,
        quantity,
        userId
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get pricing rules for service/resource
   */
  async getPricingRules(service: string, resource?: string): Promise<PricingRule[]> {
    try {
      LoggerUtil.debug('billing-service', 'Getting pricing rules from database', { service, resource });

      const whereClause: any = {
        service,
        isActive: true,
        OR: [
          { validFrom: null },
          { validFrom: { lte: new Date() } }
        ],
        AND: [
          { OR: [{ validTo: null }, { validTo: { gte: new Date() } }] }
        ]
      };

      if (resource) {
        whereClause.OR = [
          { resource },
          { resource: null } // Global rules for service
        ];
      }

      const rules = await (this.prisma as any).pricingRule.findMany({
        where: whereClause,
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ]
      });

      LoggerUtil.info('billing-service', 'Pricing rules retrieved', {
        service,
        resource,
        count: rules.length,
        rules: rules.map(r => ({ id: r.id, name: r.name, price: r.price, type: r.type }))
      });

      return rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        service: rule.service,
        resource: rule.resource,
        type: rule.type as any,
        price: rule.price.toNumber(),
        currency: rule.currency,
        limits: rule.limits as any,
        discounts: rule.discounts as any
      }));
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get pricing rules', error as Error, { service, resource });
      return [];
    }
  }

  /**
   * Create or update pricing rule
   */
  async createPricingRule(rule: Omit<PricingRule, 'id'>): Promise<{
    success: boolean;
    rule?: PricingRule;
    error?: string;
  }> {
    try {
      LoggerUtil.debug('billing-service', 'Creating pricing rule in database', { rule });

      const newRule = await (this.prisma as any).pricingRule.create({
        data: {
          name: rule.name,
          service: rule.service,
          resource: rule.resource,
          type: rule.type as any,
          price: rule.price,
          currency: rule.currency,
          limits: rule.limits as any,
          discounts: rule.discounts as any,
          priority: 0,
          isActive: true
        }
      });

      const createdRule: PricingRule = {
        id: newRule.id,
        name: newRule.name,
        service: newRule.service,
        resource: newRule.resource,
        type: newRule.type as any,
        price: newRule.price.toNumber(),
        currency: newRule.currency,
        limits: newRule.limits as any,
        discounts: newRule.discounts as any
      };

      LoggerUtil.info('billing-service', 'Pricing rule created successfully', {
        ruleId: newRule.id,
        service: newRule.service,
        resource: newRule.resource,
        price: newRule.price
      });

      return {
        success: true,
        rule: createdRule
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to create pricing rule', error as Error, { rule });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Apply discount to cost
   */
  async applyDiscount(
    userId: string,
    cost: number,
    discountCode?: string,
    metadata?: Record<string, any>
  ): Promise<{
    success: boolean;
    discountedCost?: number;
    discountAmount?: number;
    error?: string;
  }> {
    try {
      LoggerUtil.debug('billing-service', 'Applying discount', { userId, cost, discountCode });

      const discounts = await this.getApplicableDiscounts(userId, cost, metadata, discountCode);
      const discountAmount = this.calculateDiscountAmount(discounts, cost);
      const discountedCost = Math.max(0, cost - discountAmount);

      LoggerUtil.info('billing-service', 'Discount applied successfully', {
        userId,
        originalCost: cost,
        discountAmount,
        discountedCost
      });

      return {
        success: true,
        discountedCost,
        discountAmount
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to apply discount', error as Error, { userId, cost, discountCode });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get currency conversion rate
   */
  async getCurrencyRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      LoggerUtil.debug('billing-service', 'Getting currency rate from database', { fromCurrency, toCurrency });

      if (fromCurrency === toCurrency) {
        return 1.0;
      }

      // Сначала проверяем кэш в БД (последние 1 час)
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
      const cachedRate = await (this.prisma as any).currencyRate.findFirst({
        where: {
          fromCurrency,
          toCurrency,
          timestamp: { gte: oneHourAgo }
        },
        orderBy: { timestamp: 'desc' }
      });

      if (cachedRate) {
        LoggerUtil.info('billing-service', 'Currency rate retrieved from cache', { 
          fromCurrency, 
          toCurrency, 
          rate: cachedRate.rate.toNumber(),
          timestamp: cachedRate.timestamp
        });
        return cachedRate.rate.toNumber();
      }

      // Если нет кэша, получаем свежий курс
      const freshRate = await this.fetchFreshCurrencyRate(fromCurrency, toCurrency);
      
      // Сохраняем в БД для кэширования
      await (this.prisma as any).currencyRate.create({
        data: {
          fromCurrency,
          toCurrency,
          rate: freshRate,
          timestamp: new Date()
        }
      });

      LoggerUtil.info('billing-service', 'Fresh currency rate retrieved and cached', { 
        fromCurrency, 
        toCurrency, 
        rate: freshRate 
      });

      return freshRate;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get currency rate', error as Error, { fromCurrency, toCurrency });
      return 1.0; // Default to 1:1 if conversion fails
    }
  }

  /**
   * Fetch fresh currency rate from external API
   */
  private async fetchFreshCurrencyRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      // TODO: Implement actual currency API integration
      // For now, return mock rates with some randomness to simulate real rates
      const mockRates: Record<string, Record<string, number>> = {
        'USD': { 'EUR': 0.85, 'RUB': 95.0, 'BTC': 0.000025 },
        'EUR': { 'USD': 1.18, 'RUB': 112.0, 'BTC': 0.000030 },
        'RUB': { 'USD': 0.011, 'EUR': 0.009, 'BTC': 0.00000026 }
      };

      const baseRate = mockRates[fromCurrency]?.[toCurrency] || 1.0;
      
      // Добавляем небольшую случайность для имитации реальных курсов
      const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
      return baseRate * (1 + variation);
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to fetch fresh currency rate', error as Error);
      return 1.0;
    }
  }

  // ===========================================
  // PRIVATE HELPER METHODS
  // ===========================================

  private async getApplicablePricingRules(
    service: string,
    resource: string,
    userId?: string
  ): Promise<PricingRule[]> {
    // TODO: Implement database query for applicable pricing rules
    // This would consider user-specific pricing, volume discounts, etc.
    return await this.getPricingRules(service, resource);
  }

  private async getApplicableDiscounts(
    userId: string,
    cost: number,
    metadata?: Record<string, any>,
    discountCode?: string
  ): Promise<DiscountRule[]> {
    try {
      LoggerUtil.debug('billing-service', 'Getting applicable discounts from database', { 
        userId, 
        cost, 
        discountCode 
      });

      const whereClause: any = {
        isActive: true,
        OR: [
          { validFrom: null },
          { validFrom: { lte: new Date() } }
        ],
        AND: [
          { OR: [{ validTo: null }, { validTo: { gte: new Date() } }] }
        ]
      };

      // Если указан промокод, ищем по коду
      if (discountCode) {
        whereClause.code = discountCode;
      } else {
        // Иначе ищем персональные, глобальные и по тарифу пользователя
        whereClause.OR = [
          { userId }, // Персональные скидки
          { isGlobal: true }, // Глобальные скидки
          { userTier: await this.getUserTier(userId) } // Скидки по тарифу
        ];
      }

      // Проверяем минимальную сумму
      whereClause.OR = [
        { minAmount: null },
        { minAmount: { lte: cost } }
      ];

      // Проверяем максимальную сумму
      whereClause.AND.push({
        OR: [
          { maxAmount: null },
          { maxAmount: { gte: cost } }
        ]
      });

      const discounts = await (this.prisma as any).discountRule.findMany({
        where: whereClause,
        orderBy: [
          { value: 'desc' }, // Приоритет большим скидкам
          { createdAt: 'desc' }
        ]
      });

      LoggerUtil.info('billing-service', 'Applicable discounts retrieved', {
        userId,
        count: discounts.length,
        discounts: discounts.map(d => ({ 
          id: d.id, 
          name: d.name, 
          type: d.type, 
          value: d.value.toNumber() 
        }))
      });

      return discounts.map(discount => ({
        id: discount.id,
        name: discount.name,
        code: discount.code,
        type: discount.type as any,
        value: discount.value.toNumber(),
        currency: discount.currency,
        conditions: {
          minAmount: discount.minAmount?.toNumber(),
          maxAmount: discount.maxAmount?.toNumber(),
          validFrom: discount.validFrom,
          validTo: discount.validTo,
          usageLimit: discount.usageLimit,
          usageCount: discount.usageCount
        }
      }));
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get applicable discounts', error as Error, { userId });
      return [];
    }
  }

  /**
   * Get user tier for discount calculation
   */
  private async getUserTier(userId: string): Promise<string> {
    try {
      // TODO: Implement user tier logic based on subscription, usage, etc.
      // For now, return default tier
      return 'standard';
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get user tier', error as Error, { userId });
      return 'standard';
    }
  }

  private calculateRuleCost(rule: PricingRule, quantity: number, metadata?: Record<string, any>): number {
    switch (rule.type) {
      case 'fixed':
        return rule.price;
      case 'per_unit':
        return rule.price * quantity;
      case 'tiered':
        return this.calculateTieredCost(rule, quantity);
      default:
        return rule.price * quantity;
    }
  }

  private calculateTieredCost(rule: PricingRule, quantity: number): number {
    // TODO: Implement tiered pricing logic
    // This would calculate cost based on quantity tiers
    return rule.price * quantity;
  }

  private calculateDiscountAmount(discounts: DiscountRule[], cost: number): number {
    let totalDiscount = 0;

    for (const discount of discounts) {
      let discountAmount = 0;

      switch (discount.type) {
        case 'percentage':
          discountAmount = cost * (discount.value / 100);
          break;
        case 'fixed':
          discountAmount = discount.value;
          break;
      }

      // Apply conditions
      if (discount.conditions) {
        if (discount.conditions.minAmount && cost < discount.conditions.minAmount) {
          continue;
        }
        if (discount.conditions.minQuantity && cost < discount.conditions.minQuantity) {
          continue;
        }
        if (discount.conditions.validFrom && new Date() < discount.conditions.validFrom) {
          continue;
        }
        if (discount.conditions.validTo && new Date() > discount.conditions.validTo) {
          continue;
        }
      }

      totalDiscount += discountAmount;
    }

    return Math.min(totalDiscount, cost); // Don't exceed the original cost
  }

  private async getTaxRate(userId: string, service: string): Promise<number> {
    // TODO: Implement tax calculation based on user location and service type
    // This would consider VAT, sales tax, etc.
    return 0.0; // Default to no tax
  }

  private getDefaultPricing(service: string, resource: string): number {
    const defaultPricing: Record<string, Record<string, number>> = {
      'ai-chat': {
        'gpt-4': 0.03,
        'gpt-3.5-turbo': 0.002,
        'claude-3': 0.015,
        'default': 0.01
      },
      'ai-image': {
        'dall-e-3': 0.04,
        'midjourney': 0.02,
        'default': 0.03
      },
      'api': {
        'request': 0.001,
        'data': 0.0001,
        'default': 0.001
      }
    };

    return defaultPricing[service]?.[resource] || defaultPricing[service]?.default || 0.01;
  }
}
