# Billing Service

## 🎯 Назначение

Billing Service управляет биллингом, тарификацией и финансовыми операциями. Обеспечивает точный расчет стоимости AI запросов, управление балансами пользователей и обработку платежей.

## 🏗️ Архитектура

```
Request → Billing Service → Database
   ↓            ↓              ↓
Calculate   Process        Store
Cost        Payment        Transaction
```

## 🚀 Запуск

```bash
# Запуск сервиса
docker-compose up -d billing-service

# Проверка статуса
curl http://localhost:3004/health
```

## 📡 API Endpoints

### Баланс
- `GET /billing/balance/:userId` - Получение баланса
- `PUT /billing/balance/:userId` - Обновление баланса
- `POST /billing/balance/:userId/credit` - Пополнение баланса

### Транзакции
- `GET /billing/transactions/:userId` - История транзакций
- `POST /billing/transactions` - Создание транзакции
- `GET /billing/transactions/:id` - Детали транзакции

### Тарификация
- `POST /billing/calculate-cost` - Расчет стоимости
- `POST /billing/charge` - Списание средств
- `POST /billing/refund` - Возврат средств

### Платежи
- `POST /billing/payments` - Обработка платежа
- `GET /billing/payments/:userId` - История платежей
- `POST /billing/payments/:id/refund` - Возврат платежа

### Отчеты
- `GET /billing/reports/usage/:userId` - Отчет по использованию
- `GET /billing/reports/costs/:userId` - Отчет по расходам
- `GET /billing/reports/revenue` - Отчет по доходам

## 🔧 Конфигурация

### Environment Variables
```env
PORT=3004
DATABASE_URL=postgresql://user:password@billing-db:5432/billing_db
REDIS_URL=redis://redis:6379
CURRENCY=USD
DEFAULT_BALANCE=100.0
```

### База данных
```sql
-- Пользователи
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Балансы
CREATE TABLE user_balances (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  balance DECIMAL(10,2) DEFAULT 100.0,
  currency VARCHAR(3) DEFAULT 'USD',
  credit_limit DECIMAL(10,2),
  last_updated TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Транзакции
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  type VARCHAR(20) NOT NULL, -- DEBIT, CREDIT, REFUND
  amount DECIMAL(10,2) NOT NULL,
  description TEXT,
  provider VARCHAR(100),
  model VARCHAR(100),
  tokens INTEGER,
  cost_per_token DECIMAL(10,6),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 💰 Тарификация

### Модели ценообразования
```typescript
interface PricingModel {
  provider: string;
  model: string;
  inputCostPerToken: number;   // $ за входной токен
  outputCostPerToken: number;  // $ за выходной токен
  baseCost: number;            // Базовая стоимость
  minimumCost: number;         // Минимальная стоимость
}
```

### Расчет стоимости
```typescript
interface CostCalculation {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  provider: string;
  model: string;
}
```

### Примеры тарифов
```typescript
const pricingModels = {
  'openai': {
    'gpt-4': {
      inputCostPerToken: 0.00003,
      outputCostPerToken: 0.00006,
      baseCost: 0.01
    },
    'gpt-3.5-turbo': {
      inputCostPerToken: 0.0000015,
      outputCostPerToken: 0.000002,
      baseCost: 0.005
    }
  },
  'openrouter': {
    'gpt-4': {
      inputCostPerToken: 0.00002,
      outputCostPerToken: 0.00004,
      baseCost: 0.008
    }
  }
};
```

## 🔄 API Использование

### Получение баланса
```typescript
GET /billing/balance/b6793877-246a-4e3a-807f-50e494aa5188

// Ответ
{
  "success": true,
  "message": "Balance retrieved successfully",
  "balance": {
    "id": "uuid",
    "userId": "b6793877-246a-4e3a-807f-50e494aa5188",
    "balance": "100.00",
    "currency": "USD",
    "creditLimit": null,
    "lastUpdated": "2025-10-05T22:17:59.301Z"
  }
}
```

### Расчет стоимости
```typescript
POST /billing/calculate-cost
{
  "provider": "openai",
  "model": "gpt-4",
  "inputTokens": 100,
  "outputTokens": 50
}

