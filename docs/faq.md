# FAQ - Частые вопросы

## Общие вопросы

### Что такое AI Aggregator?

AI Aggregator — это микросервисная платформа для агрегации и управления различными ИИ-провайдерами. Система предоставляет единый API для работы с различными языковыми моделями, обеспечивая гибкость, масштабируемость и экономическую эффективность.

### Какие ИИ-провайдеры поддерживаются?

В настоящее время поддерживаются:
- **OpenAI** (GPT-4, GPT-3.5, DALL-E)
- **Anthropic** (Claude 3 Sonnet, Claude 3 Haiku)
- **OpenRouter** (доступ к множеству моделей)
- **Google** (Gemini Pro)
- **Meta** (LLaMA 2)

### Как работает тарификация?

Система поддерживает два типа тарификации:
- **Планы подписки** с включенными токенами и скидками
- **Pay-as-you-go** для запросов без подписки или после исчерпания включенных токенов

## Установка и настройка

### Какие системные требования?

**Минимальные требования:**
- RAM: 8GB
- CPU: 4 ядра
- Диск: 20GB свободного места
- Docker: 20.10+
- Docker Compose: 2.0+

**Рекомендуемые требования:**
- RAM: 16GB
- CPU: 8 ядер
- Диск: 50GB SSD
- Docker: 24.0+
- Docker Compose: 2.20+

### Как установить проект?

```bash
# 1. Клонирование репозитория
git clone https://github.com/your-org/ai-aggregator.git
cd ai-aggregator

# 2. Настройка окружения
cp .env.example .env
# Отредактируйте .env файл

# 3. Запуск сервисов
docker-compose up -d

# 4. Проверка статуса
docker-compose ps
```

### Как настроить переменные окружения?

Создайте файл `.env` в корне проекта:

```bash
# Основные настройки
NODE_ENV=development
LOG_LEVEL=info

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Базы данных
AUTH_DATABASE_URL=postgresql://postgres:password@auth-db:5432/auth_db
BILLING_DATABASE_URL=postgresql://postgres:password@billing-db:5432/billing_db
PAYMENT_DATABASE_URL=postgresql://postgres:password@payment-db:5432/payment_db

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

# YooKassa
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
```

## API и интеграция

### Как получить API ключ?

1. Зарегистрируйте компанию через `/api/v1/auth/register`
2. Войдите в систему через `/api/v1/auth/login`
3. Создайте API ключ через `/api/v1/auth/api-keys`

```bash
# Пример создания API ключа
curl -X POST http://localhost:3000/api/v1/auth/api-keys \
  -H "Authorization: Bearer <your-jwt-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Production API Key",
    "permissions": ["chat", "billing", "analytics"]
  }'
```

### Как использовать API?

```bash
# Пример запроса к чату
curl -X POST http://localhost:3000/api/v1/chat/completions \
  -H "X-API-Key: <your-api-key>" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [
      {
        "role": "user",
        "content": "Привет! Как дела?"
      }
    ]
  }'
```

### Какие форматы ответов поддерживаются?

- **JSON** (по умолчанию)
- **Server-Sent Events** для стриминга
- **WebSocket** (планируется)

## Биллинг и платежи

### Как работает система балансов?

Каждая компания имеет:
- **Текущий баланс** в долларах США
- **Кредитный лимит** для овердрафта
- **Историю транзакций** с детализацией

### Как пополнить баланс?

1. Создайте платеж через `/api/v1/payments`
2. Перейдите по ссылке для оплаты
3. Оплатите через YooKassa (SBP)
4. Баланс пополнится автоматически

### Какие способы оплаты поддерживаются?

- **SBP** (Система быстрых платежей) - основной способ
- **Банковские карты** через YooKassa
- **Электронные кошельки** (планируется)

### Как работает реферальная система?

- Создайте реферальный код через API
- Поделитесь ссылкой с другими компаниями
- Получайте 10% от их расходов на ИИ
- Комиссии начисляются автоматически

## Технические вопросы

### Как работает маршрутизация запросов?

1. **API Gateway** получает запрос
2. **Provider Orchestrator** выбирает оптимальный провайдер
3. **Proxy Service** проксирует запрос к выбранному провайдеру
4. **Billing Service** списывает стоимость с баланса

