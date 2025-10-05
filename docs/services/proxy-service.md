# Proxy Service

## 🎯 Назначение

Proxy Service обеспечивает проксирование запросов к внешним AI провайдерам. Обрабатывает трансформацию запросов, retry логику, кэширование и мониторинг производительности.

## 🏗️ Архитектура

```
Orchestrator → Proxy Service → External AI Provider
     ↓              ↓                    ↓
Route Request   Transform & Send    Process & Return
```

## 🚀 Запуск

```bash
# Запуск сервиса
docker-compose up -d proxy-service

# Проверка статуса
curl http://localhost:3003/health
```

## 📡 API Endpoints

### Проксирование
- `POST /proxy/openai/chat/completions` - OpenAI Chat Completions
- `POST /proxy/openrouter/chat/completions` - OpenRouter Chat Completions
- `POST /proxy/yandex/chat/completions` - Yandex GPT Chat Completions

### Модели
- `GET /proxy/models` - Список всех моделей
- `GET /proxy/models/:provider` - Модели провайдера
- `GET /proxy/models/:provider/:model` - Детали модели

### Валидация
- `POST /proxy/validate-request` - Валидация запроса
- `POST /proxy/validate-response` - Валидация ответа

## 🔧 Конфигурация

### Environment Variables
```env
PORT=3003
REDIS_URL=redis://redis:6379
OPENAI_API_KEY=your-openai-key
OPENROUTER_API_KEY=your-openrouter-key
YANDEX_API_KEY=your-yandex-key
MAX_RETRIES=3
TIMEOUT=30000
```

### Внешние провайдеры
```typescript
interface ProviderConfig {
  name: string;
  baseUrl: string;
  apiKey: string;
  timeout: number;
  retries: number;
  rateLimit: {
    requests: number;
    window: number; // milliseconds
  };
}
```

## 🔄 API Использование

### OpenAI Chat Completions
```typescript
POST /proxy/openai/chat/completions
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

// Ответ
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

### OpenRouter Chat Completions
```typescript
POST /proxy/openrouter/chat/completions
{
  "model": "openai/gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "What is the capital of France?"
    }
  ]
}

// Ответ
{
  "id": "chatcmpl-456",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "openai/gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "The capital of France is Paris."
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 8,
    "completion_tokens": 6,
    "total_tokens": 14
  }
}
```

### Получение моделей
```typescript
GET /proxy/models

// Ответ
{
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "provider": "openai",
      "status": "available",
      "costPerToken": 0.00003,
      "maxTokens": 4096
    },
    {
      "id": "claude-3-sonnet",
      "name": "Claude 3 Sonnet",
      "provider": "openrouter",
      "status": "available",
      "costPerToken": 0.00002,
      "maxTokens": 4096
    }
  ]
}
```

## 🔄 Retry логика

### Стратегии retry
```typescript
interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
  retryableErrors: string[];
}
```

### Примеры retry
```typescript
const retryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNRESET',
    'ETIMEDOUT',
    'ENOTFOUND',
    'rate_limit_exceeded'
  ]
};
```

### Exponential backoff
```typescript
const calculateDelay = (attempt: number, baseDelay: number): number => {
  const delay = baseDelay * Math.pow(2, attempt);
  return Math.min(delay, 10000); // Max 10 seconds
};
```

## 🚀 Кэширование

### Redis кэширование
```typescript
interface CacheConfig {
  ttl: number; // Time to live in seconds
  keyPrefix: string;
  enabled: boolean;
}
```

### Кэш ключи
```typescript
const cacheKeys = {
  request: (provider: string, model: string, prompt: string) => 
    `request:${provider}:${model}:${hash(prompt)}`,
  response: (requestId: string) => 
    `response:${requestId}`,
  models: (provider: string) => 
    `models:${provider}`
};
```

### Примеры кэширования
```typescript
// Кэширование запроса
const cacheKey = `request:openai:gpt-4:${hash(prompt)}`;
const cachedResponse = await redis.get(cacheKey);

if (cachedResponse) {
  return JSON.parse(cachedResponse);
}

// Сохранение в кэш
await redis.setex(cacheKey, 3600, JSON.stringify(response));
```

## 📊 Мониторинг

### Метрики производительности
```typescript
interface PerformanceMetrics {
  provider: string;
  model: string;
  responseTime: number;
  tokensPerSecond: number;
  successRate: number;
  errorRate: number;
  totalRequests: number;
  totalTokens: number;
}
```

### Логирование
```json
{
  "timestamp": "2025-10-05T22:30:00.000Z",
  "level": "INFO",
  "service": "proxy-service",
  "action": "request_proxied",
  "provider": "openai",
  "model": "gpt-4",
  "responseTime": 1500,
  "tokens": 21,
  "success": true
}
```

## 🚨 Обработка ошибок

### Типы ошибок
- `400 Bad Request` - неверные данные запроса
- `401 Unauthorized` - неверный API ключ
- `429 Too Many Requests` - превышен лимит
- `500 Internal Server Error` - ошибки провайдера
- `503 Service Unavailable` - провайдер недоступен

### Обработка ошибок провайдеров
```typescript
const handleProviderError = (error: any, provider: string) => {
  if (error.status === 429) {
    // Rate limit - retry with backoff
    return { retryable: true, delay: 5000 };
  }
  
  if (error.status === 401) {
    // Invalid API key - don't retry
    return { retryable: false, error: 'Invalid API key' };
  }
  
  if (error.code === 'ECONNRESET') {
    // Network error - retry
    return { retryable: true, delay: 1000 };
  }
  
  return { retryable: false, error: error.message };
};
```

## 🔄 Трансформация запросов

### Нормализация запросов
```typescript
const normalizeRequest = (request: any, provider: string) => {
  switch (provider) {
    case 'openai':
      return {
        model: request.model,
        messages: request.messages,
        max_tokens: request.max_tokens,
        temperature: request.temperature
      };
    
    case 'openrouter':
      return {
        model: `openai/${request.model}`,
        messages: request.messages,
        max_tokens: request.max_tokens,
        temperature: request.temperature
      };
    
    case 'yandex':
      return {
        model: request.model,
        messages: request.messages,
        max_tokens: request.max_tokens,
        temperature: request.temperature
      };
  }
};
```

### Нормализация ответов
```typescript
const normalizeResponse = (response: any, provider: string) => {
  const baseResponse = {
    id: response.id || generateId(),
    object: 'chat.completion',
    created: response.created || Date.now(),
    model: response.model,
    choices: response.choices,
    usage: response.usage
  };
  
  return baseResponse;
};
```

## 🔧 Разработка

### Структура проекта
```
src/
├── proxy/          # Основная логика
├── providers/      # Провайдеры
├── cache/          # Кэширование
├── retry/          # Retry логика
├── transform/      # Трансформация
└── common/         # Общие утилиты
```

### Тестирование
```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Тестирование провайдеров
npm run test:providers
```

## 📈 Производительность

### Оптимизации
- Connection pooling
- Асинхронная обработка
- Batch запросы
- Кэширование ответов

### Масштабирование
- Горизонтальное масштабирование
- Load balancing
- Rate limiting
- Circuit breaker pattern

## 🔄 Интеграция

### Внешние провайдеры
- OpenAI API
- OpenRouter API
- Yandex GPT API
- Claude API

### Внутренние сервисы
- Provider Orchestrator (HTTP)
- Billing Service (gRPC)
- Analytics Service (HTTP)
