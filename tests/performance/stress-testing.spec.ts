import request from 'supertest';

describe('System Stress Testing', () => {
  const baseUrl = 'http://localhost:3000';

  describe('🔥 Extreme Load Testing', () => {
    it('should handle 500 concurrent health check requests', async () => {
      const promises = Array.from({ length: 500 }, () =>
        request(baseUrl).get('/health')
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 500;
      const successRate = responses.filter(r => r.status === 200).length / 500 * 100;
      const throughput = 500 / (totalTime / 1000); // requests per second

      console.log(`🔥 Extreme Health: 500 requests in ${totalTime}ms`);
      console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Success rate: ${successRate.toFixed(1)}%`);
      console.log(`   Throughput: ${throughput.toFixed(2)} req/s`);

      expect(successRate).toBeGreaterThan(98);
      expect(avgResponseTime).toBeLessThan(100);
      expect(totalTime).toBeLessThan(10000);
      expect(throughput).toBeGreaterThan(50);
    }, 15000);

    it('should handle 300 concurrent mixed billing requests', async () => {
      const requests = [
        // Balance checks (40%)
        ...Array.from({ length: 120 }, (_, i) => 
          request(baseUrl).get(`/billing/balance/stress-test-user-${i}`)
        ),
        
        // Transaction creation (30%)
        ...Array.from({ length: 90 }, (_, i) =>
          request(baseUrl)
            .post('/billing/transaction')
            .send({
              userId: `stress-test-user-${i}`,
              amount: 10.50 + (i * 0.1),
              type: 'DEBIT',
              description: `Stress test transaction ${i}`
            })
        ),
        
        // Payment processing (20%)
        ...Array.from({ length: 60 }, (_, i) =>
          request(baseUrl)
            .post('/billing/payment/process')
            .send({
              userId: `stress-payment-user-${i}`,
              amount: 25.00 + (i * 0.5),
              paymentMethod: 'card'
            })
        ),
        
        // Refund processing (10%)
        ...Array.from({ length: 30 }, (_, i) =>
          request(baseUrl)
            .post('/billing/payment/refund')
            .send({
              transactionId: `stress-tx-${i}`,
              amount: 5.00 + (i * 0.1),
              reason: `Stress test refund ${i}`
            })
        )
      ];

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 300;
      const successRate = responses.filter(r => r.status < 400).length / 300 * 100;
      const throughput = 300 / (totalTime / 1000);

      console.log(`🔥 Extreme Billing: 300 mixed requests in ${totalTime}ms`);
      console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Success rate: ${successRate.toFixed(1)}%`);
      console.log(`   Throughput: ${throughput.toFixed(2)} req/s`);

      expect(successRate).toBeGreaterThan(90);
      expect(avgResponseTime).toBeLessThan(200);
      expect(totalTime).toBeLessThan(15000);
      expect(throughput).toBeGreaterThan(20);
    }, 20000);

    it('should handle 200 concurrent analytics requests', async () => {
      const requests = [
        // Event tracking (60%)
        ...Array.from({ length: 120 }, (_, i) =>
          request(baseUrl)
            .post('/analytics/track-event')
            .send({
              eventType: 'stress_test',
              eventName: `stress_event_${i}`,
              service: 'stress_test_service',
              userId: `stress-analytics-user-${i}`,
              metadata: { 
                test: `stress_data_${i}`,
                timestamp: new Date().toISOString(),
                iteration: i
              }
            })
        ),
        
        // Metrics requests (25%)
        ...Array.from({ length: 50 }, () =>
          request(baseUrl).get('/analytics/metrics')
        ),
        
        // Dashboard requests (15%)
        ...Array.from({ length: 30 }, () =>
          request(baseUrl).get('/analytics/dashboard')
        )
      ];

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const avgResponseTime = totalTime / 200;
      const successRate = responses.filter(r => r.status < 400).length / 200 * 100;
      const throughput = 200 / (totalTime / 1000);

      console.log(`🔥 Extreme Analytics: 200 requests in ${totalTime}ms`);
      console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Success rate: ${successRate.toFixed(1)}%`);
      console.log(`   Throughput: ${throughput.toFixed(2)} req/s`);

      expect(successRate).toBeGreaterThan(90);
      expect(avgResponseTime).toBeLessThan(150);
      expect(totalTime).toBeLessThan(10000);
      expect(throughput).toBeGreaterThan(20);
    }, 15000);
  });

  describe('⚡ Burst Testing', () => {
    it('should handle burst of 100 requests in 1 second', async () => {
      const promises = Array.from({ length: 100 }, (_, i) =>
        request(baseUrl).get('/health')
      );

      const startTime = Date.now();
      const responses = await Promise.all(promises);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const burstRate = 100 / (totalTime / 1000);

      console.log(`⚡ Burst Test: 100 requests in ${totalTime}ms (${burstRate.toFixed(2)} req/s)`);

      expect(totalTime).toBeLessThan(2000);
      expect(burstRate).toBeGreaterThan(50);
      expect(responses.every(r => r.status === 200)).toBe(true);
    }, 5000);

    it('should handle rapid sequential requests', async () => {
      const startTime = Date.now();
      const responses = [];

      // Send 50 requests sequentially with minimal delay
      for (let i = 0; i < 50; i++) {
        const response = await request(baseUrl).get('/health');
        responses.push(response);
      }

      const endTime = Date.now();
      const totalTime = endTime - startTime;
      const avgTimePerRequest = totalTime / 50;

      console.log(`⚡ Sequential Test: 50 requests in ${totalTime}ms (${avgTimePerRequest.toFixed(2)}ms per request)`);

      expect(totalTime).toBeLessThan(3000);
      expect(avgTimePerRequest).toBeLessThan(100);
      expect(responses.every(r => r.status === 200)).toBe(true);
    }, 8000);
  });

  describe('🔄 Endurance Testing', () => {
    it('should maintain performance over 30 seconds of continuous load', async () => {
      const testDuration = 30000; // 30 seconds
      const requestInterval = 100; // 100ms between requests
      const startTime = Date.now();
      const results = [];

      const makeRequest = async () => {
        const requestStart = Date.now();
        try {
          const response = await request(baseUrl).get('/health');
          const requestEnd = Date.now();
          return {
            success: response.status === 200,
            responseTime: requestEnd - requestStart,
            timestamp: requestStart - startTime
          };
        } catch (error) {
          return {
            success: false,
            responseTime: 0,
            timestamp: Date.now() - startTime,
            error: error.message
          };
        }
      };

      // Run requests for the specified duration
      const interval = setInterval(async () => {
        if (Date.now() - startTime < testDuration) {
          const result = await makeRequest();
          results.push(result);
        } else {
          clearInterval(interval);
        }
      }, requestInterval);

      // Wait for test completion
      await new Promise(resolve => setTimeout(resolve, testDuration + 1000));

      const endTime = Date.now();
      const actualDuration = endTime - startTime;
      const totalRequests = results.length;
      const successfulRequests = results.filter(r => r.success).length;
      const successRate = (successfulRequests / totalRequests) * 100;
      const avgResponseTime = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + r.responseTime, 0) / successfulRequests;

      console.log(`🔄 Endurance Test: ${totalRequests} requests over ${actualDuration}ms`);
      console.log(`   Success rate: ${successRate.toFixed(1)}%`);
      console.log(`   Average response time: ${avgResponseTime.toFixed(2)}ms`);
      console.log(`   Requests per second: ${(totalRequests / (actualDuration / 1000)).toFixed(2)}`);

      expect(successRate).toBeGreaterThan(95);
      expect(avgResponseTime).toBeLessThan(100);
      expect(totalRequests).toBeGreaterThan(200);
    }, 40000);
  });

  describe('💥 Failure Recovery Testing', () => {
    it('should handle mixed success/failure scenarios gracefully', async () => {
      const requests = [
        // Valid requests (70%)
        ...Array.from({ length: 35 }, (_, i) => 
          request(baseUrl).get('/health')
        ),
        
        // Invalid requests (20%)
        ...Array.from({ length: 10 }, () =>
          request(baseUrl).get('/invalid-endpoint')
        ),
        
        // Malformed requests (10%)
        ...Array.from({ length: 5 }, () =>
          request(baseUrl)
            .post('/billing/transaction')
            .send({ invalid: 'data' })
        )
      ];

      const startTime = Date.now();
      const responses = await Promise.all(requests);
      const endTime = Date.now();

      const totalTime = endTime - startTime;
      const validRequests = responses.filter(r => r.status === 200).length;
      const invalidRequests = responses.filter(r => r.status >= 400).length;
      const errorRate = (invalidRequests / responses.length) * 100;

      console.log(`💥 Failure Recovery: ${responses.length} mixed requests in ${totalTime}ms`);
      console.log(`   Valid requests: ${validRequests}`);
      console.log(`   Invalid requests: ${invalidRequests}`);
      console.log(`   Error rate: ${errorRate.toFixed(1)}%`);

      expect(validRequests).toBe(35);
      expect(invalidRequests).toBe(15);
      expect(errorRate).toBeCloseTo(30, 1);
      expect(totalTime).toBeLessThan(3000);
    }, 8000);
  });

  describe('📊 Performance Metrics Summary', () => {
    it('should provide comprehensive performance summary', async () => {
      const testSuites = [
        { name: 'Health Check', endpoint: '/health', requests: 100, expectedTime: 2000 },
        { name: 'Billing Balance', endpoint: '/billing/balance/test-user', requests: 50, expectedTime: 3000 },
        { name: 'Analytics Metrics', endpoint: '/analytics/metrics', requests: 30, expectedTime: 2000 },
        { name: 'Orchestrator Models', endpoint: '/orchestrator/models', requests: 25, expectedTime: 2000 }
      ];

      const results = [];

      for (const suite of testSuites) {
        const promises = Array.from({ length: suite.requests }, () =>
          request(baseUrl).get(suite.endpoint)
        );

        const startTime = Date.now();
        const responses = await Promise.all(promises);
        const endTime = Date.now();

        const totalTime = endTime - startTime;
        const successRate = responses.filter(r => r.status === 200).length / suite.requests * 100;
        const avgResponseTime = totalTime / suite.requests;
        const throughput = suite.requests / (totalTime / 1000);

        results.push({
          name: suite.name,
          requests: suite.requests,
          totalTime,
          avgResponseTime,
          successRate,
          throughput,
          passed: totalTime <= suite.expectedTime && successRate >= 95
        });

        console.log(`📊 ${suite.name}: ${suite.requests} requests in ${totalTime}ms`);
        console.log(`   Avg response: ${avgResponseTime.toFixed(2)}ms, Success: ${successRate.toFixed(1)}%, Throughput: ${throughput.toFixed(2)} req/s`);
      }

      const overallSuccess = results.every(r => r.passed);
      const totalRequests = results.reduce((sum, r) => sum + r.requests, 0);
      const totalTime = results.reduce((sum, r) => sum + r.totalTime, 0);
      const overallThroughput = totalRequests / (totalTime / 1000);

      console.log(`\n📊 PERFORMANCE SUMMARY:`);
      console.log(`   Total requests: ${totalRequests}`);
      console.log(`   Total time: ${totalTime}ms`);
      console.log(`   Overall throughput: ${overallThroughput.toFixed(2)} req/s`);
      console.log(`   All tests passed: ${overallSuccess}`);

      expect(overallSuccess).toBe(true);
      expect(overallThroughput).toBeGreaterThan(30);
    }, 15000);
  });
});
