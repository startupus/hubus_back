import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../services/api-gateway/src/app.module';
import { HttpTestHelper, ValidationHelper, TestData } from '../shared/test-helpers';

describe('API Gateway Integration', () => {
  let app: INestApplication;
  let httpHelper: HttpTestHelper;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    httpHelper = new HttpTestHelper(app);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await httpHelper.get('/health');
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('status', 'ok');
    });
  });

  describe('Authentication Endpoints', () => {
    let authToken: string;

    it('should register new company', async () => {
      const companyData = {
        email: 'test@company.com',
        name: 'Test Company',
        password: 'password123',
      };

      const response = await httpHelper.post('/v1/auth/register', companyData);
      ValidationHelper.expectValidResponse(response, 201);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
      
      authToken = response.body.accessToken;
    });

    it('should login existing company', async () => {
      const loginData = {
        email: 'test@company.com',
        password: 'password123',
      };

      const response = await httpHelper.post('/v1/auth/login', loginData);
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('refreshToken');
    });

    it('should reject invalid credentials', async () => {
      const loginData = {
        email: 'test@company.com',
        password: 'wrongpassword',
      };

      const response = await httpHelper.post('/v1/auth/login', loginData);
      ValidationHelper.expectErrorResponse(response, 401);
    });

    it('should get company profile with valid token', async () => {
      const response = await httpHelper.withAuth(authToken).get('/v1/auth/profile');
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('email', 'test@company.com');
    });

    it('should reject invalid token', async () => {
      const response = await httpHelper.withAuth('invalid-token').get('/v1/auth/profile');
      ValidationHelper.expectUnauthorized(response);
    });
  });

  describe('Billing Endpoints', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get token
      const loginData = {
        email: 'test@company.com',
        password: 'password123',
      };
      const response = await httpHelper.post('/v1/auth/login', loginData);
      authToken = response.body.accessToken;
    });

    it('should get company balance', async () => {
      const response = await httpHelper.withAuth(authToken).get('/v1/billing/balance');
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('balance');
    });

    it('should get transaction history', async () => {
      const response = await httpHelper.withAuth(authToken).get('/v1/billing/transactions');
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('transactions');
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });

    it('should get usage statistics', async () => {
      const response = await httpHelper.withAuth(authToken).get('/v1/billing/usage');
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('usage');
    });
  });

  describe('Payment Endpoints', () => {
    let authToken: string;

    beforeAll(async () => {
      // Login to get token
      const loginData = {
        email: 'test@company.com',
        password: 'password123',
      };
      const response = await httpHelper.post('/v1/auth/login', loginData);
      authToken = response.body.accessToken;
    });

    it('should create payment', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'RUB',
      };

      const response = await httpHelper.withAuth(authToken).post('/v1/payments', paymentData);
      ValidationHelper.expectValidResponse(response, 201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('confirmationUrl');
    });

    it('should reject payment below minimum amount', async () => {
      const paymentData = {
        amount: 50, // Below minimum 100 RUB
        currency: 'RUB',
      };

      const response = await httpHelper.withAuth(authToken).post('/v1/payments', paymentData);
      ValidationHelper.expectErrorResponse(response, 400);
    });

    it('should get company payments', async () => {
      const response = await httpHelper.withAuth(authToken).get('/v1/payments');
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('payments');
      expect(Array.isArray(response.body.payments)).toBe(true);
    });

    it('should get payment by ID', async () => {
      // First create a payment
      const paymentData = { amount: 1000, currency: 'RUB' };
      const createResponse = await httpHelper.withAuth(authToken).post('/v1/payments', paymentData);
      const paymentId = createResponse.body.id;

      // Then get it by ID
      const response = await httpHelper.withAuth(authToken).get(`/v1/payments/${paymentId}`);
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('id', paymentId);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 for non-existent endpoints', async () => {
      const response = await httpHelper.get('/v1/non-existent');
      ValidationHelper.expectNotFound(response);
    });

    it('should return 400 for invalid request data', async () => {
      const invalidData = {
        email: 'invalid-email',
        password: '123', // Too short
      };

      const response = await httpHelper.post('/v1/auth/register', invalidData);
      ValidationHelper.expectValidationError(response);
    });

    it('should return 401 for protected endpoints without token', async () => {
      const response = await httpHelper.get('/v1/billing/balance');
      ValidationHelper.expectUnauthorized(response);
    });
  });
});
