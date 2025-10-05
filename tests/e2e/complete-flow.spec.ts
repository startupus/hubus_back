import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { TestUtils, TEST_CONSTANTS } from '../setup';

describe('Complete E2E Flow', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    module = await TestUtils.createTestingModule();
    app = await TestUtils.createTestApp(module);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('User Registration and Authentication Flow', () => {
    it('should complete full user registration and authentication', async () => {
      const userData = {
        email: TestUtils.generateRandomEmail(),
        password: 'test-password-123',
        firstName: 'Test',
        lastName: 'User',
      };

      // Step 1: Register user
      const registerResponse = await request('http://localhost:3000')
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(registerResponse.body).toHaveProperty('user');
      expect(registerResponse.body.user).toHaveProperty('id');
      expect(registerResponse.body.user).toHaveProperty('email', userData.email);
      expect(registerResponse.body).toHaveProperty('accessToken');

      const userId = registerResponse.body.user.id;
      const accessToken = registerResponse.body.accessToken;

      // Step 2: Login user
      const loginResponse = await request('http://localhost:3000')
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginResponse.body).toHaveProperty('accessToken');
      expect(loginResponse.body).toHaveProperty('user');

      // Step 3: Get user profile
      const profileResponse = await request('http://localhost:3000')
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(profileResponse.body).toHaveProperty('id', userId);
      expect(profileResponse.body).toHaveProperty('email', userData.email);

      // Step 4: Generate API key
      const apiKeyResponse = await request('http://localhost:3000')
        .post('/auth/api-keys')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test API Key',
          expiresIn: 365, // 1 year
        })
        .expect(201);

      expect(apiKeyResponse.body).toHaveProperty('id');
      expect(apiKeyResponse.body).toHaveProperty('key');
      expect(apiKeyResponse.body).toHaveProperty('name', 'Test API Key');

      return { userId, accessToken, apiKey: apiKeyResponse.body.key };
    });
  });

  describe('Billing and Payment Flow', () => {
    it('should complete billing operations', async () => {
      const { userId, accessToken } = await createTestUser();

      // Step 1: Check initial balance
      const balanceResponse = await request('http://localhost:3000')
        .get(`/billing/balance/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(balanceResponse.body).toHaveProperty('balance');
      expect(balanceResponse.body).toHaveProperty('currency', 'USD');

      const initialBalance = parseFloat(balanceResponse.body.balance);

      // Step 2: Add funds to account
      const addFundsResponse = await request('http://localhost:3000')
        .post('/billing/balance/update')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: userId,
          amount: 100.00,
          operation: 'add',
          description: 'Initial deposit',
        })
        .expect(200);

      expect(addFundsResponse.body).toHaveProperty('balance');
      expect(parseFloat(addFundsResponse.body.balance)).toBeGreaterThan(initialBalance);

      // Step 3: Get billing report
      const reportResponse = await request('http://localhost:3000')
        .get(`/billing/report/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(reportResponse.body).toHaveProperty('userId', userId);
      expect(reportResponse.body).toHaveProperty('totalTransactions');
      expect(reportResponse.body).toHaveProperty('currentBalance');

      return { userId, accessToken };
    });
  });

  describe('AI Request and Usage Tracking Flow', () => {
    it('should complete AI request and usage tracking', async () => {
      const { userId, accessToken, apiKey } = await createTestUserWithApiKey();

      // Step 1: Make AI request through proxy
      const aiRequest = {
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Hello, how are you?',
          },
        ],
        max_tokens: 100,
        temperature: 0.7,
      };

      const aiResponse = await request('http://localhost:3000')
        .post('/proxy/chat/completions')
        .set('Authorization', `Bearer ${apiKey}`)
        .send(aiRequest)
        .expect(200);

      expect(aiResponse.body).toHaveProperty('id');
      expect(aiResponse.body).toHaveProperty('choices');
      expect(aiResponse.body).toHaveProperty('usage');

      // Step 2: Track usage
      const usageData = {
        userId,
        service: 'openai',
        tokens: aiResponse.body.usage.total_tokens,
        model: aiRequest.model,
        requestId: aiResponse.body.id,
      };

      const trackResponse = await request('http://localhost:3000')
        .post('/billing/usage/track')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(usageData)
        .expect(201);

      expect(trackResponse.body).toHaveProperty('id');
      expect(trackResponse.body).toHaveProperty('userId', userId);
      expect(trackResponse.body).toHaveProperty('type', 'DEBIT');
      expect(trackResponse.body).toHaveProperty('amount');

      // Step 3: Check updated balance
      const balanceResponse = await request('http://localhost:3000')
        .get(`/billing/balance/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(balanceResponse.body).toHaveProperty('balance');
      expect(parseFloat(balanceResponse.body.balance)).toBeLessThan(100.00);

      // Step 4: Get updated billing report
      const reportResponse = await request('http://localhost:3000')
        .get(`/billing/report/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(reportResponse.body).toHaveProperty('totalTransactions');
      expect(reportResponse.body.totalTransactions).toBeGreaterThan(0);

      return { userId, accessToken, usageData };
    });
  });

  describe('Analytics and Monitoring Flow', () => {
    it('should complete analytics tracking and monitoring', async () => {
      const { userId, accessToken } = await createTestUser();

      // Step 1: Track analytics event
      const analyticsEvent = {
        userId,
        eventType: 'ai_request',
        data: {
          model: 'gpt-3.5-turbo',
          tokens: 150,
          cost: 0.002,
        },
        timestamp: new Date().toISOString(),
      };

      const trackEventResponse = await request('http://localhost:3000')
        .post('/analytics/event/track')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(analyticsEvent)
        .expect(201);

      expect(trackEventResponse.body).toHaveProperty('id');
      expect(trackEventResponse.body).toHaveProperty('eventType', 'ai_request');

      // Step 2: Get analytics dashboard
      const dashboardResponse = await request('http://localhost:3000')
        .get('/analytics/dashboard')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(dashboardResponse.body).toHaveProperty('totalEvents');
      expect(dashboardResponse.body).toHaveProperty('eventsByType');
      expect(dashboardResponse.body).toHaveProperty('recentEvents');

      // Step 3: Get user analytics
      const userAnalyticsResponse = await request('http://localhost:3000')
        .get(`/analytics/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(userAnalyticsResponse.body).toHaveProperty('userId', userId);
      expect(userAnalyticsResponse.body).toHaveProperty('totalEvents');
      expect(userAnalyticsResponse.body).toHaveProperty('eventsByType');

      // Step 4: Get system health
      const healthResponse = await request('http://localhost:3000')
        .get('/analytics/health')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(healthResponse.body).toHaveProperty('status');
      expect(healthResponse.body).toHaveProperty('services');
      expect(healthResponse.body).toHaveProperty('metrics');

      return { userId, accessToken };
    });
  });

  describe('Provider Orchestrator Flow', () => {
    it('should complete provider orchestration', async () => {
      const { userId, accessToken } = await createTestUser();

      // Step 1: Get available providers
      const providersResponse = await request('http://localhost:3000')
        .get('/orchestrator/providers')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(providersResponse.body).toHaveProperty('providers');
      expect(Array.isArray(providersResponse.body.providers)).toBe(true);

      // Step 2: Get provider status
      const statusResponse = await request('http://localhost:3000')
        .get('/orchestrator/status')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(statusResponse.body).toHaveProperty('status');
      expect(statusResponse.body).toHaveProperty('providers');

      // Step 3: Route request
      const routeRequest = {
        userId,
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'user',
            content: 'Test message',
          },
        ],
        maxTokens: 100,
        temperature: 0.7,
      };

      const routeResponse = await request('http://localhost:3000')
        .post('/orchestrator/route')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(routeRequest)
        .expect(200);

      expect(routeResponse.body).toHaveProperty('providerId');
      expect(routeResponse.body).toHaveProperty('cost');
      expect(routeResponse.body).toHaveProperty('estimatedTime');

      return { userId, accessToken };
    });
  });

  describe('Error Handling and Recovery Flow', () => {
    it('should handle errors gracefully', async () => {
      const { userId, accessToken } = await createTestUser();

      // Step 1: Test invalid API key
      await request('http://localhost:3000')
        .post('/proxy/chat/completions')
        .set('Authorization', 'Bearer invalid-api-key')
        .send({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello' }],
        })
        .expect(401);

      // Step 2: Test insufficient balance
      const usageData = {
        userId,
        service: 'openai',
        tokens: 1000000, // Very high token count
        model: 'gpt-3.5-turbo',
      };

      await request('http://localhost:3000')
        .post('/billing/usage/track')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(usageData)
        .expect(400);

      // Step 3: Test invalid user ID
      await request('http://localhost:3000')
        .get('/billing/balance/invalid-user-id')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      // Step 4: Test malformed request
      await request('http://localhost:3000')
        .post('/billing/transaction')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId: 'invalid-user',
          type: 'INVALID_TYPE',
          amount: -100,
        })
        .expect(400);

      return { userId, accessToken };
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle concurrent requests', async () => {
      const { userId, accessToken } = await createTestUser();

      // Create multiple concurrent requests
      const concurrentRequests = Array.from({ length: 10 }, (_, index) => {
        return request('http://localhost:3000')
          .post('/billing/usage/track')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            userId,
            service: 'openai',
            tokens: 100 + index,
            model: 'gpt-3.5-turbo',
          });
      });

      const responses = await Promise.all(concurrentRequests);
      
      // All requests should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      return { userId, accessToken };
    });

    it('should handle high volume analytics events', async () => {
      const { userId, accessToken } = await createTestUser();

      // Create multiple analytics events
      const analyticsEvents = Array.from({ length: 50 }, (_, index) => {
        return request('http://localhost:3000')
          .post('/analytics/event/track')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            userId,
            eventType: `test_event_${index}`,
            data: { index, timestamp: Date.now() },
          });
      });

      const responses = await Promise.all(analyticsEvents);
      
      // All events should be tracked
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      return { userId, accessToken };
    });
  });

  describe('Data Consistency and Integrity', () => {
    it('should maintain data consistency across services', async () => {
      const { userId, accessToken } = await createTestUser();

      // Step 1: Make AI request
      const aiRequest = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Hello' }],
        max_tokens: 50,
      };

      const aiResponse = await request('http://localhost:3000')
        .post('/proxy/chat/completions')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(aiRequest)
        .expect(200);

      // Step 2: Track usage
      const usageData = {
        userId,
        service: 'openai',
        tokens: aiResponse.body.usage.total_tokens,
        model: aiRequest.model,
      };

      await request('http://localhost:3000')
        .post('/billing/usage/track')
        .set('Authorization', `Bearer ${accessToken}`)
        .send(usageData)
        .expect(201);

      // Step 3: Track analytics
      await request('http://localhost:3000')
        .post('/analytics/event/track')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          userId,
          eventType: 'ai_request',
          data: usageData,
        })
        .expect(201);

      // Step 4: Verify consistency
      const balanceResponse = await request('http://localhost:3000')
        .get(`/billing/balance/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const reportResponse = await request('http://localhost:3000')
        .get(`/billing/report/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      const analyticsResponse = await request('http://localhost:3000')
        .get(`/analytics/user/${userId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Verify data consistency
      expect(balanceResponse.body).toHaveProperty('balance');
      expect(reportResponse.body).toHaveProperty('totalTransactions');
      expect(analyticsResponse.body).toHaveProperty('totalEvents');

      return { userId, accessToken };
    });
  });

  // Helper functions
  async function createTestUser() {
    const userData = {
      email: TestUtils.generateRandomEmail(),
      password: 'test-password-123',
      firstName: 'Test',
      lastName: 'User',
    };

    const registerResponse = await request('http://localhost:3000')
      .post('/auth/register')
      .send(userData)
      .expect(201);

    return {
      userId: registerResponse.body.id,
      accessToken: registerResponse.body.accessToken,
    };
  }

  async function createTestUserWithApiKey() {
    const { userId, accessToken } = await createTestUser();

    const apiKeyResponse = await request('http://localhost:3000')
      .post('/auth/api-keys')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Test API Key',
        expiresIn: 365,
      })
      .expect(201);

    return {
      userId,
      accessToken,
      apiKey: apiKeyResponse.body.key,
    };
  }
});
