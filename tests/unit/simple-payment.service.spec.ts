import { PrismaMock, TestData } from '../shared/test-helpers';

// Создаем простой мок для тестирования только логики
class SimplePaymentService {
  private prisma: PrismaMock;
  private readonly MIN_AMOUNT = 100;

  constructor(prisma: PrismaMock) {
    this.prisma = prisma;
  }

  async createPayment(data: {
    companyId: string;
    amount: number;
    currency: string;
    returnUrl: string;
  }) {
    // Проверка минимальной суммы
    if (data.amount < this.MIN_AMOUNT) {
      throw new Error(`Minimum payment amount is ${this.MIN_AMOUNT} RUB`);
    }

    try {
      // Создаем платеж в базе данных
      const payment = await this.prisma.payment.create({
        data: {
          companyId: data.companyId,
          amount: data.amount,
          currency: data.currency,
          status: 'PENDING',
          yookassaId: null,
          yookassaUrl: `https://yookassa.ru/payment/${Date.now()}`,
        },
      });

      return {
        paymentId: payment.id,
        paymentUrl: payment.yookassaUrl,
        amount: payment.amount,
        amountUsd: payment.amount * 0.01, // Упрощенная конвертация
        status: payment.status,
      };
    } catch (error) {
      throw error;
    }
  }

  async getPayment(paymentId: string) {
    try {
      const payment = await this.prisma.payment.findUnique({
        where: { id: paymentId },
      });

      return payment;
    } catch (error) {
      throw error;
    }
  }

  async getCompanyPayments(companyId: string, page = 1, limit = 10) {
    try {
      const skip = (page - 1) * limit;

      const [payments, total] = await Promise.all([
        this.prisma.payment.findMany({
          where: { companyId },
          orderBy: { createdAt: 'desc' },
          take: limit,
          skip,
        }),
        this.prisma.payment.count({
          where: { companyId },
        }),
      ]);

      return {
        payments,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      throw error;
    }
  }

  async updatePaymentStatus(paymentId: string, status: string, yooKassaId?: string) {
    try {
      const updateData: any = { status };
      
      if (status === 'SUCCEEDED') {
        updateData.paidAt = new Date();
      }
      
      if (yooKassaId) {
        updateData.yookassaId = yooKassaId;
      }

      const payment = await this.prisma.payment.update({
        where: { id: paymentId },
        data: updateData,
      });

      return payment;
    } catch (error) {
      throw error;
    }
  }
}

describe('Simple PaymentService', () => {
  let service: SimplePaymentService;
  let prismaMock: PrismaMock;

  beforeEach(() => {
    prismaMock = new PrismaMock();
    service = new SimplePaymentService(prismaMock);
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const paymentData = {
        companyId: 'test-company-id',
        amount: 1000,
        currency: 'RUB',
        returnUrl: 'https://example.com/return',
      };

      prismaMock.payment.create.mockResolvedValue(TestData.validPayment);

      const result = await service.createPayment(paymentData);

      expect(result).toBeDefined();
      expect(result.paymentId).toBeDefined();
      expect(result.status).toBe('PENDING');
      expect(prismaMock.payment.create).toHaveBeenCalledWith({
        data: {
          companyId: paymentData.companyId,
          amount: paymentData.amount,
          currency: paymentData.currency,
          status: 'PENDING',
          yookassaId: null,
          yookassaUrl: expect.stringMatching(/https:\/\/yookassa\.ru\/payment\/\d+/),
        },
      });
    });

    it('should handle minimum amount validation', async () => {
      const paymentData = {
        companyId: 'test-company-id',
        amount: 50, // Less than minimum 100 RUB
        currency: 'RUB',
        returnUrl: 'https://example.com/return',
      };

      await expect(service.createPayment(paymentData)).rejects.toThrow('Minimum payment amount is 100 RUB');
    });

    it('should handle database errors', async () => {
      const paymentData = {
        companyId: 'test-company-id',
        amount: 1000,
        currency: 'RUB',
        returnUrl: 'https://example.com/return',
      };

      const error = new Error('Database error');
      prismaMock.payment.create.mockRejectedValue(error);

      await expect(service.createPayment(paymentData)).rejects.toThrow('Database error');
    });
  });

  describe('getPayment', () => {
    it('should return payment when found', async () => {
      const paymentId = 'test-payment-id';
      prismaMock.payment.findUnique.mockResolvedValue(TestData.validPayment);

      const result = await service.getPayment(paymentId);

      expect(result).toEqual(TestData.validPayment);
      expect(prismaMock.payment.findUnique).toHaveBeenCalledWith({
        where: { id: paymentId },
      });
    });

    it('should return null when payment not found', async () => {
      const paymentId = 'non-existent-id';
      prismaMock.payment.findUnique.mockResolvedValue(null);

      const result = await service.getPayment(paymentId);

      expect(result).toBeNull();
    });
  });

  describe('getCompanyPayments', () => {
    it('should return company payments', async () => {
      const companyId = 'test-company-id';
      const page = 1;
      const limit = 10;

      prismaMock.payment.findMany.mockResolvedValue([TestData.validPayment]);
      prismaMock.payment.count.mockResolvedValue(1);

      const result = await service.getCompanyPayments(companyId, page, limit);

      expect(result).toBeDefined();
      expect(result.payments).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(prismaMock.payment.findMany).toHaveBeenCalledWith({
        where: { companyId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: (page - 1) * limit,
      });
    });

    it('should handle empty payment list', async () => {
      const companyId = 'test-company-id';
      const page = 1;
      const limit = 10;

      prismaMock.payment.findMany.mockResolvedValue([]);
      prismaMock.payment.count.mockResolvedValue(0);

      const result = await service.getCompanyPayments(companyId, page, limit);

      expect(result.payments).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
    });
  });

  describe('updatePaymentStatus', () => {
    it('should update payment status successfully', async () => {
      const paymentId = 'test-payment-id';
      const status = 'SUCCEEDED';
      const yooKassaId = 'yookassa-123';

      prismaMock.payment.update.mockResolvedValue({
        ...TestData.validPayment,
        status: 'SUCCEEDED',
        paidAt: new Date(),
      });

      const result = await service.updatePaymentStatus(paymentId, status, yooKassaId);

      expect(result).toBeDefined();
      expect(prismaMock.payment.update).toHaveBeenCalledWith({
        where: { id: paymentId },
        data: {
          status,
          paidAt: expect.any(Date),
          yookassaId: yooKassaId,
        },
      });
    });

    it('should handle payment not found', async () => {
      const paymentId = 'non-existent-id';
      const status = 'SUCCEEDED';
      const yooKassaId = 'yookassa-123';

      prismaMock.payment.update.mockRejectedValue(new Error('Record not found'));

      await expect(service.updatePaymentStatus(paymentId, status, yooKassaId)).rejects.toThrow('Record not found');
    });
  });
});
