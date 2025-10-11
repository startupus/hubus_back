# AI Aggregator Platform

Платформа для агрегации и управления ИИ-провайдерами с единым API, биллингом и аналитикой.

## Архитектура

Система построена на микросервисной архитектуре с использованием NestJS, PostgreSQL, Redis и RabbitMQ.

### Основные сервисы

- **[API Gateway](services/api-gateway.md)** - Единая точка входа для всех API запросов
- **[Auth Service](services/auth-service.md)** - Аутентификация и управление компаниями
- **[Billing Service](services/billing-service.md)** - Биллинг, тарификация и управление балансами
- **[Payment Service](services/payment-service.md)** - Обработка платежей через YooKassa
- **[Provider Orchestrator](services/provider-orchestrator.md)** - Управление ИИ-провайдерами и маршрутизация
- **[Proxy Service](services/proxy-service.md)** - Проксирование запросов к внешним ИИ-API
- **[Analytics Service](services/analytics-service.md)** - Сбор метрик и аналитика
- **[AI Certification Service](services/ai-certification-service.md)** - Сертификация ИИ-моделей
- **[Anonymization Service](services/anonymization-service.md)** - Анонимизация персональных данных

## Быстрый старт

### Требования

- Docker и Docker Compose
- Node.js 18+
- PostgreSQL 15+
- Redis 6+
- RabbitMQ 3.8+

### Установка

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd ai-aggregator
```

2. Настройте переменные окружения:
```bash
cp .env.example .env
# Отредактируйте .env файл
```

3. Запустите все сервисы:
```bash
docker-compose up -d
```

4. Проверьте статус сервисов:
```bash
docker-compose ps
```

### Первые шаги

1. **Регистрация компании**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Моя компания",
    "email": "admin@company.com",
    "password": "securepassword123"
  }'
```

2. **Получение API ключа**:
```bash
curl -X POST http://localhost:3000/api/v1/auth/api-keys \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "expiresAt": "2024-12-31T23:59:59.000Z"
  }'
```

3. **Пополнение баланса**:
```bash
curl -X POST http://localhost:3000/api/v1/payments \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1000,
    "currency": "RUB"
  }'
```

4. **Получение доступных моделей**:
```bash
# Все модели
curl http://localhost:3000/v1/chat/models

# Модели OpenAI
curl "http://localhost:3000/v1/chat/models?provider=openai"

# Информация о конкретной модели
curl http://localhost:3000/v1/chat/models/openai/gpt-4
```

5. **Отправка запроса к ИИ**:
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [
      {
        "role": "user",
        "content": "Привет! Как дела?"
      }
    ]
  }'
