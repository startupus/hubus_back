import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from '../../services/billing-service/src/billing/billing.service';
import { PrismaService } from '../../services/billing-service/src/common/prisma/prisma.service';
import { TestModuleBuilder, PrismaMock, TestData, MockHelper } from '../shared/test-helpers';
import { Decimal } from '@prisma/client/runtime/library';

describe('BillingService', () => {
  let service: BillingService;
  let prismaMock: PrismaMock;

  beforeEach(async () => {
    prismaMock = new PrismaMock();
    MockHelper.setupPrismaMock(prismaMock);

    const module: TestingModule = await new TestModuleBuilder()
      .addProvider(BillingService)
      .addProvider({
        provide: PrismaService,
        useValue: prismaMock,
      })
      .build();

    service = module.get<BillingService>(BillingService);
  });

  afterEach(() => {
    MockHelper.resetAllMocks(prismaMock);
  });

  describe('getBalance', () => {
    it('should return company balance when found', async () => {
      const request = { companyId: 'test-company-id' };
      prismaMock.companyBalance.findUnique.mockResolvedValue(TestData.validCompanyBalance);

      const result = await service.getBalance(request);

      expect(result.success).toBe(true);
      expect(result.balance).toEqual(TestData.validCompanyBalance);
      expect(prismaMock.companyBalance.findUnique).toHaveBeenCalledWith({
        where: { companyId: request.companyId },
      });
    });

    it('should return error when balance not found', async () => {
      const request = { companyId: 'non-existent-id' };
      prismaMock.companyBalance.findUnique.mockResolvedValue(null);

      const result = await service.getBalance(request);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle database errors', async () => {
      const request = { companyId: 'test-company-id' };
      const error = new Error('Database connection failed');
      prismaMock.companyBalance.findUnique.mockRejectedValue(error);

      await expect(service.getBalance(request)).rejects.toThrow('Database connection failed');
    });
  });

  describe('updateBalance', () => {
    it('should update balance successfully', async () => {
      const request = {
        companyId: 'test-company-id',
        amount: 100,
        operation: 'add' as const,
        description: 'Test balance update',
      };

      prismaMock.companyBalance.upsert.mockResolvedValue({
        ...TestData.validCompanyBalance,
        balance: new Decimal(1100),
      });

      const result = await service.updateBalance(request);

      expect(result.success).toBe(true);
      expect(prismaMock.companyBalance.upsert).toHaveBeenCalled();
    });

    it('should subtract balance when operation is subtract', async () => {
      const request = {
        companyId: 'test-company-id',
        amount: 50,
        operation: 'subtract' as const,
        description: 'Test balance subtraction',
      };

      prismaMock.companyBalance.upsert.mockResolvedValue({
        ...TestData.validCompanyBalance,
        balance: new Decimal(950),
      });

      const result = await service.updateBalance(request);

      expect(result.success).toBe(true);
    });

    it('should handle insufficient balance', async () => {
      const request = {
        companyId: 'test-company-id',
        amount: 2000, // More than available balance
        operation: 'subtract' as const,
        description: 'Test insufficient balance',
      };

      prismaMock.companyBalance.findUnique.mockResolvedValue(TestData.validCompanyBalance);

      await expect(service.updateBalance(request)).rejects.toThrow();
    });
  });

  describe('createTransaction', () => {
    it('should create transaction successfully', async () => {
      const transactionData = {
        companyId: 'test-company-id',
        type: 'DEBIT' as any,
        amount: 100,
        description: 'Test transaction',
      };

      prismaMock.transaction.create.mockResolvedValue(TestData.validTransaction);

      const result = await service.createTransaction(transactionData);

      expect(result.success).toBe(true);
      expect(result.transaction).toEqual(TestData.validTransaction);
      expect(prismaMock.transaction.create).toHaveBeenCalledWith({
        data: transactionData,
      });
    });

    it('should handle transaction creation errors', async () => {
      const transactionData = {
        companyId: 'test-company-id',
        type: 'DEBIT' as any,
        amount: 100,
        description: 'Test transaction',
      };

      const error = new Error('Transaction creation failed');
      prismaMock.transaction.create.mockRejectedValue(error);

      await expect(service.createTransaction(transactionData)).rejects.toThrow('Transaction creation failed');
    });
  });

  describe('getTransactions', () => {
    it('should return company transactions', async () => {
      const companyId = 'test-company-id';
      const limit = 10;
      const offset = 0;

      prismaMock.transaction.findMany.mockResolvedValue([TestData.validTransaction]);

      const result = await service.getTransactions(companyId, limit, offset);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(1);
      expect(prismaMock.transaction.findMany).toHaveBeenCalledWith({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });
    });

    it('should handle empty transaction list', async () => {
      const companyId = 'test-company-id';
      const limit = 10;
      const offset = 0;

      prismaMock.transaction.findMany.mockResolvedValue([]);

      const result = await service.getTransactions(companyId, limit, offset);

      expect(Array.isArray(result)).toBe(true);
      expect(result).toHaveLength(0);
    });
  });

  describe('trackUsage', () => {
    it('should track usage event successfully', async () => {
      const usageData = {
        companyId: 'test-company-id',
        service: 'ai-chat',
        resource: 'gpt-4',
        quantity: 1,
        unit: 'request',
        metadata: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      };

      prismaMock.usageEvent.create.mockResolvedValue({
        id: 'usage-event-id',
        ...usageData,
        cost: new Decimal(0.01),
        currency: 'USD',
        timestamp: new Date(),
      });

      const result = await service.trackUsage(usageData);

      expect(result.success).toBe(true);
      expect(prismaMock.usageEvent.create).toHaveBeenCalled();
    });

    it('should handle usage tracking errors', async () => {
      const usageData = {
        companyId: 'test-company-id',
        service: 'ai-chat',
        resource: 'gpt-4',
        quantity: 1,
        unit: 'request',
      };

      const error = new Error('Usage tracking failed');
      prismaMock.usageEvent.create.mockRejectedValue(error);

      await expect(service.trackUsage(usageData)).rejects.toThrow('Usage tracking failed');
    });
  });
});
