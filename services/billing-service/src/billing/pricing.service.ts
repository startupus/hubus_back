import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { PricingRule, DiscountRule, CostBreakdown } from '../types/billing.types';
import { ProviderClassificationService, ProviderType } from './provider-classification.service';

/**
 * Pricing Service (OpenRouter Style)
 * 
 * Manages pricing rules, discounts, and cost calculations:
 * - Token-based pricing like OpenRouter
 * - Provider classification (domestic/foreign)
 * - Dynamic pricing based on usage patterns
 * - Tiered pricing for volume discounts
 * - Promotional discounts and coupons
 * - Currency conversion
 * - Tax calculations based on provider type
 */
@Injectable()
export class PricingService {
  private readonly logger = new Logger(PricingService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly providerClassification: ProviderClassificationService
  ) {}

  /**
   * Calculate cost for usage (alias for calculateUsageCost)
   */
  async calculateCost(
    service: string,
    resource: string,
    quantity: number,
    userId?: string,
    metadata?: {
      provider?: string;
      model?: string;
      tokens?: {
        prompt?: number;
        completion?: number;
        total?: number;
      };
      [key: string]: any;
    }
  ): Promise<number> {
    const result = await this.calculateUsageCost(service, resource, quantity, userId, metadata);
    return result.cost || 0;
  }

