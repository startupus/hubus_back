# API Documentation

## 🎯 Обзор

AI Aggregator предоставляет RESTful API для взаимодействия с AI провайдерами. Все запросы проходят через API Gateway, который обеспечивает аутентификацию, маршрутизацию и агрегацию ответов.

## 🔐 Аутентификация

### JWT Токены
```bash
# В заголовке
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Или в query параметре
?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### API Ключи
```bash
# В заголовке
Authorization: Bearer ak_live_1234567890abcdef...

# Или в query параметре
?api_key=ak_live_1234567890abcdef...
```

## 📡 Base URL

```
Production: https://api.ai-aggregator.com
Development: http://localhost:3000
```

## 🔄 Аутентификация

### Регистрация пользователя
```http
POST /v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "id": "b6793877-246a-4e3a-807f-50e494aa5188",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "isActive": true,
    "createdAt": "2025-10-05T22:30:00Z"
  }
}
```

### Вход в систему
```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "b6793877-246a-4e3a-807f-50e494aa5188",
      "email": "user@example.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
}
```

### Создание API ключа
```http
POST /v1/auth/api-keys
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "name": "My API Key",
  "expiresAt": "2025-12-31T23:59:59Z"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "API key created successfully",
  "data": {
    "id": "uuid",
    "key": "ak_live_1234567890abcdef...",
    "name": "My API Key",
    "expiresAt": "2025-12-31T23:59:59Z",
    "createdAt": "2025-10-05T22:30:00Z"
  }
}
```

## 🤖 AI Запросы

### Chat Completions
```http
POST /v1/chat/completions
Authorization: Bearer ak_live_1234567890abcdef...
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "max_tokens": 100,
  "temperature": 0.7
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
        "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 9,
    "completion_tokens": 12,
    "total_tokens": 21
  }
}
```

### Список моделей
```http
GET /v1/models
Authorization: Bearer ak_live_1234567890abcdef...
```

**Ответ:**
```json
{
  "success": true,
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "provider": "OpenAI",
      "status": "available",
      "costPerToken": 0.00003,
      "maxTokens": 4096
    },
    {
      "id": "gpt-3.5-turbo",
      "name": "GPT-3.5 Turbo",
      "provider": "OpenAI",
      "status": "available",
      "costPerToken": 0.00002,
      "maxTokens": 4096
    }
  ]
}
```

## 💰 Биллинг

### Получение баланса
```http
GET /v1/billing/balance
Authorization: Bearer ak_live_1234567890abcdef...
```

**Ответ:**
```json
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

### История транзакций
```http
GET /v1/billing/history?limit=10&offset=0
Authorization: Bearer ak_live_1234567890abcdef...
```

**Ответ:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "type": "DEBIT",
      "amount": 0.05,
      "description": "GPT-4 usage",
      "provider": "openai",
      "model": "gpt-4",
      "tokens": 30,
      "createdAt": "2025-10-05T22:30:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 10,
    "offset": 0,
    "hasMore": true
  }
}
```

### Пополнение баланса
```http
POST /v1/billing/balance/credit
Authorization: Bearer ak_live_1234567890abcdef...
Content-Type: application/json

{
  "amount": 50.0,
  "currency": "USD",
  "paymentMethod": "card"
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Balance updated successfully",
  "balance": {
    "id": "uuid",
    "userId": "b6793877-246a-4e3a-807f-50e494aa5188",
    "balance": "150.00",
    "currency": "USD",
    "lastUpdated": "2025-10-05T22:30:00Z"
  }
}
```

## 📊 Аналитика

### Основной дашборд
```http
GET /v1/analytics/dashboard
Authorization: Bearer ak_live_1234567890abcdef...
```

**Ответ:**
```json
{
  "success": true,
  "dashboard": {
    "overview": {
      "totalRequests": 150,
      "totalTokens": 4500,
      "totalCost": 12.50,
      "averageResponseTime": 1500
    },
    "usage": {
      "requestsToday": 5,
      "requestsThisWeek": 35,
      "requestsThisMonth": 150
    },
    "costs": {
      "spentToday": 0.50,
      "spentThisWeek": 3.50,
      "spentThisMonth": 12.50
    }
  }
}
```

### Отправка события
```http
POST /v1/analytics/events
Authorization: Bearer ak_live_1234567890abcdef...
Content-Type: application/json

