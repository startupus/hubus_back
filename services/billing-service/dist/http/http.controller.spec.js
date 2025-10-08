"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const config_1 = require("@nestjs/config");
const http_controller_1 = require("./http.controller");
const billing_service_1 = require("../billing/billing.service");
const pricing_service_1 = require("../billing/pricing.service");
const payment_gateway_service_1 = require("../billing/payment-gateway.service");
const validation_service_1 = require("../common/validation/validation.service");
const supertest_1 = __importDefault(require("supertest"));
describe('HttpController', () => {
    let app;
    let controller;
    let billingService;
    let validationService;
    const mockUserBalance = {
        id: 'test-balance-id',
        userId: 'test-user-id',
        companyId: 'test-company-id',
        balance: 100.00,
        currency: 'USD',
        creditLimit: 1000.00,
        lastUpdated: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    };
    const mockTransaction = {
        id: 'test-transaction-id',
        userId: 'test-user-id',
        companyId: 'test-company-id',
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
        type: 'DEBIT',
        amount: 10.50,
        description: 'Test transaction',
        status: 'COMPLETED',
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
        const module = await testing_1.Test.createTestingModule({
            imports: [
                config_1.ConfigModule.forRoot({
                    isGlobal: true,
                    envFilePath: '.env.test',
                }),
            ],
            controllers: [http_controller_1.HttpController],
            providers: [
                {
                    provide: billing_service_1.BillingService,
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
                    provide: pricing_service_1.PricingService,
                    useValue: {
                        calculateCost: jest.fn(),
                        calculateUsageCost: jest.fn(),
                    },
                },
                {
                    provide: payment_gateway_service_1.PaymentGatewayService,
                    useValue: {
                        processPayment: jest.fn(),
                        refundPayment: jest.fn(),
                        validatePaymentMethod: jest.fn(),
                    },
                },
                {
                    provide: validation_service_1.ValidationService,
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
        controller = module.get(http_controller_1.HttpController);
        billingService = module.get(billing_service_1.BillingService);
        validationService = module.get(validation_service_1.ValidationService);
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
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            await (0, supertest_1.default)(app.getHttpServer())
                .get('/billing/balance/non-existent-user')
                .expect(404);
        });
        it('should handle service errors', async () => {
            jest.spyOn(billingService, 'getBalance').mockRejectedValue(new Error('Database error'));
            await (0, supertest_1.default)(app.getHttpServer())
                .get('/billing/balance/test-user-id')
                .expect(500);
        });
    });
    describe('POST /billing/balance/:userId', () => {
        it('should update user balance', async () => {
            const updateData = { amount: 50.00 };
            const updatedBalance = { ...mockUserBalance, balance: 150.00 };
            jest.spyOn(billingService, 'updateBalance').mockResolvedValue({
                success: true,
                balance: updatedBalance
            });
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/billing/balance/test-user-id')
                .send(invalidData)
                .expect(400);
        });
        it('should handle service errors', async () => {
            const updateData = { amount: 50.00 };
            jest.spyOn(billingService, 'updateBalance').mockRejectedValue(new Error('Database error'));
            await (0, supertest_1.default)(app.getHttpServer())
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
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            await (0, supertest_1.default)(app.getHttpServer())
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
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/billing/transaction')
                .send(transactionData)
                .expect(500);
        });
    });
    describe('GET /billing/transactions/:userId', () => {
        it('should return user transactions', async () => {
            const transactions = [mockTransaction];
            jest.spyOn(billingService, 'getTransactions').mockResolvedValue(transactions);
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get('/billing/transactions/test-user-id?page=1&limit=10')
                .expect(200);
            expect(response.body).toHaveLength(1);
        });
        it('should support date filtering', async () => {
            const transactions = [mockTransaction];
            jest.spyOn(billingService, 'getTransactions').mockResolvedValue(transactions);
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get('/billing/transactions/test-user-id?startDate=2023-01-01&endDate=2023-12-31')
                .expect(200);
            expect(response.body).toHaveLength(1);
        });
    });
    describe('GET /billing/report/:userId', () => {
        it('should return billing report', async () => {
            jest.spyOn(billingService, 'getBillingReport').mockResolvedValue(mockBillingReport);
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            const response = await (0, supertest_1.default)(app.getHttpServer())
                .get('/billing/report/test-user-id?startDate=2023-01-01&endDate=2023-12-31')
                .expect(200);
            expect(response.body).toBeDefined();
        });
        it('should handle service errors', async () => {
            jest.spyOn(billingService, 'getBillingReport').mockRejectedValue(new Error('Database error'));
            await (0, supertest_1.default)(app.getHttpServer())
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
                    companyId: 'test-company-id',
                    service: 'openai',
                    resource: 'gpt-3.5-turbo',
                    quantity: 1000,
                    cost: 10.50,
                    timestamp: new Date(),
                    unit: 'tokens',
                    currency: 'USD'
                },
                cost: 10.50
            });
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
                tokens: -1000,
                model: 'gpt-3.5-turbo',
            };
            await (0, supertest_1.default)(app.getHttpServer())
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
            await (0, supertest_1.default)(app.getHttpServer())
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
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
                amount: -50.00,
                paymentMethod: 'stripe',
                paymentToken: 'test-token',
            };
            await (0, supertest_1.default)(app.getHttpServer())
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
            await (0, supertest_1.default)(app.getHttpServer())
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
                status: 'completed'
            });
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
                amount: -25.00,
            };
            await (0, supertest_1.default)(app.getHttpServer())
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
            await (0, supertest_1.default)(app.getHttpServer())
                .post('/billing/payment/refund')
                .send(refundData)
                .expect(500);
        });
    });
    describe('GET /billing/transaction/:id', () => {
        it('should return transaction by id', async () => {
            const transactionId = 'test-transaction-id';
            jest.spyOn(billingService, 'getTransactionById').mockResolvedValue(mockTransaction);
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            await (0, supertest_1.default)(app.getHttpServer())
                .get(`/billing/transaction/${transactionId}`)
                .expect(404);
        });
    });
    describe('PUT /billing/transaction/:id', () => {
        it('should update transaction', async () => {
            const transactionId = 'test-transaction-id';
            const updateData = {
                description: 'Updated transaction',
                status: 'completed',
            };
            const updatedTransaction = { ...mockTransaction, ...updateData };
            jest.spyOn(billingService, 'updateTransaction').mockResolvedValue(updatedTransaction);
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            await (0, supertest_1.default)(app.getHttpServer())
                .put(`/billing/transaction/${transactionId}`)
                .send(updateData)
                .expect(500);
        });
    });
    describe('DELETE /billing/transaction/:id', () => {
        it('should delete transaction', async () => {
            const transactionId = 'test-transaction-id';
            jest.spyOn(billingService, 'deleteTransaction').mockResolvedValue(mockTransaction);
            const response = await (0, supertest_1.default)(app.getHttpServer())
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
            await (0, supertest_1.default)(app.getHttpServer())
                .delete(`/billing/transaction/${transactionId}`)
                .expect(500);
        });
    });
});
//# sourceMappingURL=http.controller.spec.js.map