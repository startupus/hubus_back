import request from 'supertest';

describe('Comprehensive Load Testing', () => {
  const baseUrl = 'http://localhost:3000';
  const authServiceUrl = 'http://localhost:3001';
  const billingServiceUrl = 'http://localhost:3004';
  const analyticsServiceUrl = 'http://localhost:3005';

  describe('🚀 API Gateway Load Testing', () => {
    it('should handle 100 concurrent health check requests', async () => {
      const promises = Array.from({ length: 100 }, () =>
        request(baseUrl).get('/health')
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.status).toBe('healthy');
      });

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 100;
      
      console.log(`✅ API Gateway: 100 concurrent requests completed in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
      
      // Performance assertions
      expect(totalTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(avgResponseTime).toBeLessThan(100); // Average response time < 100ms
    }, 10000);

    it('should handle 50 concurrent billing balance requests', async () => {
      const promises = Array.from({ length: 50 }, () =>
        request(baseUrl).get('/billing/balance/test-user')
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('userId');
        expect(response.body).toHaveProperty('balance');
      });

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 50;
      
      console.log(`✅ Billing Balance: 50 concurrent requests completed in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
      
      expect(totalTime).toBeLessThan(3000);
      expect(avgResponseTime).toBeLessThan(100);
    }, 8000);

    it('should handle 30 concurrent analytics requests', async () => {
      const promises = Array.from({ length: 30 }, () =>
        request(baseUrl).get('/analytics/metrics')
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalRequests');
      });

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 30;
      
      console.log(`✅ Analytics: 30 concurrent requests completed in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
      
      expect(totalTime).toBeLessThan(2000);
      expect(avgResponseTime).toBeLessThan(80);
    }, 6000);
  });

  describe('🔐 Auth Service Load Testing', () => {
    it('should handle 20 concurrent API key creation requests', async () => {
      const promises = Array.from({ length: 20 }, (_, index) =>
        request(baseUrl)
          .post('/auth/api-keys')
          .send({
            userId: `test-user-${index}`,
            name: `test-key-${index}`
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success');
        expect(response.body.success).toBe(true);
      });

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 20;
      
      console.log(`✅ Auth API Keys: 20 concurrent requests completed in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
      
      expect(totalTime).toBeLessThan(3000);
      expect(avgResponseTime).toBeLessThan(200);
    }, 8000);
  });

  describe('💰 Billing Service Load Testing', () => {
    it('should handle 40 concurrent transaction creation requests', async () => {
      const promises = Array.from({ length: 40 }, (_, index) =>
        request(baseUrl)
          .post('/billing/transaction')
          .send({
            userId: `test-user-${index}`,
            amount: 10.50 + index,
            type: 'DEBIT',
            description: `Test transaction ${index}`
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success');
        expect(response.body.success).toBe(true);
      });

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 40;
      
      console.log(`✅ Billing Transactions: 40 concurrent requests completed in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
      
      expect(totalTime).toBeLessThan(4000);
      expect(avgResponseTime).toBeLessThan(150);
    }, 10000);

    it('should handle 25 concurrent payment processing requests', async () => {
      const promises = Array.from({ length: 25 }, (_, index) =>
        request(baseUrl)
          .post('/billing/payment/process')
          .send({
            userId: `test-user-${index}`,
            amount: 25.00 + index,
            paymentMethod: 'card'
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success');
        expect(response.body.success).toBe(true);
      });

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 25;
      
      console.log(`✅ Payment Processing: 25 concurrent requests completed in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
      
      expect(totalTime).toBeLessThan(3000);
      expect(avgResponseTime).toBeLessThan(150);
    }, 8000);
  });

  describe('📊 Analytics Service Load Testing', () => {
    it('should handle 60 concurrent event tracking requests', async () => {
      const promises = Array.from({ length: 60 }, (_, index) =>
        request(baseUrl)
          .post('/analytics/track-event')
          .send({
            eventType: 'user_action',
            eventName: `test_event_${index}`,
            service: 'test_service',
            userId: `test-user-${index}`,
            metadata: { test: `data_${index}` }
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('success');
        expect(response.body.success).toBe(true);
      });

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 60;
      
      console.log(`✅ Analytics Events: 60 concurrent requests completed in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
      
      expect(totalTime).toBeLessThan(5000);
      expect(avgResponseTime).toBeLessThan(100);
    }, 12000);
  });

  describe('🎯 Orchestrator Service Load Testing', () => {
    it('should handle 35 concurrent model requests', async () => {
      const promises = Array.from({ length: 35 }, () =>
        request(baseUrl).get('/orchestrator/models')
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('models');
        expect(Array.isArray(response.body.models)).toBe(true);
      });

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 35;
      
      console.log(`✅ Orchestrator Models: 35 concurrent requests completed in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
      
      expect(totalTime).toBeLessThan(3000);
      expect(avgResponseTime).toBeLessThan(100);
    }, 8000);
  });

  describe('🔄 Proxy Service Load Testing', () => {
    it('should handle 20 concurrent OpenAI proxy requests', async () => {
      const promises = Array.from({ length: 20 }, (_, index) =>
        request(baseUrl)
          .post('/proxy/openai/chat/completions')
          .send({
            model: 'gpt-3.5-turbo',
            messages: [
              { role: 'user', content: `Test message ${index}` }
            ]
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('choices');
      });

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 20;
      
      console.log(`✅ OpenAI Proxy: 20 concurrent requests completed in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
      
      expect(totalTime).toBeLessThan(4000);
      expect(avgResponseTime).toBeLessThan(250);
    }, 10000);

    it('should handle 15 concurrent OpenRouter proxy requests', async () => {
      const promises = Array.from({ length: 15 }, (_, index) =>
        request(baseUrl)
          .post('/proxy/openrouter/chat/completions')
          .send({
            model: 'claude-3-sonnet',
            messages: [
              { role: 'user', content: `Test message ${index}` }
            ]
          })
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
        expect(response.body).toHaveProperty('choices');
      });

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 15;
      
      console.log(`✅ OpenRouter Proxy: 15 concurrent requests completed in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
      
      expect(totalTime).toBeLessThan(3000);
      expect(avgResponseTime).toBeLessThan(250);
    }, 8000);
  });

  describe('🌐 Full System Load Testing', () => {
    it('should handle mixed workload of 100 concurrent requests', async () => {
      const requests = [
        // Health checks (20%)
        ...Array.from({ length: 20 }, () => request(baseUrl).get('/health')),
        
        // Billing requests (30%)
        ...Array.from({ length: 15 }, (_, i) => request(baseUrl).get('/billing/balance/test-user')),
        ...Array.from({ length: 15 }, (_, i) => request(baseUrl).post('/billing/transaction').send({
          userId: `test-user-${i}`,
          amount: 10.50,
          type: 'DEBIT',
          description: `Test transaction ${i}`
        })),
        
        // Analytics requests (20%)
        ...Array.from({ length: 10 }, () => request(baseUrl).get('/analytics/metrics')),
        ...Array.from({ length: 10 }, (_, i) => request(baseUrl).post('/analytics/track-event').send({
          eventType: 'user_action',
          eventName: `test_event_${i}`,
          service: 'test_service',
          userId: `test-user-${i}`,
          metadata: { test: `data_${i}` }
        })),
        
        // Auth requests (15%)
        ...Array.from({ length: 15 }, (_, i) => request(baseUrl).post('/auth/api-keys').send({
          userId: `test-user-${i}`,
          name: `test-key-${i}`
        })),
        
        // Orchestrator requests (15%)
        ...Array.from({ length: 15 }, () => request(baseUrl).get('/orchestrator/models'))
      ];

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      // Verify all requests succeeded
      responses.forEach(response => {
        expect(response.status).toBeGreaterThanOrEqual(200);
        expect(response.status).toBeLessThan(500);
      });

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 100;
      const successRate = responses.filter(r => r.status < 400).length / 100 * 100;
      
      console.log(`✅ Full System: 100 mixed requests completed in ${totalTime}ms`);
      console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Success rate: ${successRate.toFixed(1)}%`);
      
      expect(totalTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(successRate).toBeGreaterThan(95); // 95%+ success rate
      expect(avgResponseTime).toBeLessThan(150); // Average response time < 150ms
    }, 15000);
  });

  describe('📈 Performance Benchmarks', () => {
    it('should meet performance requirements for critical endpoints', async () => {
      const benchmarks = [
        { endpoint: '/health', maxTime: 100, requests: 50 },
        { endpoint: '/billing/balance/test-user', maxTime: 150, requests: 30 },
        { endpoint: '/analytics/metrics', maxTime: 120, requests: 25 },
        { endpoint: '/orchestrator/models', maxTime: 200, requests: 20 }
      ];

      for (const benchmark of benchmarks) {
        const promises = Array.from({ length: benchmark.requests }, () =>
          request(baseUrl).get(benchmark.endpoint)
        );

        const startTime = Date.now();
        const responses = await Promise.all(promises);
        const endTime = Date.now();

        const totalTime = endTime - startTime;
        const avgResponseTime = totalTime / benchmark.requests;
        
        console.log(`📊 ${benchmark.endpoint}: ${benchmark.requests} requests in ${totalTime}ms (avg: ${avgResponseTime.toFixed(2)}ms)`);
        
        expect(avgResponseTime).toBeLessThan(benchmark.maxTime);
        expect(responses.every(r => r.status === 200)).toBe(true);
      }
    }, 12000);
  });
});
