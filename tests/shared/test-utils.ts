import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

/**
 * Simplified test utilities for the AI Aggregator project
 */
export class TestUtils {
  /**
   * Create a test module with common providers
   */
  static async createTestModule(moduleClass: any, providers: any[] = []): Promise<TestingModule> {
    const moduleRef = await Test.createTestingModule({
      imports: [moduleClass],
      providers: [
        ...providers
      ],
    })
    .compile();

    return moduleRef;
  }

  /**
   * Create a testing module with mocked PrismaService.
   */
  static async createTestingModule(
    providers: any[] = [],
    controllers: any[] = [],
    imports: any[] = [],
    mockPrismaServiceInstance: any = TestUtils.mockPrismaService(),
    mockBillingPrismaServiceInstance: any = TestUtils.mockBillingPrismaService(),
  ): Promise<TestingModule> {
    const moduleBuilder = Test.createTestingModule({
      imports: imports,
      controllers: controllers,
      providers: [
        ...providers,
        { provide: 'PrismaService', useValue: mockPrismaServiceInstance },
        { provide: 'BillingPrismaService', useValue: mockBillingPrismaServiceInstance },
      ],
    });
    return moduleBuilder.compile();
  }

  /**
   * Create a test app from module
   */
  static async createTestApp(module: TestingModule): Promise<INestApplication> {
    const app = module.createNestApplication();
    await app.init();
    return app;
  }

