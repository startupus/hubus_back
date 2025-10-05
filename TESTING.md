# 🧪 Comprehensive Testing Guide

## 📋 Overview

This project includes a comprehensive testing suite covering all aspects of the AI Aggregator microservices architecture:

- **Unit Tests** - Individual component testing
- **Integration Tests** - Service interaction testing  
- **E2E Tests** - Complete user workflow testing
- **Performance Tests** - Load and stress testing
- **Security Tests** - Security vulnerability testing

## 🚀 Quick Start

### Prerequisites

```bash
# Install dependencies
npm install

# Start services
npm run start

# Run all tests
npm test
```

### Test Categories

```bash
# Unit tests only
npm run test:unit

# Integration tests
npm run test:integration

# End-to-end tests
npm run test:e2e

# Performance tests
npm run test:performance

# Security tests
npm run test:security

# All tests with coverage
npm run test:coverage
```

## 📁 Test Structure

```
tests/
├── setup.ts                    # Global test setup
├── e2e/                        # End-to-end tests
│   └── complete-flow.spec.ts   # Complete user workflows
├── performance/                # Performance tests
│   └── load-testing.spec.ts   # Load and stress tests
├── security/                   # Security tests
│   └── security.spec.ts      # Security vulnerability tests
└── integration/               # Integration tests
    └── service-integration.spec.ts

services/
├── auth-service/src/
│   ├── **/*.spec.ts          # Unit tests
│   └── **/*.test.ts          # Additional tests
├── billing-service/src/
│   ├── **/*.spec.ts
│   └── **/*.test.ts
├── analytics-service/src/
│   ├── **/*.spec.ts
│   └── **/*.test.ts
├── provider-orchestrator/src/
│   ├── **/*.spec.ts
│   └── **/*.test.ts
├── proxy-service/src/
│   ├── **/*.spec.ts
│   └── **/*.test.ts
├── api-gateway/src/
│   ├── **/*.spec.ts
│   └── **/*.test.ts
└── shared/src/
    ├── **/*.spec.ts
    └── **/*.test.ts
```

## 🔧 Test Configuration

### Jest Configuration

The project uses Jest with the following configuration:

```javascript
// jest.config.js
module.exports = {
  projects: [
    // Individual service configurations
    {
      displayName: 'API Gateway',
      testMatch: ['<rootDir>/services/api-gateway/src/**/*.spec.ts'],
      // ... other config
    },
    // ... other services
  ],
  collectCoverage: true,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  testTimeout: 30000,
  verbose: true,
};
```

### Test Environment Setup

```typescript
// tests/setup.ts
import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

export class TestUtils {
  static async createTestingModule(providers: any[] = []): Promise<TestingModule> {
    // Test module creation
  }
  
  static async createTestApp(module: TestingModule): Promise<INestApplication> {
    // Test app creation
  }
  
  // Helper methods for test data generation
  static generateMockUser(overrides: any = {}) { /* ... */ }
  static generateMockTransaction(overrides: any = {}) { /* ... */ }
  // ... other helpers
}
```

## 🧪 Test Types

### 1. Unit Tests

Test individual components in isolation:

```typescript
// Example: BillingService unit test
describe('BillingService', () => {
  let service: BillingService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: {
            userBalance: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
            transaction: {
              create: jest.fn(),
              findMany: jest.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
  });

  it('should update user balance', async () => {
    // Test implementation
  });
});
```

### 2. Integration Tests

Test service interactions:

```typescript
// Example: Service integration test
describe('Service Integration', () => {
  it('should process AI request with billing', async () => {
    // 1. Make AI request
    const aiResponse = await request(app.getHttpServer())
      .post('/proxy/chat/completions')
      .send(aiRequest)
      .expect(200);

    // 2. Track usage
    const usageResponse = await request(app.getHttpServer())
      .post('/billing/usage/track')
      .send(usageData)
      .expect(201);

    // 3. Verify billing
    const balanceResponse = await request(app.getHttpServer())
      .get('/billing/balance/user-id')
      .expect(200);

    expect(balanceResponse.body.balance).toBeLessThan(initialBalance);
  });
});
```

### 3. E2E Tests

Test complete user workflows:

```typescript
// Example: Complete user flow
describe('Complete E2E Flow', () => {
  it('should complete full user registration and authentication', async () => {
    // Step 1: Register user
    const registerResponse = await request(app.getHttpServer())
      .post('/auth/register')
      .send(userData)
      .expect(201);

    // Step 2: Login user
    const loginResponse = await request(app.getHttpServer())
      .post('/auth/login')
      .send(loginData)
      .expect(200);

    // Step 3: Make AI request
    const aiResponse = await request(app.getHttpServer())
      .post('/proxy/chat/completions')
      .send(aiRequest)
      .expect(200);

    // Step 4: Verify billing
    const billingResponse = await request(app.getHttpServer())
      .get('/billing/report/user-id')
      .expect(200);

    // Verify complete flow
    expect(billingResponse.body.totalTransactions).toBeGreaterThan(0);
  });
});
```

### 4. Performance Tests

Test system performance under load:

```typescript
// Example: Load testing
describe('Performance and Load Testing', () => {
  it('should handle 1000 concurrent usage tracking requests', async () => {
    const startTime = Date.now();
    
    const usagePromises = Array.from({ length: 1000 }, (_, index) => {
      return request(app.getHttpServer())
        .post('/billing/usage/track')
        .send({
          userId: 'test-user-id',
          service: 'openai',
          tokens: 10 + (index % 100),
          model: 'gpt-3.5-turbo',
        });
    });

    const responses = await Promise.all(usagePromises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    // Performance assertion
    expect(duration).toBeLessThan(60000); // Should complete within 60 seconds
    expect(responses.every(r => r.status === 201)).toBe(true);
  });
});
```

