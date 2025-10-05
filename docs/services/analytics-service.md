# Analytics Service

## 🎯 Назначение

Analytics Service собирает, обрабатывает и анализирует данные о использовании системы. Обеспечивает мониторинг производительности, пользовательскую аналитику и бизнес-метрики.

## 🏗️ Архитектура

```
Events → Analytics Service → Processing → Storage
   ↓           ↓                ↓           ↓
Collect    Aggregate        Analyze     Report
Data       Metrics          Trends      Dashboard
```

## 🚀 Запуск

```bash
# Запуск сервиса
docker-compose up -d analytics-service

# Проверка статуса
curl http://localhost:3005/health
```

## 📡 API Endpoints

### События
- `POST /analytics/events/track` - Отправка события
- `POST /analytics/events/batch` - Массовая отправка событий
- `GET /analytics/events/:userId` - События пользователя

### Метрики
- `GET /analytics/metrics/usage` - Метрики использования
- `GET /analytics/metrics/performance` - Метрики производительности
- `GET /analytics/metrics/billing` - Метрики биллинга

### Дашборд
- `GET /analytics/dashboard` - Основной дашборд
- `GET /analytics/dashboard/:userId` - Дашборд пользователя
- `GET /analytics/dashboard/admin` - Админ дашборд

### Отчеты
- `GET /analytics/reports/usage` - Отчет по использованию
- `GET /analytics/reports/revenue` - Отчет по доходам
- `GET /analytics/reports/performance` - Отчет по производительности

## 🔧 Конфигурация

### Environment Variables
```env
PORT=3005
DATABASE_URL=postgresql://user:password@analytics-db:5432/analytics_db
REDIS_URL=redis://redis:6379
KAFKA_URL=kafka:9092
ELASTICSEARCH_URL=http://elasticsearch:9200
```

### База данных
```sql
-- События
CREATE TABLE events (
  id UUID PRIMARY KEY,
  user_id UUID,
  session_id UUID,
  event_type VARCHAR(100) NOT NULL,
  event_name VARCHAR(100) NOT NULL,
  service VARCHAR(100) NOT NULL,
  properties JSONB,
  metadata JSONB,
  timestamp TIMESTAMP DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT
);

-- Метрики
CREATE TABLE metrics (
  id UUID PRIMARY KEY,
  metric_name VARCHAR(100) NOT NULL,
  metric_value DECIMAL(15,6) NOT NULL,
  metric_unit VARCHAR(20),
  tags JSONB,
  timestamp TIMESTAMP DEFAULT NOW()
);

-- Сессии
CREATE TABLE sessions (
  id UUID PRIMARY KEY,
  user_id UUID,
  started_at TIMESTAMP DEFAULT NOW(),
  ended_at TIMESTAMP,
  duration INTEGER, -- seconds
  events_count INTEGER DEFAULT 0,
  properties JSONB
);
```

## 📊 События

### Типы событий
```typescript
interface Event {
  id: string;
  userId: string;
  sessionId?: string;
  eventType: 'ai_interaction' | 'user_action' | 'system_event' | 'error';
  eventName: string;
  service: string;
  properties: Record<string, any>;
  metadata?: Record<string, any>;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}
```

### Отправка события
```typescript
POST /analytics/events/track
{
  "userId": "b6793877-246a-4e3a-807f-50e494aa5188",
  "eventType": "ai_interaction",
  "eventName": "chat_completion",
  "service": "api-gateway",
  "properties": {
    "model": "gpt-4",
    "tokens": 30,
    "cost": 0.05,
    "provider": "openai"
  },
  "metadata": {
    "requestId": "req-123",
    "responseTime": 1500
  }
}

// Ответ
{
  "success": true,
  "data": {
    "id": "2ff79549-7639-4d62-8a54-ca402041b6e7",
    "userId": "b6793877-246a-4e3a-807f-50e494aa5188",
    "eventType": "ai_interaction",
    "eventName": "chat_completion",
    "service": "api-gateway",
    "properties": {
      "model": "gpt-4",
      "tokens": 30,
      "cost": 0.05,
      "provider": "openai"
    },
    "timestamp": "2025-10-05T22:22:56.065Z"
  },
  "message": "Event tracked successfully"
}
```

### Массовая отправка
```typescript
POST /analytics/events/batch
{
  "events": [
    {
      "userId": "user-1",
      "eventType": "ai_interaction",
      "eventName": "chat_completion",
      "service": "api-gateway",
      "properties": { "model": "gpt-4" }
    },
    {
      "userId": "user-2",
      "eventType": "user_action",
      "eventName": "login",
      "service": "auth-service",
      "properties": { "method": "email" }
    }
  ]
}
```

## 📈 Метрики

### Метрики использования
```typescript
GET /analytics/metrics/usage?period=7d&granularity=hour

// Ответ
{
  "success": true,
  "metrics": {
    "totalRequests": 1500,
    "uniqueUsers": 120,
    "totalTokens": 45000,
    "totalCost": 125.50,
    "byHour": [
      {
        "timestamp": "2025-10-05T00:00:00Z",
        "requests": 50,
        "users": 25,
        "tokens": 1500,
        "cost": 4.20
      }
    ],
    "byProvider": {
      "openai": { "requests": 1000, "cost": 85.50 },
      "openrouter": { "requests": 500, "cost": 40.00 }
    },
    "byModel": {
      "gpt-4": { "requests": 800, "cost": 70.00 },
      "gpt-3.5-turbo": { "requests": 700, "cost": 55.50 }
    }
  }
}
```