### Как настроить мониторинг?

```bash
# Запуск с мониторингом
docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d

# Доступ к дашбордам
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3001 (admin/admin)
```

### Как настроить логирование?

```bash
# Просмотр логов всех сервисов
docker-compose logs -f

# Просмотр логов конкретного сервиса
docker-compose logs -f auth-service

# Логи с фильтрацией
docker-compose logs -f | grep "ERROR"
```

## Проблемы и решения

### Сервис не запускается

**Проблема:** Контейнер падает при запуске

**Решение:**
```bash
# 1. Проверьте логи
docker-compose logs service-name

# 2. Проверьте переменные окружения
docker-compose exec service-name env

# 3. Проверьте подключение к БД
docker-compose exec service-name npx prisma db pull

# 4. Пересоберите образ
docker-compose build --no-cache service-name
```

### Ошибки аутентификации

**Проблема:** `401 Unauthorized` при запросах

**Решение:**
```bash
# 1. Проверьте JWT секрет
echo $JWT_SECRET

# 2. Проверьте токен
jwt decode <your-token>

# 3. Обновите токен
curl -X POST http://localhost:3000/api/v1/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "<your-refresh-token>"}'
```

### Проблемы с базой данных

**Проблема:** `Connection refused` к БД

**Решение:**
```bash
# 1. Проверьте статус БД
docker-compose ps | grep postgres

# 2. Перезапустите БД
docker-compose restart auth-db

# 3. Проверьте подключение
docker-compose exec auth-db psql -U postgres -c "SELECT 1;"

# 4. Выполните миграции
docker-compose exec auth-service npx prisma migrate deploy
```

### Проблемы с Redis

**Проблема:** `Redis connection failed`

**Решение:**
```bash
# 1. Проверьте статус Redis
docker-compose ps | grep redis

# 2. Перезапустите Redis
docker-compose restart redis

# 3. Проверьте подключение
docker-compose exec redis redis-cli ping

# 4. Очистите кэш
docker-compose exec redis redis-cli FLUSHDB
```

### Проблемы с RabbitMQ

**Проблема:** `RabbitMQ connection failed`

**Решение:**
```bash
# 1. Проверьте статус RabbitMQ
docker-compose ps | grep rabbitmq

# 2. Перезапустите RabbitMQ
docker-compose restart rabbitmq

# 3. Проверьте очереди
docker-compose exec rabbitmq rabbitmqctl list_queues

# 4. Проверьте пользователей
docker-compose exec rabbitmq rabbitmqctl list_users
```

## Производительность

### Как оптимизировать производительность?

1. **Настройте Redis** для кэширования
2. **Используйте connection pooling** для БД
3. **Настройте rate limiting** для защиты
4. **Мониторьте метрики** через Prometheus

### Как масштабировать систему?

```bash
# Горизонтальное масштабирование
docker-compose up -d --scale api-gateway=3
docker-compose up -d --scale auth-service=2

# Вертикальное масштабирование
# Увеличьте ресурсы в docker-compose.yml
```

## Безопасность

### Как обеспечить безопасность?

1. **Используйте HTTPS** в production
2. **Настройте firewall** для защиты портов
3. **Регулярно обновляйте** зависимости
4. **Мониторьте логи** на подозрительную активность

### Как настроить SSL?

```bash
# 1. Получите сертификат
certbot --nginx -d your-domain.com

# 2. Настройте Nginx
# См. docs/deployment.md

# 3. Обновите переменные окружения
FRONTEND_URL=https://your-domain.com
```

## Поддержка

### Как получить помощь?

1. **Проверьте документацию** в папке `docs/`
2. **Изучите логи** сервисов
3. **Создайте Issue** на GitHub
4. **Напишите в поддержку** support@ai-aggregator.com

### Как сообщить об ошибке?

При создании Issue укажите:
- Версию системы
- Шаги для воспроизведения
- Логи ошибок
- Конфигурацию окружения

### Как предложить улучшение?

1. Создайте **Feature Request** на GitHub
2. Опишите проблему и предлагаемое решение
3. Укажите приоритет и сложность реализации
