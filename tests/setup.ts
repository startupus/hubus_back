// Global test setup
import { Logger } from '@nestjs/common';

// Disable console logs during tests
Logger.overrideLogger(false);

// Global test timeout
jest.setTimeout(30000);

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.RABBITMQ_URL = 'amqp://localhost:5672';
process.env.JWT_SECRET = 'test-secret';

// Test utilities
export class TestUtils {
  static generateTestUser() {
    return {
      id: 'test-user-123',
      email: 'test@example.com',
      password: 'password123'
    };
  }
  
  static generateTestApiKey() {
    return {
      id: 'test-key-123',
      key: 'ak-test123456789',
      userId: 'test-user-123'
    };
  }
  
  static generateTestRequest() {
    return {
      userId: 'test-user-123',
      model: 'gpt-3.5-turbo',
      prompt: 'Hello, how are you?'
    };
  }

  static generateRandomEmail() {
    return `test-${Date.now()}@example.com`;
  }

  static async createTestingModule() {
    const { Test } = await import('@nestjs/testing');
    return Test.createTestingModule({
      imports: [],
    }).compile();
  }

  static async createTestApp(module: any) {
    const app = module.createNestApplication();
    await app.init();
    return app;
  }

  static async createTestUser() {
    return {
      id: 'test-user-123',
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User'
    };
  }

  static async createTestApiKey() {
    return {
      id: 'test-key-123',
      key: 'ak-test123456789',
      userId: 'test-user-123',
      isActive: true,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) // 1 year
    };
  }

  static async createTestTransaction() {
    return {
      id: 'test-transaction-123',
      userId: 'test-user-123',
      type: 'DEBIT',
      amount: 10.50,
      description: 'Test transaction',
      status: 'COMPLETED',
      createdAt: new Date()
    };
  }

  static async createTestBalance() {
    return {
      id: 'test-balance-123',
      userId: 'test-user-123',
      balance: 100.00,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  static async createTestUsage() {
    return {
      id: 'test-usage-123',
      userId: 'test-user-123',
      service: 'openai',
      model: 'gpt-3.5-turbo',
      tokens: 100,
      cost: 0.001,
      createdAt: new Date()
    };
  }

  static async createTestEvent() {
    return {
      id: 'test-event-123',
      userId: 'test-user-123',
      eventType: 'user_action',
      eventName: 'test_event',
      service: 'test_service',
      properties: { test: 'value' },
      timestamp: new Date()
    };
  }

  static async createTestProvider() {
    return {
      id: 'test-provider-123',
      name: 'openai',
      type: 'OPENAI',
      config: { apiKey: 'test-key' },
      isActive: true,
      createdAt: new Date()
    };
  }

  static async createTestModel() {
    return {
      id: 'test-model-123',
      name: 'gpt-3.5-turbo',
      provider: 'openai',
      type: 'CHAT',
      isActive: true,
      createdAt: new Date()
    };
  }

  static async createTestRequest() {
    return {
      userId: 'test-user-123',
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: 'Hello, how are you?' }],
      temperature: 0.7,
      maxTokens: 100
    };
  }

  static async createTestResponse() {
    return {
      id: 'test-response-123',
      choices: [{
        index: 0,
        message: { role: 'assistant', content: 'Hello! I am doing well, thank you for asking.' },
        finishReason: 'stop'
      }],
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
      model: 'gpt-3.5-turbo',
      created: Date.now()
    };
  }

  static async createTestError() {
    return {
      code: 'INSUFFICIENT_BALANCE',
      message: 'Insufficient balance',
      details: { required: 10.50, available: 5.00 }
    };
  }

  static async createTestHealthCheck() {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'healthy',
        redis: 'healthy',
        rabbitmq: 'healthy'
      }
    };
  }

  static async createTestMetrics() {
    return {
      totalRequests: 1000,
      successfulRequests: 950,
      failedRequests: 50,
      averageResponseTime: 150,
      totalCost: 25.50,
      totalTokens: 50000
    };
  }

  static async createTestReport() {
    return {
      userId: 'test-user-123',
      period: '2023-01-01 to 2023-12-31',
      totalTransactions: 10,
      totalCost: 25.50,
      currentBalance: 100.00,
      currency: 'USD',
      breakdown: {
        byService: { 'openai': 20.00, 'anthropic': 5.50 },
        byModel: { 'gpt-3.5-turbo': 15.00, 'gpt-4': 5.00 }
      }
    };
  }
}

// Test constants
export const TEST_CONSTANTS = {
  USER_ID: 'test-user-123',
  API_KEY: 'ak-test123456789',
  MODEL: 'gpt-3.5-turbo',
  PROMPT: 'Hello, how are you?'
};

// Test helpers
export class TestHelpers {
  static async createTestUser() {
    return TestUtils.createTestUser();
  }

  static async createTestApiKey() {
    return TestUtils.createTestApiKey();
  }

  static async createTestTransaction() {
    return TestUtils.createTestTransaction();
  }

  static async createTestBalance() {
    return TestUtils.createTestBalance();
  }

  static async createTestUsage() {
    return TestUtils.createTestUsage();
  }

  static async createTestEvent() {
    return TestUtils.createTestEvent();
  }

  static async createTestProvider() {
    return TestUtils.createTestProvider();
  }

  static async createTestModel() {
    return TestUtils.createTestModel();
  }

  static async createTestRequest() {
    return TestUtils.createTestRequest();
  }

  static async createTestResponse() {
    return TestUtils.createTestResponse();
  }

  static async createTestError() {
    return TestUtils.createTestError();
  }

  static async createTestHealthCheck() {
    return TestUtils.createTestHealthCheck();
  }

  static async createTestMetrics() {
    return TestUtils.createTestMetrics();
  }

  static async createTestReport() {
    return TestUtils.createTestReport();
  }

  static async createTestModule() {
    return TestUtils.createTestingModule();
  }

  static async createTestApp(module: any) {
    return TestUtils.createTestApp(module);
  }

  static async generateTestUser() {
    return TestUtils.generateTestUser();
  }

  static async generateTestApiKey() {
    return TestUtils.generateTestApiKey();
  }

  static async generateTestRequest() {
    return TestUtils.generateTestRequest();
  }

  static async generateRandomEmail() {
    return TestUtils.generateRandomEmail();
  }

  static async retry<T>(fn: () => Promise<T>, maxRetries: number = 3, delay: number = 1000): Promise<T> {
    let lastError: Error;
    
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError!;
  }
}

// Global test utilities
global.testUtils = TestUtils;

// Cleanup after each test
afterEach(() => {
  jest.clearAllMocks();
});

// Global error handler
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

export {};