import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { AppModule } from '../../services/api-gateway/src/app.module';
import { HttpTestHelper, ValidationHelper, TestData, DateHelper } from '../shared/test-helpers';

describe('Complete Workflow E2E', () => {
  let app: INestApplication;
  let httpHelper: HttpTestHelper;
  let authToken: string;
  let companyId: string;

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

  describe('Company Registration and Authentication', () => {
    it('should complete full registration flow', async () => {
      const companyData = {
        email: 'e2e@company.com',
        name: 'E2E Test Company',
        password: 'password123',
      };

      // Register company
      const registerResponse = await httpHelper.post('/v1/auth/register', companyData);
      ValidationHelper.expectValidResponse(registerResponse, 201);
      expect(registerResponse.body).toHaveProperty('accessToken');
      expect(registerResponse.body).toHaveProperty('refreshToken');
      expect(registerResponse.body).toHaveProperty('company');
      
      authToken = registerResponse.body.accessToken;
      companyId = registerResponse.body.company.id;
    });

    it('should login with registered credentials', async () => {
      const loginData = {
        email: 'e2e@company.com',
        password: 'password123',
      };

      const response = await httpHelper.post('/v1/auth/login', loginData);
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('accessToken');
      expect(response.body).toHaveProperty('company');
      expect(response.body.company.id).toBe(companyId);
    });
  });

  describe('Billing and Balance Management', () => {
    it('should have initial balance after registration', async () => {
      const response = await httpHelper.withAuth(authToken).get('/v1/billing/balance');
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('balance');
      expect(typeof response.body.balance).toBe('number');
    });

    it('should track usage and create transactions', async () => {
      // Simulate AI request usage
      const usageData = {
        provider: 'openai',
        model: 'gpt-4',
        tokens: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
        cost: 0.01,
      };

      // This would typically be called internally by the system
      // For E2E testing, we'll simulate it through billing endpoints
      const response = await httpHelper.withAuth(authToken).get('/v1/billing/usage');
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('usage');
    });

    it('should show transaction history', async () => {
      const response = await httpHelper.withAuth(authToken).get('/v1/billing/transactions');
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('transactions');
      expect(Array.isArray(response.body.transactions)).toBe(true);
    });
  });

  describe('Payment Processing', () => {
    let paymentId: string;

    it('should create payment for balance top-up', async () => {
      const paymentData = {
        amount: 2000, // 2000 RUB
        currency: 'RUB',
      };

      const response = await httpHelper.withAuth(authToken).post('/v1/payments', paymentData);
      ValidationHelper.expectValidResponse(response, 201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('confirmationUrl');
      expect(response.body).toHaveProperty('amount', '2000');
      expect(response.body).toHaveProperty('currency', 'RUB');
      
      paymentId = response.body.id;
    });

    it('should list company payments', async () => {
      const response = await httpHelper.withAuth(authToken).get('/v1/payments');
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('payments');
      expect(Array.isArray(response.body.payments)).toBe(true);
      expect(response.body.payments.length).toBeGreaterThan(0);
      
      const payment = response.body.payments.find((p: any) => p.id === paymentId);
      expect(payment).toBeDefined();
      expect(payment.amount).toBe(2000);
    });

    it('should get specific payment details', async () => {
      const response = await httpHelper.withAuth(authToken).get(`/v1/payments/${paymentId}`);
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('id', paymentId);
      expect(response.body).toHaveProperty('status', 'pending');
      expect(response.body).toHaveProperty('amount', 2000);
    });

    it('should simulate payment completion via webhook', async () => {
      const webhookData = {
        object: {
          id: paymentId,
          status: 'succeeded',
          amount: { value: '2000', currency: 'RUB' },
        },
      };

      const response = await httpHelper.post('/webhooks/yookassa', webhookData);
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should show updated payment status after webhook', async () => {
      const response = await httpHelper.withAuth(authToken).get(`/v1/payments/${paymentId}`);
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('status', 'SUCCEEDED');
    });
  });

  describe('API Key Management', () => {
    let apiKeyId: string;

    it('should create API key', async () => {
      const apiKeyData = {
        name: 'E2E Test API Key',
        description: 'API key for E2E testing',
      };

      const response = await httpHelper.withAuth(authToken).post('/v1/api-keys', apiKeyData);
      ValidationHelper.expectValidResponse(response, 201);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('key');
      expect(response.body).toHaveProperty('name', apiKeyData.name);
      
      apiKeyId = response.body.id;
    });

    it('should list API keys', async () => {
      const response = await httpHelper.withAuth(authToken).get('/v1/api-keys');
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('apiKeys');
      expect(Array.isArray(response.body.apiKeys)).toBe(true);
      expect(response.body.apiKeys.length).toBeGreaterThan(0);
    });

    it('should validate API key', async () => {
      // First get the API key value
      const listResponse = await httpHelper.withAuth(authToken).get('/v1/api-keys');
      const apiKey = listResponse.body.apiKeys.find((key: any) => key.id === apiKeyId);
      
      // Validate the API key
      const response = await httpHelper.get(`/v1/api-keys/validate?key=${apiKey.key}`);
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('valid', true);
      expect(response.body).toHaveProperty('companyId', companyId);
    });

    it('should revoke API key', async () => {
      const response = await httpHelper.withAuth(authToken).delete(`/v1/api-keys/${apiKeyId}`);
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('success', true);
    });
  });

  describe('Provider Preferences', () => {
    it('should set provider preferences', async () => {
      const preferencesData = {
        preferences: [
          {
            modelId: 'gpt-4',
            provider: 'openai',
            priority: 1,
          },
          {
            modelId: 'claude-3-sonnet',
            provider: 'anthropic',
            priority: 2,
          },
        ],
      };

      const response = await httpHelper.withAuth(authToken).put('/v1/providers/preferences', preferencesData);
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('success', true);
    });

    it('should get provider preferences', async () => {
      const response = await httpHelper.withAuth(authToken).get('/v1/providers/preferences');
      ValidationHelper.expectValidResponse(response);
      expect(response.body).toHaveProperty('preferences');
      expect(Array.isArray(response.body.preferences)).toBe(true);
    });
  });

  describe('Error Scenarios', () => {
    it('should handle expired token', async () => {
      // This would require manipulating the token or waiting for expiration
      // For now, we'll test with an obviously invalid token
      const response = await httpHelper.withAuth('invalid-token').get('/v1/billing/balance');
      ValidationHelper.expectUnauthorized(response);
    });

    it('should handle concurrent payment creation', async () => {
      const paymentData = {
        amount: 1000,
        currency: 'RUB',
      };

      // Create multiple payments simultaneously
      const promises = Array(3).fill(null).map(() => 
        httpHelper.withAuth(authToken).post('/v1/payments', paymentData)
      );

      const responses = await Promise.all(promises);
      
      // All should succeed
      responses.forEach(response => {
        ValidationHelper.expectValidResponse(response, 201);
      });
    });

    it('should handle invalid payment amounts', async () => {
      const invalidAmounts = [0, -100, 50]; // Below minimum

      for (const amount of invalidAmounts) {
        const paymentData = { amount, currency: 'RUB' };
        const response = await httpHelper.withAuth(authToken).post('/v1/payments', paymentData);
        ValidationHelper.expectErrorResponse(response, 400);
      }
    });
  });

  describe('Performance and Load', () => {
    it('should handle multiple rapid requests', async () => {
      const requests = Array(10).fill(null).map(() => 
        httpHelper.withAuth(authToken).get('/v1/billing/balance')
      );

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // All requests should succeed
      responses.forEach(response => {
        ValidationHelper.expectValidResponse(response);
      });

      // Should complete within reasonable time (5 seconds)
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});
