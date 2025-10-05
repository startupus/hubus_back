# Provider Orchestrator Service

## 🎯 Назначение

Provider Orchestrator - это интеллектуальная система маршрутизации запросов к AI провайдерам. Обеспечивает оптимальный выбор провайдера на основе стоимости, скорости, качества и доступности.

## 🏗️ Архитектура

```
Request → Orchestrator → Provider Selection → Proxy Service
   ↓           ↓              ↓                    ↓
Analyze    Smart Route    Fallback Logic      Execute
Request    to Provider    if Needed          Request
```

## 🚀 Запуск

```bash
# Запуск сервиса
docker-compose up -d provider-orchestrator

# Проверка статуса
curl http://localhost:3002/health
```

## 📡 API Endpoints

### Провайдеры
- `GET /orchestrator/providers` - Список провайдеров
- `GET /orchestrator/provider-status/:id` - Статус провайдера
- `POST /orchestrator/providers` - Добавление провайдера

### Модели
- `GET /orchestrator/models` - Список доступных моделей
- `GET /orchestrator/models/:provider` - Модели провайдера

### Маршрутизация
- `POST /orchestrator/route-request` - Маршрутизация запроса
- `POST /orchestrator/analyze-request` - Анализ запроса
- `GET /orchestrator/routing-rules` - Правила маршрутизации

## 🔧 Конфигурация

### Environment Variables
```env
PORT=3002
DATABASE_URL=postgresql://user:password@orchestrator-db:5432/orchestrator_db
REDIS_URL=redis://redis:6379
OPENAI_API_KEY=your-openai-key
OPENROUTER_API_KEY=your-openrouter-key
YANDEX_API_KEY=your-yandex-key
```

### База данных
```sql
-- Провайдеры
CREATE TABLE providers (
  id UUID PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- OPENAI, OPENROUTER, YANDEX
  base_url VARCHAR(255) NOT NULL,
  api_key VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 1,
  fallback_order INTEGER DEFAULT 1,
  config JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Модели
CREATE TABLE models (
  id UUID PRIMARY KEY,
  provider_id UUID REFERENCES providers(id),
  name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100),
  cost_per_token DECIMAL(10,6),
  max_tokens INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Правила маршрутизации
CREATE TABLE routing_rules (
  id UUID PRIMARY KEY,
  condition JSONB NOT NULL,
  provider_id UUID REFERENCES providers(id),
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🧠 Умная маршрутизация

### Алгоритм выбора провайдера
```typescript
interface RequestAnalysis {
  userId: string;
  model: string;
  prompt: string;
  expectedTokens: number;
  budget?: number;
  urgency: 'low' | 'medium' | 'high';
  quality: 'standard' | 'premium';
  options?: Record<string, any>;
}
```

### Критерии оценки
```typescript
interface ProviderScore {
  provider: string;
  score: number;
  factors: {
    cost: number;        // Стоимость (0-100)
    speed: number;       // Скорость (0-100)
    quality: number;     // Качество (0-100)
    availability: number; // Доступность (0-100)
    reliability: number; // Надежность (0-100)
  };
}
```

### Примеры правил
```typescript
const routingRules = [
  {
    condition: { urgency: 'high', quality: 'premium' },
    provider: 'openai',
    priority: 1
  },
  {
    condition: { budget: { max: 0.01 } },
    provider: 'openrouter',
    priority: 2
  },
  {
    condition: { model: 'gpt-4' },
    provider: 'openai',
    priority: 1
  }
];
```

## 🔄 API Использование

### Получение провайдеров
```typescript
GET /orchestrator/providers

// Ответ
{
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "status": "operational",
      "models": ["gpt-4", "gpt-3.5-turbo"],
      "responseTime": 2000,
      "successRate": 0.98,
      "costPerToken": 0.00003
    },
    {
      "id": "openrouter",
      "name": "OpenRouter",
      "status": "operational",
      "models": ["gpt-4", "claude-3"],
      "responseTime": 1500,
      "successRate": 0.95,
      "costPerToken": 0.00002
    }
  ]
}
```

### Маршрутизация запроса
```typescript
POST /orchestrator/route-request
{
  "userId": "b6793877-246a-4e3a-807f-50e494aa5188",
  "model": "gpt-4",
  "prompt": "Hello, how are you?",
  "urgency": "medium",
  "quality": "standard",
  "expectedTokens": 30,
  "budget": 0.05
}

// Ответ
{
  "success": true,
  "message": "Request routed successfully",
  "provider": "openai",
  "model": "gpt-4",
  "estimatedCost": 0.05,
  "estimatedTokens": 30,
  "responseTime": 2000,
  "fallbackProvider": "openrouter"
}
```

### Статус провайдера
```typescript
GET /orchestrator/provider-status/openai

// Ответ
{
  "provider": "openai",
  "status": "operational",
  "responseTime": 100,
  "successRate": 99.5,
  "errorRate": 0.5,
  "lastCheck": "2025-10-05T22:30:00Z",
  "message": "Provider is operational"
}
```

## 🔄 Fallback система

### Логика fallback
```typescript
interface FallbackLogic {
  primaryProvider: string;
  fallbackProviders: string[];
  conditions: {
    maxResponseTime: number;
    minSuccessRate: number;
    maxErrorRate: number;
  };
}
```

### Автоматическое переключение
- Мониторинг в реальном времени
- Автоматический fallback при недоступности
- Восстановление после устранения проблем
- Уведомления о переключениях

## 📊 Мониторинг

### Health Checks
```typescript
// Проверка доступности провайдера
GET /orchestrator/health/openai

// Ответ
{
  "provider": "openai",
  "status": "healthy",
  "responseTime": 150,
  "lastCheck": "2025-10-05T22:30:00Z",
  "uptime": "99.9%"
}
```

### Метрики
- Время ответа провайдеров
- Процент успешных запросов
- Стоимость по провайдерам
- Использование fallback

### Логирование
```json
{
  "timestamp": "2025-10-05T22:30:00.000Z",
  "level": "INFO",
  "service": "provider-orchestrator",
  "action": "request_routed",
  "userId": "uuid",
  "provider": "openai",
  "model": "gpt-4",
  "estimatedCost": 0.05,
  "responseTime": 2000
}
```

## 🚨 Обработка ошибок

### Типы ошибок
- `400 Bad Request` - неверные данные запроса
- `404 Not Found` - провайдер не найден
- `503 Service Unavailable` - все провайдеры недоступны
- `500 Internal Server Error` - внутренние ошибки

### Стратегии восстановления
- Автоматический retry
- Fallback на резервные провайдеры
- Graceful degradation
- Уведомления администраторов

## 🔧 Разработка

### Структура проекта
```
src/
├── orchestrator/   # Основная логика
├── providers/      # Управление провайдерами
├── routing/        # Маршрутизация
├── monitoring/     # Мониторинг
├── fallback/       # Fallback логика
└── common/         # Общие утилиты
```

### Тестирование
```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Тестирование маршрутизации
npm run test:routing
```

## 📈 Производительность

### Оптимизации
- Кэширование статуса провайдеров
- Асинхронная проверка доступности
- Batch обработка запросов
- Connection pooling

### Масштабирование
- Горизонтальное масштабирование
- Load balancing
- Database sharding
- Message queues для асинхронной обработки

## 🔄 Интеграция

### Внешние провайдеры
- OpenAI API
- OpenRouter API
- Yandex GPT API
- Claude API (через OpenRouter)

### Внутренние сервисы
- Proxy Service (HTTP)
- Billing Service (gRPC)
- Analytics Service (HTTP)
- API Gateway (HTTP)
