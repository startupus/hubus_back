import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { TestUtils } from '../setup';

describe('Security Testing', () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    module = await TestUtils.createTestingModule();
    app = await TestUtils.createTestApp(module);
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Authentication Security', () => {
    it('should reject invalid JWT tokens', async () => {
      const invalidTokens = [
        'invalid-token',
        'Bearer invalid-token',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid',
        'Bearer ',
        '',
        null,
        undefined,
      ];

      for (const token of invalidTokens) {
        await request('http://localhost:3000')
          .get('/billing/balance/test-user')
          .set('Authorization', token)
          .expect(401);
      }
    });

    it('should reject expired JWT tokens', async () => {
      // Create a token with very short expiration
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

      const accessToken = registerResponse.body.accessToken;

      // Wait for token to expire (if configured with short expiration)
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Try to use expired token
      await request('http://localhost:3000')
        .get('/billing/balance/test-user')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('should prevent brute force attacks', async () => {
      const userData = {
        email: TestUtils.generateRandomEmail(),
        password: 'test-password-123',
        firstName: 'Test',
        lastName: 'User',
      };

      // Register user
      await request('http://localhost:3000')
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Attempt multiple failed logins
      const failedAttempts = Array.from({ length: 10 }, () => {
        return request('http://localhost:3000')
          .post('/auth/login')
          .send({
            email: userData.email,
            password: 'wrong-password',
          });
      });

      const responses = await Promise.all(failedAttempts);
      
      // All should fail
      responses.forEach(response => {
        expect(response.status).toBe(401);
      });

      // Rate limiting should kick in after multiple attempts
      await request('http://localhost:3000')
        .post('/auth/login')
        .send({
          email: userData.email,
          password: 'wrong-password',
        })
        .expect(429); // Too Many Requests
    });

    it('should validate password strength', async () => {
      const weakPasswords = [
        '123',
        'password',
        '12345678',
        'qwerty',
        'abc',
        '',
        'a'.repeat(1000), // Too long
      ];

      for (const password of weakPasswords) {
        await request('http://localhost:3000')
          .post('/auth/register')
          .send({
            email: TestUtils.generateRandomEmail(),
            password,
            firstName: 'Test',
            lastName: 'User',
          })
          .expect(400);
      }
    });

    it('should validate email format', async () => {
      const invalidEmails = [
        'invalid-email',
        '@example.com',
        'test@',
        'test@.com',
        'test..test@example.com',
        '',
        'a'.repeat(1000) + '@example.com',
      ];

      for (const email of invalidEmails) {
        await request('http://localhost:3000')
          .post('/auth/register')
          .send({
            email,
            password: 'test-password-123',
            firstName: 'Test',
            lastName: 'User',
          })
          .expect(400);
      }
    });
  });

  describe('Authorization Security', () => {
    it('should prevent unauthorized access to user data', async () => {
      const { userId, accessToken } = await createTestUser();

      // Try to access another user's data
      const otherUserId = 'other-user-id';
      
      await request('http://localhost:3000')
        .get(`/billing/balance/${otherUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      await request('http://localhost:3000')
        .get(`/billing/transactions/${otherUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);

      await request('http://localhost:3000')
        .get(`/billing/report/${otherUserId}`)
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(403);
    });

    it('should prevent unauthorized API key usage', async () => {
      const { apiKey } = await createTestUserWithApiKey();

      // Try to use API key for different user's operations
      await request('http://localhost:3000')
        .post('/billing/usage/track')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          userId: 'other-user-id',
          service: 'openai',
          tokens: 100,
          model: 'gpt-3.5-turbo',
        })
        .expect(403);
    });

    it('should validate API key permissions', async () => {
      const { apiKey } = await createTestUserWithApiKey();

      // API key should only work for AI requests, not direct billing operations
      await request('http://localhost:3000')
        .post('/billing/transaction')
        .set('Authorization', `Bearer ${apiKey}`)
        .send({
          userId: 'test-user-id',
          type: 'DEBIT',
          amount: 10.00,
          description: 'Unauthorized transaction',
        })
        .expect(403);
    });
  });

  describe('Input Validation Security', () => {
    it('should prevent SQL injection attacks', async () => {
      const { accessToken } = await createTestUser();

      const sqlInjectionPayloads = [
        "'; DROP TABLE users; --",
        "' OR '1'='1",
        "'; INSERT INTO users VALUES ('hacker', 'password'); --",
        "'; UPDATE users SET password = 'hacked'; --",
        "'; DELETE FROM users; --",
      ];

      for (const payload of sqlInjectionPayloads) {
        await request('http://localhost:3000')
          .get(`/billing/balance/${payload}`)
          .set('Authorization', `Bearer ${accessToken}`)
          .expect(400);
      }
    });

    it('should prevent XSS attacks', async () => {
      const { accessToken } = await createTestUser();

      const xssPayloads = [
        '<script>alert("XSS")</script>',
        'javascript:alert("XSS")',
        '<img src="x" onerror="alert(\'XSS\')">',
        '"><script>alert("XSS")</script>',
        '"><img src="x" onerror="alert(\'XSS\')">',
      ];

      for (const payload of xssPayloads) {
        await request('http://localhost:3000')
          .post('/billing/transaction')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            userId: 'test-user-id',
            type: 'DEBIT',
            amount: 10.00,
            description: payload,
          })
          .expect(400);
      }
    });

    it('should prevent NoSQL injection attacks', async () => {
      const { accessToken } = await createTestUser();

      const nosqlPayloads = [
        { $where: 'this.password == this.password' },
        { $ne: null },
        { $gt: '' },
        { $regex: '.*' },
        { $exists: true },
      ];

      for (const payload of nosqlPayloads) {
        await request('http://localhost:3000')
          .post('/billing/transaction')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            userId: payload,
            type: 'DEBIT',
            amount: 10.00,
            description: 'Test',
          })
          .expect(400);
      }
    });

    it('should validate numeric inputs', async () => {
      const { accessToken } = await createTestUser();

      const invalidNumericInputs = [
        'not-a-number',
        '1e1000', // Too large
        '-1e1000', // Too small
        'Infinity',
        '-Infinity',
        'NaN',
        '0x123', // Hex
        '0b101', // Binary
        '0o777', // Octal
      ];

      for (const input of invalidNumericInputs) {
        await request('http://localhost:3000')
          .post('/billing/transaction')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            userId: 'test-user-id',
            type: 'DEBIT',
            amount: input,
            description: 'Test',
          })
          .expect(400);
      }
    });

    it('should validate array inputs', async () => {
      const { accessToken } = await createTestUser();

      const invalidArrayInputs = [
        'not-an-array',
        { not: 'an-array' },
        null,
        undefined,
        '[]',
        '{}',
      ];

      for (const input of invalidArrayInputs) {
        await request('http://localhost:3000')
          .post('/analytics/event/track')
          .set('Authorization', `Bearer ${accessToken}`)
          .send({
            userId: 'test-user-id',
            eventType: 'test',
            data: input,
          })
          .expect(400);
      }
    });
  });

  describe('Rate Limiting Security', () => {
    it('should enforce rate limits on authentication endpoints', async () => {
      const userData = {
        email: TestUtils.generateRandomEmail(),
        password: 'test-password-123',
        firstName: 'Test',
        lastName: 'User',
      };

      // Register user
      await request('http://localhost:3000')
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Attempt multiple logins rapidly
      const loginPromises = Array.from({ length: 20 }, () => {
        return request('http://localhost:3000')
          .post('/auth/login')
          .send({
            email: userData.email,
            password: 'wrong-password',
          });
      });

      const responses = await Promise.all(loginPromises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce rate limits on API endpoints', async () => {
      const { accessToken } = await createTestUser();

      // Make many requests rapidly
      const requestPromises = Array.from({ length: 100 }, () => {
        return request('http://localhost:3000')
          .get('/billing/balance/test-user-id')
          .set('Authorization', `Bearer ${accessToken}`);
      });

      const responses = await Promise.all(requestPromises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should enforce rate limits on AI endpoints', async () => {
      const { apiKey } = await createTestUserWithApiKey();

      // Make many AI requests rapidly
      const aiPromises = Array.from({ length: 50 }, () => {
        return request('http://localhost:3000')
          .post('/proxy/chat/completions')
          .set('Authorization', `Bearer ${apiKey}`)
          .send({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: 'Hello' }],
            max_tokens: 10,
          });
      });

      const responses = await Promise.all(aiPromises);
      
      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(r => r.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });
  });

  describe('Data Protection Security', () => {
    it('should sanitize sensitive data in responses', async () => {
      const { userId, accessToken } = await createTestUser();

      const response = await request('http://localhost:3000')
        .get('/auth/profile')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Password should not be in response
      expect(response.body).not.toHaveProperty('password');
      expect(response.body).not.toHaveProperty('passwordHash');
      expect(response.body).not.toHaveProperty('salt');
    });

    it('should prevent data leakage in error messages', async () => {
      const { accessToken } = await createTestUser();

      // Try to access non-existent resource
      const response = await request('http://localhost:3000')
        .get('/billing/balance/non-existent-user')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(404);

      // Error message should not contain sensitive information
      expect(response.body.message).not.toContain('password');
      expect(response.body.message).not.toContain('token');
      expect(response.body.message).not.toContain('secret');
      expect(response.body.message).not.toContain('key');
    });

    it('should validate data types in requests', async () => {
      const { accessToken } = await createTestUser();

      const invalidRequests = [
        {
          userId: 123, // Should be string
          type: 'DEBIT',
          amount: 10.00,
          description: 'Test',
        },
        {
          userId: 'test-user-id',
          type: 123, // Should be string
          amount: 10.00,
          description: 'Test',
        },
        {
          userId: 'test-user-id',
          type: 'DEBIT',
          amount: 'not-a-number', // Should be number
          description: 'Test',
        },
        {
          userId: 'test-user-id',
          type: 'DEBIT',
          amount: 10.00,
          description: 123, // Should be string
        },
      ];

      for (const requestData of invalidRequests) {
        await request('http://localhost:3000')
          .post('/billing/transaction')
          .set('Authorization', `Bearer ${accessToken}`)
          .send(requestData)
          .expect(400);
      }
    });
  });

  describe('CORS Security', () => {
    it('should handle CORS preflight requests', async () => {
      await request('http://localhost:3000')
        .options('/auth/login')
        .set('Origin', 'https://example.com')
        .set('Access-Control-Request-Method', 'POST')
        .set('Access-Control-Request-Headers', 'Content-Type')
        .expect(200);
    });

    it('should include proper CORS headers', async () => {
      const response = await request('http://localhost:3000')
        .post('/auth/login')
        .set('Origin', 'https://example.com')
        .send({
          email: 'test@example.com',
          password: 'test-password',
        });

      expect(response.headers).toHaveProperty('access-control-allow-origin');
      expect(response.headers).toHaveProperty('access-control-allow-methods');
      expect(response.headers).toHaveProperty('access-control-allow-headers');
    });
  });

  describe('Session Security', () => {
    it('should invalidate tokens on logout', async () => {
      const { userId, accessToken } = await createTestUser();

      // Logout
      await request('http://localhost:3000')
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      // Token should be invalidated
      await request('http://localhost:3000')
        .get('/billing/balance/test-user')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(401);
    });

    it('should handle concurrent sessions', async () => {
      const userData = {
        email: TestUtils.generateRandomEmail(),
        password: 'test-password-123',
        firstName: 'Test',
        lastName: 'User',
      };

      // Register user
      await request('http://localhost:3000')
        .post('/auth/register')
        .send(userData)
        .expect(201);

      // Login multiple times
      const loginPromises = Array.from({ length: 5 }, () => {
        return request('http://localhost:3000')
          .post('/auth/login')
          .send({
            email: userData.email,
            password: userData.password,
          });
      });

      const responses = await Promise.all(loginPromises);
      
      // All logins should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('accessToken');
      });
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
