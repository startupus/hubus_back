# Тестирование

## Обзор

AI Aggregator использует комплексный подход к тестированию, включающий unit тесты, integration тесты и end-to-end тесты. Все тесты написаны на TypeScript с использованием Jest и Supertest.

## Структура тестов

```
tests/
├── unit/                    # Unit тесты
│   ├── simple-auth.service.spec.ts      # Тесты Auth Service
│   ├── simple-billing.service.spec.ts   # Тесты Billing Service
│   └── simple-payment.service.spec.ts   # Тесты Payment Service
├── integration/            # Integration тесты
│   ├── api-gateway.spec.ts             # Тесты API Gateway
│   └── service-communication.spec.ts   # Тесты взаимодействия сервисов
├── e2e/                   # End-to-end тесты
│   ├── complete-workflow.spec.ts       # Полные пользовательские сценарии
│   └── performance.spec.ts             # Тесты производительности
├── shared/                # Общие утилиты
│   ├── test-helpers.ts    # Базовые моки и тестовые данные
│   └── test-utils.ts      # Утилиты для создания тестовых модулей
├── jest.config.js         # Конфигурация Jest
└── setup.ts              # Глобальная настройка тестов
```

## Типы тестов

### Unit тесты

Тестируют отдельные компоненты в изоляции.

**Покрытие:**
- ✅ Auth Service (CompanyService) - 11 тестов
- ✅ Billing Service - 10 тестов  
- ✅ Payment Service - 10 тестов

**Пример unit теста:**

```typescript
describe('CompanyService', () => {
  let service: CompanyService;
  let prismaMock: PrismaMock;

  beforeEach(() => {
    prismaMock = new PrismaMock();
    service = new CompanyService(prismaMock);
  });

  it('should register new company successfully', async () => {
    const companyData = {
      email: 'test@company.com',
      password: 'password123',
      name: 'Test Company'
    };

    prismaMock.company.findUnique.mockResolvedValue(null);
    prismaMock.company.create.mockResolvedValue(TestData.validCompany);

    const result = await service.registerCompany(companyData);

    expect(result).toBeDefined();
    expect(result.company.email).toBe(companyData.email);
    expect(prismaMock.company.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        email: companyData.email,
        passwordHash: expect.any(String)
      })
    });
  });
});
```

### Integration тесты

Тестируют взаимодействие между компонентами внутри сервиса.

**Пример integration теста:**

```typescript
describe('API Gateway Integration', () => {
  let app: INestApplication;
  let authService: AuthService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(PrismaService)
    .useValue(mockPrismaService)
    .compile();

    app = module.createNestApplication();
    await app.init();
  });

  it('should authenticate and create chat completion', async () => {
    // Регистрация
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@company.com',
        password: 'password123'
      });

    const token = registerResponse.body.accessToken;

    // Создание чата
    const chatResponse = await request(app.getHttpServer())
      .post('/api/v1/chat/completions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello!' }]
      });

    expect(chatResponse.status).toBe(200);
    expect(chatResponse.body.choices).toBeDefined();
  });
});
```

### E2E тесты

Тестируют полные пользовательские сценарии через все сервисы.

**Пример E2E теста:**

```typescript
describe('Complete Workflow', () => {
  it('should complete full user journey', async () => {
    // 1. Регистрация компании
    const registerResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: 'test@company.com',
        password: 'password123',
        name: 'Test Company'
      });

    expect(registerResponse.status).toBe(201);
    const token = registerResponse.body.accessToken;

    // 2. Создание API ключа
    const apiKeyResponse = await request(app.getHttpServer())
      .post('/api/v1/auth/api-keys')
      .set('Authorization', `Bearer ${token}`)
      .send({
        name: 'Test API Key'
      });

    expect(apiKeyResponse.status).toBe(201);
    const apiKey = apiKeyResponse.body.key;

    // 3. Пополнение баланса
    const paymentResponse = await request(app.getHttpServer())
      .post('/api/v1/payments')
      .set('Authorization', `Bearer ${token}`)
      .send({
        amount: 100.00,
        currency: 'USD'
      });

    expect(paymentResponse.status).toBe(201);

    // 4. Использование API
    const chatResponse = await request(app.getHttpServer())
      .post('/api/v1/chat/completions')
      .set('X-API-Key', apiKey)
      .send({
        model: 'gpt-4',
        messages: [{ role: 'user', content: 'Hello!' }]
      });

    expect(chatResponse.status).toBe(200);

    // 5. Проверка биллинга
    const balanceResponse = await request(app.getHttpServer())
      .get('/api/v1/billing/balance')
      .set('Authorization', `Bearer ${token}`);

    expect(balanceResponse.status).toBe(200);
    expect(balanceResponse.body.balance).toBeLessThan(100.00);
  });
});
```

