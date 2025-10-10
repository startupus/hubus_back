# Testing Guide

## 🧪 Testing Overview

The AI Aggregator Platform includes a comprehensive testing suite with unit tests, integration tests, and end-to-end tests.

## 📊 Test Structure

```
tests/
├── unit/                    # Unit tests for individual services
├── integration/             # Integration tests between services
├── e2e/                    # End-to-end tests
└── shared/                 # Shared test utilities
    └── test-utils.ts       # Common testing utilities
```

## 🚀 Quick Start

### Run All Tests
```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

### Run Specific Test Types
```bash
# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# E2E tests only
npm run test:e2e

# Specific test file
npm test services/test-basic/basic.spec.ts
```

## 🔧 Test Configuration

### Jest Configuration
The project uses Jest with TypeScript support. Configuration is in `jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/services', '<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'es2020',
        module: 'commonjs',
        // ... other TypeScript options
      }
    }]
  },
  moduleNameMapper: {
    '^@ai-aggregator/(.*)$': '<rootDir>/services/$1/src',
    '^@ai-aggregator/shared$': '<rootDir>/services/shared/src'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testTimeout: 30000,
  maxWorkers: 4
};
```

## 🛠️ Test Utilities

### TestUtils Class
The `TestUtils` class provides common testing utilities:

```typescript
import { TestUtils } from '../shared/test-utils';

describe('My Test Suite', () => {
  let service: MyService;
  let module: TestingModule;

  beforeEach(async () => {
    module = await TestUtils.createTestingModule([
      MyService,
      { provide: PrismaService, useValue: TestUtils.mockPrismaService() }
    ]);
    service = module.get<MyService>(MyService);
  });

  afterEach(async () => {
    await module.close();
  });

  it('should work', () => {
    expect(service).toBeDefined();
  });
});
```

### Available Methods

#### createTestingModule()
Creates a testing module with mocked dependencies:
```typescript
const module = await TestUtils.createTestingModule(
  providers: any[],
  controllers: any[],
  imports: any[],
  mockPrismaServiceInstance: any,
  mockBillingPrismaServiceInstance: any
);
```

#### mockPrismaService()
Creates a mock PrismaService for auth-service:
```typescript
const mockPrisma = TestUtils.mockPrismaService();
```

#### mockBillingPrismaService()
Creates a mock PrismaService for billing-service:
```typescript
const mockBillingPrisma = TestUtils.mockBillingPrismaService();
```

#### createTestApp()
Creates a test application from a module:
```typescript
const app = await TestUtils.createTestApp(module);
```

## 📝 Writing Tests

### Unit Tests

Unit tests focus on testing individual components in isolation:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { CompanyService } from '../../src/modules/auth/company.service';
import { PrismaService } from '../../src/common/prisma/prisma.service';
import { TestUtils } from '../../../../tests/shared/test-utils';

describe('CompanyService', () => {
  let service: CompanyService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: PrismaService,
          useValue: TestUtils.mockPrismaService()
        }
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('registerCompany', () => {
    it('should register a company successfully', async () => {
      // Arrange
      const companyData = {
        name: 'Test Company',
        email: 'test@example.com',
        password: 'password123'
      };

      const mockCompany = {
        id: 'company-id',
        ...companyData,
        passwordHash: 'hashed-password'
      };

      jest.spyOn(prismaService.company, 'create').mockResolvedValue(mockCompany);

      // Act
      const result = await service.registerCompany(companyData);

      // Assert
      expect(result).toBeDefined();
      expect(result.company.name).toBe(companyData.name);
      expect(prismaService.company.create).toHaveBeenCalled();
    });
  });
});
```

### Integration Tests

Integration tests test the interaction between components:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../src/app.module';

describe('Auth Integration Tests', () => {
  let app: INestApplication;
  let moduleRef: TestingModule;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(PrismaService)
    .useValue(TestUtils.mockPrismaService())
    .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /v1/auth/register', () => {
    it('should register a company', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/auth/register')
        .send({
          name: 'Test Company',
          email: 'test@example.com',
          password: 'password123'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.company).toBeDefined();
    });
  });
});
```

### E2E Tests

End-to-end tests test the complete user workflow:

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';

describe('Complete Workflow E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete full user workflow', async () => {
    // 1. Register company
    const registerResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        name: 'Test Company',
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(201);

    const { accessToken } = registerResponse.body;

    // 2. Get balance
    const balanceResponse = await request(app.getHttpServer())
      .get('/v1/billing/balance')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(balanceResponse.body.balance).toBeDefined();

    // 3. Send chat request
    const chatResponse = await request(app.getHttpServer())
      .post('/v1/chat/completions')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello!' }]
      })
      .expect(200);

    expect(chatResponse.body.choices).toBeDefined();
  });
});
```