  /**
   * Calculate cost for usage (OpenRouter style)
   */
  async calculateUsageCost(
    service: string,
    resource: string,
    quantity: number,
    userId?: string,
    metadata?: {
      provider?: string;
      model?: string;
      tokens?: {
        prompt?: number;
        completion?: number;
        total?: number;
      };
      [key: string]: any;
    }
  ): Promise<{
    success: boolean;
    cost?: number;
    currency?: string;
    breakdown?: CostBreakdown;
    providerType?: ProviderType;
    error?: string;
  }> {
    try {
      const provider = metadata?.provider || 'unknown';
      const model = metadata?.model || 'unknown';
      const tokens = metadata?.tokens || { total: quantity };
      
      LoggerUtil.debug('billing-service', 'Calculating usage cost (OpenRouter style)', {
        service,
        resource,
        quantity,
        provider,
        model,
        tokens,
        userId
      });

      // Классифицируем провайдера
      const providerType = this.providerClassification.classifyProvider(provider);
      const providerInfo = this.providerClassification.getProviderInfo(provider);

      // Получаем правила ценообразования для провайдера и модели
      const pricingRules = await this.getPricingRulesForProvider(service, resource, provider, model);
      
      if (pricingRules.length === 0) {
        LoggerUtil.warn('billing-service', 'No pricing rules found for provider/model', {
          service,
          resource,
          provider,
          model
        });
        return {
          success: false,
          error: `No pricing rules found for ${provider}/${model}`
        };
      }

      // Рассчитываем стоимость на основе токенов (как в OpenRouter)
      let baseCost = 0;
      let currency = 'USD';
      
      for (const rule of pricingRules) {
        if (rule.type === 'per_token') {
          // Стоимость за токен
          const tokenCount = tokens.total || quantity;
          baseCost += Number(rule.price) * tokenCount;
        } else if (rule.type === 'per_unit') {
          // Стоимость за запрос
          baseCost += Number(rule.price) * quantity;
        } else if (rule.type === 'fixed') {
          // Фиксированная стоимость
          baseCost += Number(rule.price);
        }
        currency = rule.currency;
      }

      // Применяем скидки
      const discounts = await this.getApplicableDiscounts(userId, baseCost, quantity, providerType);
      let discountAmount = 0;
      
      for (const discount of discounts) {
        if (discount.type === 'percentage') {
          discountAmount += baseCost * (Number(discount.value) / 100);
        } else if (discount.type === 'fixed') {
          discountAmount += Number(discount.value);
        }
      }

      // Рассчитываем налоги (разные для отечественных и зарубежных)
      const taxRate = this.getTaxRate(providerType);
      const taxableAmount = baseCost - discountAmount;
      const tax = taxableAmount * taxRate;

      const totalCost = baseCost - discountAmount + tax;

      const breakdown: CostBreakdown = {
        baseCost,
        usageCost: baseCost,
        tax,
        discounts: discountAmount,
        total: totalCost,
        currency
      };

      LoggerUtil.info('billing-service', 'Usage cost calculated (OpenRouter style)', {
        service,
        resource,
        quantity,
        provider,
        model,
        providerType,
        tokens,
        userId,
        cost: totalCost,
        currency,
        breakdown
      });

      return {
        success: true,
        cost: totalCost,
        currency,
        breakdown,
        providerType
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to calculate usage cost', error as Error, {
        service,
        resource,
        quantity,
        userId,
        provider: metadata?.provider
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get pricing rules for specific provider and model
   */
  async getPricingRulesForProvider(
    service: string,
    resource: string,
    provider: string,
    model: string
  ): Promise<PricingRule[]> {
    try {
      const rules = await this.prisma.pricingRule.findMany({
        where: {
          service,
          resource,
          provider,
          model,
          isActive: true,
          OR: [
            { validFrom: null },
            { validFrom: { lte: new Date() } }
          ],
          AND: [
            {
              OR: [
                { validTo: null },
                { validTo: { gte: new Date() } }
              ]
            }
          ]
        },
        orderBy: { priority: 'desc' }
      });

      return rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        service: rule.service,
        resource: rule.resource || '',
        provider: rule.provider,
        model: rule.model,
        providerType: rule.providerType as 'DOMESTIC' | 'FOREIGN',
        type: rule.type as 'fixed' | 'per_unit' | 'per_token' | 'tiered',
        price: Number(rule.price),
        currency: rule.currency,
        limits: rule.limits as any,
        discounts: rule.discounts as any
      }));
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get pricing rules for provider', error as Error, {
        service,
        resource,
        provider,
        model
      });
      return [];
    }
  }

  /**
   * Get applicable discounts
   */
  async getApplicableDiscounts(
    userId?: string,
    amount?: number,
    quantity?: number,
    providerType?: ProviderType
  ): Promise<DiscountRule[]> {
    try {
      const now = new Date();
      const discounts = await this.prisma.discountRule.findMany({
      where: {
        isActive: true,
        AND: [
          {
            OR: [
              { validFrom: null },
              { validFrom: { lte: now } }
            ]
          },
          {
            OR: [
              { validTo: null },
              { validTo: { gte: now } }
            ]
          },
          {
            OR: [
              { isGlobal: true }
            ]
          }
        ]
      },
        orderBy: { value: 'desc' }
      });

      return discounts
        .filter(discount => {
          // Check minimum amount
          if (discount.minAmount && amount && amount < Number(discount.minAmount)) {
            return false;
          }
          
          // Check maximum amount
          if (discount.maxAmount && amount && amount > Number(discount.maxAmount)) {
            return false;
          }
          
          // Check usage limit
          if (discount.usageLimit && discount.usageCount >= discount.usageLimit) {
            return false;
          }
          
          return true;
        })
        .map(discount => ({
          id: discount.id,
          name: discount.name,
          type: discount.type as 'percentage' | 'fixed',
          value: Number(discount.value),
          conditions: {
            minAmount: discount.minAmount ? Number(discount.minAmount) : undefined,
            maxAmount: discount.maxAmount ? Number(discount.maxAmount) : undefined,
            validFrom: discount.validFrom,
            validTo: discount.validTo
          }
        }));
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get applicable discounts', error as Error, {
        userId,
        amount,
        quantity
      });
      return [];
    }
  }

  /**
   * Get tax rate based on provider type
   */
  getTaxRate(providerType?: ProviderType): number {
    if (providerType === 'DOMESTIC') {
      return 0.20; // 20% НДС для отечественных провайдеров
    } else if (providerType === 'FOREIGN') {
      return 0.0; // Нет НДС для зарубежных провайдеров (пока)
    }
    return 0.0; // По умолчанию без налога
  }

  /**
   * Get default pricing for service/resource
   */
  getDefaultPricing(service: string, resource: string): number {
    const defaultPricing: Record<string, Record<string, number>> = {
      'ai': {
        'chat_completion': 0.00002, // $0.00002 per token
        'text_generation': 0.00002,
        'image_generation': 0.02,   // $0.02 per image
        'embedding': 0.0001,        // $0.0001 per token
        'default': 0.00002
      },
      'api': {
        'request': 0.001,           // $0.001 per request
        'default': 0.001
      }
    };

    return defaultPricing[service]?.[resource] || defaultPricing[service]?.default || 0.01;
  }

  /**
   * Create pricing rule
   */
  async createPricingRule(rule: {
    name: string;
    service: string;
    resource: string;
    provider?: string;
    model?: string;
    providerType: 'DOMESTIC' | 'FOREIGN';
    type: 'PER_TOKEN' | 'PER_REQUEST' | 'FIXED';
    price: number;
    currency?: string;
    limits?: any;
    discounts?: any;
    priority?: number;
    validFrom?: Date;
    validTo?: Date;
  }): Promise<{
    success: boolean;
    rule?: PricingRule;
    error?: string;
  }> {
    try {
      const createdRule = await this.prisma.pricingRule.create({
        data: {
          name: rule.name,
          service: rule.service,
          resource: rule.resource,
          provider: rule.provider,
          model: rule.model,
          providerType: rule.providerType,
          type: rule.type,
          price: rule.price,
          currency: rule.currency || 'USD',
          limits: rule.limits,
          discounts: rule.discounts,
          priority: rule.priority || 0,
          validFrom: rule.validFrom,
          validTo: rule.validTo
        }
      });

      LoggerUtil.info('billing-service', 'Pricing rule created', {
        ruleId: createdRule.id,
        service: rule.service,
        resource: rule.resource,
        provider: rule.provider,
        model: rule.model
      });

      return {
        success: true,
        rule: {
          id: createdRule.id,
          name: createdRule.name,
          service: createdRule.service,
          resource: createdRule.resource || '',
          provider: createdRule.provider,
          model: createdRule.model,
          providerType: createdRule.providerType as 'DOMESTIC' | 'FOREIGN',
          type: createdRule.type as 'fixed' | 'per_unit' | 'per_token' | 'tiered',
          price: Number(createdRule.price),
          currency: createdRule.currency,
          limits: createdRule.limits as any,
          discounts: createdRule.discounts as any
        }
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to create pricing rule', error as Error, {
        rule
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Get all pricing rules
   */
  async getAllPricingRules(): Promise<PricingRule[]> {
    try {
      const rules = await this.prisma.pricingRule.findMany({
        where: { isActive: true },
        orderBy: [
          { service: 'asc' },
          { resource: 'asc' },
          { provider: 'asc' },
          { model: 'asc' },
          { priority: 'desc' }
        ]
      });

      return rules.map(rule => ({
        id: rule.id,
        name: rule.name,
        service: rule.service,
        resource: rule.resource || '',
        provider: rule.provider,
        model: rule.model,
        providerType: rule.providerType as 'DOMESTIC' | 'FOREIGN',
        type: rule.type as 'fixed' | 'per_unit' | 'per_token' | 'tiered',
        price: Number(rule.price),
        currency: rule.currency,
        limits: rule.limits as any,
        discounts: rule.discounts as any
      }));
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get all pricing rules', error as Error);
      return [];
    }
  }

  /**
   * Update pricing rule
   */
  async updatePricingRule(
    id: string,
    updates: Partial<{
      name: string;
      price: number;
      currency: string;
      limits: any;
      discounts: any;
      priority: number;
      validFrom: Date;
      validTo: Date;
      isActive: boolean;
    }>
  ): Promise<{
    success: boolean;
    rule?: PricingRule;
    error?: string;
  }> {
    try {
      const updatedRule = await this.prisma.pricingRule.update({
        where: { id },
        data: updates
      });

      LoggerUtil.info('billing-service', 'Pricing rule updated', {
        ruleId: id,
        updates
      });

      return {
        success: true,
        rule: {
          id: updatedRule.id,
          name: updatedRule.name,
          service: updatedRule.service,
          resource: updatedRule.resource || '',
          provider: updatedRule.provider,
          model: updatedRule.model,
          providerType: updatedRule.providerType as 'DOMESTIC' | 'FOREIGN',
          type: updatedRule.type as 'fixed' | 'per_unit' | 'per_token' | 'tiered',
          price: Number(updatedRule.price),
          currency: updatedRule.currency,
          limits: updatedRule.limits as any,
          discounts: updatedRule.discounts as any
        }
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to update pricing rule', error as Error, {
        ruleId: id,
        updates
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Delete pricing rule
   */
  async deletePricingRule(id: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      await this.prisma.pricingRule.delete({
        where: { id }
      });

      LoggerUtil.info('billing-service', 'Pricing rule deleted', {
        ruleId: id
      });

      return { success: true };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to delete pricing rule', error as Error, {
        ruleId: id
      });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }
}