## Запуск тестов

### Все тесты

```bash
# Запуск всех тестов
npm test

# С подробным выводом
npm run test:verbose

# С покрытием кода
npm run test:coverage
```

### По типам

```bash
# Unit тесты
npm run test:unit

# Integration тесты
npm run test:integration

# E2E тесты
npm run test:e2e
```

### По сервисам

```bash
# Тесты Auth Service
npm run test:auth

# Тесты Billing Service
npm run test:billing

# Тесты Payment Service
npm run test:payment
```

### PowerShell скрипты

```powershell
# Запуск всех тестов
.\run-tests.ps1

# Запуск unit тестов
.\run-tests.ps1 -Type unit

# Запуск с покрытием
.\run-tests.ps1 -Coverage

# Запуск в watch режиме
.\run-tests.ps1 -Watch
```

## Конфигурация

### Jest конфигурация

```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.ts',
    '**/?(*.)+(spec|test).ts'
  ],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'services/**/*.ts',
    '!services/**/*.d.ts',
    '!services/**/node_modules/**'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleNameMapper: {
    '^@ai-aggregator/shared$': '<rootDir>/services/shared/src'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts']
};
```

### Переменные окружения для тестов

```bash
# .env.test
NODE_ENV=test
LOG_LEVEL=error

# Базы данных для тестов
AUTH_DATABASE_URL=postgresql://postgres:password@localhost:5432/auth_test
BILLING_DATABASE_URL=postgresql://postgres:password@localhost:5432/billing_test
PAYMENT_DATABASE_URL=postgresql://postgres:password@localhost:5432/payment_test

# JWT для тестов
JWT_SECRET=test-jwt-secret

# Redis для тестов
REDIS_URL=redis://localhost:6379/1
```

## Тестовые данные

### Базовые тестовые данные

```typescript
// tests/shared/test-helpers.ts
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
    updatedAt: new Date()
  },

  validApiKey: {
    id: 'test-api-key-id',
    key: 'ak_test_1234567890abcdef',
    name: 'Test API Key',
    companyId: 'test-company-id',
    isActive: true,
    permissions: ['chat', 'billing'],
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  },

  validPayment: {
    id: 'test-payment-id',
    companyId: 'test-company-id',
    amount: 100.00,
    currency: 'USD',
    status: 'pending',
    createdAt: new Date()
  }
};
```

### Моки сервисов

```typescript
// tests/shared/test-utils.ts
export class TestUtils {
  static createMockPrismaService() {
    return {
      company: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn()
      },
      companyBalance: {
        findUnique: jest.fn(),
        upsert: jest.fn()
      },
      transaction: {
        create: jest.fn(),
        findMany: jest.fn()
      },
      payment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn()
      }
    };
  }

  static createTestingModule(moduleClass: any, overrides: any[] = []) {
    return Test.createTestingModule({
      imports: [moduleClass],
    })
    .overrideProvider(PrismaService)
    .useValue(TestUtils.createMockPrismaService())
    .overrideProvider(JwtService)
    .useValue({
      sign: jest.fn().mockReturnValue('mock-jwt-token'),
      verify: jest.fn().mockReturnValue({ sub: 'test-company-id' })
    });
  }
}
```

## Покрытие кода

### Настройка покрытия

```bash
# Запуск с покрытием
npm run test:coverage

# Просмотр отчета
open coverage/lcov-report/index.html
```

### Цели покрытия

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

### Исключения из покрытия

