import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { ValidationService } from '../common/validation/validation.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { RabbitMQClient } from '@ai-aggregator/shared';
import { ReferralService } from './referral.service';
import {
  UserBalance,
  Transaction,
  UsageEvent,
  Invoice,
  CreateTransactionRequest,
  CreateTransactionResponse,
  TrackUsageRequest,
  TrackUsageResponse,
  GetBalanceRequest,
  GetBalanceResponse,
  UpdateBalanceRequest,
  UpdateBalanceResponse,
  CalculateCostRequest,
  CalculateCostResponse,
  ProcessPaymentRequest,
  ProcessPaymentResponse,
  TransactionType,
  TransactionStatus,
  CostBreakdown,
  BillingReport
} from '../types/billing.types';
import { Decimal } from '@prisma/client/runtime/library';
import { 
  InsufficientBalanceException,
  InvalidAmountException,
  InvalidCurrencyException,
  CompanyNotFoundException,
  PaymentMethodNotFoundException,
  CostCalculationException
} from '../exceptions/billing.exceptions';

/**
 * Core Billing Service
 * 
 * Responsible for:
 * - Managing user balances and transactions
 * - Tracking usage and calculating costs
 * - Processing payments and refunds
 * - Generating invoices and reports
 * - Integration with payment gateways
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // 1 секунда

  constructor(
    private readonly prisma: PrismaService,
    private readonly cacheService: CacheService,
    private readonly validationService: ValidationService,
    private readonly rabbitmq: RabbitMQClient,
    private readonly referralService: ReferralService,
  ) {}

  /**
   * Get user balance with caching and validation
   */
  async getBalance(request: GetBalanceRequest): Promise<GetBalanceResponse> {
    try {
      // Валидация входных данных
      this.validationService.validateId(request.companyId, 'User ID');
      
      LoggerUtil.debug('billing-service', 'Getting user balance', { companyId: request.companyId });

      // Проверяем кэш
      const cachedBalance = this.cacheService.getCachedCompanyBalance(request.companyId);
      if (cachedBalance) {
        LoggerUtil.debug('billing-service', 'Balance retrieved from cache', { companyId: request.companyId });
        return {
          success: true,
          balance: cachedBalance
        };
      }

      // Валидация компании
      await this.validationService.validateCompany(request.companyId, this.prisma);

      // Получаем баланс из БД
      const balance = await this.prisma.companyBalance.findUnique({
        where: { companyId: request.companyId }
      });

      if (!balance) {
        // Создаем баланс для нового пользователя
        const newBalance = await this.prisma.companyBalance.create({
          data: {
            company: {
              connect: { id: request.companyId }
            },
            balance: 0,
            currency: 'USD',
            creditLimit: 0
          }
        });

        // Кэшируем новый баланс
        this.cacheService.cacheCompanyBalance(request.companyId, newBalance);

        LoggerUtil.info('billing-service', 'New balance created', { companyId: request.companyId });
        return {
          success: true,
          balance: newBalance as UserBalance
        };
      }

      // Кэшируем полученный баланс
      this.cacheService.cacheCompanyBalance(request.companyId, balance);

      LoggerUtil.info('billing-service', 'Balance retrieved successfully', { 
        companyId: request.companyId,
        balance: balance.balance.toString()
      });

      return {
        success: true,
        balance: balance as UserBalance
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get balance', error as Error, { companyId: request.companyId });
      
      // Возвращаем специфичные ошибки
      if (error instanceof CompanyNotFoundException) {
        return {
          success: false,
          error: error.message
        };
      }

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Update user balance with retry logic and enhanced validation
   */
  async updateBalance(request: UpdateBalanceRequest): Promise<UpdateBalanceResponse> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        // Валидация входных данных
        this.validationService.validateId(request.companyId, 'User ID');
        this.validationService.validateAmount(request.amount);
        this.validationService.validateMetadata(request.metadata);

        LoggerUtil.debug('billing-service', 'Updating user balance', {
          companyId: request.companyId,
          amount: request.amount,
          operation: request.operation,
          attempt
        });

        // Валидация компании
        await this.validationService.validateCompany(request.companyId, this.prisma);

        const result = await this.prisma.$transaction(async (tx) => {
          // Получаем текущий баланс с блокировкой
          const currentBalance = await tx.companyBalance.findUnique({
            where: { companyId: request.companyId }
          });

          if (!currentBalance) {
            throw new NotFoundException('User balance not found');
          }

          // Валидация баланса для операции
          this.validationService.validateBalanceForOperation(
            currentBalance.balance,
            request.amount,
            request.operation,
            currentBalance.creditLimit || new Decimal(0)
          );

          // Вычисляем новый баланс
          LoggerUtil.debug('billing-service', 'Creating amount from request', {
            originalAmount: request.amount,
            amountType: typeof request.amount,
            amountString: String(request.amount)
          });
          const amount = new Decimal(request.amount);
          LoggerUtil.debug('billing-service', 'Decimal amount created', {
            amount: amount.toString(),
            amountValue: amount.toNumber()
          });
          const newBalance = request.operation === 'add' 
            ? currentBalance.balance.add(amount)
            : currentBalance.balance.sub(amount);

          // Обновляем баланс
          const updatedBalance = await tx.companyBalance.update({
            where: { companyId: request.companyId },
            data: { 
              balance: newBalance,
              lastUpdated: new Date()
            }
          });

          // Создаем запись транзакции
          const transaction = await tx.transaction.create({
            data: {
              company: {
                connect: { id: currentBalance.companyId }
              },
              type: request.operation === 'add' ? TransactionType.CREDIT : TransactionType.DEBIT,
              amount: amount,
              currency: currentBalance.currency,
              description: request.description || `Balance ${request.operation}`,
              reference: request.reference,
              status: TransactionStatus.COMPLETED,
              processedAt: new Date(),
              metadata: request.metadata
            }
          });

          return { updatedBalance, transaction };
        });

        // Инвалидируем кэш баланса
        this.cacheService.invalidateCompanyBalance(request.companyId);

        // Обрабатываем реферальные бонусы для DEBIT операций (списания за AI запросы)
        if (request.operation === 'subtract' && request.metadata?.inputTokens && request.metadata?.outputTokens) {
          try {
            await this.processReferralBonus(
              request.companyId,
              result.transaction.id,
              request.metadata.inputTokens,
              request.metadata.outputTokens,
              request.metadata.inputTokenPrice,
              request.metadata.outputTokenPrice
            );
          } catch (referralError) {
            // Логируем ошибку, но не прерываем основной процесс
            LoggerUtil.warn('billing-service', 'Failed to process referral bonus', {
              companyId: request.companyId,
              transactionId: result.transaction.id,
              error: referralError instanceof Error ? referralError.message : String(referralError),
            });
          }
        }

        LoggerUtil.info('billing-service', 'Balance updated successfully', {
          companyId: request.companyId,
          newBalance: result.updatedBalance.balance.toString(),
          operation: request.operation,
          attempt
        });

        return {
          success: true,
          balance: result.updatedBalance as UserBalance,
          transaction: result.transaction as any
        };

      } catch (error) {
        lastError = error as Error;
        
        // Если это последняя попытка или ошибка не связана с блокировкой, не повторяем
        if (attempt === this.maxRetries || !this.isRetryableError(error)) {
          break;
        }

        // Ждем перед повторной попыткой
        await this.delay(this.retryDelay * attempt);
        
        LoggerUtil.warn('billing-service', 'Balance update retry', {
          companyId: request.companyId,
          attempt,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    LoggerUtil.error('billing-service', 'Failed to update balance after retries', lastError as Error, { 
      companyId: request.companyId,
      attempts: this.maxRetries
    });

    return {
      success: false,
      error: lastError instanceof Error ? lastError.message : 'Unknown error'
    };
  }

  /**
   * Track usage and calculate cost
   */
  async trackUsage(request: TrackUsageRequest): Promise<TrackUsageResponse> {
    try {
      // companyId используется для идентификации компании
      const initiatorCompanyId = request.companyId;
      
      LoggerUtil.debug('billing-service', 'Tracking usage', {
        initiatorCompanyId,
        service: request.service,
        resource: request.resource,
        quantity: request.quantity
      });

      // Определить кто платит
      const { payerId, initiatorId } = await this.determinePayerCompany(initiatorCompanyId);

      // Calculate cost based on pricing rules
      const costCalculation = await this.calculateCost({
        companyId: payerId, // Расчет на основе плательщика
        service: request.service,
        resource: request.resource,
        quantity: request.quantity || 1,
        metadata: request.metadata
      });

      if (!costCalculation.success || !costCalculation.cost) {
        throw new BadRequestException('Failed to calculate cost');
      }

      // Create usage event
      const usageEvent = await this.prisma.usageEvent.create({
        data: {
          company: {
            connect: { id: payerId }
          },
          initiatorCompany: initiatorId ? {
            connect: { id: initiatorId }
          } : undefined,
          service: request.service,
          resource: request.resource,
          quantity: request.quantity || 1,
          unit: request.unit || 'request',
          cost: new Decimal(costCalculation.cost),
          currency: costCalculation.currency || 'USD',
          metadata: request.metadata
        }
      });

      // Update payer balance (subtract cost)
      await this.updateBalance({
        companyId: payerId,  // Списываем с плательщика
        amount: costCalculation.cost,
        operation: 'subtract',
        description: `Usage by ${initiatorId === payerId ? 'self' : initiatorId}: ${request.service}/${request.resource}`,
        reference: usageEvent.id
      });

      // Create transaction record
      await this.prisma.transaction.create({
        data: {
          company: {
            connect: { id: payerId }
          },
          initiatorCompany: initiatorId && initiatorId !== payerId ? {
            connect: { id: initiatorId }
          } : undefined,
          type: 'DEBIT',
          amount: new Decimal(costCalculation.cost),
          currency: costCalculation.currency || 'USD',
          description: `Usage: ${request.service}/${request.resource}`,
          status: 'COMPLETED',
          reference: usageEvent.id,
          processedAt: new Date()
        }
      });

      LoggerUtil.info('billing-service', 'Usage tracked successfully', {
        payerId,
        initiatorId,
        service: request.service,
        resource: request.resource,
        cost: costCalculation.cost
      });

      return {
        success: true,
        usageEvent: usageEvent as any,
        cost: costCalculation.cost
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to track usage', error as Error, { companyId: request.companyId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Calculate cost for usage
   */
  async calculateCost(request: CalculateCostRequest): Promise<CalculateCostResponse> {
    try {
      LoggerUtil.debug('billing-service', 'Calculating cost', {
        companyId: request.companyId,
        service: request.service,
        resource: request.resource,
        quantity: request.quantity
      });

      // Get pricing rules for the service/resource
      const pricingRules = await this.getPricingRules(request.service, request.resource);
      
      if (!pricingRules || pricingRules.length === 0) {
        // Default pricing if no rules found
        const defaultCost = this.getDefaultPricing(request.service, request.resource);
        const totalCost = defaultCost * request.quantity;

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

      // Apply pricing rules
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
        let ruleCost = 0;
        
        switch (rule.type) {
          case 'fixed':
            ruleCost = rule.price;
            break;
          case 'per_unit':
            ruleCost = rule.price * request.quantity;
            break;
          case 'tiered':
            ruleCost = this.calculateTieredPricing(rule, request.quantity);
            break;
        }

        // Apply discounts
        if (rule.discounts && rule.discounts.length > 0) {
          const discountAmount = this.calculateDiscounts(rule.discounts, ruleCost, request);
          ruleCost -= discountAmount;
          breakdown.discounts += discountAmount;
        }

        totalCost += ruleCost;
        breakdown.usageCost += ruleCost;
      }

      breakdown.total = totalCost;

      return {
        success: true,
        cost: totalCost,
        currency: 'USD',
        breakdown
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to calculate cost', error as Error, { companyId: request.companyId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Create transaction
   */
  async createTransaction(request: CreateTransactionRequest): Promise<CreateTransactionResponse> {
    try {
      LoggerUtil.debug('billing-service', 'Creating transaction', {
        companyId: request.companyId,
        type: request.type,
        amount: request.amount,
        fullRequest: request
      });

      if (!request.companyId) {
        throw new Error('companyId is required');
      }

      const transaction = await this.prisma.transaction.create({
        data: {
          company: {
            connect: { id: request.companyId }
          },
          type: request.type,
          amount: new Decimal(request.amount),
          currency: request.currency || 'USD',
          description: request.description,
          reference: request.reference,
          status: TransactionStatus.PENDING,
          metadata: request.metadata,
          paymentMethod: request.paymentMethodId ? {
            connect: { id: request.paymentMethodId }
          } : undefined
        }
      });

      LoggerUtil.info('billing-service', 'Transaction created successfully', {
        transactionId: transaction.id,
        companyId: request.companyId,
        amount: request.amount
      });

      // Отправка события в Analytics через RabbitMQ
      try {
        await this.rabbitmq.publishCriticalMessage('analytics.events', {
          eventType: 'transaction_created',
          companyId: request.companyId,
          transactionId: transaction.id,
          amount: request.amount,
          type: request.type,
          timestamp: new Date().toISOString(),
          metadata: {
            service: 'billing-service',
            currency: request.currency || 'USD',
            description: request.description
          }
        });
      } catch (rabbitError) {
        LoggerUtil.warn('billing-service', 'Failed to send analytics event', { error: rabbitError });
        // Не прерываем выполнение при ошибке RabbitMQ
      }

      return {
        success: true,
        transaction: transaction as any
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to create transaction', error as Error, { companyId: request.companyId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Process payment
   */
  async processPayment(request: ProcessPaymentRequest): Promise<ProcessPaymentResponse> {
    try {
      LoggerUtil.debug('billing-service', 'Processing payment', {
        companyId: request.companyId,
        amount: request.amount,
        paymentMethodId: request.paymentMethodId
      });

      // Create transaction
      const transactionResult = await this.createTransaction({
        companyId: request.companyId,
        type: TransactionType.CREDIT,
        amount: request.amount,
        currency: request.currency,
        description: request.description || 'Payment',
        metadata: request.metadata,
        paymentMethodId: request.paymentMethodId
      });

      if (!transactionResult.success || !transactionResult.transaction) {
        throw new BadRequestException('Failed to create transaction');
      }

      // Update balance
      const balanceResult = await this.updateBalance({
        companyId: request.companyId,
        amount: request.amount,
        operation: 'add',
        description: 'Payment received',
        reference: transactionResult.transaction.id
      });

      if (!balanceResult.success) {
        throw new BadRequestException('Failed to update balance');
      }

      // Update transaction status
      await this.prisma.transaction.update({
        where: { id: transactionResult.transaction.id },
        data: { 
          status: TransactionStatus.COMPLETED,
          processedAt: new Date()
        }
      });

      LoggerUtil.info('billing-service', 'Payment processed successfully', {
        transactionId: transactionResult.transaction.id,
        companyId: request.companyId,
        amount: request.amount
      });

      return {
        success: true,
        transaction: transactionResult.transaction
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to process payment', error as Error, { companyId: request.companyId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get billing report
   */
  async getBillingReport(companyId: string, startDate: Date, endDate: Date): Promise<BillingReport> {
    try {
      LoggerUtil.debug('billing-service', 'Generating billing report', { companyId, startDate, endDate });

      // Get usage events
      const usageEvents = await this.prisma.usageEvent.findMany({
        where: {
          companyId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Get transactions
      const transactions = await this.prisma.transaction.findMany({
        where: {
          companyId,
          createdAt: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Calculate totals
      const totalUsage = usageEvents.reduce((sum, event) => sum + event.quantity, 0);
      const totalCost = usageEvents.reduce((sum, event) => sum + Number(event.cost), 0);

      // Generate breakdown
      const breakdown = {
        byService: this.groupByService(usageEvents),
        byResource: this.groupByResource(usageEvents),
        byDay: this.groupByDay(usageEvents)
      };

      return {
        companyId: companyId, // для обратной совместимости
        period: { start: startDate, end: endDate },
        totalUsage,
        totalCost,
        currency: 'USD',
        breakdown,
        transactions: transactions as any
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to generate billing report', error as Error, { companyId });
      throw error;
    }
  }

  // ===========================================
  // PRIVATE HELPER METHODS
  // ===========================================

  private async getPricingRules(service: string, resource: string): Promise<any[]> {
    // TODO: Implement pricing rules from database
    // For now, return empty array to use default pricing
    return [];
  }

  private getDefaultPricing(service: string, resource: string): number {
    // Default pricing based on service and resource
    const defaultPricing: Record<string, Record<string, number>> = {
      'ai-chat': {
        'gpt-4': 0.03,
        'gpt-3.5-turbo': 0.002,
        'claude-3': 0.015
      },
      'ai-image': {
        'dall-e-3': 0.04,
        'midjourney': 0.02
      },
      'api': {
        'request': 0.001,
        'data': 0.0001
      }
    };

    return defaultPricing[service]?.[resource] || 0.01;
  }

  private calculateTieredPricing(rule: any, quantity: number): number {
    // TODO: Implement tiered pricing logic
    return rule.price * quantity;
  }

  private calculateDiscounts(discounts: any[], cost: number, request: CalculateCostRequest): number {
    // TODO: Implement discount calculation logic
    return 0;
  }

  private groupByService(events: any[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.service] = (acc[event.service] || 0) + event.quantity;
      return acc;
    }, {});
  }

  private groupByResource(events: any[]): Record<string, number> {
    return events.reduce((acc, event) => {
      acc[event.resource] = (acc[event.resource] || 0) + event.quantity;
      return acc;
    }, {});
  }

  private groupByDay(events: any[]): Record<string, number> {
    return events.reduce((acc, event) => {
      const day = event.timestamp.toISOString().split('T')[0];
      acc[day] = (acc[day] || 0) + event.quantity;
      return acc;
    }, {});
  }

  // ===========================================
  // HELPER METHODS
  // ===========================================

  /**
   * Проверяет, можно ли повторить операцию при ошибке
   */
  private isRetryableError(error: any): boolean {
    if (!error) return false;
    
    const retryableErrors = [
      'P2002', // Unique constraint violation
      'P2034', // Transaction conflict
      'P2025', // Record not found (может быть временной проблемой)
      'ECONNRESET',
      'ETIMEDOUT',
      'ENOTFOUND'
    ];

    const errorMessage = error.message || error.code || '';
    return retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError)
    );
  }

  /**
   * Задержка для retry логики
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Валидация и нормализация входных данных
   */
  private validateAndNormalizeRequest<T extends Record<string, any>>(request: T): T {
    // Удаляем лишние пробелы из строк
    const normalized = { ...request };
    
    Object.keys(normalized).forEach(key => {
      if (typeof normalized[key] === 'string') {
        (normalized as any)[key] = (normalized as any)[key].trim();
      }
    });

    return normalized;
  }

  /**
   * Создание уникального ID для транзакции
   */
  private generateTransactionId(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return `txn_${timestamp}_${random}`;
  }

  /**
   * Проверка лимитов использования
   */
  private async checkUsageLimits(companyId: string, service: string, resource: string): Promise<boolean> {
    try {
      // Получаем лимиты из конфигурации или БД
      const limits = await this.getUsageLimits(companyId, service, resource);
      
      if (!limits) return true; // Лимиты не установлены

      // Проверяем дневные лимиты
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayUsage = await this.prisma.usageEvent.aggregate({
        where: {
          companyId,
          service,
          resource,
          timestamp: { gte: today }
        },
        _sum: { quantity: true }
      });

      if (limits.daily && todayUsage._sum.quantity && todayUsage._sum.quantity >= limits.daily) {
        throw new Error('Daily usage limit exceeded');
      }

      return true;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Usage limits check failed', error as Error, { companyId, service, resource });
      return false;
    }
  }

  /**
   * Получение лимитов использования
   */
  private async getUsageLimits(companyId: string, service: string, resource: string): Promise<any> {
    // TODO: Реализовать получение лимитов из БД или конфигурации
    return null;
  }

  /**
   * Аудит операций
   */
  private async auditOperation(
    operation: string,
    companyId: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      LoggerUtil.info('billing-service', 'Audit operation', {
        operation,
        companyId,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      LoggerUtil.error('billing-service', 'Audit operation failed', error as Error, { operation, companyId });
    }
  }

  /**
   * Получить все транзакции компании
   */
  async getTransactions(companyId: string, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    try {
      const transactions = await this.prisma.transaction.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return transactions as any;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get transactions', error as Error, { companyId });
      throw error;
    }
  }

  /**
   * Получить транзакцию по ID
   */
  async getTransactionById(transactionId: string): Promise<Transaction | null> {
    try {
      const transaction = await this.prisma.transaction.findUnique({
        where: { id: transactionId }
      });

      return transaction as any;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get transaction by ID', error as Error, { transactionId });
      throw error;
    }
  }

  /**
   * Получить транзакцию по payment ID (для идемпотентности)
   */
  async getTransactionByPaymentId(paymentId: string): Promise<Transaction | null> {
    try {
      const transaction = await this.prisma.transaction.findFirst({
        where: {
          metadata: {
            path: ['paymentId'],
            equals: paymentId
          }
        }
      });

      return transaction as any;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get transaction by payment ID', error as Error, { paymentId });
      return null;
    }
  }

  /**
   * Обновить транзакцию
   */
  async updateTransaction(transactionId: string, updateData: Partial<Transaction>): Promise<Transaction> {
    try {
      const updatedTransaction = await this.prisma.transaction.update({
        where: { id: transactionId },
        data: updateData
      });

      return updatedTransaction as any;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to update transaction', error as Error, { transactionId });
      throw error;
    }
  }

  /**
   * Удалить транзакцию
   */
  async deleteTransaction(transactionId: string): Promise<Transaction> {
    try {
      const deletedTransaction = await this.prisma.transaction.delete({
        where: { id: transactionId }
      });

      return deletedTransaction as any;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to delete transaction', error as Error, { transactionId });
      throw error;
    }
  }

  /**
   * Определить компанию-плательщика
   * Логика: если у компании режим PARENT_PAID и есть родитель - платит родитель,
   * иначе платит сама компания
   */
  async determinePayerCompany(initiatorCompanyId: string): Promise<{ payerId: string; initiatorId: string }> {
    try {
      const company = await this.prisma.company.findUnique({
        where: { id: initiatorCompanyId },
        include: { 
          parentCompany: {
            select: { id: true }
          }
        }
      });

      if (!company) {
        throw new CompanyNotFoundException(`Company not found: ${initiatorCompanyId}`);
      }

      // Если режим PARENT_PAID и есть родитель - платит родитель
      if (company.billingMode === 'PARENT_PAID' && company.parentCompany) {
        LoggerUtil.debug('billing-service', 'Billing mode: PARENT_PAID', {
          initiatorId: initiatorCompanyId,
          payerId: company.parentCompany.id
        });
        return {
          payerId: company.parentCompany.id,
          initiatorId: initiatorCompanyId
        };
      }

      // Иначе платит сама
      LoggerUtil.debug('billing-service', 'Billing mode: SELF_PAID', {
        companyId: initiatorCompanyId
      });
      return {
        payerId: initiatorCompanyId,
        initiatorId: initiatorCompanyId
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to determine payer company', error as Error, { initiatorCompanyId });
      throw error;
    }
  }

  /**
   * Обработать возврат платежа
   */
  async refundPayment(refundData: { transactionId: string; amount: Decimal; reason: string }): Promise<{ success: boolean; refundId?: string; status?: TransactionStatus; error?: string }> {
    try {
      // Mock implementation for refund
      return {
        success: true,
        refundId: `refund_${Date.now()}`,
        status: 'COMPLETED' as any
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to process refund', error as Error, { refundData });
      return {
        success: false,
        error: 'Refund failed'
      };
    }
  }

  /**
   * Get company child companies statistics
   */
  async getCompanyUsersStatistics(companyId: string, startDate: Date, endDate: Date) {
    try {
      LoggerUtil.debug('billing-service', 'Getting company child companies statistics', { 
        companyId, 
        startDate, 
        endDate 
      });

      // Get all child companies
      const childCompanies = await this.prisma.company.findMany({
        where: { parentCompanyId: companyId },
        select: {
          id: true,
          name: true,
          email: true,
          position: true,
          department: true,
          billingMode: true,
        }
      });

      // Get usage statistics for each child company
      const childCompaniesStatistics = await Promise.all(
        childCompanies.map(async (child) => {
          // Get usage events initiated by this child
          const usageEvents = await this.prisma.usageEvent.findMany({
            where: {
              initiatorCompanyId: child.id,
              timestamp: {
                gte: startDate,
                lte: endDate
              }
            }
          });

          // Get transactions for this child
          const transactions = await this.prisma.transaction.findMany({
            where: {
              initiatorCompanyId: child.id,
              createdAt: {
                gte: startDate,
                lte: endDate
              }
            }
          });

          // Calculate totals
          const totalRequests = usageEvents.length;
          const totalCost = usageEvents.reduce((sum, event) => sum + Number(event.cost), 0);
          const totalTransactions = transactions.length;

          // Group by service
          const byService = usageEvents.reduce((acc, event) => {
            if (!acc[event.service]) {
              acc[event.service] = {
                count: 0,
                cost: 0
              };
            }
            acc[event.service].count += 1;
            acc[event.service].cost += Number(event.cost);
            return acc;
          }, {} as Record<string, { count: number; cost: number }>);

          return {
            company: {
              id: child.id,
              name: child.name,
              email: child.email,
              position: child.position,
              department: child.department,
              billingMode: child.billingMode,
            },
            statistics: {
              totalRequests,
              totalCost,
              totalTransactions,
              byService
            }
          };
        })
      );

      // Calculate company totals (including requests paid by this company)
      const totalUsageEvents = await this.prisma.usageEvent.findMany({
        where: {
          companyId: companyId, // Все что оплачено этой компанией
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      const companyTotals = {
        totalChildCompanies: childCompanies.length,
        totalRequests: totalUsageEvents.length,
        totalCost: totalUsageEvents.reduce((sum, event) => sum + Number(event.cost), 0),
        totalTransactions: await this.prisma.transaction.count({
          where: {
            companyId: companyId,
            createdAt: {
              gte: startDate,
              lte: endDate
            }
          }
        }),
      };

      return {
        companyId,
        period: { start: startDate, end: endDate },
        totals: companyTotals,
        childCompanies: childCompaniesStatistics
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get company child companies statistics', error as Error, { companyId });
      throw error;
    }
  }

  /**
   * Process referral bonus for a transaction
   */
  private async processReferralBonus(
    companyId: string,
    transactionId: string,
    inputTokens: number,
    outputTokens: number,
    inputTokenPrice?: Decimal,
    outputTokenPrice?: Decimal
  ): Promise<void> {
    try {
      // Получаем информацию о компании
      const company = await this.prisma.company.findUnique({
        where: { id: companyId },
        select: { referredBy: true },
      });

      if (!company?.referredBy) {
        // Компания не является рефералом, пропускаем
        return;
      }

      // Если цены токенов не переданы, используем стандартные значения
      const defaultInputPrice = new Decimal('0.00003'); // $0.03 за 1K токенов
      const defaultOutputPrice = new Decimal('0.00006'); // $0.06 за 1K токенов

      const inputPrice = inputTokenPrice || defaultInputPrice;
      const outputPrice = outputTokenPrice || defaultOutputPrice;

      // Создаем реферальную транзакцию
      await this.referralService.createReferralTransaction({
        referralOwnerId: company.referredBy,
        originalTransactionId: transactionId,
        inputTokens,
        outputTokens,
        inputTokenPrice: inputPrice,
        outputTokenPrice: outputPrice,
        description: `Referral bonus for AI request (${inputTokens} input + ${outputTokens} output tokens)`,
        metadata: {
          transactionId,
          companyId,
          inputTokens,
          outputTokens,
        },
      });

      LoggerUtil.info('billing-service', 'Referral bonus processed', {
        companyId,
        referrerId: company.referredBy,
        transactionId,
        inputTokens,
        outputTokens,
      });
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to process referral bonus', error as Error, {
        companyId,
        transactionId,
        inputTokens,
        outputTokens,
      });
      throw error;
    }
  }
}