  /**
   * Generic mock for PrismaService in auth-service
   */
  static mockPrismaService() {
    return {
      company: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      apiKey: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      referralCode: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      companyProviderPreference: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      loginAttempt: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
  }

  /**
   * Generic mock for PrismaService in billing-service
   */
  static mockBillingPrismaService() {
    return {
      companyBalance: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
        findMany: jest.fn(),
        aggregate: jest.fn(),
      },
      pricingPlan: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      subscription: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      referralTransaction: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
  }

  /**
   * Create a mock Prisma service for testing
   */
  static createMockPrismaService() {
    return {
      company: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        count: jest.fn(),
      },
      apiKey: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      companyProviderPreference: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      referralCode: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      userBalance: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      transaction: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        aggregate: jest.fn(),
      },
      pricingPlan: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      subscription: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      loginAttempt: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      $transaction: jest.fn(),
      $connect: jest.fn(),
      $disconnect: jest.fn(),
    };
  }

  /**
   * Create test data for companies
   */
  static createTestCompany(overrides: any = {}) {
    return {
      id: 'test-company-id',
      name: 'Test Company',
      email: 'test@example.com',
      passwordHash: 'hashed-password',
      isActive: true,
      isVerified: true,
      role: 'company',
      description: 'Test company description',
      website: 'https://test.com',
      phone: '+1234567890',
      address: { city: 'Test City', country: 'Test Country' },
      settings: {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastLoginAt: new Date(),
      metadata: {},
      parentCompanyId: null,
      billingMode: 'SELF_PAID',
      position: null,
      department: null,
      referralCode: 'TEST123',
      referredBy: null,
      referralCodeId: null,
      ...overrides
    };
  }

  /**
   * Create test data for API keys
   */
  static createTestApiKey(overrides: any = {}) {
    return {
      id: 'test-api-key-id',
      key: 'ak_test123456789',
      companyId: 'test-company-id',
      name: 'Test API Key',
      description: 'Test API key description',
      isActive: true,
      permissions: ['read', 'write'],
      lastUsedAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      createdAt: new Date(),
      metadata: {},
      ...overrides
    };
  }

  /**
   * Create test data for provider preferences
   */
  static createTestProviderPreference(overrides: any = {}) {
    return {
      id: 'test-preference-id',
      companyId: 'test-company-id',
      model: 'gpt-4',
      preferredProvider: 'openrouter',
      isActive: true,
      priority: 1,
      fallbackProviders: ['openai'],
      costLimit: 0.00005,
      maxTokens: 4096,
      metadata: { reason: 'Cost optimization' },
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Create test data for user balances
   */
  static createTestUserBalance(overrides: any = {}) {
    return {
      id: 'test-balance-id',
      userId: 'test-company-id',
      balance: 100.0,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Create test data for transactions
   */
  static createTestTransaction(overrides: any = {}) {
    return {
      id: 'test-transaction-id',
      userId: 'test-company-id',
      type: 'DEBIT',
      amount: 10.0,
      currency: 'USD',
      description: 'Test transaction',
      provider: 'openai',
      metadata: {},
      createdAt: new Date(),
      ...overrides
    };
  }

  /**
   * Create test data for pricing plans
   */
  static createTestPricingPlan(overrides: any = {}) {
    return {
      id: 'test-plan-id',
      name: 'Test Plan',
      description: 'Test pricing plan',
      type: 'TOKEN_BASED',
      price: 50.0,
      currency: 'USD',
      billingCycle: 'MONTHLY',
      isActive: true,
      inputTokens: 10000,
      outputTokens: 20000,
      inputTokenPrice: 0.00003,
      outputTokenPrice: 0.00006,
      discountPercent: 10.0,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Create test data for subscriptions
   */
  static createTestSubscription(overrides: any = {}) {
    return {
      id: 'test-subscription-id',
      companyId: 'test-company-id',
      planId: 'test-plan-id',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      inputTokensUsed: 0,
      outputTokensUsed: 0,
      inputTokensLimit: 10000,
      outputTokensLimit: 20000,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides
    };
  }

  /**
   * Mock LoggerUtil for testing
   */
  static mockLoggerUtil() {
    // Mock console methods instead of LoggerUtil
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  }

  /**
   * Restore LoggerUtil mocks
   */
  static restoreLoggerUtil() {
    jest.restoreAllMocks();
  }

  /**
   * Wait for async operations to complete
   */
  static async waitFor(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random test data
   */
  static generateRandomEmail(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`;
  }

  static generateRandomId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  }

  static generateRandomApiKey(): string {
    return `ak_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Assert that a function throws an error with specific message
   */
  static async expectToThrow(
    fn: () => Promise<any>,
    expectedMessage?: string
  ): Promise<void> {
    try {
      await fn();
      throw new Error('Expected function to throw an error');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (expectedMessage && !errorMessage.includes(expectedMessage)) {
        throw new Error(`Expected error message to contain "${expectedMessage}", but got "${errorMessage}"`);
      }
    }
  }

  /**
   * Create a test HTTP request
   */
  static createTestRequest(overrides: any = {}) {
    return {
      headers: {
        authorization: 'Bearer test-token',
        'content-type': 'application/json',
        ...overrides.headers
      },
      body: {},
      params: {},
      query: {},
      user: {
        companyId: 'test-company-id',
        email: 'test@example.com',
        role: 'company'
      },
      ...overrides
    };
  }

  /**
   * Create a test HTTP response
   */
  static createTestResponse(overrides: any = {}) {
    return {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      ...overrides
    };
  }
}

/**
 * Test constants
 */
export const TEST_CONSTANTS = {
  COMPANY_ID: 'test-company-id',
  API_KEY_ID: 'test-api-key-id',
  PREFERENCE_ID: 'test-preference-id',
  BALANCE_ID: 'test-balance-id',
  TRANSACTION_ID: 'test-transaction-id',
  PLAN_ID: 'test-plan-id',
  SUBSCRIPTION_ID: 'test-subscription-id',
  JWT_SECRET: 'test-jwt-secret',
  API_KEY: 'ak_test123456789',
  EMAIL: 'test@example.com',
  PASSWORD: 'test-password',
  MODEL: 'gpt-4',
  PROVIDER: 'openrouter',
  AMOUNT: 100.0,
  CURRENCY: 'USD'
};

/**
 * Test error messages
 */
export const TEST_ERRORS = {
  COMPANY_NOT_FOUND: 'Company not found',
  API_KEY_NOT_FOUND: 'API key not found',
  PREFERENCE_NOT_FOUND: 'Provider preference not found',
  BALANCE_NOT_FOUND: 'User balance not found',
  TRANSACTION_NOT_FOUND: 'Transaction not found',
  PLAN_NOT_FOUND: 'Pricing plan not found',
  SUBSCRIPTION_NOT_FOUND: 'Subscription not found',
  INVALID_CREDENTIALS: 'Invalid credentials',
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  VALIDATION_ERROR: 'Validation failed',
  INTERNAL_ERROR: 'Internal server error'
};
