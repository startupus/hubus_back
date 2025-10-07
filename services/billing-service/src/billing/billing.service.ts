import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { CacheService } from '../common/cache/cache.service';
import { ValidationService } from '../common/validation/validation.service';
import { LoggerUtil } from '@ai-aggregator/shared';
import { RabbitMQClient } from '@ai-aggregator/shared';
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
  UserNotFoundException,
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
  ) {}

  /**
   * Get user balance with caching and validation
   */
  async getBalance(request: GetBalanceRequest): Promise<GetBalanceResponse> {
    try {
      // Валидация входных данных
      this.validationService.validateId(request.userId, 'User ID');
      
      LoggerUtil.debug('billing-service', 'Getting user balance', { userId: request.userId });

      // Проверяем кэш
      const cachedBalance = this.cacheService.getCachedUserBalance(request.userId);
      if (cachedBalance) {
        LoggerUtil.debug('billing-service', 'Balance retrieved from cache', { userId: request.userId });
        return {
          success: true,
          balance: cachedBalance
        };
      }

      // Валидация пользователя
      await this.validationService.validateUser(request.userId, this.prisma);

      // Получаем баланс из БД
      const balance = await this.prisma.companyBalance.findUnique({
        where: { companyId: request.userId }
      });

      if (!balance) {
        // Создаем баланс для нового пользователя
        const newBalance = await this.prisma.companyBalance.create({
          data: {
            companyId: request.userId,
            balance: 0,
            currency: 'USD',
            creditLimit: 0
          }
        });

        // Кэшируем новый баланс
        this.cacheService.cacheUserBalance(request.userId, newBalance);

        LoggerUtil.info('billing-service', 'New balance created', { userId: request.userId });
        return {
          success: true,
          balance: newBalance as UserBalance
        };
      }

      // Кэшируем полученный баланс
      this.cacheService.cacheUserBalance(request.userId, balance);

      LoggerUtil.info('billing-service', 'Balance retrieved successfully', { 
        userId: request.userId,
        balance: balance.balance.toString()
      });

      return {
        success: true,
        balance: balance as UserBalance
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get balance', error as Error, { userId: request.userId });
      
      // Возвращаем специфичные ошибки
      if (error instanceof UserNotFoundException) {
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
        this.validationService.validateId(request.userId, 'User ID');
        this.validationService.validateAmount(request.amount);
        this.validationService.validateMetadata(request.metadata);

        LoggerUtil.debug('billing-service', 'Updating user balance', {
          userId: request.userId,
          amount: request.amount,
          operation: request.operation,
          attempt
        });

        // Валидация пользователя
        await this.validationService.validateUser(request.userId, this.prisma);

        const result = await this.prisma.$transaction(async (tx) => {
          // Получаем текущий баланс с блокировкой
          const currentBalance = await tx.companyBalance.findUnique({
            where: { companyId: request.userId }
          });

          if (!currentBalance) {
            throw new NotFoundException('User balance not found');
          }

          // Валидация баланса для операции
          this.validationService.validateBalanceForOperation(
            currentBalance.balance,
            request.amount,
            request.operation,
            currentBalance.creditLimit
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
            where: { companyId: request.userId },
            data: { 
              balance: newBalance,
              lastUpdated: new Date()
            }
          });

          // Создаем запись транзакции
          const transaction = await tx.transaction.create({
            data: {
              companyId: currentBalance.companyId,
              userId: request.userId,
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
        this.cacheService.invalidateUserBalance(request.userId);

        LoggerUtil.info('billing-service', 'Balance updated successfully', {
          userId: request.userId,
          newBalance: result.updatedBalance.balance.toString(),
          operation: request.operation,
          attempt
        });

        return {
          success: true,
          balance: result.updatedBalance as UserBalance,
          transaction: result.transaction as Transaction
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
          userId: request.userId,
          attempt,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    LoggerUtil.error('billing-service', 'Failed to update balance after retries', lastError as Error, { 
      userId: request.userId,
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
      LoggerUtil.debug('billing-service', 'Tracking usage', {
        userId: request.userId,
        service: request.service,
        resource: request.resource,
        quantity: request.quantity
      });

      // Calculate cost based on pricing rules
      const costCalculation = await this.calculateCost({
        userId: request.userId,
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
          companyId: request.companyId || 'default-company', // Временная заглушка
          userId: request.userId,
          service: request.service,
          resource: request.resource,
          quantity: request.quantity || 1,
          unit: request.unit || 'request',
          cost: new Decimal(costCalculation.cost),
          currency: costCalculation.currency || 'USD',
          metadata: request.metadata
        }
      });

      // Update user balance (subtract cost)
      await this.updateBalance({
        userId: request.userId,
        amount: costCalculation.cost,
        operation: 'subtract',
        description: `Usage: ${request.service}/${request.resource}`,
        reference: usageEvent.id
      });

      LoggerUtil.info('billing-service', 'Usage tracked successfully', {
        userId: request.userId,
        service: request.service,
        resource: request.resource,
        cost: costCalculation.cost
      });

      return {
        success: true,
        usageEvent: usageEvent as UsageEvent,
        cost: costCalculation.cost
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to track usage', error as Error, { userId: request.userId });
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
        userId: request.userId,
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
      LoggerUtil.error('billing-service', 'Failed to calculate cost', error as Error, { userId: request.userId });
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
        userId: request.userId,
        type: request.type,
        amount: request.amount
      });

      const transaction = await this.prisma.transaction.create({
        data: {
          companyId: request.companyId || 'default-company', // Временная заглушка
          userId: request.userId,
          type: request.type,
          amount: new Decimal(request.amount),
          currency: request.currency || 'USD',
          description: request.description,
          reference: request.reference,
          status: TransactionStatus.PENDING,
          metadata: request.metadata,
          paymentMethodId: request.paymentMethodId
        }
      });

      LoggerUtil.info('billing-service', 'Transaction created successfully', {
        transactionId: transaction.id,
        userId: request.userId,
        amount: request.amount
      });

      // Отправка события в Analytics через RabbitMQ
      try {
        await this.rabbitmq.publishCriticalMessage('analytics.events', {
          eventType: 'transaction_created',
          userId: request.userId,
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
        transaction: transaction as Transaction
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to create transaction', error as Error, { userId: request.userId });
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
        userId: request.userId,
        amount: request.amount,
        paymentMethodId: request.paymentMethodId
      });

      // Create transaction
      const transactionResult = await this.createTransaction({
        userId: request.userId,
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
        userId: request.userId,
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
        userId: request.userId,
        amount: request.amount
      });

      return {
        success: true,
        transaction: transactionResult.transaction
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to process payment', error as Error, { userId: request.userId });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get billing report
   */
  async getBillingReport(userId: string, startDate: Date, endDate: Date): Promise<BillingReport> {
    try {
      LoggerUtil.debug('billing-service', 'Generating billing report', { userId, startDate, endDate });

      // Get usage events
      const usageEvents = await this.prisma.usageEvent.findMany({
        where: {
          userId,
          timestamp: {
            gte: startDate,
            lte: endDate
          }
        }
      });

      // Get transactions
      const transactions = await this.prisma.transaction.findMany({
        where: {
          userId,
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
        userId,
        period: { start: startDate, end: endDate },
        totalUsage,
        totalCost,
        currency: 'USD',
        breakdown,
        transactions: transactions as Transaction[]
      };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to generate billing report', error as Error, { userId });
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
  private async checkUsageLimits(userId: string, service: string, resource: string): Promise<boolean> {
    try {
      // Получаем лимиты из конфигурации или БД
      const limits = await this.getUsageLimits(userId, service, resource);
      
      if (!limits) return true; // Лимиты не установлены

      // Проверяем дневные лимиты
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayUsage = await this.prisma.usageEvent.aggregate({
        where: {
          userId,
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
      LoggerUtil.error('billing-service', 'Usage limits check failed', error as Error, { userId, service, resource });
      return false;
    }
  }

  /**
   * Получение лимитов использования
   */
  private async getUsageLimits(userId: string, service: string, resource: string): Promise<any> {
    // TODO: Реализовать получение лимитов из БД или конфигурации
    return null;
  }

  /**
   * Аудит операций
   */
  private async auditOperation(
    operation: string,
    userId: string,
    details: Record<string, any>
  ): Promise<void> {
    try {
      LoggerUtil.info('billing-service', 'Audit operation', {
        operation,
        userId,
        details,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      LoggerUtil.error('billing-service', 'Audit operation failed', error as Error, { operation, userId });
    }
  }

  /**
   * Получить все транзакции пользователя
   */
  async getTransactions(userId: string, limit: number = 50, offset: number = 0): Promise<Transaction[]> {
    try {
      const transactions = await this.prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      });

      return transactions as any;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get transactions', error as Error, { userId });
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
}
