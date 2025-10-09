import { Injectable, Logger } from '@nestjs/common';
import { LoggerUtil } from '@ai-aggregator/shared';
// import { ThreadPoolService } from '@ai-aggregator/shared'; // Removed - using Promise.all for now
import { ConcurrentMap, ConcurrentQueue, AtomicCounter, ConcurrentCache } from '@ai-aggregator/shared';
import { PrismaService } from '../common/prisma/prisma.service';
import { Decimal } from '@prisma/client/runtime/library';

/**
 * Concurrent Billing Service для высоконагруженных операций биллинга
 * 
 * Обеспечивает:
 * - Потокобезопасные операции с балансами
 * - Параллельную обработку транзакций
 * - Кэширование часто запрашиваемых данных
 * - Предотвращение race conditions
 */
@Injectable()
export class ConcurrentBillingService {
  private readonly logger = new Logger(ConcurrentBillingService.name);
  
  // Потокобезопасные коллекции для кэширования
  private readonly balanceCache = new ConcurrentCache<string, { balance: Decimal; currency: string; lastUpdated: Date }>();
  private readonly pricingCache = new ConcurrentCache<string, { price: Decimal; currency: string; lastUpdated: Date }>();
  private readonly currencyCache = new ConcurrentCache<string, { rate: number; lastUpdated: Date }>();
  
  // Потокобезопасные счетчики для метрик
  private readonly transactionCounter = new AtomicCounter(0);
  private readonly totalRevenue = new AtomicCounter(0);
  private readonly activeUsers = new AtomicCounter(0);
  
  // Очередь для обработки транзакций
  private readonly transactionQueue = new ConcurrentQueue<{
    companyId: string;
    amount: Decimal;
    type: 'DEBIT' | 'CREDIT';
    description: string;
    metadata?: any;
  }>();
  
  // Потокобезопасная карта для блокировок пользователей
  private readonly userLocks = new ConcurrentMap<string, Int32Array>();
  
  // Пул потоков для параллельной обработки
  // private readonly threadPool: ThreadPoolService; // Temporarily disabled

  constructor(
    private readonly prisma: PrismaService,
    // threadPool: ThreadPoolService // Temporarily disabled
  ) {
    // this.threadPool = threadPool; // Temporarily disabled
    this.startTransactionProcessor();
  }

  /**
   * Потокобезопасное получение баланса пользователя
   */
  async getBalance(companyId: string): Promise<{ balance: Decimal; currency: string }> {
    try {
      // Сначала проверяем кэш
      const cached = this.balanceCache.get(companyId);
      if (cached && (Date.now() - cached.lastUpdated.getTime()) < 60000) { // 1 минута TTL
        LoggerUtil.debug('billing-service', 'Balance retrieved from cache', { companyId });
        return { balance: cached.balance, currency: cached.currency };
      }

      // Получаем блокировку для пользователя
      const userLock = this.getUserLock(companyId);
      await this.acquireLock(userLock);

      try {
        // Получаем баланс из БД
        const balance = await this.prisma.companyBalance.findUnique({
          where: { companyId: companyId }
        });

        if (!balance) {
          // Создаем новый баланс
          const newBalance = await this.prisma.companyBalance.create({
            data: {
              companyId: companyId,
              balance: 0,
              currency: 'USD',
              creditLimit: 0
            }
          });

          // Кэшируем новый баланс
          this.balanceCache.set(companyId, {
            balance: newBalance.balance,
            currency: newBalance.currency,
            lastUpdated: new Date()
          });

          return { balance: newBalance.balance, currency: newBalance.currency };
        }

        // Кэшируем полученный баланс
        this.balanceCache.set(companyId, {
          balance: balance.balance,
          currency: balance.currency,
          lastUpdated: new Date()
        });

        LoggerUtil.info('billing-service', 'Balance retrieved successfully', { 
          companyId, 
          balance: balance.balance.toString() 
        });

        return { balance: balance.balance, currency: balance.currency };
      } finally {
        this.releaseLock(userLock);
      }
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get balance', error as Error, { companyId });
      throw error;
    }
  }

