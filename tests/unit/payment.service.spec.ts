import { Test, TestingModule } from '@nestjs/testing';
import { PaymentService } from '../../services/payment-service/src/modules/payment/payment.service';
import { PrismaService } from '../../services/payment-service/src/common/prisma/prisma.service';
import { YooKassaService } from '../../services/payment-service/src/modules/yookassa/yookassa.service';
import { CurrencyService } from '../../services/payment-service/src/modules/currency/currency.service';
import { TestModuleBuilder, PrismaMock, TestData, MockHelper } from '../shared/test-helpers';
import { Decimal } from '@prisma/client/runtime/library';

describe('PaymentService', () => {
  let service: PaymentService;
  let prismaMock: PrismaMock;
  let yooKassaService: jest.Mocked<YooKassaService>;
  let currencyService: jest.Mocked<CurrencyService>;

  beforeEach(async () => {
    prismaMock = new PrismaMock();
    MockHelper.setupPrismaMock(prismaMock);

    yooKassaService = {
      createPayment: jest.fn(),
      processWebhook: jest.fn(),
    } as any;

    currencyService = {
      getUsdToRubRate: jest.fn(),
    } as any;

    const module: TestingModule = await new TestModuleBuilder()
      .addProvider(PaymentService)
      .addProvider({
        provide: PrismaService,
        useValue: prismaMock,
      })
      .addProvider({
        provide: YooKassaService,
        useValue: yooKassaService,
      })
      .addProvider({
        provide: CurrencyService,
        useValue: currencyService,
      })
      .build();

    service = module.get<PaymentService>(PaymentService);
  });

  afterEach(() => {
    MockHelper.resetAllMocks(prismaMock);
    jest.clearAllMocks();
  });

  describe('createPayment', () => {
    it('should create payment successfully', async () => {
      const paymentData = {
        companyId: 'test-company-id',
        amount: 1000,
        currency: 'RUB',
        returnUrl: 'https://example.com/return',
      };

      const yooKassaResponse = {
        id: 'yookassa-payment-id',
        status: 'pending',
        confirmationUrl: 'https://yookassa.ru/payment/123',
        amount: '1000',
        currency: 'RUB',
      };

      yooKassaService.createPayment.mockResolvedValue(yooKassaResponse);
      prismaMock.payment.create.mockResolvedValue(TestData.validPayment);

      const result = await service.createPayment(paymentData);

      expect(result).toBeDefined();
      expect(result.paymentId).toBeDefined();
      expect(result.status).toBe('pending');
      expect(yooKassaService.createPayment).toHaveBeenCalledWith({
        amount: paymentData.amount,
        returnUrl: paymentData.returnUrl,
        companyId: paymentData.companyId,
      });
    });

    it('should handle minimum amount validation', async () => {
      const paymentData = {
        companyId: 'test-company-id',
        amount: 50, // Less than minimum 100 RUB
        currency: 'RUB',
        returnUrl: 'https://example.com/return',
      };

      await expect(service.createPayment(paymentData)).rejects.toThrow();
    });

    it('should handle YooKassa service errors', async () => {
      const paymentData = {
        companyId: 'test-company-id',
        amount: 1000,
        currency: 'RUB',
        returnUrl: 'https://example.com/return',
      };

      yooKassaService.createPayment.mockRejectedValue(new Error('YooKassa service unavailable'));

      await expect(service.createPayment(paymentData)).rejects.toThrow('YooKassa service unavailable');
    });

    it('should handle database errors', async () => {
      const paymentData = {
        companyId: 'test-company-id',
        amount: 1000,
        currency: 'RUB',
        returnUrl: 'https://example.com/return',
      };

      const yooKassaResponse = {
        id: 'yookassa-payment-id',
        status: 'pending',
        confirmationUrl: 'https://yookassa.ru/payment/123',
        amount: '1000',
        currency: 'RUB',
      };

      yooKassaService.createPayment.mockResolvedValue(yooKassaResponse);
      prismaMock.payment.create.mockRejectedValue(new Error('Database error'));

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