```

## Документация

### Общая документация

- [Архитектура системы](architecture.md) - Обзор архитектуры и принципов
- [Развертывание](deployment.md) - Инструкции по развертыванию
- [API документация](api.md) - Общие принципы API
- [Тестирование](testing.md) - Стратегия тестирования
- [FAQ](faq.md) - Часто задаваемые вопросы
- [Changelog](changelog.md) - История изменений

### Документация сервисов

#### Основные сервисы
- [API Gateway](services/api-gateway.md) - Маршрутизация и агрегация запросов
- [Auth Service](services/auth-service.md) - Аутентификация и управление компаниями
- [Billing Service](services/billing-service.md) - Биллинг и тарификация
- [Payment Service](services/payment-service.md) - Обработка платежей

#### Сервисы ИИ
- [Provider Orchestrator](services/provider-orchestrator.md) - Управление провайдерами
- [Proxy Service](services/proxy-service.md) - Проксирование к ИИ-API
- [Analytics Service](services/analytics-service.md) - Аналитика и метрики
- [AI Certification Service](services/ai-certification-service.md) - Сертификация моделей
- [Anonymization Service](services/anonymization-service.md) - Анонимизация данных

## API Endpoints

### Аутентификация
- `POST /api/v1/auth/register` - Регистрация компании
- `POST /api/v1/auth/login` - Вход в систему
- `POST /api/v1/auth/refresh` - Обновление токена
- `POST /api/v1/auth/api-keys` - Создание API ключа
- `GET /api/v1/auth/profile` - Получение профиля

### Биллинг
- `GET /api/v1/billing/balance` - Получение баланса
- `GET /api/v1/billing/transactions` - История транзакций
- `GET /api/v1/billing/usage` - Статистика использования
- `POST /api/v1/billing/plans` - Подписка на план

### Платежи
- `POST /api/v1/payments` - Создание платежа
- `GET /api/v1/payments/:id` - Получение платежа
- `GET /api/v1/payments` - Список платежей
- `POST /api/v1/webhooks/yookassa` - Webhook от YooKassa

### ИИ API
- `POST /v1/chat/completions` - Chat completions
- `GET /v1/chat/models` - Список доступных моделей нейросетей
- `GET /v1/chat/models/{provider}/{model}` - Информация о конкретной модели
- `POST /v1/embeddings` - Создание эмбеддингов
- `POST /v1/images/generations` - Генерация изображений

### Аналитика
- `GET /api/v1/analytics/usage` - Статистика использования
- `GET /api/v1/analytics/costs` - Анализ затрат
- `GET /api/v1/analytics/providers` - Статистика по провайдерам
- `GET /api/v1/analytics/reports` - Отчеты

### Анонимизация
- `POST /api/v1/anonymize` - Анонимизация текста
- `POST /api/v1/de-anonymize` - Деанонимизация текста
- `POST /api/v1/detect-pii` - Обнаружение PII
- `GET /api/v1/anonymization/settings` - Настройки анонимизации

## Конфигурация

### Переменные окружения

Основные переменные для всех сервисов:

```bash
# Общие настройки
NODE_ENV=development
LOG_LEVEL=info

# База данных
DATABASE_URL=postgresql://postgres:password@localhost:5432/ai_aggregator

# Redis
REDIS_URL=redis://localhost:6379

# RabbitMQ
RABBITMQ_URL=amqp://user:password@localhost:5672

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Внешние API
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
OPENROUTER_API_KEY=your-openrouter-api-key

# YooKassa
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# CBR API
CBR_API_URL=https://www.cbr-xml-daily.ru/daily_json.js
```

### Docker Compose

Основные сервисы в `docker-compose.yml`:

```yaml
version: '3.8'
services:
  # База данных
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: ai_aggregator
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management
    environment:
      RABBITMQ_DEFAULT_USER: user
      RABBITMQ_DEFAULT_PASS: password
    ports:
      - "5672:5672"
      - "15672:15672"
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq

  # API Gateway
  api-gateway:
    build: ./services/api-gateway
    ports:
      - "3000:3000"
    depends_on:
      - auth-service
      - billing-service
      - provider-orchestrator

  # Auth Service
  auth-service:
    build: ./services/auth-service
    ports:
      - "3001:3001"
    depends_on:
      - auth-db

  # Billing Service
  billing-service:
    build: ./services/billing-service
    ports:
      - "3004:3004"
    depends_on:
      - billing-db
      - redis

  # Payment Service
  payment-service:
    build: ./services/payment-service
    ports:
      - "3006:3006"
    depends_on:
      - payment-db

  # Provider Orchestrator
  provider-orchestrator:
    build: ./services/provider-orchestrator
    ports:
      - "3002:3002"
    depends_on:
      - orchestrator-db
      - rabbitmq

  # Proxy Service
  proxy-service:
    build: ./services/proxy-service
    ports:
      - "3003:3003"
    depends_on:
      - rabbitmq
      - billing-service

  # Analytics Service
  analytics-service:
    build: ./services/analytics-service
    ports:
      - "3005:3005"
    depends_on:
      - analytics-db
      - rabbitmq

  # AI Certification Service
  ai-certification-service:
    build: ./services/ai-certification-service
    ports:
      - "3007:3007"
    depends_on:
      - certification-db
      - rabbitmq

  # Anonymization Service
  anonymization-service:
    build: ./services/anonymization-service
    ports:
      - "3008:3008"
    depends_on:
      - anonymization-db
      - redis
      - rabbitmq

