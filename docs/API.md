# API Документация

## Обзор

AI Aggregator предоставляет RESTful API для интеграции с различными ИИ-провайдерами. Все запросы проходят через API Gateway, который обеспечивает аутентификацию, маршрутизацию и агрегацию ответов.

## Базовый URL

```
Production: https://api.ai-aggregator.com
Development: http://localhost:3000
```

## Аутентификация

### JWT токены

Большинство API endpoints требуют аутентификации через JWT токен:

```http
Authorization: Bearer <your-jwt-token>
```

### API ключи

Для программного доступа используйте API ключи:

```http
X-API-Key: <your-api-key>
```

## Общие заголовки

```http
Content-Type: application/json
Accept: application/json
Authorization: Bearer <token>
X-API-Key: <api-key>
X-Request-ID: <unique-request-id>
```

## Коды ответов

| Код | Описание |
|-----|----------|
| 200 | Успешный запрос |
| 201 | Ресурс создан |
| 400 | Некорректный запрос |
| 401 | Не авторизован |
| 403 | Доступ запрещен |
| 404 | Ресурс не найден |
| 409 | Конфликт |
| 429 | Превышен лимит запросов |
| 500 | Внутренняя ошибка сервера |

## Формат ошибок

```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ],
  "timestamp": "2023-12-01T12:00:00.000Z",
  "path": "/api/v1/auth/register"
}
```

## API Endpoints

### Аутентификация

#### Регистрация компании

```http
POST /api/v1/auth/register
```

**Тело запроса:**
```json
{
  "email": "admin@company.com",
  "password": "securepassword123",
  "name": "My Company",
  "description": "AI-powered company"
}
```

**Ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "company": {
    "id": "company-uuid",
    "email": "admin@company.com",
    "name": "My Company",
    "role": "company",
    "isVerified": false
  }
}
```

#### Вход в систему

```http
POST /api/v1/auth/login
```

**Тело запроса:**
```json
{
  "email": "admin@company.com",
  "password": "securepassword123"
}
```

**Ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "company": {
    "id": "company-uuid",
    "email": "admin@company.com",
    "name": "My Company",
    "role": "company",
    "isVerified": true
  }
}
```

#### Обновление токена

```http
POST /api/v1/auth/refresh
```

**Тело запроса:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Создание API ключа

```http
POST /api/v1/auth/api-keys
```

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Тело запроса:**
```json
{
  "name": "Production API Key",
  "permissions": ["chat", "billing", "analytics"]
}
```

**Ответ:**
```json
{
  "id": "api-key-uuid",
  "name": "Production API Key",
  "key": "ak_live_1234567890abcdef",
  "isActive": true,
  "permissions": ["chat", "billing", "analytics"],
  "createdAt": "2023-12-01T12:00:00.000Z",
  "expiresAt": "2024-12-01T12:00:00.000Z"
}
```

### Чат и ИИ

#### Создание чата

```http
POST /api/v1/chat/completions
```

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
# или
X-API-Key: <api-key>
```

**Тело запроса:**
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Привет! Как дела?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

**Ответ:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Привет! У меня все отлично, спасибо за вопрос!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  },
  "cost": 0.00125,
  "provider": "openai"
}
```

#### Стриминг чата

```http
POST /api/v1/chat/completions
```

**Тело запроса:**
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Расскажи длинную историю"
    }
  ],
  "stream": true
}
```

**Ответ (Server-Sent Events):**
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4","choices":[{"index":0,"delta":{"role":"assistant","content":"Однажды"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4","choices":[{"index":0,"delta":{"content":" в далекой"},"finish_reason":null}]}

data: [DONE]
```

#### Получение доступных моделей

```http
GET /api/v1/models
```

**Ответ:**
```json
{
  "data": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "provider": "openai",
      "context_length": 8192,
      "input_cost_per_token": 0.00003,
      "output_cost_per_token": 0.00006,
      "supported_features": ["chat", "completion", "function_calling"],
      "is_available": true
    },
    {
      "id": "claude-3-sonnet",
      "name": "Claude 3 Sonnet",
      "provider": "anthropic",
      "context_length": 200000,
      "input_cost_per_token": 0.000003,
      "output_cost_per_token": 0.000015,
      "supported_features": ["chat", "completion"],
      "is_available": true
    }
  ]
}
```

### Биллинг

#### Получение баланса

```http
GET /api/v1/billing/balance
```

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Ответ:**
```json
{
  "companyId": "company-uuid",
  "balance": 100.50,
  "currency": "USD",
  "creditLimit": 1000.00,
  "lastUpdated": "2023-12-01T12:00:00.000Z"
}
```

#### Получение истории транзакций

```http
GET /api/v1/billing/transactions
```

**Параметры запроса:**
- `page` (number): Номер страницы (по умолчанию: 1)
- `limit` (number): Количество записей на странице (по умолчанию: 20)
- `startDate` (string): Дата начала (ISO 8601)
- `endDate` (string): Дата окончания (ISO 8601)
- `type` (string): Тип транзакции (DEBIT, CREDIT)