```javascript
// jest.config.js
collectCoverageFrom: [
  'services/**/*.ts',
  '!services/**/*.d.ts',
  '!services/**/node_modules/**',
  '!services/**/test/**',
  '!services/**/*.spec.ts',
  '!services/**/*.test.ts'
]
```

## Тестирование производительности

### Load тесты

```typescript
// tests/performance/load-testing.spec.ts
describe('Load Testing', () => {
  it('should handle 100 concurrent requests', async () => {
    const requests = Array.from({ length: 100 }, () =>
      request(app.getHttpServer())
        .post('/api/v1/chat/completions')
        .set('Authorization', `Bearer ${token}`)
        .send({
          model: 'gpt-4',
          messages: [{ role: 'user', content: 'Test message' }]
        })
    );

    const startTime = Date.now();
    const responses = await Promise.all(requests);
    const endTime = Date.now();

    const successCount = responses.filter(r => r.status === 200).length;
    const averageResponseTime = (endTime - startTime) / 100;

    expect(successCount).toBeGreaterThan(95);
    expect(averageResponseTime).toBeLessThan(2000);
  });
});
```

### Memory тесты

```typescript
// tests/performance/memory.spec.ts
describe('Memory Testing', () => {
  it('should not leak memory during long operations', async () => {
    const initialMemory = process.memoryUsage().heapUsed;

    // Выполнение множества операций
    for (let i = 0; i < 1000; i++) {
      await service.processRequest({
        model: 'gpt-4',
        messages: [{ role: 'user', content: `Message ${i}` }]
      });
    }

    // Принудительная сборка мусора
    global.gc && global.gc();

    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;

    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // 50MB
  });
});
```

## CI/CD интеграция

### GitHub Actions

```yaml
# .github/workflows/test.yml
name: Tests

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: password
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm run test:ci

    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        file: ./coverage/lcov.info
```

### Локальная настройка CI

```bash
# Запуск тестов в CI режиме
npm run test:ci

# Запуск с минимальным выводом
npm run test:silent

# Запуск только критичных тестов
npm run test:critical
```

## Отладка тестов

### Полезные команды

```bash
# Запуск конкретного теста
npm test -- --testNamePattern="should register company"

# Запуск тестов в watch режиме
npm run test:watch

# Запуск с отладкой
npm run test:debug

# Запуск с подробными логами
npm run test:verbose
```

### Отладка в IDE

1. Установите Jest расширение для VS Code
2. Настройте breakpoints в тестах
3. Запустите тесты в debug режиме

### Полезные утилиты

```typescript
// Отладочные утилиты
console.log('Test data:', JSON.stringify(data, null, 2));
console.log('Mock calls:', prismaMock.company.create.mock.calls);
console.log('Response:', JSON.stringify(response.body, null, 2));
```

## Лучшие практики

### 1. Именование тестов

```typescript
// Хорошо
describe('CompanyService', () => {
  describe('registerCompany', () => {
    it('should register new company successfully', async () => {
      // тест
    });

    it('should throw error if company already exists', async () => {
      // тест
    });
  });
});

// Плохо
describe('CompanyService', () => {
  it('test1', async () => {
    // тест
  });
});
```

### 2. Изоляция тестов

```typescript
// Хорошо - каждый тест независим
beforeEach(() => {
  prismaMock.company.findUnique.mockClear();
  prismaMock.company.create.mockClear();
});

// Плохо - тесты зависят друг от друга
let globalData = {};

it('should create data', async () => {
  globalData = await service.create(data);
});

it('should use created data', async () => {
  const result = await service.get(globalData.id);
});
```

### 3. Мокирование

```typescript
// Хорошо - мокируем только внешние зависимости
const mockPrisma = {
  company: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
};

// Плохо - мокируем внутренние методы
const mockService = {
  internalMethod: jest.fn(),
  publicMethod: jest.fn()
};
```

### 4. Тестовые данные

```typescript
// Хорошо - используем фабрики
const createTestCompany = (overrides = {}) => ({
  id: 'test-id',
  email: 'test@example.com',
  ...overrides
});

// Плохо - дублируем данные
const company1 = { id: '1', email: 'test1@example.com' };
const company2 = { id: '2', email: 'test2@example.com' };
```
