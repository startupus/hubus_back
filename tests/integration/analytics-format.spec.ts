import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';

describe('Analytics Service Data Format Tests', () => {
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

  describe('Analytics Event Tracking', () => {
    it('should accept events/track format', async () => {
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
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('eventId');
      expect(response.body).toHaveProperty('eventType', 'ai_interaction');
    });

    it('should accept track-event format', async () => {
      const requestData = {
        eventName: 'ai_interaction',
        service: 'ai-chat',
        properties: {
          model: 'gpt-3.5-turbo',
          tokens: 50,
          cost: 0.05
        },
        userId: 'user123'
      };

      const response = await request('http://localhost:3000')
        .post('/analytics/track-event')
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('eventId');
      expect(response.body).toHaveProperty('eventName', 'ai_interaction');
      expect(response.body).toHaveProperty('service', 'ai-chat');
    });

    it('should reject invalid format for events/track', async () => {
      const requestData = {
        // Missing required fields
        userId: 'user123'
      };

      const response = await request('http://localhost:3000')
        .post('/analytics/events/track')
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject invalid format for track-event', async () => {
      const requestData = {
        // Missing required fields
        userId: 'user123'
      };

      const response = await request('http://localhost:3000')
        .post('/analytics/track-event')
        .send(requestData)
        .expect(400);

      expect(response.body).toHaveProperty('message');
    });

    it('should handle complex metadata', async () => {
      const requestData = {
        eventType: 'ai_interaction',
        userId: 'user123',
        metadata: {
          model: 'gpt-3.5-turbo',
          tokens: 50,
          cost: 0.05,
          provider: 'openai',
          responseTime: 1200,
          success: true,
          error: null,
          customData: {
            sessionId: 'session-123',
            requestId: 'req-456',
            userAgent: 'Mozilla/5.0...'
          }
        }
      };

      const response = await request('http://localhost:3000')
        .post('/analytics/events/track')
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('eventId');
    });

    it('should handle complex properties', async () => {
      const requestData = {
        eventName: 'ai_interaction',
        service: 'ai-chat',
        properties: {
          model: 'gpt-3.5-turbo',
          tokens: 50,
          cost: 0.05,
          provider: 'openai',
          responseTime: 1200,
          success: true,
          error: null,
          customData: {
            sessionId: 'session-123',
            requestId: 'req-456',
            userAgent: 'Mozilla/5.0...'
          }
        },
        userId: 'user123'
      };

      const response = await request('http://localhost:3000')
        .post('/analytics/track-event')
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('eventId');
    });
  });

  describe('Analytics Dashboard', () => {
    it('should return dashboard data', async () => {
      const response = await request('http://localhost:3000')
        .get('/analytics/dashboard')
        .expect(200);

      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('summary');
      expect(response.body.data).toHaveProperty('charts');
    });

    it('should return usage metrics', async () => {
      const response = await request('http://localhost:3000')
        .get('/analytics/usage-metrics/user123')
        .expect(200);

      expect(response.body).toHaveProperty('metrics');
      expect(Array.isArray(response.body.metrics)).toBe(true);
    });
  });

  describe('Data Validation', () => {
    it('should validate required fields for events/track', async () => {
      const testCases = [
        { data: {}, expectedStatus: 400 },
        { data: { eventType: 'test' }, expectedStatus: 400 },
        { data: { userId: 'user123' }, expectedStatus: 400 },
        { data: { eventType: 'test', userId: 'user123' }, expectedStatus: 200 },
      ];

      for (const testCase of testCases) {
        const response = await request('http://localhost:3000')
          .post('/analytics/events/track')
          .send(testCase.data)
          .expect(testCase.expectedStatus);

        if (testCase.expectedStatus === 200) {
          expect(response.body).toHaveProperty('success', true);
        } else {
          expect(response.body).toHaveProperty('message');
        }
      }
    });

    it('should validate required fields for track-event', async () => {
      const testCases = [
        { data: {}, expectedStatus: 400 },
        { data: { eventName: 'test' }, expectedStatus: 400 },
        { data: { service: 'test' }, expectedStatus: 400 },
        { data: { properties: {} }, expectedStatus: 400 },
        { data: { eventName: 'test', service: 'test', properties: {} }, expectedStatus: 200 },
      ];

      for (const testCase of testCases) {
        const response = await request('http://localhost:3000')
          .post('/analytics/track-event')
          .send(testCase.data)
          .expect(testCase.expectedStatus);

        if (testCase.expectedStatus === 200) {
          expect(response.body).toHaveProperty('success', true);
        } else {
          expect(response.body).toHaveProperty('message');
        }
      }
    });
  });
});
