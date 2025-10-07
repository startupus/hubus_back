import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { BillingService } from './billing.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { ValidationService } from '../common/validation/validation.service';
import { PricingService } from './pricing.service';
import { PaymentGatewayService } from './payment-gateway.service';
// // import { Decimal } from 'decimal.js'; // Временно отключено

describe('BillingService', () => {
  let service: BillingService;
  let prismaService: PrismaService;
  let validationService: ValidationService;
  let pricingService: PricingService;
  let paymentGatewayService: PaymentGatewayService;

  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserBalance = {
    id: 'test-balance-id',
    userId: 'test-user-id',
    companyId: 'test-company-id',
    balance: 100.00 as any,
    currency: 'USD',
    creditLimit: 1000.00 as any,
    lastUpdated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction = {
    id: 'test-transaction-id',
    companyId: 'test-company-id',
    userId: 'test-user-id',
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
    type: 'DEBIT' as any,
    amount: 10.50 as any,
    description: 'Test transaction',
    status: 'COMPLETED' as any,
    reference: 'ref_123',
    metadata: {},
    paymentMethodId: 'pm_123',
    processedAt: new Date(),
    invoiceId: 'test-invoice-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
            },
            userBalance: {
              findUnique: jest.fn(),
              create: jest.fn(),
              update: jest.fn(),
              findMany: jest.fn(),
            },
            transaction: {
              create: jest.fn(),
              findMany: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            $transaction: jest.fn(),
          },
        },
        {
          provide: ValidationService,
          useValue: {
            validateAmount: jest.fn(),
            validateUserId: jest.fn(),
            validateTransactionType: jest.fn(),
          },
        },
        {
          provide: PricingService,
          useValue: {
            calculateCost: jest.fn(),
            getPricingRules: jest.fn(),
            getCurrencyRate: jest.fn(),
          },
        },
        {
          provide: PaymentGatewayService,
          useValue: {
            processPayment: jest.fn(),
            refundPayment: jest.fn(),
            getPaymentStatus: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prismaService = module.get<PrismaService>(PrismaService);
    validationService = module.get<ValidationService>(ValidationService);
    pricingService = module.get<PricingService>(PricingService);
    paymentGatewayService = module.get<PaymentGatewayService>(PaymentGatewayService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getBalance', () => {
    it('should return user balance', async () => {
      jest.spyOn(prismaService.companyBalance, 'findUnique').mockResolvedValue(mockUserBalance);

      const result = await service.getBalance({ userId: 'test-user-id' });

      expect(result).toEqual(mockUserBalance);
      expect(prismaService.companyBalance.findUnique).toHaveBeenCalledWith({
        where: { userId: 'test-user-id' },
      });
    });

    it('should return null when user balance not found', async () => {
      jest.spyOn(prismaService.companyBalance, 'findUnique').mockResolvedValue(null);

      const result = await service.getBalance({ userId: 'non-existent-user' });

      expect(result).toBeNull();
    });

    it('should handle database errors', async () => {
      const error = new Error('Database connection failed');
      jest.spyOn(prismaService.companyBalance, 'findUnique').mockRejectedValue(error);

      await expect(service.getBalance({ userId: 'test-user-id' })).rejects.toThrow('Database connection failed');
    });
  });

  describe('updateBalance', () => {
    it('should update user balance successfully', async () => {
      const userId = 'test-user-id';
      const amount = new Decimal(50.00);
      const updatedBalance = { ...mockUserBalance, balance: 150.00 as any };

      jest.spyOn(prismaService.companyBalance, 'findUnique').mockResolvedValue(mockUserBalance);
      jest.spyOn(prismaService.companyBalance, 'update').mockResolvedValue(updatedBalance);

      const result = await service.updateBalance({ userId, amount: Number(amount), operation: 'add' });

      expect(result).toEqual(updatedBalance);
      expect(prismaService.companyBalance.update).toHaveBeenCalledWith({
        where: { userId },
        data: { balance: new Decimal(150.00) },
      });
    });

    it('should create new balance when user has no balance', async () => {
      const userId = 'test-user-id';
      const amount = new Decimal(100.00);
      const newBalance = { ...mockUserBalance, balance: 100.00 as any };

      jest.spyOn(prismaService.companyBalance, 'findUnique').mockResolvedValue(null);
      jest.spyOn(prismaService.companyBalance, 'create').mockResolvedValue(newBalance);

      const result = await service.updateBalance({ userId, amount: Number(amount), operation: 'add' });

      expect(result).toEqual(newBalance);
      expect(prismaService.companyBalance.create).toHaveBeenCalledWith({
        data: {
          userId,
          balance: amount,
          currency: 'USD',
        },
      });
    });

    it('should handle negative balance', async () => {
      const userId = 'test-user-id';
      const amount = new Decimal(-50.00);
      const updatedBalance = { ...mockUserBalance, balance: 50.00 as any };

      jest.spyOn(prismaService.companyBalance, 'findUnique').mockResolvedValue(mockUserBalance);
      jest.spyOn(prismaService.companyBalance, 'update').mockResolvedValue(updatedBalance);

      const result = await service.updateBalance({ userId, amount: Number(amount), operation: 'add' });

      expect(result).toEqual(updatedBalance);
      expect(prismaService.companyBalance.update).toHaveBeenCalledWith({
        where: { userId },
        data: { balance: new Decimal(50.00) },
      });
    });

    it('should validate amount before updating', async () => {
      const userId = 'test-user-id';
      const amount = new Decimal(50.00);

      jest.spyOn(validationService, 'validateAmount').mockImplementation(() => {
        throw new Error('Invalid amount');
      });

      await expect(service.updateBalance({ userId, amount: Number(amount), operation: 'add' })).rejects.toThrow('Invalid amount');
    });
  });

  describe('createTransaction', () => {
    it('should create transaction successfully', async () => {
      const transactionData = {
        userId: 'test-user-id',
        type: 'DEBIT' as any,
        amount: 10.50,
        description: 'Test transaction',
      };

      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue(mockTransaction);

      const result = await service.createTransaction(transactionData);

      expect(result).toEqual(mockTransaction);
      expect(prismaService.transaction.create).toHaveBeenCalledWith({
        data: transactionData,
      });
    });

    it('should validate transaction data', async () => {
      const transactionData = {
        userId: 'test-user-id',
        type: 'DEBIT' as any,
        amount: 10.50,
        description: 'Test transaction',
      };

      jest.spyOn(validationService, 'validateAmount').mockImplementation(() => {
        throw new Error('Invalid amount');
      });

      await expect(service.createTransaction(transactionData)).rejects.toThrow('Invalid amount');
    });

    it('should handle database errors', async () => {
      const transactionData = {
        userId: 'test-user-id',
        type: 'DEBIT' as any,
        amount: 10.50,
        description: 'Test transaction',
      };

      const error = new Error('Database connection failed');
      jest.spyOn(prismaService.transaction, 'create').mockRejectedValue(error);

      await expect(service.createTransaction(transactionData)).rejects.toThrow('Database connection failed');
    });
  });

  describe('getTransactions', () => {
    it('should return user transactions', async () => {
      const userId = 'test-user-id';
      const transactions = [{ ...mockTransaction, amount: 10.50 as any }];

      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue(transactions);

      const result = await service.getTransactions(userId);

      expect(result).toEqual(transactions);
      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    });

    it('should return transactions with pagination', async () => {
      const userId = 'test-user-id';
      const transactions = [{ ...mockTransaction, amount: 10.50 as any }];
      const page = 1;
      const limit = 10;

      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue(transactions);

      const result = await service.getTransactions(userId, page, limit);

      expect(result).toEqual(transactions);
      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    });

    it('should return transactions with date filter', async () => {
      const userId = 'test-user-id';
      const transactions = [{ ...mockTransaction, amount: 10.50 as any }];
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');

      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue(transactions);

      const result = await service.getTransactions(userId, 1, 10);

      expect(result).toEqual(transactions);
      expect(prismaService.transaction.findMany).toHaveBeenCalledWith({
        where: {
          userId,
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('getBillingReport', () => {
    it('should return billing report', async () => {
      const userId = 'test-user-id';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const transactions = [{ ...mockTransaction, amount: 10.50 as any }];
      const userBalance = mockUserBalance;

      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue(transactions);
      jest.spyOn(prismaService.companyBalance, 'findUnique').mockResolvedValue(userBalance);

      const result = await service.getBillingReport(userId, startDate, endDate);

      expect(result).toEqual({
        userId,
        startDate,
        endDate,
        totalTransactions: 1,
        totalAmount: new Decimal(10.50),
        currentBalance: new Decimal(100.00),
        transactions,
      });
    });

    it('should handle empty transactions', async () => {
      const userId = 'test-user-id';
      const startDate = new Date('2023-01-01');
      const endDate = new Date('2023-12-31');
      const userBalance = mockUserBalance;

      jest.spyOn(prismaService.transaction, 'findMany').mockResolvedValue([]);
      jest.spyOn(prismaService.companyBalance, 'findUnique').mockResolvedValue(userBalance);

      const result = await service.getBillingReport(userId, startDate, endDate);

      expect(result).toEqual({
        userId,
        startDate,
        endDate,
        totalTransactions: 0,
        totalAmount: new Decimal(0),
        currentBalance: new Decimal(100.00),
        transactions: [],
      });
    });
  });

  describe('trackUsage', () => {
    it('should track usage and create transaction', async () => {
      const usageData = {
        userId: 'test-user-id',
        service: 'openai',
        resource: 'gpt-3.5-turbo',
        tokens: 1000,
        model: 'gpt-3.5-turbo',
      };

      const cost = new Decimal(0.002);
      const updatedBalance = { ...mockUserBalance, balance: 99.998 as any };

      jest.spyOn(pricingService, 'calculateCost').mockResolvedValue(Number(cost));
      jest.spyOn(prismaService.companyBalance, 'findUnique').mockResolvedValue(mockUserBalance);
      jest.spyOn(prismaService.companyBalance, 'update').mockResolvedValue(updatedBalance);
      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue(mockTransaction);

      const result = await service.trackUsage(usageData);

      expect(result).toEqual(mockTransaction);
      expect(pricingService.calculateCost).toHaveBeenCalledWith(usageData);
      expect(prismaService.transaction.create).toHaveBeenCalledWith({
        data: {
          userId: usageData.userId,
          type: 'DEBIT' as any,
          amount: cost,
          description: `AI usage: ${usageData.service} - ${usageData.tokens} tokens`,
        },
      });
    });

    it('should handle insufficient balance', async () => {
      const usageData = {
        userId: 'test-user-id',
        service: 'openai',
        resource: 'gpt-3.5-turbo',
        tokens: 1000,
        model: 'gpt-3.5-turbo',
      };

      const cost = 150.00;
      const userBalance = { ...mockUserBalance, balance: 100.00 as any };

      jest.spyOn(pricingService, 'calculateCost').mockResolvedValue(Number(cost));
      jest.spyOn(prismaService.companyBalance, 'findUnique').mockResolvedValue(userBalance);

      await expect(service.trackUsage(usageData)).rejects.toThrow('Insufficient balance');
    });

    it('should validate usage data', async () => {
      const usageData = {
        userId: 'test-user-id',
        service: 'openai',
        resource: 'gpt-3.5-turbo',
        tokens: -1000, // Invalid negative tokens
        model: 'gpt-3.5-turbo',
      };

      jest.spyOn(validationService, 'validateAmount').mockImplementation(() => {
        throw new Error('Invalid tokens');
      });

      await expect(service.trackUsage(usageData)).rejects.toThrow('Invalid tokens');
    });
  });

  describe('processPayment', () => {
    it('should process payment successfully', async () => {
      const paymentData = {
        userId: 'test-user-id',
        amount: 50.00,
        paymentMethod: 'stripe',
        paymentToken: 'test-token',
      };

      const paymentResult = {
        success: true,
        transactionId: 'payment-id',
        status: 'COMPLETED' as any,
        metadata: {},
        amount: 50.00,
        currency: 'USD',
        timestamp: new Date()
      };

      const updatedBalance = { ...mockUserBalance, balance: 150.00 as any };

      jest.spyOn(paymentGatewayService, 'processPayment').mockResolvedValue(paymentResult);
      jest.spyOn(prismaService.companyBalance, 'findUnique').mockResolvedValue(mockUserBalance);
      jest.spyOn(prismaService.companyBalance, 'update').mockResolvedValue(updatedBalance);
      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue(mockTransaction);

      const result = await service.processPayment(paymentData);

      expect(result).toEqual(mockTransaction);
      expect(paymentGatewayService.processPayment).toHaveBeenCalledWith(paymentData);
    });

    it('should handle payment failure', async () => {
      const paymentData = {
        userId: 'test-user-id',
        amount: 50.00,
        paymentMethod: 'stripe',
        paymentToken: 'invalid-token',
      };

      jest.spyOn(paymentGatewayService, 'processPayment').mockRejectedValue(new Error('Payment failed'));

      await expect(service.processPayment(paymentData)).rejects.toThrow('Payment failed');
    });
  });

  describe('refundPayment', () => {
    it('should refund payment successfully', async () => {
      const refundData = {
        transactionId: 'test-transaction-id',
        amount: 25.00 as any,
        reason: 'Customer requested refund',
      };

      const refundResult = {
        success: true,
        refundId: 'refund-id',
        status: 'COMPLETED' as any,
        amount: 25.00 as any,
        currency: 'USD',
        timestamp: new Date()
      };

      const updatedBalance = { ...mockUserBalance, balance: 75.00 as any };

      jest.spyOn(paymentGatewayService, 'refundPayment').mockResolvedValue(refundResult);
      jest.spyOn(prismaService.companyBalance, 'findUnique').mockResolvedValue(mockUserBalance);
      jest.spyOn(prismaService.companyBalance, 'update').mockResolvedValue(updatedBalance);
      jest.spyOn(prismaService.transaction, 'create').mockResolvedValue(mockTransaction);

      const result = await service.refundPayment(refundData);

      expect(result).toEqual(mockTransaction);
      expect(paymentGatewayService.refundPayment).toHaveBeenCalledWith(refundData);
    });

    it('should handle refund failure', async () => {
      const refundData = {
        transactionId: 'test-transaction-id',
        amount: 25.00 as any,
        reason: 'Customer requested refund',
      };

      jest.spyOn(paymentGatewayService, 'refundPayment').mockRejectedValue(new Error('Refund failed'));

      await expect(service.refundPayment(refundData)).rejects.toThrow('Refund failed');
    });
  });

  describe('getTransactionById', () => {
    it('should return transaction by id', async () => {
      const transactionId = 'test-transaction-id';

      jest.spyOn(prismaService.transaction, 'findUnique').mockResolvedValue(mockTransaction);

      const result = await service.getTransactionById(transactionId);

      expect(result).toEqual(mockTransaction);
      expect(prismaService.transaction.findUnique).toHaveBeenCalledWith({
        where: { id: transactionId },
      });
    });

    it('should return null when transaction not found', async () => {
      const transactionId = 'non-existent-transaction';

      jest.spyOn(prismaService.transaction, 'findUnique').mockResolvedValue(null);

      const result = await service.getTransactionById(transactionId);

      expect(result).toBeNull();
    });
  });

  describe('updateTransaction', () => {
    it('should update transaction successfully', async () => {
      const transactionId = 'test-transaction-id';
      const updateData = {
        description: 'Updated transaction',
        status: 'completed' as any,
      };

      const updatedTransaction = { ...mockTransaction, ...updateData } as any;

      jest.spyOn(prismaService.transaction, 'update').mockResolvedValue(updatedTransaction);

      const result = await service.updateTransaction(transactionId, updateData);

      expect(result).toEqual(updatedTransaction);
      expect(prismaService.transaction.update).toHaveBeenCalledWith({
        where: { id: transactionId },
        data: updateData,
      });
    });

    it('should handle update failure', async () => {
      const transactionId = 'test-transaction-id';
      const updateData = {
        description: 'Updated transaction',
      };

      const error = new Error('Update failed');
      jest.spyOn(prismaService.transaction, 'update').mockRejectedValue(error);

      await expect(service.updateTransaction(transactionId, updateData)).rejects.toThrow('Update failed');
    });
  });

  describe('deleteTransaction', () => {
    it('should delete transaction successfully', async () => {
      const transactionId = 'test-transaction-id';

      jest.spyOn(prismaService.transaction, 'delete').mockResolvedValue(mockTransaction);

      const result = await service.deleteTransaction(transactionId);

      expect(result).toEqual(mockTransaction);
      expect(prismaService.transaction.delete).toHaveBeenCalledWith({
        where: { id: transactionId },
      });
    });

    it('should handle delete failure', async () => {
      const transactionId = 'test-transaction-id';

      const error = new Error('Delete failed');
      jest.spyOn(prismaService.transaction, 'delete').mockRejectedValue(error);

      await expect(service.deleteTransaction(transactionId)).rejects.toThrow('Delete failed');
    });
  });
});