  /**
   * Потокобезопасное обновление баланса
   */
  async updateBalance(
    companyId: string, 
    amount: Decimal, 
    type: 'DEBIT' | 'CREDIT',
    description: string,
    metadata?: any
  ): Promise<{ success: boolean; newBalance: Decimal; transactionId?: string }> {
    try {
      // Получаем блокировку для пользователя
      const userLock = this.getUserLock(companyId);
      await this.acquireLock(userLock);

      try {
      // Получаем текущий баланс
      const currentBalance = await this.prisma.companyBalance.findUnique({
        where: { companyId: companyId }
        });

        if (!currentBalance) {
          throw new Error(`User balance not found: ${companyId}`);
        }

        // Вычисляем новый баланс
        let newBalance: Decimal;
        if (type === 'DEBIT') {
          newBalance = currentBalance.balance.minus(amount);
          if (newBalance.lt(0)) {
            throw new Error(`Insufficient balance: ${currentBalance.balance.toString()}, requested: ${amount.toString()}`);
          }
        } else {
          newBalance = currentBalance.balance.plus(amount);
        }

        // Обновляем баланс в БД
        const updatedBalance = await this.prisma.companyBalance.update({
          where: { companyId: companyId },
          data: { balance: newBalance }
        });

        // Создаем транзакцию
        const transaction = await this.prisma.transaction.create({
          data: {
            companyId: currentBalance.companyId,
            type,
            amount,
            currency: currentBalance.currency,
            description,
            metadata: metadata || {}
          }
        });

        // Обновляем кэш
        this.balanceCache.set(companyId, {
          balance: newBalance,
          currency: currentBalance.currency,
          lastUpdated: new Date()
        });

        // Обновляем счетчики
        this.transactionCounter.increment();
        if (type === 'CREDIT') {
          this.totalRevenue.increment();
        }

        LoggerUtil.info('billing-service', 'Balance updated successfully', {
          companyId,
          type,
          amount: amount.toString(),
          newBalance: newBalance.toString(),
          transactionId: transaction.id
        });

        return {
          success: true,
          newBalance,
          transactionId: transaction.id
        };
      } finally {
        this.releaseLock(userLock);
      }
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to update balance', error as Error, { companyId });
      return {
        success: false,
        newBalance: new Decimal(0)
      };
    }
  }

  /**
   * Асинхронная обработка транзакций через очередь
   */
  async processTransactionAsync(
    companyId: string,
    amount: Decimal,
    type: 'DEBIT' | 'CREDIT',
    description: string,
    metadata?: any
  ): Promise<boolean> {
    try {
      // Добавляем транзакцию в очередь
      const success = this.transactionQueue.enqueue({
        companyId,
        amount,
        type,
        description,
        metadata
      });

      if (success) {
        LoggerUtil.debug('billing-service', 'Transaction queued for processing', { companyId, type });
        return true;
      } else {
        LoggerUtil.warn('billing-service', 'Transaction queue is full', { companyId });
        return false;
      }
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to queue transaction', error as Error, { companyId });
      return false;
    }
  }

  /**
   * Параллельная обработка множественных транзакций
   */
  async processBatchTransactions(
    transactions: Array<{
      userId: string;
      amount: Decimal;
      type: 'DEBIT' | 'CREDIT';
      description: string;
      metadata?: any;
    }>
  ): Promise<Array<{ success: boolean; transactionId?: string; error?: string }>> {
    try {
      // Создаем задачи для пула потоков
      const tasks = transactions.map(transaction => 
        () => this.updateBalance(
          transaction.userId,
          transaction.amount,
          transaction.type,
          transaction.description,
          transaction.metadata
        )
      );

      // Выполняем задачи параллельно
      // const results = await this.threadPool.executeParallel(tasks, { // Temporarily disabled
      //   maxConcurrency: 5, // Максимум 5 параллельных операций
      //   timeout: 30000 // 30 секунд таймаут
      // });
      const results = await Promise.all(tasks.map(task => task())); // Fallback implementation

      return results.map(result => ({
        success: result.success,
        transactionId: result.transactionId,
        error: result.success ? undefined : 'Transaction failed'
      }));
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to process batch transactions', error as Error);
      return transactions.map(() => ({
        success: false,
        error: 'Batch processing failed'
      }));
    }
  }

  /**
   * Потокобезопасное получение цены с кэшированием
   */
  async getPricing(
    service: string, 
    resource: string, 
    quantity: number
  ): Promise<{ price: Decimal; currency: string }> {
    try {
      const cacheKey = `${service}:${resource}`;
      
      // Проверяем кэш
      const cached = this.pricingCache.get(cacheKey);
      if (cached && (Date.now() - cached.lastUpdated.getTime()) < 300000) { // 5 минут TTL
        LoggerUtil.debug('billing-service', 'Pricing retrieved from cache', { service, resource });
        return { price: cached.price, currency: cached.currency };
      }

      // Получаем цену из БД
      const pricingRule = await this.prisma.pricingRule.findFirst({
        where: {
          service,
          resource,
          isActive: true
        },
        orderBy: { priority: 'desc' }
      });

      if (!pricingRule) {
        throw new Error(`Pricing rule not found for ${service}:${resource}`);
      }

      const price = pricingRule.price.times(quantity);
      
      // Кэшируем цену
      this.pricingCache.set(cacheKey, {
        price,
        currency: pricingRule.currency,
        lastUpdated: new Date()
      });

      LoggerUtil.info('billing-service', 'Pricing calculated', {
        service,
        resource,
        quantity,
        price: price.toString(),
        currency: pricingRule.currency
      });

      return { price, currency: pricingRule.currency };
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get pricing', error as Error, { service, resource });
      throw error;
    }
  }

