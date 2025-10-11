import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

/**
 * Утилиты для создания тестовых модулей
 */
export class TestModuleBuilder {
  private providers: any[] = [];
  private controllers: any[] = [];
  private imports: any[] = [];

  addProvider(provider: any) {
    this.providers.push(provider);
    return this;
  }

  addController(controller: any) {
    this.controllers.push(controller);
    return this;
  }

  addImport(module: any) {
    this.imports.push(module);
    return this;
  }

  async build(): Promise<TestingModule> {
    return Test.createTestingModule({
      imports: this.imports,
      controllers: this.controllers,
      providers: this.providers,
    }).compile();
  }
}

/**
 * Утилиты для HTTP тестирования
 */
export class HttpTestHelper {
  constructor(private app: INestApplication) {}

  async post(url: string, data?: any) {
    return request(this.app.getHttpServer()).post(url).send(data);
  }

  async get(url: string) {
    return request(this.app.getHttpServer()).get(url);
  }

  async put(url: string, data?: any) {
    return request(this.app.getHttpServer()).put(url).send(data);
  }

  async delete(url: string) {
    return request(this.app.getHttpServer()).delete(url);
  }

  withAuth(token: string) {
    return {
      post: (url: string, data?: any) => 
        request(this.app.getHttpServer()).post(url).set('Authorization', `Bearer ${token}`).send(data),
      get: (url: string) => 
        request(this.app.getHttpServer()).get(url).set('Authorization', `Bearer ${token}`),
      put: (url: string, data?: any) => 
        request(this.app.getHttpServer()).put(url).set('Authorization', `Bearer ${token}`).send(data),
      delete: (url: string) => 
        request(this.app.getHttpServer()).delete(url).set('Authorization', `Bearer ${token}`),
    };
  }
}

/**
 * Моки для Prisma
 */
export class PrismaMock {
  company = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  companyBalance = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    upsert: jest.fn(),
  };

  transaction = {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };

  usageEvent = {
    findMany: jest.fn(),
    create: jest.fn(),
    count: jest.fn(),
  };

  payment = {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  };

  $transaction = jest.fn();
  $queryRaw = jest.fn();
  $connect = jest.fn();
  $disconnect = jest.fn();
}

/**
 * Тестовые данные
 */
export const TestData = {
  validCompany: {
    id: 'test-company-id',
    email: 'test@company.com',
    name: 'Test Company',
    passwordHash: 'hashed-password',
    isActive: true,
    isVerified: true,
    role: 'company',
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  validCompanyBalance: {
    id: 'test-balance-id',
    companyId: 'test-company-id',
    balance: 1000.0,
    creditLimit: 500.0,
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  validTransaction: {
    id: 'test-transaction-id',
    companyId: 'test-company-id',
    type: 'DEBIT',
    amount: 100.0,
    description: 'Test transaction',
    createdAt: new Date(),
  },

  validPayment: {
    id: 'test-payment-id',
    companyId: 'test-company-id',
    amount: 500.0,
    currency: 'RUB',
    status: 'PENDING',
    createdAt: new Date(),
  },

  validJwtPayload: {
    sub: 'test-company-id',
    email: 'test@company.com',
    role: 'company',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
  },
};

/**
 * Утилиты для валидации
 */
export class ValidationHelper {
  static expectValidResponse(response: any, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
  }

  static expectErrorResponse(response: any, expectedStatus: number) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toHaveProperty('message');
  }

  static expectValidationError(response: any) {
    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message');
    expect(Array.isArray(response.body.message) || typeof response.body.message === 'string').toBe(true);
  }

  static expectUnauthorized(response: any) {
    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
  }

  static expectForbidden(response: any) {
    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message');
  }

  static expectNotFound(response: any) {
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty('message');
  }
}

/**
 * Утилиты для работы с датами
 */
export class DateHelper {
  static createDate(daysAgo: number = 0): Date {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date;
  }

  static createDateString(daysAgo: number = 0): string {
    return this.createDate(daysAgo).toISOString();
  }

  static isRecentDate(date: Date | string, maxMinutes: number = 5): boolean {
    const testDate = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMinutes = (now.getTime() - testDate.getTime()) / (1000 * 60);
    return diffMinutes <= maxMinutes;
  }
}

/**
 * Утилиты для работы с моками
 */
export class MockHelper {
  static setupPrismaMock(prismaMock: PrismaMock) {
    // Настройка базовых моков
    prismaMock.company.findUnique.mockResolvedValue(TestData.validCompany);
    prismaMock.companyBalance.findUnique.mockResolvedValue(TestData.validCompanyBalance);
    prismaMock.transaction.findMany.mockResolvedValue([TestData.validTransaction]);
    prismaMock.payment.findMany.mockResolvedValue([TestData.validPayment]);
    
    // Настройка транзакций
    prismaMock.$transaction.mockImplementation(async (callback) => {
      return callback(prismaMock);
    });

    return prismaMock;
  }

  static resetAllMocks(prismaMock: PrismaMock) {
    Object.values(prismaMock).forEach(mock => {
      if (typeof mock === 'function' && mock.mockReset) {
        mock.mockReset();
      }
    });
  }
}