**Ответ:**
```json
{
  "data": [
    {
      "id": "transaction-uuid",
      "type": "DEBIT",
      "amount": 0.00125,
      "currency": "USD",
      "description": "GPT-4 usage",
      "metadata": {
        "model": "gpt-4",
        "provider": "openai",
        "tokens": 25
      },
      "createdAt": "2023-12-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### Пополнение баланса

```http
POST /api/v1/billing/deposit
```

**Тело запроса:**
```json
{
  "amount": 50.00,
  "currency": "USD",
  "paymentMethod": "card"
}
```

**Ответ:**
```json
{
  "transactionId": "transaction-uuid",
  "amount": 50.00,
  "currency": "USD",
  "status": "pending",
  "paymentUrl": "https://payment.example.com/pay/123"
}
```

### Платежи

#### Создание платежа

```http
POST /api/v1/payments
```

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Тело запроса:**
```json
{
  "amount": 1000.00,
  "currency": "RUB",
  "description": "Пополнение баланса"
}
```

**Ответ:**
```json
{
  "id": "payment-uuid",
  "status": "pending",
  "confirmationUrl": "https://yookassa.ru/payment/123",
  "amount": "1000.00",
  "currency": "RUB"
}
```

#### Получение статуса платежа

```http
GET /api/v1/payments/{paymentId}
```

**Ответ:**
```json
{
  "id": "payment-uuid",
  "status": "succeeded",
  "amount": "1000.00",
  "currency": "RUB",
  "yookassaId": "yookassa-payment-id",
  "createdAt": "2023-12-01T12:00:00.000Z",
  "paidAt": "2023-12-01T12:05:00.000Z"
}
```

#### Получение платежей компании

```http
GET /api/v1/payments
```

**Параметры запроса:**
- `page` (number): Номер страницы
- `limit` (number): Количество записей на странице
- `status` (string): Статус платежа (pending, succeeded, failed, canceled)

**Ответ:**
```json
{
  "data": [
    {
      "id": "payment-uuid",
      "status": "succeeded",
      "amount": "1000.00",
      "currency": "RUB",
      "createdAt": "2023-12-01T12:00:00.000Z",
      "paidAt": "2023-12-01T12:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

### Аналитика

#### Получение статистики использования

```http
GET /api/v1/analytics/usage
```

**Параметры запроса:**
- `startDate` (string): Дата начала (ISO 8601)
- `endDate` (string): Дата окончания (ISO 8601)
- `groupBy` (string): Группировка (day, week, month)
- `provider` (string): Фильтр по провайдеру
- `model` (string): Фильтр по модели

**Ответ:**
```json
{
  "period": {
    "startDate": "2023-12-01T00:00:00.000Z",
    "endDate": "2023-12-31T23:59:59.999Z"
  },
  "summary": {
    "totalRequests": 1500,
    "totalTokens": 45000,
    "totalCost": 12.50,
    "averageResponseTime": 1.2
  },
  "byProvider": [
    {
      "provider": "openai",
      "requests": 800,
      "tokens": 25000,
      "cost": 8.50
    },
    {
      "provider": "anthropic",
      "requests": 700,
      "tokens": 20000,
      "cost": 4.00
    }
  ],
  "byModel": [
    {
      "model": "gpt-4",
      "requests": 500,
      "tokens": 15000,
      "cost": 6.00
    },
    {
      "model": "claude-3-sonnet",
      "requests": 700,
      "tokens": 20000,
      "cost": 4.00
    }
  ],
  "timeline": [
    {
      "date": "2023-12-01",
      "requests": 50,
      "tokens": 1500,
      "cost": 0.42
    }
  ]
}
```

## Webhooks

### Настройка webhook'ов

```http
POST /api/v1/webhooks
```

**Тело запроса:**
```json
{
  "url": "https://your-app.com/webhooks/ai-aggregator",
  "events": ["payment.succeeded", "payment.failed", "usage.tracked"],
  "secret": "your-webhook-secret"
}
```

### Формат webhook'ов

```json
{
  "id": "webhook-uuid",
  "event": "payment.succeeded",
  "data": {
    "paymentId": "payment-uuid",
    "amount": "1000.00",
    "currency": "RUB",
    "status": "succeeded"
  },
  "timestamp": "2023-12-01T12:00:00.000Z",
  "signature": "sha256=abc123..."
}
```

## Rate Limiting

### Лимиты по умолчанию

| Тип запроса | Лимит |
|-------------|-------|
| Аутентификация | 10 запросов/минуту |
| Чат | 100 запросов/минуту |
| API ключи | 20 запросов/минуту |
| Биллинг | 50 запросов/минуту |

### Заголовки rate limiting

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## SDK и примеры

### JavaScript/Node.js

```javascript
import { AIAggregatorClient } from '@ai-aggregator/sdk';

const client = new AIAggregatorClient({
  apiKey: 'ak_live_1234567890abcdef',
  baseUrl: 'https://api.ai-aggregator.com'
});

// Создание чата
const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Привет!' }
  ]
});

console.log(response.choices[0].message.content);
```

### Python

```python
from ai_aggregator import AIAggregatorClient

client = AIAggregatorClient(
    api_key='ak_live_1234567890abcdef',
    base_url='https://api.ai-aggregator.com'
)

# Создание чата
response = client.chat.completions.create(
    model='gpt-4',
    messages=[
        {'role': 'user', 'content': 'Привет!'}
    ]
)

print(response.choices[0].message.content)
```

### cURL примеры

```bash
# Регистрация
curl -X POST https://api.ai-aggregator.com/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "securepassword123"
  }'

# Создание чата
curl -X POST https://api.ai-aggregator.com/api/v1/chat/completions \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {"role": "user", "content": "Привет!"}
    ]
  }'
```
