import { Test, TestingModule } from '@nestjs/testing';
import { BillingService } from '../../src/billing/billing.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';

describe('BillingService - Working Tests', () => {
  let service: BillingService;
  let prismaService: PrismaService;

  // Mock PrismaService
  const mockPrismaService: any = {
    companyBalance: {
      findUnique: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
    },
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      aggregate: jest.fn(),
    },
    company: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn((cb: any) => cb(mockPrismaService)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prismaService = module.get<PrismaService>(PrismaService);

    // Reset mocks
    jest.clearAllMocks();
  });

  describe('Basic Functionality', () => {
    it('should be defined', () => {
      expect(service).toBeDefined();
    });

    it('should have required methods', () => {
      expect(typeof service.getBalance).toBe('function');
      expect(typeof service.updateBalance).toBe('function');
      expect(typeof service.createTransaction).toBe('function');
    });
  });

  describe('getBalance', () => {
    it('should get balance successfully', async () => {
      const companyId = 'test-company-id';
      const mockBalance = {
        id: 'balance-id',
        userId: companyId,
        balance: 100.0,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.companyBalance.findUnique.mockResolvedValue(mockBalance);

      const result = await service.getBalance({ companyId });

      expect(result).toBeDefined();
      expect(result.balance).toBe(100.0);
      expect(mockPrismaService.companyBalance.findUnique).toHaveBeenCalledWith({
        where: { userId: companyId },
      });
    });

    it('should handle balance not found', async () => {
      const companyId = 'test-company-id';

      mockPrismaService.companyBalance.findUnique.mockResolvedValue(null);

      await expect(service.getBalance({ companyId })).rejects.toThrow();
    });
  });

  describe('updateBalance', () => {
    it('should update balance successfully', async () => {
      const companyId = 'test-company-id';
      const amount = 50.0;
      const operation = 'add';

      const mockBalance = {
        id: 'balance-id',
        userId: companyId,
        balance: 100.0,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedBalance = {
        ...mockBalance,
        balance: 150.0,
      };

      mockPrismaService.companyBalance.findUnique.mockResolvedValue(mockBalance);
      mockPrismaService.companyBalance.update.mockResolvedValue(updatedBalance);
      mockPrismaService.transaction.create.mockResolvedValue({} as any);

      const result = await service.updateBalance({ companyId, amount, operation });

      expect(result).toBeDefined();
      expect(result.balance).toBe(150.0);
      expect(mockPrismaService.companyBalance.update).toHaveBeenCalled();
    });

    it('should handle insufficient balance for debit', async () => {
      const companyId = 'test-company-id';
      const amount = 150.0;
      const operation = 'subtract';

      const mockBalance = {
        id: 'balance-id',
        userId: companyId,
        balance: 100.0,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.companyBalance.findUnique.mockResolvedValue(mockBalance);

      await expect(service.updateBalance({ companyId, amount, operation })).rejects.toThrow();
    });
  });

  describe('createTransaction', () => {
    it('should create transaction successfully', async () => {
      const transactionData = {
        userId: 'test-company-id',
        type: 'DEBIT' as any,
        amount: 10.0,
        currency: 'USD',
        description: 'Test transaction',
        provider: 'openai',
        metadata: { test: true },
      };

      const mockTransaction = {
        id: 'transaction-id',
        ...transactionData,
        createdAt: new Date(),
      };

      mockPrismaService.transaction.create.mockResolvedValue(mockTransaction);

      const result = await service.createTransaction(transactionData);

      expect(result).toBeDefined();
      expect(result.transaction?.id).toBe('transaction-id');
      expect(mockPrismaService.transaction.create).toHaveBeenCalledWith({
        data: transactionData,
      });
    });
  });

  describe('getTransactions', () => {
    it('should get transactions successfully', async () => {
      const companyId = 'test-company-id';
      const mockTransactions = [
        {
          id: 'transaction-1',
          userId: companyId,
          type: 'DEBIT',
          amount: 10.0,
          currency: 'USD',
          description: 'Test transaction 1',
          provider: 'openai',
          metadata: {},
          createdAt: new Date(),
        },
        {
          id: 'transaction-2',
          userId: companyId,
          type: 'CREDIT',
          amount: 50.0,
          currency: 'USD',
          description: 'Test transaction 2',
          provider: 'openai',
          metadata: {},
          createdAt: new Date(),
        },
      ];

      mockPrismaService.transaction.findMany.mockResolvedValue(mockTransactions);

      const result = await service.getTransactions(companyId);

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(mockPrismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId: companyId },
        orderBy: { createdAt: 'desc' },
        take: 50,
        skip: 0,
      });
    });
  });
});