  /**
   * Потокобезопасное получение валютного курса
   */
  async getCurrencyRate(fromCurrency: string, toCurrency: string): Promise<number> {
    try {
      if (fromCurrency === toCurrency) {
        return 1.0;
      }

      const cacheKey = `${fromCurrency}:${toCurrency}`;
      
      // Проверяем кэш
      const cached = this.currencyCache.get(cacheKey);
      if (cached && (Date.now() - cached.lastUpdated.getTime()) < 3600000) { // 1 час TTL
        LoggerUtil.debug('billing-service', 'Currency rate retrieved from cache', { fromCurrency, toCurrency });
        return cached.rate;
      }

      // Получаем курс из БД
      const currencyRate = await this.prisma.currencyRate.findFirst({
        where: {
          fromCurrency,
          toCurrency,
          timestamp: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Последние 24 часа
          }
        },
        orderBy: { timestamp: 'desc' }
      });

      if (!currencyRate) {
        LoggerUtil.warn('billing-service', 'Currency rate not found, using default', { fromCurrency, toCurrency });
        return 1.0; // Default rate
      }

      const rate = currencyRate.rate.toNumber();
      
      // Кэшируем курс
      this.currencyCache.set(cacheKey, {
        rate,
        lastUpdated: new Date()
      });

      LoggerUtil.info('billing-service', 'Currency rate retrieved', {
        fromCurrency,
        toCurrency,
        rate
      });

      return rate;
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to get currency rate', error as Error, { fromCurrency, toCurrency });
      return 1.0; // Default rate
    }
  }

  /**
   * Процессор транзакций из очереди
   */
  private startTransactionProcessor(): void {
    const processTransactions = async () => {
      while (true) {
        try {
          // Получаем транзакцию из очереди
          const transaction = this.transactionQueue.dequeueBlocking(1000); // Ждем 1 секунду
          if (!transaction) {
            continue;
          }

          // Обрабатываем транзакцию
          await this.updateBalance(
            transaction.companyId,
            transaction.amount,
            transaction.type,
            transaction.description,
            transaction.metadata
          );

          LoggerUtil.debug('billing-service', 'Transaction processed from queue', {
            companyId: transaction.companyId,
            type: transaction.type
          });
        } catch (error) {
          LoggerUtil.error('billing-service', 'Failed to process transaction from queue', error as Error);
        }
      }
    };

    // Запускаем процессор в отдельном потоке
    setImmediate(processTransactions);
  }

  /**
   * Получение блокировки для пользователя
   */
  private getUserLock(userId: string): Int32Array {
    if (!this.userLocks.has(userId)) {
      this.userLocks.set(userId, new Int32Array(new SharedArrayBuffer(4)));
    }
    return this.userLocks.get(userId)!;
  }

  /**
   * Получение блокировки
   */
  private async acquireLock(lock: Int32Array): Promise<void> {
    while (!Atomics.compareExchange(lock, 0, 0, 1)) {
      Atomics.wait(lock, 0, 1);
    }
  }

  /**
   * Освобождение блокировки
   */
  private releaseLock(lock: Int32Array): void {
    Atomics.store(lock, 0, 0);
    Atomics.notify(lock, 0, 1);
  }

  /**
   * Получение статистики сервиса
   */
  getStats(): {
    totalTransactions: number;
    totalRevenue: number;
    activeUsers: number;
    queueSize: number;
    cacheStats: {
      balanceCache: number;
      pricingCache: number;
      currencyCache: number;
    };
  } {
    return {
      totalTransactions: this.transactionCounter.get(),
      totalRevenue: this.totalRevenue.get(),
      activeUsers: this.activeUsers.get(),
      queueSize: this.transactionQueue.size(),
      cacheStats: {
        balanceCache: (this.balanceCache as any).size(),
        pricingCache: (this.pricingCache as any).size(),
        currencyCache: (this.currencyCache as any).size()
      }
    };
  }

  /**
   * Очистка кэша
   */
  async clearCache(): Promise<void> {
    try {
      // Очищаем все кэши
      this.balanceCache.cleanup();
      this.pricingCache.cleanup();
      this.currencyCache.cleanup();

      LoggerUtil.info('billing-service', 'Cache cleared successfully');
    } catch (error) {
      LoggerUtil.error('billing-service', 'Failed to clear cache', error as Error);
    }
  }
}