## 🎯 Test Categories

### 1. Unit Tests
- **Location**: `services/*/test/unit/`
- **Purpose**: Test individual methods and classes
- **Mocking**: Heavy use of mocks
- **Speed**: Fast execution

### 2. Integration Tests
- **Location**: `services/*/test/integration/`
- **Purpose**: Test service interactions
- **Mocking**: Minimal mocking
- **Speed**: Medium execution

### 3. E2E Tests
- **Location**: `tests/e2e/`
- **Purpose**: Test complete workflows
- **Mocking**: No mocking
- **Speed**: Slow execution

## 📊 Test Coverage

### Coverage Goals
- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### View Coverage Report
```bash
# Generate coverage report
npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html
```

### Coverage Configuration
```javascript
// jest.config.js
collectCoverageFrom: [
  'services/**/*.service.ts',
  'services/**/*.controller.ts',
  '!services/**/*.module.ts',
  '!services/**/*.dto.ts',
  '!services/**/main.ts'
],
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

## 🔧 Mocking Strategies

### Database Mocking
```typescript
const mockPrismaService = {
  company: {
    create: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn()
  },
  $transaction: jest.fn()
};
```

### External Service Mocking
```typescript
const mockHttpService = {
  post: jest.fn().mockResolvedValue({
    data: { success: true }
  })
};
```

### JWT Service Mocking
```typescript
const mockJwtService = {
  sign: jest.fn().mockReturnValue('mock-jwt-token'),
  verify: jest.fn().mockReturnValue({ userId: 'test-user' })
};
```

## 🚀 Performance Testing

### Load Testing
```typescript
describe('Load Testing', () => {
  it('should handle 100 concurrent requests', async () => {
    const promises = Array.from({ length: 100 }, () =>
      request(app.getHttpServer())
        .get('/v1/health')
    );

    const responses = await Promise.all(promises);
    
    responses.forEach(response => {
      expect(response.status).toBe(200);
    });
  });
});
```

### Memory Testing
```typescript
describe('Memory Testing', () => {
  it('should not leak memory', async () => {
    const initialMemory = process.memoryUsage();
    
    // Perform operations
    for (let i = 0; i < 1000; i++) {
      await service.someOperation();
    }
    
    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
    
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

## 🐛 Debugging Tests

### Debug Mode
```bash
# Run tests in debug mode
npm run test:debug

# Run specific test in debug mode
npm test -- --testNamePattern="should register company" --verbose
```

### Console Logging
```typescript
describe('Debug Test', () => {
  it('should debug properly', async () => {
    console.log('Starting test...');
    
    const result = await service.someMethod();
    
    console.log('Result:', result);
    expect(result).toBeDefined();
  });
});
```

### Test Timeout
```typescript
describe('Slow Test', () => {
  it('should complete within timeout', async () => {
    // Test implementation
  }, 10000); // 10 second timeout
});
```

## 📋 Test Checklist

### Before Writing Tests
- [ ] Understand the component being tested
- [ ] Identify dependencies to mock
- [ ] Plan test scenarios
- [ ] Set up test data

### Writing Tests
- [ ] Follow AAA pattern (Arrange, Act, Assert)
- [ ] Use descriptive test names
- [ ] Test both success and failure cases
- [ ] Mock external dependencies
- [ ] Clean up after tests

### After Writing Tests
- [ ] Run tests locally
- [ ] Check test coverage
- [ ] Verify CI/CD pipeline
- [ ] Update documentation

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
name: Tests
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: npm test
      - run: npm run test:coverage
```

### GitLab CI
```yaml
test:
  stage: test
  script:
    - npm install
    - npm test
    - npm run test:coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
```

## 📚 Best Practices

### Test Organization
- Group related tests in `describe` blocks
- Use clear, descriptive test names
- Keep tests focused and simple
- Avoid testing implementation details

### Mock Management
- Mock at the boundary of your unit
- Use realistic mock data
- Reset mocks between tests
- Verify mock interactions

### Assertions
- Use specific assertions
- Test one thing per test
- Use meaningful error messages
- Test edge cases and error conditions

### Performance
- Keep tests fast
- Use parallel execution when possible
- Avoid unnecessary setup/teardown
- Mock slow operations

---

**Last Updated**: December 2024
**Testing Version**: 1.0.0