// Ответ
{
  "success": true,
  "cost": {
    "inputCost": 0.003,
    "outputCost": 0.003,
    "totalCost": 0.006,
    "currency": "USD"
  }
}
```

### Списание средств
```typescript
POST /billing/charge
{
  "userId": "b6793877-246a-4e3a-807f-50e494aa5188",
  "amount": 0.006,
  "description": "GPT-4 usage",
  "provider": "openai",
  "model": "gpt-4",
  "tokens": 150
}

// Ответ
{
  "success": true,
  "transactionId": "uuid",
  "newBalance": 99.994,
  "message": "Charge processed successfully"
}
```

## 💳 Платежи

### Обработка платежей
```typescript
POST /billing/payments
{
  "userId": "b6793877-246a-4e3a-807f-50e494aa5188",
  "amount": 50.0,
  "currency": "USD",
  "paymentMethod": "card",
  "description": "Account top-up"
}

// Ответ
{
  "success": true,
  "paymentId": "uuid",
  "status": "completed",
  "newBalance": 149.994
}
```

### История платежей
```typescript
GET /billing/payments/b6793877-246a-4e3a-807f-50e494aa5188

// Ответ
{
  "success": true,
  "payments": [
    {
      "id": "uuid",
      "amount": 50.0,
      "currency": "USD",
      "status": "completed",
      "createdAt": "2025-10-05T22:30:00Z"
    }
  ]
}
```

## 📊 Отчеты

### Отчет по использованию
```typescript
GET /billing/reports/usage/b6793877-246a-4e3a-807f-50e494aa5188?period=30d

// Ответ
{
  "success": true,
  "report": {
    "period": "30d",
    "totalRequests": 150,
    "totalTokens": 45000,
    "totalCost": 12.50,
    "byProvider": {
      "openai": { "requests": 100, "cost": 8.50 },
      "openrouter": { "requests": 50, "cost": 4.00 }
    },
    "byModel": {
      "gpt-4": { "requests": 80, "cost": 7.20 },
      "gpt-3.5-turbo": { "requests": 70, "cost": 5.30 }
    }
  }
}
```

## 🔄 Интеграция

### gRPC Endpoints
- `GetBalance` - получение баланса
- `ChargeUser` - списание средств
- `ValidatePayment` - валидация платежа

### HTTP Endpoints
- Все REST API endpoints
- Swagger документация на `/api`

## 📊 Мониторинг

### Метрики
- Общий объем транзакций
- Средняя стоимость запроса
- Популярные модели
- Конверсия платежей

### Логирование
```json
{
  "timestamp": "2025-10-05T22:30:00.000Z",
  "level": "INFO",
  "service": "billing-service",
  "action": "charge_processed",
  "userId": "uuid",
  "amount": 0.006,
  "transactionId": "uuid"
}
```

## 🚨 Обработка ошибок

### Типы ошибок
- `400 Bad Request` - неверные данные
- `402 Payment Required` - недостаточно средств
- `404 Not Found` - пользователь не найден
- `409 Conflict` - дублирование транзакции
- `500 Internal Server Error` - внутренние ошибки

### Безопасность
- Аудит всех транзакций
- Защита от двойного списания
- Валидация всех платежей
- Шифрование чувствительных данных

## 🔧 Разработка

### Структура проекта
```
src/
├── billing/        # Основная логика
├── pricing/        # Тарификация
├── payments/       # Платежи
├── reports/        # Отчеты
├── validation/     # Валидация
└── common/         # Общие утилиты
```

### Тестирование
```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Тестирование биллинга
npm run test:billing
```

## 📈 Производительность

### Оптимизации
- Индексы в базе данных
- Кэширование балансов
- Batch обработка транзакций
- Асинхронная обработка платежей

### Масштабирование
- Горизонтальное масштабирование
- Database sharding
- Read replicas
- Message queues для асинхронной обработки
