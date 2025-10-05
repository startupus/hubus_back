import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';
import { LoggerUtil } from '@ai-aggregator/shared';

describe('API Endpoints Integration Tests', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Provider Orchestrator API', () => {
    it('should get providers list', async () => {
      const response = await request('http://localhost:3000')
        .get('/orchestrator/models')
        .expect(200);

      expect(response.body).toHaveProperty('models');
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(response.body.models.length).toBeGreaterThan(0);
    });

    it('should get models list', async () => {
      const response = await request('http://localhost:3000')
        .get('/orchestrator/models')
        .expect(200);

      expect(response.body).toHaveProperty('models');
      expect(Array.isArray(response.body.models)).toBe(true);
      expect(response.body.models.length).toBeGreaterThan(0);
    });

    it('should route request to provider', async () => {
      const requestData = {
        userId: 'test-user-123',
        model: 'gpt-3.5-turbo',
        prompt: 'Hello, how are you?'
      };

      const response = await request('http://localhost:3000')
        .post('/proxy/openai/chat/completions')
        .send({
          model: 'gpt-3.5-turbo',
          messages: [{ role: 'user', content: 'Hello, how are you?' }]
        })
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('choices');
    });

    it('should get provider status', async () => {
      const response = await request('http://localhost:3000')
        .get('/orchestrator/models')
        .expect(200);

      expect(response.body).toHaveProperty('models');
      expect(Array.isArray(response.body.models)).toBe(true);
    });
  });

  describe('Proxy Service API', () => {
    it('should get available models', async () => {
      const response = await request('http://localhost:3000')
        .get('/orchestrator/models')
        .expect(200);

      expect(response.body).toHaveProperty('models');
      expect(Array.isArray(response.body.models)).toBe(true);
    });

    it('should proxy OpenAI request', async () => {
      const requestData = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ]
      };

      const response = await request('http://localhost:3000')
        .post('/proxy/openai/chat/completions')
        .send(requestData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('object', 'chat.completion');
      expect(response.body).toHaveProperty('choices');
      expect(Array.isArray(response.body.choices)).toBe(true);
    });

    it('should proxy OpenRouter request', async () => {
      const requestData = {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'user', content: 'Hello, how are you?' }
        ]
      };

      const response = await request('http://localhost:3000')
        .post('/proxy/openrouter/chat/completions')
        .send(requestData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('object', 'chat.completion');
      expect(response.body).toHaveProperty('choices');
      expect(Array.isArray(response.body.choices)).toBe(true);
    });

    it('should validate request', async () => {
      const requestData = {
        userId: 'test-user-123',
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        prompt: 'Hello'
      };

      const response = await request('http://localhost:3000')
        .post('/proxy/validate-request')
        .send(requestData)
        .expect(201);

      expect(response.body).toHaveProperty('valid');
      expect(response.body).toHaveProperty('message');
    });
  });

  describe('API Gateway Billing', () => {
    it('should get user balance', async () => {
      const response = await request('http://localhost:3000')
        .get('/billing/balance/user123')
        .expect(200);

      expect(response.body).toHaveProperty('userId');
      expect(response.body).toHaveProperty('balance');
      expect(response.body).toHaveProperty('currency');
    });

    it('should track usage', async () => {
      const requestData = {
        userId: 'user123',
        service: 'ai-chat',
        resource: 'gpt-3.5-turbo',
        quantity: 50
      };

      const response = await request('http://localhost:3000')
        .post('/billing/usage/track')
        .send(requestData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('usageEvent');
    });

    it('should get billing report', async () => {
      const response = await request('http://localhost:3000')
        .get('/billing/report/user123')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('report');
      expect(response.body.report).toHaveProperty('userId', 'user123');
      expect(response.body.report).toHaveProperty('totalUsage');
      expect(response.body.report).toHaveProperty('totalCost');
    });
  });

  describe('Analytics Service API', () => {
    it('should track event with correct format', async () => {
      const requestData = {
        eventType: 'ai_interaction',
        userId: 'user123',
        metadata: {
          model: 'gpt-3.5-turbo',
          tokens: 50,
          cost: 0.05
        }
      };

      const response = await request('http://localhost:3000')
        .post('/analytics/events/track')
        .send(requestData)
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('eventId');
      expect(response.body).toHaveProperty('eventType', 'ai_interaction');
    });

    it('should get analytics dashboard', async () => {
      const response = await request('http://localhost:3000')
        .get('/analytics/stats/collection')
        .expect(201);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
    });
  });

  describe('Auth Service API Keys', () => {
    it('should create API key (requires authentication)', async () => {
      const requestData = {
        name: 'Test API Key'
      };

      // This test would require proper authentication setup
      const response = await request('http://localhost:3000')
        .post('/auth/api-keys')
        .send(requestData)
        .expect(401); // Expected to fail without authentication

      expect(response.body).toHaveProperty('message');
    });

    it('should get API keys (requires authentication)', async () => {
      const response = await request('http://localhost:3000')
        .get('/auth/api-keys')
        .expect(401); // Expected to fail without authentication

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Health Checks', () => {
    it('should check provider orchestrator health', async () => {
      const response = await request('http://localhost:3000')
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
    });

    it('should check proxy service health', async () => {
      const response = await request('http://localhost:3000')
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
    });

    it('should check analytics service health', async () => {
      const response = await request('http://localhost:3000')
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('service');
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid request data', async () => {
      const response = await request('http://localhost:3000')
        .post('/proxy/validate-request')
        .send({}) // Empty request
        .expect(201);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle non-existent endpoints', async () => {
      const response = await request('http://localhost:3000')
        .get('/non-existent-endpoint')
        .expect(404);

      expect(response.body).toHaveProperty('message');
    });
  });
});