### 5. Security Tests

Test security vulnerabilities:

```typescript
// Example: Security testing
describe('Security Testing', () => {
  it('should prevent SQL injection attacks', async () => {
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "'; INSERT INTO users VALUES ('hacker', 'password'); --",
    ];

    for (const payload of sqlInjectionPayloads) {
      await request(app.getHttpServer())
        .get(`/billing/balance/${payload}`)
        .expect(400);
    }
  });

  it('should prevent XSS attacks', async () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      'javascript:alert("XSS")',
      '<img src="x" onerror="alert(\'XSS\')">',
    ];

    for (const payload of xssPayloads) {
      await request(app.getHttpServer())
        .post('/billing/transaction')
        .send({ description: payload })
        .expect(400);
    }
  });
});
```

## 📊 Coverage Reports

### Running Coverage

```bash
# Generate coverage report
npm run test:coverage

# View coverage in browser
open coverage/index.html
```

### Coverage Thresholds

The project enforces the following coverage thresholds:

- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Coverage by Service

```bash
# Individual service coverage
npm run test:coverage -- --testPathPattern=auth-service
npm run test:coverage -- --testPathPattern=billing-service
npm run test:coverage -- --testPathPattern=analytics-service
```

## 🚀 CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        
    - name: Install dependencies
      run: npm ci
      
    - name: Run tests
      run: npm run test:ci
      
    - name: Upload coverage
      uses: codecov/codecov-action@v3
```

### Docker Testing

```bash
# Test in Docker environment
docker-compose -f docker-compose.test.yml up --build

# Run tests in container
docker-compose exec api-gateway npm test
```

## 🔍 Debugging Tests

### Debug Mode

```bash
# Run tests in debug mode
npm run test:debug

# Run specific test with debug
npm run test:debug -- --testNamePattern="should update user balance"
```

### Verbose Output

```bash
# Run tests with verbose output
npm run test:verbose

# Run tests with detailed logging
DEBUG=* npm test
```

### Test Isolation

```bash
# Run tests in isolation
npm run test:silent

# Clear test cache
npm run test:clear-cache
```

## 📈 Performance Monitoring

### Load Testing

```bash
# Run performance tests
npm run test:performance

# Run specific load test
npm run test:performance -- --testNamePattern="concurrent requests"
```

### Memory Testing

```bash
# Monitor memory usage
node --inspect-brk node_modules/.bin/jest --testPathPattern=performance
```

## 🛡️ Security Testing

### Security Scan

```bash
# Run security tests
npm run test:security

# Run specific security test
npm run test:security -- --testNamePattern="SQL injection"
```

### Vulnerability Testing

```bash
# Test for common vulnerabilities
npm audit

# Fix vulnerabilities
npm audit fix
```

## 📝 Test Documentation

### Writing Tests

1. **Follow naming conventions**:
   - Unit tests: `*.spec.ts`
   - Integration tests: `*.integration.spec.ts`
   - E2E tests: `*.e2e.spec.ts`

2. **Use descriptive test names**:
   ```typescript
   it('should update user balance when valid amount is provided', async () => {
     // Test implementation
   });
   ```

3. **Follow AAA pattern**:
   ```typescript
   it('should process payment successfully', async () => {
     // Arrange
     const paymentData = { amount: 100, method: 'stripe' };
     
     // Act
     const result = await billingService.processPayment(paymentData);
     
     // Assert
     expect(result).toBeDefined();
     expect(result.status).toBe('success');
   });
   ```

### Test Data Management

```typescript
// Use test utilities for consistent data
const mockUser = TestUtils.generateMockUser({
  email: 'test@example.com',
  balance: 100.00,
});

const mockTransaction = TestUtils.generateMockTransaction({
  amount: 50.00,
  type: 'DEBIT',
});
```

## 🎯 Best Practices

### 1. Test Isolation
- Each test should be independent
- Use `beforeEach` and `afterEach` for setup/cleanup
- Mock external dependencies

### 2. Test Coverage
- Aim for 80%+ coverage
- Test both happy path and error cases
- Include edge cases and boundary conditions

### 3. Performance
- Use `Promise.all` for concurrent operations
- Set appropriate timeouts
- Monitor memory usage

### 4. Security
- Test input validation
- Test authentication/authorization
- Test for common vulnerabilities

### 5. Maintainability
- Keep tests simple and focused
- Use descriptive names
- Document complex test scenarios

## 🚨 Troubleshooting

### Common Issues

1. **Tests timing out**:
   ```bash
   # Increase timeout
   npm run test -- --testTimeout=60000
   ```

2. **Memory leaks**:
   ```bash
   # Run with memory monitoring
   node --max-old-space-size=4096 node_modules/.bin/jest
   ```

3. **Database connection issues**:
   ```bash
   # Ensure services are running
   npm run start
   npm run health
   ```

4. **Port conflicts**:
   ```bash
   # Check for port usage
   lsof -i :3000
   ```

### Debug Commands

```bash
# Debug specific test
npm run test:debug -- --testNamePattern="specific test"

# Run tests with detailed output
npm run test:verbose

# Clear all caches
npm run test:clear-cache
```

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [NestJS Testing](https://docs.nestjs.com/fundamentals/testing)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

## 🤝 Contributing

When adding new tests:

1. Follow the existing patterns
2. Ensure adequate coverage
3. Include both positive and negative test cases
4. Update documentation as needed
5. Run the full test suite before submitting

## 📞 Support

For testing-related issues:

1. Check the troubleshooting section
2. Review test logs and coverage reports
3. Consult the documentation
4. Create an issue with detailed information

---

**Happy Testing! 🧪✨**
