import request from 'supertest';

describe('Working Endpoints Integration Tests', () => {
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

  describe('Billing Service', () => {
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

  describe('Analytics Service', () => {
    it('should get analytics metrics', async () => {
      const response = await request(baseUrl)
        .get('/analytics/metrics')
        .expect(200);

      expect(response.body).toHaveProperty('totalRequests');
      expect(response.body).toHaveProperty('totalUsers');
      expect(response.body).toHaveProperty('totalCost');
    });
  });
});
