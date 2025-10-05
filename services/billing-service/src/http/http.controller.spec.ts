import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { HttpController } from './http.controller';
import { BillingService } from '../billing/billing.service';
import { PricingService } from '../billing/pricing.service';
import { PaymentGatewayService } from '../billing/payment-gateway.service';
import { ValidationService } from '../common/validation/validation.service';
import { Decimal } from 'decimal.js';
import request from 'supertest';

describe('HttpController', () => {
  let app: INestApplication;
  let controller: HttpController;
  let billingService: BillingService;
  let validationService: ValidationService;

  const mockUserBalance = {
    id: 'test-balance-id',
    userId: 'test-user-id',
    balance: new Decimal(100.00),
    currency: 'USD',
    creditLimit: new Decimal(1000.00),
    lastUpdated: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTransaction = {
    id: 'test-transaction-id',
    userId: 'test-user-id',
    currency: 'USD',
    createdAt: new Date(),
    updatedAt: new Date(),
    type: 'DEBIT' as any,
    amount: new Decimal(10.50),
    description: 'Test transaction',
    status: 'COMPLETED' as any,
    reference: 'ref_123',
    metadata: {},
    paymentMethodId: 'pm_123'
  };

  const mockBillingReport = {
    userId: 'test-user-id',
    period: {
      start: new Date('2023-01-01'),
      end: new Date('2023-12-31')
    },
    totalTransactions: 1,
    totalUsage: 100,
    totalCost: 10.50,
    totalAmount: new Decimal(10.50),
    currentBalance: new Decimal(100.00),
    currency: 'USD',
    breakdown: {
      byService: { 'test-service': 10.50 },
      byResource: { 'gpt-3.5-turbo': 10.50 },
      byDay: { '2023-01-15': 10.50 }
    },
    transactions: [mockTransaction],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
      ],
      controllers: [HttpController],
      providers: [
        {
          provide: BillingService,
          useValue: {
            getBalance: jest.fn(),
            updateBalance: jest.fn(),
            createTransaction: jest.fn(),
            getTransactions: jest.fn(),
            getBillingReport: jest.fn(),
            trackUsage: jest.fn(),
            processPayment: jest.fn(),
            refundPayment: jest.fn(),
            getTransactionById: jest.fn(),
            updateTransaction: jest.fn(),
            deleteTransaction: jest.fn(),
          },
        },
        {
          provide: PricingService,
          useValue: {
            calculateCost: jest.fn(),
            calculateUsageCost: jest.fn(),
          },
        },
        {
          provide: PaymentGatewayService,
          useValue: {
            processPayment: jest.fn(),
            refundPayment: jest.fn(),
            validatePaymentMethod: jest.fn(),
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
      ],
    }).compile();

    app = module.createNestApplication();
    await app.init();

    controller = module.get<HttpController>(HttpController);
    billingService = module.get<BillingService>(BillingService);
    validationService = module.get<ValidationService>(ValidationService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('GET /billing/balance/:userId', () => {
    it('should return user balance', async () => {
      jest.spyOn(billingService, 'getBalance').mockResolvedValue({
        success: true,
        balance: mockUserBalance
      });

      const response = await request(app.getHttpServer())
        .get('/billing/balance/test-user-id')
        .expect(200);

      expect(response.body).toEqual({
        id: 'test-balance-id',
        userId: 'test-user-id',
        balance: '100.00',
        currency: 'USD',
        createdAt: mockUserBalance.createdAt.toISOString(),
        updatedAt: mockUserBalance.updatedAt.toISOString(),
      });
    });

    it('should return 404 when user balance not found', async () => {
      jest.spyOn(billingService, 'getBalance').mockResolvedValue({
        success: false,
        balance: null
      });

      await request(app.getHttpServer())
        .get('/billing/balance/non-existent-user')
        .expect(404);
    });

    it('should handle service errors', async () => {
      jest.spyOn(billingService, 'getBalance').mockRejectedValue(new Error('Database error'));

      await request(app.getHttpServer())
        .get('/billing/balance/test-user-id')
        .expect(500);
    });
  });

  describe('POST /billing/balance/:userId', () => {
    it('should update user balance', async () => {
      const updateData = { amount: 50.00 };
      const updatedBalance = { ...mockUserBalance, balance: new Decimal(150.00) };

      jest.spyOn(billingService, 'updateBalance').mockResolvedValue({
        success: true,
        balance: updatedBalance
      });

      const response = await request(app.getHttpServer())
        .post('/billing/balance/test-user-id')
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        id: 'test-balance-id',
        userId: 'test-user-id',
        balance: '150.00',
        currency: 'USD',
        createdAt: mockUserBalance.createdAt.toISOString(),
        updatedAt: mockUserBalance.updatedAt.toISOString(),
      });
    });

    it('should validate request body', async () => {
      const invalidData = { amount: 'invalid' };

      await request(app.getHttpServer())
        .post('/billing/balance/test-user-id')
        .send(invalidData)
        .expect(400);
    });

    it('should handle service errors', async () => {
      const updateData = { amount: 50.00 };
      jest.spyOn(billingService, 'updateBalance').mockRejectedValue(new Error('Database error'));

      await request(app.getHttpServer())
        .post('/billing/balance/test-user-id')
        .send(updateData)
        .expect(500);
    });
  });

  describe('POST /billing/transaction', () => {
    it('should create transaction', async () => {
      const transactionData = {
        userId: 'test-user-id',
        type: 'DEBIT',
        amount: 10.50,
        description: 'Test transaction',
      };

      jest.spyOn(billingService, 'createTransaction').mockResolvedValue({
        success: true,
        transaction: mockTransaction
      });

      const response = await request(app.getHttpServer())
        .post('/billing/transaction')
        .send(transactionData)
        .expect(201);

      expect(response.body).toEqual({
        id: 'test-transaction-id',
        userId: 'test-user-id',
        type: 'DEBIT',
        amount: '10.50',
        description: 'Test transaction',
        createdAt: mockTransaction.createdAt.toISOString(),
      });
    });

    it('should validate transaction data', async () => {
      const invalidData = {
        userId: 'test-user-id',
        type: 'INVALID_TYPE',
        amount: -10.50,
        description: 'Test transaction',
      };

      await request(app.getHttpServer())
        .post('/billing/transaction')
        .send(invalidData)
        .expect(400);
    });

    it('should handle service errors', async () => {
      const transactionData = {
        userId: 'test-user-id',
        type: 'DEBIT',
        amount: 10.50,
        description: 'Test transaction',
      };

      jest.spyOn(billingService, 'createTransaction').mockRejectedValue(new Error('Database error'));

      await request(app.getHttpServer())
        .post('/billing/transaction')
        .send(transactionData)
        .expect(500);
    });
  });

  describe('GET /billing/transactions/:userId', () => {
    it('should return user transactions', async () => {
      const transactions = [mockTransaction];
      jest.spyOn(billingService, 'getTransactions').mockResolvedValue(transactions);

      const response = await request(app.getHttpServer())
        .get('/billing/transactions/test-user-id')
        .expect(200);

      expect(response.body).toEqual([
        {
          id: 'test-transaction-id',
          userId: 'test-user-id',
          type: 'DEBIT',
          amount: '10.50',
          description: 'Test transaction',
          createdAt: mockTransaction.createdAt.toISOString(),
        },
      ]);
    });

    it('should support pagination', async () => {
      const transactions = [mockTransaction];
      jest.spyOn(billingService, 'getTransactions').mockResolvedValue(transactions);

      const response = await request(app.getHttpServer())
        .get('/billing/transactions/test-user-id?page=1&limit=10')
        .expect(200);

      expect(response.body).toHaveLength(1);
    });

    it('should support date filtering', async () => {
      const transactions = [mockTransaction];
      jest.spyOn(billingService, 'getTransactions').mockResolvedValue(transactions);

      const response = await request(app.getHttpServer())
        .get('/billing/transactions/test-user-id?startDate=2023-01-01&endDate=2023-12-31')
        .expect(200);

      expect(response.body).toHaveLength(1);
    });
  });

  describe('GET /billing/report/:userId', () => {
    it('should return billing report', async () => {
      jest.spyOn(billingService, 'getBillingReport').mockResolvedValue(mockBillingReport);

      const response = await request(app.getHttpServer())
        .get('/billing/report/test-user-id')
        .expect(200);

      expect(response.body).toEqual({
        userId: 'test-user-id',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-12-31T00:00:00.000Z',
        totalTransactions: 1,
        totalAmount: '10.50',
        currentBalance: '100.00',
        transactions: [
          {
            id: 'test-transaction-id',
            userId: 'test-user-id',
            type: 'DEBIT',
            amount: '10.50',
            description: 'Test transaction',
            createdAt: mockTransaction.createdAt.toISOString(),
          },
        ],
      });
    });

    it('should support date filtering', async () => {
      jest.spyOn(billingService, 'getBillingReport').mockResolvedValue(mockBillingReport);

      const response = await request(app.getHttpServer())
        .get('/billing/report/test-user-id?startDate=2023-01-01&endDate=2023-12-31')
        .expect(200);

      expect(response.body).toBeDefined();
    });

    it('should handle service errors', async () => {
      jest.spyOn(billingService, 'getBillingReport').mockRejectedValue(new Error('Database error'));

      await request(app.getHttpServer())
        .get('/billing/report/test-user-id')
        .expect(500);
    });
  });

  describe('POST /billing/usage/track', () => {
    it('should track usage', async () => {
      const usageData = {
        userId: 'test-user-id',
        service: 'openai',
        tokens: 1000,
        model: 'gpt-3.5-turbo',
      };

      jest.spyOn(billingService, 'trackUsage').mockResolvedValue({
        success: true,
        usageEvent: {
          id: 'test-usage-id',
          userId: 'test-user-id',
          service: 'openai',
          resource: 'gpt-3.5-turbo',
          quantity: 1000,
          cost: new Decimal(10.50),
          timestamp: new Date(),
          unit: 'tokens',
          currency: 'USD'
        },
        cost: 10.50
      });

      const response = await request(app.getHttpServer())
        .post('/billing/usage/track')
        .send(usageData)
        .expect(201);

      expect(response.body).toEqual({
        id: 'test-transaction-id',
        userId: 'test-user-id',
        type: 'DEBIT',
        amount: '10.50',
        description: 'Test transaction',
        createdAt: mockTransaction.createdAt.toISOString(),
      });
    });

    it('should validate usage data', async () => {
      const invalidData = {
        userId: 'test-user-id',
        service: 'openai',
        tokens: -1000, // Invalid negative tokens
        model: 'gpt-3.5-turbo',
      };

      await request(app.getHttpServer())
        .post('/billing/usage/track')
        .send(invalidData)
        .expect(400);
    });

    it('should handle service errors', async () => {
      const usageData = {
        userId: 'test-user-id',
        service: 'openai',
        tokens: 1000,
        model: 'gpt-3.5-turbo',
      };

      jest.spyOn(billingService, 'trackUsage').mockRejectedValue(new Error('Database error'));

      await request(app.getHttpServer())
        .post('/billing/usage/track')
        .send(usageData)
        .expect(500);
    });
  });

  describe('POST /billing/payment/process', () => {
    it('should process payment', async () => {
      const paymentData = {
        userId: 'test-user-id',
        amount: 50.00,
        paymentMethod: 'stripe',
        paymentToken: 'test-token',
      };

      jest.spyOn(billingService, 'processPayment').mockResolvedValue({
        success: true,
        transaction: mockTransaction,
        paymentUrl: 'https://stripe.com/pay/test-token'
      });

      const response = await request(app.getHttpServer())
        .post('/billing/payment/process')
        .send(paymentData)
        .expect(201);

      expect(response.body).toEqual({
        id: 'test-transaction-id',
        userId: 'test-user-id',
        type: 'DEBIT',
        amount: '10.50',
        description: 'Test transaction',
        createdAt: mockTransaction.createdAt.toISOString(),
      });
    });

    it('should validate payment data', async () => {
      const invalidData = {
        userId: 'test-user-id',
        amount: -50.00, // Invalid negative amount
        paymentMethod: 'stripe',
        paymentToken: 'test-token',
      };

      await request(app.getHttpServer())
        .post('/billing/payment/process')
        .send(invalidData)
        .expect(400);
    });

    it('should handle service errors', async () => {
      const paymentData = {
        userId: 'test-user-id',
        amount: 50.00,
        paymentMethod: 'stripe',
        paymentToken: 'test-token',
      };

      jest.spyOn(billingService, 'processPayment').mockRejectedValue(new Error('Payment failed'));

      await request(app.getHttpServer())
        .post('/billing/payment/process')
        .send(paymentData)
        .expect(500);
    });
  });

  describe('POST /billing/payment/refund', () => {
    it('should refund payment', async () => {
      const refundData = {
        userId: 'test-user-id',
        transactionId: 'test-transaction-id',
        amount: 25.00,
      };

      jest.spyOn(billingService, 'refundPayment').mockResolvedValue({
        success: true,
        refundId: 'test-refund-id',
        status: 'completed' as any
      });

      const response = await request(app.getHttpServer())
        .post('/billing/payment/refund')
        .send(refundData)
        .expect(201);

      expect(response.body).toEqual({
        id: 'test-transaction-id',
        userId: 'test-user-id',
        type: 'DEBIT',
        amount: '10.50',
        description: 'Test transaction',
        createdAt: mockTransaction.createdAt.toISOString(),
      });
    });

    it('should validate refund data', async () => {
      const invalidData = {
        userId: 'test-user-id',
        transactionId: 'test-transaction-id',
        amount: -25.00, // Invalid negative amount
      };

      await request(app.getHttpServer())
        .post('/billing/payment/refund')
        .send(invalidData)
        .expect(400);
    });

    it('should handle service errors', async () => {
      const refundData = {
        userId: 'test-user-id',
        transactionId: 'test-transaction-id',
        amount: 25.00,
      };

      jest.spyOn(billingService, 'refundPayment').mockRejectedValue(new Error('Refund failed'));

      await request(app.getHttpServer())
        .post('/billing/payment/refund')
        .send(refundData)
        .expect(500);
    });
  });

  describe('GET /billing/transaction/:id', () => {
    it('should return transaction by id', async () => {
      const transactionId = 'test-transaction-id';
      jest.spyOn(billingService, 'getTransactionById').mockResolvedValue(mockTransaction);

      const response = await request(app.getHttpServer())
        .get(`/billing/transaction/${transactionId}`)
        .expect(200);

      expect(response.body).toEqual({
        id: 'test-transaction-id',
        userId: 'test-user-id',
        type: 'DEBIT',
        amount: '10.50',
        description: 'Test transaction',
        createdAt: mockTransaction.createdAt.toISOString(),
      });
    });

    it('should return 404 when transaction not found', async () => {
      const transactionId = 'non-existent-transaction';
      jest.spyOn(billingService, 'getTransactionById').mockResolvedValue(null);

      await request(app.getHttpServer())
        .get(`/billing/transaction/${transactionId}`)
        .expect(404);
    });
  });

  describe('PUT /billing/transaction/:id', () => {
    it('should update transaction', async () => {
      const transactionId = 'test-transaction-id';
      const updateData = {
        description: 'Updated transaction',
        status: 'completed' as any,
      };

      const updatedTransaction = { ...mockTransaction, ...updateData };
      jest.spyOn(billingService, 'updateTransaction').mockResolvedValue(updatedTransaction);

      const response = await request(app.getHttpServer())
        .put(`/billing/transaction/${transactionId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toEqual({
        id: 'test-transaction-id',
        userId: 'test-user-id',
        type: 'DEBIT',
        amount: '10.50',
        description: 'Updated transaction',
        createdAt: mockTransaction.createdAt.toISOString(),
      });
    });

    it('should handle service errors', async () => {
      const transactionId = 'test-transaction-id';
      const updateData = {
        description: 'Updated transaction',
      };

      jest.spyOn(billingService, 'updateTransaction').mockRejectedValue(new Error('Update failed'));

      await request(app.getHttpServer())
        .put(`/billing/transaction/${transactionId}`)
        .send(updateData)
        .expect(500);
    });
  });

  describe('DELETE /billing/transaction/:id', () => {
    it('should delete transaction', async () => {
      const transactionId = 'test-transaction-id';
      jest.spyOn(billingService, 'deleteTransaction').mockResolvedValue(mockTransaction);

      const response = await request(app.getHttpServer())
        .delete(`/billing/transaction/${transactionId}`)
        .expect(200);

      expect(response.body).toEqual({
        id: 'test-transaction-id',
        userId: 'test-user-id',
        type: 'DEBIT',
        amount: '10.50',
        description: 'Test transaction',
        createdAt: mockTransaction.createdAt.toISOString(),
      });
    });

    it('should handle service errors', async () => {
      const transactionId = 'test-transaction-id';
      jest.spyOn(billingService, 'deleteTransaction').mockRejectedValue(new Error('Delete failed'));

      await request(app.getHttpServer())
        .delete(`/billing/transaction/${transactionId}`)
        .expect(500);
    });
  });
});