### Метрики производительности
```typescript
GET /analytics/metrics/performance?period=24h

// Ответ
{
  "success": true,
  "metrics": {
    "averageResponseTime": 1500,
    "p95ResponseTime": 3000,
    "p99ResponseTime": 5000,
    "successRate": 0.985,
    "errorRate": 0.015,
    "byService": {
      "api-gateway": { "responseTime": 1200, "successRate": 0.99 },
      "proxy-service": { "responseTime": 1800, "successRate": 0.98 },
      "billing-service": { "responseTime": 800, "successRate": 0.995 }
    }
  }
}
```

## 📊 Дашборд

### Основной дашборд
```typescript
GET /analytics/dashboard

// Ответ
{
  "success": true,
  "dashboard": {
    "overview": {
      "totalUsers": 1200,
      "activeUsers": 150,
      "totalRequests": 15000,
      "totalRevenue": 2500.00
    },
    "usage": {
      "requestsToday": 500,
      "requestsThisWeek": 3500,
      "requestsThisMonth": 15000,
      "growthRate": 0.15
    },
    "performance": {
      "averageResponseTime": 1500,
      "successRate": 0.985,
      "uptime": 0.999
    },
    "revenue": {
      "today": 85.50,
      "thisWeek": 580.00,
      "thisMonth": 2500.00,
      "growthRate": 0.12
    }
  }
}
```

### Пользовательский дашборд
```typescript
GET /analytics/dashboard/b6793877-246a-4e3a-807f-50e494aa5188

// Ответ
{
  "success": true,
  "dashboard": {
    "user": {
      "id": "b6793877-246a-4e3a-807f-50e494aa5188",
      "totalRequests": 150,
      "totalTokens": 4500,
      "totalCost": 12.50,
      "favoriteModel": "gpt-4",
      "favoriteProvider": "openai"
    },
    "usage": {
      "requestsToday": 5,
      "requestsThisWeek": 35,
      "requestsThisMonth": 150,
      "tokensToday": 150,
      "tokensThisWeek": 1050,
      "tokensThisMonth": 4500
    },
    "costs": {
      "spentToday": 0.50,
      "spentThisWeek": 3.50,
      "spentThisMonth": 12.50,
      "averageCostPerRequest": 0.083
    }
  }
}
```

## 📋 Отчеты

### Отчет по использованию
```typescript
GET /analytics/reports/usage?period=30d&format=json

// Ответ
{
  "success": true,
  "report": {
    "period": "30d",
    "summary": {
      "totalRequests": 15000,
      "uniqueUsers": 1200,
      "totalTokens": 450000,
      "totalCost": 2500.00
    },
    "trends": {
      "requestsGrowth": 0.15,
      "usersGrowth": 0.08,
      "costGrowth": 0.12
    },
    "breakdown": {
      "byDay": [
        {
          "date": "2025-10-01",
          "requests": 500,
          "users": 120,
          "tokens": 15000,
          "cost": 85.50
        }
      ],
      "byProvider": {
        "openai": { "requests": 10000, "cost": 1700.00 },
        "openrouter": { "requests": 5000, "cost": 800.00 }
      },
      "byModel": {
        "gpt-4": { "requests": 8000, "cost": 1400.00 },
        "gpt-3.5-turbo": { "requests": 7000, "cost": 1100.00 }
      }
    }
  }
}
```

## 🔄 Интеграция

### HTTP Endpoints
- Все REST API endpoints
- Swagger документация на `/api`

### Внутренние сервисы
- API Gateway (HTTP)
- Billing Service (HTTP)
- Provider Orchestrator (HTTP)
- Proxy Service (HTTP)

## 📊 Мониторинг

### Метрики системы
- Количество событий в секунду
- Время обработки событий
- Использование памяти
- Размер базы данных

### Логирование
```json
{
  "timestamp": "2025-10-05T22:30:00.000Z",
  "level": "INFO",
  "service": "analytics-service",
  "action": "event_processed",
  "eventId": "uuid",
  "userId": "uuid",
  "eventType": "ai_interaction",
  "processingTime": 50
}
```

## 🚨 Обработка ошибок

### Типы ошибок
- `400 Bad Request` - неверные данные события
- `429 Too Many Requests` - превышен лимит событий
- `500 Internal Server Error` - ошибки обработки

### Стратегии восстановления
- Retry для временных ошибок
- Dead letter queue для проблемных событий
- Graceful degradation при перегрузке

## 🔧 Разработка

### Структура проекта
```
src/
├── analytics/      # Основная логика
├── events/        # Обработка событий
├── metrics/        # Метрики
├── dashboard/      # Дашборды
├── reports/        # Отчеты
└── common/         # Общие утилиты
```

### Тестирование
```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Тестирование аналитики
npm run test:analytics
```

## 📈 Производительность

### Оптимизации
- Batch обработка событий
- Асинхронная обработка
- Индексы в базе данных
- Кэширование метрик

### Масштабирование
- Горизонтальное масштабирование
- Database sharding
- Message queues для событий
- Elasticsearch для поиска
