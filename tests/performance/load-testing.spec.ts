import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { TestUtils, TestHelpers } from '../setup';

describe('Performance and Load Testing', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    module = await TestUtils.createTestingModule();
    app = await TestUtils.createTestApp(module);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Concurrent User Operations', () => {
    it('should handle 100 concurrent user registrations', async () => {
      const startTime = Date.now();
      
      const registrationPromises = Array.from({ length: 100 }, (_, index) => {
        const userData = {
          email: `test-user-${index}@example.com`,
          password: 'test-password-123',
          firstName: `User${index}`,
          lastName: 'Test',
        };

        return request('http://localhost:3000')
          .post('/auth/register')
          .send(userData);
      });

      const responses = await Promise.all(registrationPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all registrations succeeded
      responses.forEach((response, index) => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('email', `test-user-${index}@example.com`);
      });

      // Performance assertion: should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
      
      console.log(`100 concurrent user registrations completed in ${duration}ms`);
    });

    it('should handle 50 concurrent login attempts', async () => {
      // First, create test users
      const users = await createTestUsers(50);
      
      const startTime = Date.now();
      
      const loginPromises = users.map(user => {
        return request('http://localhost:3000')
          .post('/auth/login')
          .send({
            email: user.email,
            password: user.password,
          });
      });

      const responses = await Promise.all(loginPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all logins succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
      });

      // Performance assertion: should complete within 15 seconds
      expect(duration).toBeLessThan(15000);
      
      console.log(`50 concurrent login attempts completed in ${duration}ms`);
    });
  });

  describe('High-Volume Billing Operations', () => {
    it('should handle 1000 concurrent usage tracking requests', async () => {
      const { userId, accessToken } = await createTestUserWithBalance();

      const startTime = Date.now();
      
      const usagePromises = Array.from({ length: 1000 }, (_, index) => {
        return request('http://localhost:3000')
          .post('/billing/usage/track')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            userId,
            service: 'openai',
            tokens: 10 + (index % 100), // Vary token count
            model: 'gpt-3.5-turbo',
          });
      });

      const responses = await Promise.all(usagePromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all tracking requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('userId', userId);
      });

      // Performance assertion: should complete within 60 seconds
      expect(duration).toBeLessThan(60000);
      
      console.log(`1000 concurrent usage tracking requests completed in ${duration}ms`);
    });

    it('should handle 500 concurrent balance updates', async () => {
      const { userId, accessToken } = await createTestUserWithBalance();

      const startTime = Date.now();
      
      const balancePromises = Array.from({ length: 500 }, (_, index) => {
        return request('http://localhost:3000')
          .post(`/billing/balance/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            amount: 0.01, // Small amount to avoid insufficient balance
            description: `Test update ${index}`,
          });
      });

      const responses = await Promise.all(balancePromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all balance updates succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('balance');
      });

      // Performance assertion: should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
      
      console.log(`500 concurrent balance updates completed in ${duration}ms`);
    });
  });

  describe('Analytics Event Processing', () => {
    it('should handle 2000 concurrent analytics events', async () => {
      const { userId, accessToken } = await createTestUser();

      const startTime = Date.now();
      
      const analyticsPromises = Array.from({ length: 2000 }, (_, index) => {
        return request('http://localhost:3000')
          .post('/analytics/event/track')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            userId,
            eventType: `test_event_${index % 10}`, // 10 different event types
            data: {
              index,
              timestamp: Date.now(),
              value: Math.random() * 100,
            },
          });
      });

      const responses = await Promise.all(analyticsPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all analytics events were tracked
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('eventType');
      });

      // Performance assertion: should complete within 45 seconds
      expect(duration).toBeLessThan(45000);
      
      console.log(`2000 concurrent analytics events completed in ${duration}ms`);
    });

    it('should handle 100 concurrent dashboard requests', async () => {
      const { accessToken } = await createTestUser();

      const startTime = Date.now();
      
      const dashboardPromises = Array.from({ length: 100 }, () => {
        return request('http://localhost:3000')
          .get('/analytics/dashboard')
          .set('Authorization', `Bearer ${accessToken}`);
      });

      const responses = await Promise.all(dashboardPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all dashboard requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalEvents');
        expect(response.body).toHaveProperty('eventsByType');
      });

      // Performance assertion: should complete within 20 seconds
      expect(duration).toBeLessThan(20000);
      
      console.log(`100 concurrent dashboard requests completed in ${duration}ms`);
    });
  });

  describe('AI Request Processing', () => {
    it('should handle 100 concurrent AI requests', async () => {
      const { apiKey } = await createTestUserWithApiKey();

      const startTime = Date.now();
      
      const aiPromises = Array.from({ length: 100 }, (_, index) => {
        return request('http://localhost:3000')
          .post('/proxy/chat/completions')
          .set('Authorization', `Bearer ${apiKey}`)
          .send({
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'user',
                content: `Test message ${index}`,
              },
            ],
            max_tokens: 50,
            temperature: 0.7,
          });
      });

      const responses = await Promise.all(aiPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all AI requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('choices');
        expect(response.body).toHaveProperty('usage');
      });

      // Performance assertion: should complete within 60 seconds
      expect(duration).toBeLessThan(60000);
      
      console.log(`100 concurrent AI requests completed in ${duration}ms`);
    });

    it('should handle 50 concurrent provider orchestration requests', async () => {
      const { accessToken } = await createTestUser();

      const startTime = Date.now();
      
      const orchestrationPromises = Array.from({ length: 50 }, (_, index) => {
        return request('http://localhost:3000')
          .post('/orchestrator/route')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            userId: 'test-user-id',
            model: 'gpt-3.5-turbo',
            messages: [
              {
                role: 'user',
                content: `Test orchestration ${index}`,
              },
            ],
            maxTokens: 100,
            temperature: 0.7,
          });
      });

      const responses = await Promise.all(orchestrationPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all orchestration requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('providerId');
        expect(response.body).toHaveProperty('cost');
      });

      // Performance assertion: should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
      
      console.log(`50 concurrent orchestration requests completed in ${duration}ms`);
    });
  });

  describe('Database Performance', () => {
    it('should handle 1000 concurrent database queries', async () => {
      const { userId, accessToken } = await createTestUserWithBalance();

      const startTime = Date.now();
      
      const queryPromises = Array.from({ length: 1000 }, () => {
        return request('http://localhost:3000')
          .get(`/billing/balance/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`);
      });

      const responses = await Promise.all(queryPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all queries succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('balance');
      });

      // Performance assertion: should complete within 20 seconds
      expect(duration).toBeLessThan(20000);
      
      console.log(`1000 concurrent database queries completed in ${duration}ms`);
    });

    it('should handle 500 concurrent transaction queries', async () => {
      const { userId, accessToken } = await createTestUserWithBalance();

      const startTime = Date.now();
      
      const queryPromises = Array.from({ length: 500 }, () => {
        return request('http://localhost:3000')
          .get(`/billing/transactions/${userId}`)
          .set('Authorization', `Bearer ${accessToken}`);
      });

      const responses = await Promise.all(queryPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all queries succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
      });

      // Performance assertion: should complete within 25 seconds
      expect(duration).toBeLessThan(25000);
      
      console.log(`500 concurrent transaction queries completed in ${duration}ms`);
    });
  });

  describe('Memory and Resource Usage', () => {
    it('should maintain stable memory usage under load', async () => {
      const { userId, accessToken } = await createTestUserWithBalance();

      const initialMemory = process.memoryUsage();
      
      // Generate load
      const loadPromises = Array.from({ length: 1000 }, (_, index) => {
        return request('http://localhost:3000')
          .post('/billing/usage/track')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            userId,
            service: 'openai',
            tokens: 10 + (index % 50),
            model: 'gpt-3.5-turbo',
          });
      });

      await Promise.all(loadPromises);
      
      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      
      console.log(`Memory usage increased by ${Math.round(memoryIncrease / 1024 / 1024)}MB`);
    });

    it('should handle long-running operations', async () => {
      const { userId, accessToken } = await createTestUserWithBalance();

      const startTime = Date.now();
      
      // Simulate long-running operations
      const longRunningPromises = Array.from({ length: 100 }, (_, index) => {
        return TestHelpers.retry(async () => {
          return request('http://localhost:3000')
            .post('/billing/usage/track')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              userId,
              service: 'openai',
              tokens: 10 + (index % 20),
              model: 'gpt-3.5-turbo',
            });
        }, 3, 1000);
      });

      const responses = await Promise.all(longRunningPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Verify all operations succeeded
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      // Performance assertion: should complete within 60 seconds
      expect(duration).toBeLessThan(60000);
      
      console.log(`100 long-running operations completed in ${duration}ms`);
    });
  });

  describe('Error Recovery and Resilience', () => {
    it('should recover from temporary failures', async () => {
      const { userId, accessToken } = await createTestUserWithBalance();

      const startTime = Date.now();
      
      // Mix of successful and failing requests
      const mixedPromises = Array.from({ length: 200 }, (_, index) => {
        const shouldFail = index % 10 === 0; // 10% failure rate
        
        if (shouldFail) {
          return request('http://localhost:3000')
            .post('/billing/usage/track')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              userId: 'invalid-user-id', // This will fail
              service: 'openai',
              tokens: 10,
              model: 'gpt-3.5-turbo',
            });
        } else {
          return request('http://localhost:3000')
            .post('/billing/usage/track')
            .set('Authorization', `Bearer ${accessToken}`)
            .send({
              userId,
              service: 'openai',
              tokens: 10,
              model: 'gpt-3.5-turbo',
            });
        }
      });

      const responses = await Promise.all(mixedPromises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Count successful and failed responses
      const successful = responses.filter(r => r.status === 201).length;
      const failed = responses.filter(r => r.status !== 201).length;

      expect(successful).toBeGreaterThan(0);
      expect(failed).toBeGreaterThan(0);
      
      // Performance assertion: should complete within 30 seconds
      expect(duration).toBeLessThan(30000);
      
      console.log(`Mixed success/failure operations: ${successful} successful, ${failed} failed in ${duration}ms`);
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

  async function createTestUserWithBalance() {
    const { userId, accessToken } = await createTestUser();

    // Add initial balance
    await request('http://localhost:3000')
      .post(`/billing/balance/${userId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        amount: 1000.00,
        description: 'Initial balance for testing',
      })
      .expect(200);

    return { userId, accessToken };
  }

  async function createTestUserWithApiKey() {
    const { userId, accessToken } = await createTestUserWithBalance();

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

  async function createTestUsers(count: number) {
    const users = [];
    
    for (let i = 0; i < count; i++) {
      const userData = {
        email: `test-user-${i}@example.com`,
        password: 'test-password-123',
        firstName: `User${i}`,
        lastName: 'Test',
      };

      const registerResponse = await request('http://localhost:3000')
        .post('/auth/register')
        .send(userData)
        .expect(201);

      users.push({
        id: registerResponse.body.id,
        email: userData.email,
        password: userData.password,
        accessToken: registerResponse.body.accessToken,
      });
    }

    return users;
  }
});
