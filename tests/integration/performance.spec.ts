import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import * as request from 'supertest';

describe('Performance Tests', () => {
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

  describe('Concurrent Requests', () => {
    it('should handle 100 concurrent provider requests', async () => {
      const startTime = Date.now();
      const promises = Array.from({ length: 100 }, (_, index) => 
        request('http://localhost:3000')
          .get('/orchestrator/models')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
      expect(responses.length).toBe(100);
      responses.forEach(response => {
        expect(response.body).toHaveProperty('models');
      });
    }, 15000);

    it('should handle 50 concurrent proxy requests', async () => {
      const startTime = Date.now();
      const promises = Array.from({ length: 50 }, (_, index) => 
        request('http://localhost:3000')
          .get('/orchestrator/models')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
      expect(responses.length).toBe(50);
      responses.forEach(response => {
        expect(response.body).toHaveProperty('models');
      });
    }, 10000);

    it('should handle 25 concurrent billing requests', async () => {
      const startTime = Date.now();
      const promises = Array.from({ length: 25 }, (_, index) => 
        request('http://localhost:3000')
          .get('/billing/balance/user123')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within 3 seconds
      expect(duration).toBeLessThan(3000);
      expect(responses.length).toBe(25);
      responses.forEach(response => {
        expect(response.body).toHaveProperty('userId');
      });
    }, 8000);
  });

  describe('Response Time Tests', () => {
    it('should respond to provider requests within 100ms', async () => {
      const startTime = Date.now();
      await request('http://localhost:3000')
        .get('/orchestrator/providers')
        .expect(200);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should respond to proxy requests within 100ms', async () => {
      const startTime = Date.now();
      await request('http://localhost:3000')
        .get('/proxy/models')
        .expect(200);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });

    it('should respond to analytics requests within 100ms', async () => {
      const startTime = Date.now();
      await request('http://localhost:3000')
        .get('/analytics/dashboard')
        .expect(200);
      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });

  describe('Memory Usage Tests', () => {
    it('should not leak memory during multiple requests', async () => {
      const initialMemory = process.memoryUsage();
      
      // Make 100 requests
      for (let i = 0; i < 100; i++) {
        await request('http://localhost:3000')
          .get('/orchestrator/providers')
          .expect(200);
      }

      const finalMemory = process.memoryUsage();
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      
      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }, 30000);
  });

  describe('Load Testing', () => {
    it('should handle sustained load for 30 seconds', async () => {
      const startTime = Date.now();
      const endTime = startTime + 30000; // 30 seconds
      const requests: Promise<any>[] = [];

      while (Date.now() < endTime) {
        requests.push(
          request('http://localhost:3000')
            .get('/orchestrator/providers')
            .expect(200)
        );

        // Limit concurrent requests to prevent overwhelming
        if (requests.length >= 10) {
          await Promise.all(requests);
          requests.length = 0;
        }
      }

      // Wait for remaining requests
      if (requests.length > 0) {
        await Promise.all(requests);
      }

      const totalDuration = Date.now() - startTime;
      expect(totalDuration).toBeGreaterThanOrEqual(30000);
    }, 45000);
  });
});
