import request from 'supertest';

describe('All Endpoints Integration Tests', () => {
  const baseUrl = 'http://localhost:3000';

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(baseUrl)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('service');
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Billing Service - Basic Endpoints', () => {
    it('should get user balance', async () => {
      const response = await request(baseUrl)
        .get('/billing/balance/test-user')
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('currency');
      expect(response.body.userId).toBe('test-user');
    });

    it('should track usage', async () => {
      const usageData = {
        userId: 'test-user',
        service: 'ai',
        resource: 'tokens',
        quantity: 100
      };

      const response = await request(baseUrl)
        .post('/billing/usage/track')
        .send(usageData)
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('usageEvent');
      expect(response.body.success).toBe(true);
    });

    it('should get billing report', async () => {
      const response = await request(baseUrl)
        .get('/billing/report/test-user')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('report');
      expect(response.body.success).toBe(true);
    });
  });

  describe('Billing Service - New Endpoints', () => {
    it('should create transaction', async () => {
      const transactionData = {
        userId: 'test-user',
        amount: 10.50,
        type: 'DEBIT',
        description: 'Test transaction'
      };

      const response = await request(baseUrl)
        .post('/billing/transaction')
        .send(transactionData)
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.success).toBe(true);
    });

    it('should get user transactions', async () => {
      const response = await request(baseUrl)
        .get('/billing/transactions/test-user')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('transactions');
      expect(response.body).toHaveProperty('pagination');
      expect(response.body.success).toBe(true);
    });

    it('should process payment', async () => {
      const paymentData = {
        userId: 'test-user',
        amount: 25.00,
        paymentMethod: 'card'
      };

      const response = await request(baseUrl)
        .post('/billing/payment/process')
        .send(paymentData)
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('transaction');
      expect(response.body.success).toBe(true);
    });

    it('should refund payment', async () => {
      const refundData = {
        transactionId: 'test-tx-123',
        amount: 10.00,
        reason: 'Test refund'
      };

      const response = await request(baseUrl)
        .post('/billing/payment/refund')
        .send(refundData)
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('refund');
      expect(response.body.success).toBe(true);
    });
  });

  describe('Analytics Service', () => {
    it('should get analytics metrics', async () => {
      const response = await request(baseUrl)
        .get('/analytics/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('totalRequests');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalCost');
    });

    it('should get analytics dashboard', async () => {
      const response = await request(baseUrl)
        .get('/analytics/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('dashboard');
      expect(response.body.dashboard).toHaveProperty('totalEvents');
      expect(response.body.dashboard).toHaveProperty('totalUsers');
      expect(response.body.dashboard).toHaveProperty('totalCost');
    });

    it('should track event', async () => {
      const eventData = {
        eventType: 'user_action',
        eventName: 'test_event',
        service: 'test_service',
        userId: 'test-user',
        metadata: { test: 'data' }
      };

      const response = await request(baseUrl)
        .post('/analytics/track-event')
        .send(eventData)
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body.success).toBe(true);
    });
  });

  describe('Auth Service', () => {
    it('should create API key', async () => {
      const apiKeyData = {
        userId: 'test-user',
        name: 'test-key'
      };

      const response = await request(baseUrl)
        .post('/auth/api-keys')
        .send(apiKeyData)
        .expect(201);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('apiKey');
      expect(response.body.success).toBe(true);
    });

    it('should get API keys', async () => {
      const getKeysData = {
        userId: 'test-user'
      };

      const response = await request(baseUrl)
        .get('/auth/api-keys')
        .send(getKeysData)
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('apiKeys');
      expect(response.body.success).toBe(true);
    });

    it('should revoke API key', async () => {
      const response = await request(baseUrl)
        .delete('/auth/api-keys/test-key-id')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('apiKey');
      expect(response.body.success).toBe(true);
    });
  });

  describe('Orchestrator Service', () => {
    it('should get available models', async () => {
      const response = await request(baseUrl)
        .get('/orchestrator/models')
        .expect(200);

      expect(response.body).toHaveProperty('models');
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(response.body.models.length).toBeGreaterThan(0);
    });
  });

  describe('Proxy Service', () => {
    it('should proxy OpenAI chat completions', async () => {
      const chatData = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Hello, world!' }
        ]
      };

      const response = await request(baseUrl)
        .post('/proxy/openai/chat/completions')
        .send(chatData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('object');
      expect(response.body).toHaveProperty('choices');
      expect(response.body).toHaveProperty('usage');
    });

    it('should proxy OpenRouter chat completions', async () => {
      const chatData = {
        model: 'claude-3-sonnet',
        messages: [
          { role: 'user', content: 'Hello, world!' }
        ]
      };

      const response = await request(baseUrl)
        .post('/proxy/openrouter/chat/completions')
        .send(chatData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('object');
      expect(response.body).toHaveProperty('choices');
      expect(response.body).toHaveProperty('usage');
    });
  });
});
