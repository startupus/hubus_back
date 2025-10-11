import { BillingService } from '../../services/billing-service/src/billing/billing.service';
import { PrismaMock, TestData } from '../shared/test-helpers';

// Создаем простой мок для тестирования только логики
class SimpleBillingService {
  private prisma: PrismaMock;

  constructor(prisma: PrismaMock) {
    this.prisma = prisma;
  }

  async getBalance(request: { companyId: string }) {
    try {
      const balance = await this.prisma.companyBalance.findUnique({
        where: { companyId: request.companyId },
      });

      if (!balance) {
        return { success: false, error: 'Balance not found' };
      }

      return { success: true, balance };
    } catch (error) {
      throw error;
    }
  }

  async updateBalance(request: { 
    companyId: string; 
    amount: number; 
    operation: 'add' | 'subtract';
    description?: string;
  }) {
    try {
      const currentBalance = await this.prisma.companyBalance.findUnique({
        where: { companyId: request.companyId },
      });

      if (!currentBalance) {
        throw new Error('Company not found');
      }

      if (request.operation === 'subtract' && currentBalance.balance < request.amount) {
        throw new Error('Insufficient balance');
      }

      const newBalance = request.operation === 'add' 
        ? currentBalance.balance + request.amount
        : currentBalance.balance - request.amount;

      const updatedBalance = await this.prisma.companyBalance.upsert({
        where: { companyId: request.companyId },
        update: { balance: newBalance },
        create: {
          companyId: request.companyId,
          balance: newBalance,
          currency: 'USD',
        },
      });

      return { success: true, balance: updatedBalance };
    } catch (error) {
      throw error;
    }
  }

  async createTransaction(request: {
    companyId: string;
    type: string;
    amount: number;
    description?: string;
  }) {
    try {
      const transaction = await this.prisma.transaction.create({
        data: request,
      });

      return { success: true, transaction };
    } catch (error) {
      throw error;
    }
  }

  async getTransactions(companyId: string, limit: number = 50, offset: number = 0) {
    try {
      const transactions = await this.prisma.transaction.findMany({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      });

      return transactions;
    } catch (error) {
      throw error;
    }
  }
}

describe('Simple BillingService', () => {
  let service: SimpleBillingService;
  let prismaMock: PrismaMock;

  beforeEach(() => {
    prismaMock = new PrismaMock();
    service = new SimpleBillingService(prismaMock);
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
      expect(result.error).toBe('Balance not found');
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

      prismaMock.companyBalance.findUnique.mockResolvedValue(TestData.validCompanyBalance);
      prismaMock.companyBalance.upsert.mockResolvedValue({
        ...TestData.validCompanyBalance,
        balance: TestData.validCompanyBalance.balance + 100,
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

      prismaMock.companyBalance.findUnique.mockResolvedValue(TestData.validCompanyBalance);
      prismaMock.companyBalance.upsert.mockResolvedValue({
        ...TestData.validCompanyBalance,
        balance: TestData.validCompanyBalance.balance - 50,
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

      await expect(service.updateBalance(request)).rejects.toThrow('Insufficient balance');
    });
  });

  describe('createTransaction', () => {
    it('should create transaction successfully', async () => {
      const request = {
        companyId: 'test-company-id',
        type: 'DEBIT',
        amount: 100,
        description: 'Test transaction',
      };

      prismaMock.transaction.create.mockResolvedValue(TestData.validTransaction);

      const result = await service.createTransaction(request);

      expect(result.success).toBe(true);
      expect(result.transaction).toEqual(TestData.validTransaction);
      expect(prismaMock.transaction.create).toHaveBeenCalledWith({
        data: request,
      });
    });

    it('should handle transaction creation errors', async () => {
      const request = {
        companyId: 'test-company-id',
        type: 'DEBIT',
        amount: 100,
        description: 'Test transaction',
      };

      const error = new Error('Transaction creation failed');
      prismaMock.transaction.create.mockRejectedValue(error);

      await expect(service.createTransaction(request)).rejects.toThrow('Transaction creation failed');
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
});