{
  "eventType": "ai_interaction",
  "eventName": "chat_completion",
  "properties": {
    "model": "gpt-4",
    "tokens": 30,
    "cost": 0.05
  }
}
```

**Ответ:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "eventType": "ai_interaction",
    "eventName": "chat_completion",
    "properties": {
      "model": "gpt-4",
      "tokens": 30,
      "cost": 0.05
    },
    "timestamp": "2025-10-05T22:30:00Z"
  },
  "message": "Event tracked successfully"
}
```

## 🚨 Коды ошибок

### HTTP Status Codes
- `200 OK` - Успешный запрос
- `201 Created` - Ресурс создан
- `400 Bad Request` - Неверные данные
- `401 Unauthorized` - Неверная аутентификация
- `403 Forbidden` - Недостаточно прав
- `404 Not Found` - Ресурс не найден
- `429 Too Many Requests` - Превышен лимит
- `500 Internal Server Error` - Внутренняя ошибка

### Формат ошибок
```json
{
  "success": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "Invalid request data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Типы ошибок
- `INVALID_REQUEST` - Неверные данные запроса
- `UNAUTHORIZED` - Проблемы с аутентификацией
- `FORBIDDEN` - Недостаточно прав
- `NOT_FOUND` - Ресурс не найден
- `RATE_LIMITED` - Превышен лимит запросов
- `INSUFFICIENT_FUNDS` - Недостаточно средств
- `PROVIDER_ERROR` - Ошибка провайдера
- `INTERNAL_ERROR` - Внутренняя ошибка

## 🔄 Rate Limiting

### Лимиты
- **Пользователи**: 100 запросов в минуту
- **API ключи**: 1000 запросов в минуту
- **Премиум пользователи**: 5000 запросов в минуту

### Заголовки ответа
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## 📈 Webhooks

### Настройка webhook
```http
POST /v1/webhooks
Authorization: Bearer ak_live_1234567890abcdef...
Content-Type: application/json

{
  "url": "https://your-app.com/webhook",
  "events": ["chat.completion", "billing.charge"],
  "secret": "your-webhook-secret"
}
```

### Формат webhook
```json
{
  "id": "uuid",
  "type": "chat.completion",
  "data": {
    "userId": "b6793877-246a-4e3a-807f-50e494aa5188",
    "model": "gpt-4",
    "tokens": 30,
    "cost": 0.05
  },
  "timestamp": "2025-10-05T22:30:00Z",
  "signature": "sha256=..."
}
```

## 🔧 SDK

### JavaScript/Node.js
```bash
npm install @ai-aggregator/sdk
```

```javascript
import { AIClient } from '@ai-aggregator/sdk';

const client = new AIClient({
  apiKey: 'ak_live_1234567890abcdef...',
  baseURL: 'https://api.ai-aggregator.com'
});

const response = await client.chat.completions.create({
  model: 'gpt-4',
  messages: [
    { role: 'user', content: 'Hello!' }
  ]
});
```

### Python
```bash
pip install ai-aggregator-sdk
```

```python
from ai_aggregator import AIClient

client = AIClient(
    api_key='ak_live_1234567890abcdef...',
    base_url='https://api.ai-aggregator.com'
)

response = client.chat.completions.create(
    model='gpt-4',
    messages=[
        {'role': 'user', 'content': 'Hello!'}
    ]
)
```

## 📚 Дополнительные ресурсы

- [Swagger UI](http://localhost:3000/api) - Интерактивная документация
- [Postman Collection](docs/postman-collection.json) - Готовые запросы
- [SDK Documentation](docs/sdk/) - Документация SDK
- [Examples](docs/examples/) - Примеры использования
