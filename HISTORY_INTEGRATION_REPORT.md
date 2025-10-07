# Отчет по интеграции истории запросов к ИИ-сервисам

## Обзор

Данный отчет описывает реализацию полной интеграции хранения и аналитики истории запросов к ИИ-сервисам в микросервисной архитектуре.

## Архитектура интеграции

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   API Gateway   │───▶│   RabbitMQ       │───▶│ Analytics Service│
│                 │    │                  │    │                 │
│ - Chat Controller│    │ - analytics.events│    │ - Event Handler  │
│ - History Service│    │                  │    │ - User Analytics │
│ - RabbitMQ      │    │                  │    │ - Data Collection│
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                                               │
         ▼                                               ▼
┌─────────────────┐                            ┌─────────────────┐
│   PostgreSQL    │                            │   PostgreSQL    │
│   (api-gateway) │                            │ (analytics)     │
│                 │                            │                 │
│ - request_history│                            │ - analytics_events│
│ - session_history│                            │ - user_analytics │
└─────────────────┘                            └─────────────────┘
```

## Реализованные компоненты

### 1. API Gateway (services/api-gateway)

#### 1.1 Схема базы данных
```sql
-- Таблица истории запросов
CREATE TABLE request_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    session_id VARCHAR,
    request_type VARCHAR NOT NULL,
    provider VARCHAR NOT NULL,
    model VARCHAR NOT NULL,
    request_data JSONB NOT NULL,
    response_data JSONB,
    tokens_used INTEGER,
    cost DECIMAL(10,6),
    response_time INTEGER,
    status VARCHAR NOT NULL,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Таблица истории сессий
CREATE TABLE session_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    duration INTEGER,
    requests_count INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost DECIMAL(10,6) DEFAULT 0,
    last_request_at TIMESTAMP,
    properties JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

#### 1.2 Chat Controller
- **Создание записи истории** при начале запроса
- **Обновление с ответом** при успешном выполнении
- **Обновление с ошибкой** при неудаче
- **Отправка событий в RabbitMQ** для аналитики

#### 1.3 History Service
- CRUD операции для истории запросов
- CRUD операции для истории сессий
- Статистика пользователей
- Трансформация данных

### 2. Analytics Service (services/analytics-service)

#### 2.1 Схема базы данных
```sql
-- Таблица событий аналитики
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR,
    session_id VARCHAR,
    event_type VARCHAR NOT NULL,
    event_name VARCHAR NOT NULL,
    service VARCHAR NOT NULL,
    properties JSONB NOT NULL,
    metadata JSONB,
    timestamp TIMESTAMP DEFAULT NOW(),
    ip_address VARCHAR,
    user_agent VARCHAR
);

-- Таблица аналитики пользователей
CREATE TABLE user_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR UNIQUE NOT NULL,
    total_requests INTEGER DEFAULT 0,
    total_tokens INTEGER DEFAULT 0,
    total_cost FLOAT DEFAULT 0,
    average_response_time FLOAT DEFAULT 0,
    success_rate FLOAT DEFAULT 0,
    last_activity TIMESTAMP DEFAULT NOW(),
    preferences JSONB,
    timezone VARCHAR,
    language VARCHAR
);

-- Таблица истории использования
CREATE TABLE user_usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR NOT NULL,
    date DATE NOT NULL,
    requests INTEGER DEFAULT 0,
    tokens INTEGER DEFAULT 0,
    cost FLOAT DEFAULT 0,
    models JSONB NOT NULL,
    providers JSONB NOT NULL,
    UNIQUE(user_id, date)
);
```

#### 2.2 Critical Operations Service
- **Обработчик `analytics.events`** - получает события от api-gateway
- **Обновление аналитики пользователей** в реальном времени
- **Агрегация метрик** по дням, моделям, провайдерам

### 3. RabbitMQ Integration

#### 3.1 Очереди
- `analytics.events` - общие события аналитики
- `analytics.critical.events` - критические события
- `analytics.performance.metrics` - метрики производительности

#### 3.2 Формат сообщений
```json
{
  "eventType": "ai_interaction",
  "eventName": "chat_completion_success",
  "userId": "user-123",
  "sessionId": "session-456",
  "service": "api-gateway",
  "properties": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "tokensUsed": 150,
    "cost": 0.003,
    "responseTime": 1200,
    "requestType": "chat_completion",
    "status": "success"
  },
  "metadata": {
    "historyId": "history-789",
    "requestData": {
      "messages": 2,
      "temperature": 0.7,
      "max_tokens": 100
    }
  },
  "timestamp": "2024-01-15T10:30:00Z"
}
```

## Поток данных

### 1. Создание запроса к ИИ
1. Пользователь отправляет запрос в `/chat/completions`
2. `ChatController` создает запись в `request_history`
3. Запрос обрабатывается через `ChatService`
4. При успехе/ошибке запись обновляется
5. Событие отправляется в RabbitMQ очередь `analytics.events`

### 2. Обработка в Analytics Service
1. `CriticalOperationsService` получает событие из `analytics.events`
2. Событие сохраняется в `analytics_events`
3. Обновляется `user_analytics` (общая статистика)
4. Обновляется `user_usage_history` (дневная статистика)

### 3. Агрегация данных
- **Реальное время**: обновление счетчиков при каждом событии
- **Ежедневно**: агрегация по дням, моделям, провайдерам
- **Еженедельно**: создание отчетов и дашбордов

## Преимущества реализации

### 1. Надежность
- ✅ Двойное сохранение: в api-gateway и analytics-service
- ✅ Обработка ошибок RabbitMQ без прерывания основного потока
- ✅ Retry механизмы для критических операций

### 2. Производительность
- ✅ Асинхронная обработка через RabbitMQ
- ✅ Batch операции для аналитики
- ✅ Индексы для быстрого поиска

### 3. Масштабируемость
- ✅ Независимые базы данных для каждого сервиса
- ✅ Горизонтальное масштабирование через очереди
- ✅ Кэширование метрик

### 4. Наблюдаемость
- ✅ Подробное логирование всех операций
- ✅ Метрики производительности
- ✅ Трассировка запросов

## Мониторинг и отладка

### 1. Логи
```bash
# Логи api-gateway
docker-compose logs api-gateway | grep -E "(analytics|rabbitmq|event)"

# Логи analytics-service
docker-compose logs analytics-service | grep -E "(analytics|event|processed)"
```

### 2. База данных
```sql
-- Проверка истории запросов
SELECT * FROM request_history ORDER BY created_at DESC LIMIT 10;

-- Проверка событий аналитики
SELECT * FROM analytics_events WHERE event_type = 'ai_interaction' ORDER BY timestamp DESC LIMIT 10;

-- Статистика пользователя
SELECT * FROM user_analytics WHERE user_id = 'user-123';
```

### 3. RabbitMQ Management
- URL: http://localhost:15672
- Username: guest
- Password: guest
- Очередь: `analytics.events`

## Тестирование

### 1. Автоматический тест
```bash
# Запуск теста интеграции
./test-history-integration.ps1
```

### 2. Ручное тестирование
```bash
# Отправка тестового запроса
curl -X POST http://localhost:3000/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer test-token" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Привет!"}],
    "max_tokens": 100
  }'
```

## Заключение

Интеграция истории запросов к ИИ-сервисам полностью реализована и готова к использованию. Система обеспечивает:

- ✅ Полное отслеживание всех запросов к ИИ
- ✅ Детальную аналитику использования
- ✅ Надежное хранение данных
- ✅ Масштабируемую архитектуру
- ✅ Комплексный мониторинг

Система готова для production использования и может быть легко расширена для дополнительных типов аналитики.