volumes:
  postgres_data:
  redis_data:
  rabbitmq_data:
  auth_db_data:
  billing_db_data:
  payment_db_data:
  orchestrator_db_data:
  analytics_db_data:
  certification_db_data:
  anonymization_db_data:
```

## Разработка

### Структура проекта

```
ai-aggregator/
├── services/                 # Микросервисы
│   ├── api-gateway/         # API Gateway
│   ├── auth-service/        # Аутентификация
│   ├── billing-service/     # Биллинг
│   ├── payment-service/     # Платежи
│   ├── provider-orchestrator/ # Оркестратор провайдеров
│   ├── proxy-service/       # Прокси сервис
│   ├── analytics-service/   # Аналитика
│   ├── ai-certification-service/ # Сертификация ИИ
│   ├── anonymization-service/ # Анонимизация
│   └── shared/              # Общие компоненты
├── docs/                    # Документация
├── tests/                   # Тесты
├── docker-compose.yml       # Docker Compose
└── README.md               # Этот файл
```

### Запуск в режиме разработки

1. Установите зависимости:
```bash
npm install
```

2. Запустите базу данных и Redis:
```bash
docker-compose up -d postgres redis rabbitmq
```

3. Запустите сервисы в режиме разработки:
```bash
# В отдельных терминалах
cd services/auth-service && npm run start:dev
cd services/billing-service && npm run start:dev
cd services/payment-service && npm run start:dev
cd services/api-gateway && npm run start:dev
```

### Тестирование

```bash
# Все тесты
npm test

# Только unit тесты
npm run test:unit

# Только integration тесты
npm run test:integration

# E2E тесты
npm run test:e2e

# Тесты конкретного сервиса
npm run test:auth
npm run test:billing
npm run test:payment
```

## Мониторинг

### Health Checks

Все сервисы предоставляют health check endpoints:

- API Gateway: `http://localhost:3000/health`
- Auth Service: `http://localhost:3001/health`
- Billing Service: `http://localhost:3004/health`
- Payment Service: `http://localhost:3006/health`
- Provider Orchestrator: `http://localhost:3002/health`
- Proxy Service: `http://localhost:3003/health`
- Analytics Service: `http://localhost:3005/health`
- AI Certification Service: `http://localhost:3007/health`
- Anonymization Service: `http://localhost:3008/health`

### Логирование

Логи доступны через Docker:

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f api-gateway
docker-compose logs -f auth-service
docker-compose logs -f billing-service
```

### Метрики

Метрики доступны через Prometheus на порту 9090:

```bash
# Prometheus
http://localhost:9090

# Grafana
http://localhost:3001
```

## Безопасность

### Аутентификация

- JWT токены для API аутентификации
- API ключи для интеграций
- Refresh токены для обновления сессий

### Авторизация

- Роли: admin, company, service, fsb
- Права доступа на уровне сервисов
- Rate limiting для защиты от злоупотреблений

### Шифрование

- Все пароли хешируются с bcrypt
- Чувствительные данные шифруются
- HTTPS для всех внешних соединений

### GDPR

- Анонимизация персональных данных
- Право на удаление данных
- Аудит доступа к данным
- Согласие на обработку данных

## Поддержка

### Документация

- [FAQ](faq.md) - Часто задаваемые вопросы
- [Troubleshooting](troubleshooting.md) - Решение проблем
- [API Reference](api-reference.md) - Полная справка по API

### Контакты

- Email: support@ai-aggregator.com
- Telegram: @ai_aggregator_support
- GitHub Issues: [Создать issue](https://github.com/ai-aggregator/platform/issues)

## Лицензия

MIT License - см. [LICENSE](LICENSE) файл.

## Changelog

См. [CHANGELOG.md](changelog.md) для истории изменений.