# Deployment Guide: Hierarchical Company System

## Быстрый старт

### 1. Предварительные требования

- Docker Desktop (Windows/Mac) или Docker Engine (Linux)
- PostgreSQL клиент (`psql`) для применения миграций
- PowerShell 5.1+ (для Windows)
- Node.js 18+ (опционально, для локальной разработки)

### 2. Установка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd project

# Проверить наличие .env файла (уже включен в репозиторий)
# При необходимости обновить API ключи в .env
```

### 3. Запуск базовых сервисов

```powershell
# Запустить PostgreSQL и RabbitMQ
docker-compose up -d auth-db billing-db rabbitmq redis

# Дождаться запуска БД (примерно 10 секунд)
Start-Sleep -Seconds 10
```

### 4. Применение миграций

```powershell
# Применить SQL миграции для иерархической структуры
.\apply-hierarchy-migrations.ps1
```

Скрипт выполнит:
- ✅ Миграцию Auth Service DB (добавление hierarchy и billing mode)
- ✅ Миграцию Billing Service DB (добавление initiator tracking)
- ✅ Генерацию Prisma клиентов
- ✅ Проверку успешности применения

### 5. Сборка и запуск сервисов

```powershell
# Собрать все сервисы
docker-compose build

# Запустить все сервисы
docker-compose up -d

# Проверить статус
docker-compose ps
```

Ожидаемый результат:
```
NAME                          STATUS
project-api-gateway-1         Up
project-auth-service-1        Up
project-billing-service-1     Up
project-proxy-service-1       Up
project-provider-orchestrator-1  Up
project-analytics-service-1   Up (опционально)
```

### 6. Проверка работоспособности

```powershell
# Проверить health endpoints
curl http://localhost:3000/health  # API Gateway
curl http://localhost:3001/health  # Auth Service
curl http://localhost:3004/health  # Billing Service

# Запустить комплексный тест
.\test-hierarchical-system.ps1
```

## Детальная настройка

### Переменные окружения (.env)

```env
# Database URLs
AUTH_DATABASE_URL=postgresql://user:password@auth-db:5432/auth_db
BILLING_DATABASE_URL=postgresql://user:password@billing-db:5432/billing_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1h

# API Keys
OPENAI_API_KEY=your-openai-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
YANDEX_API_KEY=your-yandex-api-key

# Service URLs
AUTH_SERVICE_HTTP_URL=http://auth-service:3001
BILLING_SERVICE_HTTP_URL=http://billing-service:3004
PROXY_SERVICE_HTTP_URL=http://proxy-service:3003

# RabbitMQ
RABBITMQ_URL=amqp://user:pass@rabbitmq:5672
```

### Порты сервисов

| Сервис               | Порт | Описание                    |
|----------------------|------|-----------------------------|
| API Gateway          | 3000 | Единая точка входа          |
| Auth Service         | 3001 | Аутентификация              |
| Provider Orchestrator| 3002 | Маршрутизация запросов      |
| Proxy Service        | 3003 | Интеграция с AI провайдерами|
| Billing Service      | 3004 | Биллинг и транзакции        |
| Analytics Service    | 3005 | Аналитика (опционально)     |
| PostgreSQL (Auth)    | 5432 | БД аутентификации           |
| PostgreSQL (Billing) | 5433 | БД биллинга                 |
| RabbitMQ Management  | 15672| Управление очередями        |
| Redis                | 6379 | Кеш                         |

## Архитектура миграции

### До миграции
```
User Model
  ├─ id, email, password
  └─ companyId (FK → Company)

Company Model
  └─ id, name, email
```

### После миграции
```
Company Model (Unified)
  ├─ id, name, email, password
  ├─ parentCompanyId (FK → Company, nullable)
  ├─ billingMode (SELF_PAID | PARENT_PAID)
  ├─ position, department
  └─ Relations:
       ├─ parentCompany
       ├─ childCompanies[]
       ├─ transactions[]
       └─ usageEvents[]
```

### Изменения в БД

#### Auth Service
1. Добавлены поля в `companies`:
   - `parentCompanyId` - для иерархии
   - `billingMode` - режим оплаты
   - `position`, `department` - метаданные
2. Обновлены FK во всех связанных таблицах
3. Удалена таблица `users`

#### Billing Service
1. Добавлены поля:
   - `transactions.initiatorCompanyId`
   - `usage_events.initiatorCompanyId`
2. Индексы для производительности
3. Каскадные удаления настроены

## Тестирование

### Базовый тест

```powershell
.\test-hierarchical-system.ps1
```

Тест проверяет:
1. ✅ Регистрация root-компании
2. ✅ Создание дочерних компаний (PARENT_PAID и SELF_PAID)
3. ✅ Получение иерархии
4. ✅ AI-запросы с корректным списанием
5. ✅ Проверка балансов
6. ✅ Статистика дочерних компаний
7. ✅ Изменение режима биллинга

### Ручное тестирование

#### 1. Создать root-компанию

```powershell
$body = @{
    name = "Test Company"
    email = "test@example.com"
    password = "SecurePass123!"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/companies/register" `
    -Method POST -Body $body -ContentType "application/json"
```

#### 2. Создать дочернюю компанию

```powershell
$childBody = @{
    name = "Child Company"
    email = "child@example.com"
    password = "ChildPass123!"
    billingMode = "PARENT_PAID"
    position = "Manager"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3001/companies/$rootId/child-companies" `
    -Method POST -Body $childBody -ContentType "application/json" `
    -Headers @{Authorization = "Bearer $token"}
```

#### 3. Сделать AI-запрос

```powershell
$aiRequest = @{
    model = "gpt-4o-mini"
    messages = @(
        @{role = "user"; content = "Hello"}
    )
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions?provider=openai" `
    -Method POST -Body $aiRequest -ContentType "application/json" `
    -Headers @{Authorization = "Bearer $childToken"}
```

#### 4. Проверить списание

```powershell
# Проверить баланс родителя (должен уменьшиться, если child PARENT_PAID)
Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$rootId/balance" `
    -Method GET

# Проверить баланс ребенка (не должен измениться, если PARENT_PAID)
Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$childId/balance" `
    -Method GET
```

## Мониторинг

### Логи сервисов

```powershell
# Просмотр логов auth-service
docker-compose logs -f auth-service

# Просмотр логов billing-service
docker-compose logs -f billing-service

# Просмотр логов api-gateway
docker-compose logs -f api-gateway

# Все логи
docker-compose logs -f
```

### Ключевые метрики

**Billing Logic:**
```
LoggerUtil.info('billing-service', 'Usage tracked successfully', {
  payerId: 'parent-id',      // Кто платит
  initiatorId: 'child-id',   // Кто инициировал
  service: 'openai',
  cost: 0.05
});
```

**Company Creation:**
```
LoggerUtil.info('auth-service', 'Child company created', {
  parentId: 'parent-id',
  childId: 'child-id',
  billingMode: 'PARENT_PAID'
});
```

## Устранение неполадок

### Проблема: Миграция не применяется

**Симптомы:**
```
ERROR:  column "parent_company_id" of relation "companies" does not exist
```

**Решение:**
1. Проверить что БД запущена: `docker-compose ps`
2. Проверить подключение: `psql -h localhost -p 5432 -U user -d auth_db`
3. Применить миграцию вручную:
```powershell
$env:PGPASSWORD = "password"
psql -h localhost -p 5432 -U user -d auth_db -f migrations/001_add_company_hierarchy_auth.sql
```

### Проблема: TypeScript ошибки при сборке

**Симптомы:**
```
Property 'parentCompanyId' does not exist on type 'Company'
```

**Решение:**
1. Регенерировать Prisma клиенты:
```powershell
cd services/auth-service
npx prisma generate

cd ../billing-service
npx prisma generate
```

2. Пересобрать Docker образы:
```powershell
docker-compose build --no-cache auth-service billing-service
```

### Проблема: Сервисы не запускаются

**Симптомы:**
```
auth-service-1 exited with code 1
```

**Решение:**
1. Проверить логи: `docker-compose logs auth-service`
2. Проверить переменные окружения в `.env`
3. Проверить порты (не заняты другими процессами)
4. Очистить и пересобрать:
```powershell
docker-compose down -v
docker-compose up -d auth-db billing-db rabbitmq redis
.\apply-hierarchy-migrations.ps1
docker-compose build
docker-compose up -d
```

### Проблема: Не списываются деньги

**Симптомы:**
- Баланс не меняется после AI-запроса
- Транзакции не создаются

**Решение:**
1. Проверить логи billing-service:
```powershell
docker-compose logs billing-service | Select-String "determinePayerCompany"
```

2. Проверить режим биллинга компании:
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/companies/$companyId" `
    -Method GET -Headers @{Authorization = "Bearer $token"}
```

3. Проверить баланс родителя (если PARENT_PAID):
```powershell
Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$parentId/balance"
```

## Откат миграции (если требуется)

**⚠️ ВНИМАНИЕ:** Откат приведет к потере данных!

```sql
-- Откат Auth Service
ALTER TABLE companies DROP COLUMN IF EXISTS parent_company_id;
ALTER TABLE companies DROP COLUMN IF EXISTS billing_mode;
ALTER TABLE companies DROP COLUMN IF EXISTS position;
ALTER TABLE companies DROP COLUMN IF EXISTS department;

-- Откат Billing Service
ALTER TABLE transactions DROP COLUMN IF EXISTS initiator_company_id;
ALTER TABLE usage_events DROP COLUMN IF EXISTS initiator_company_id;
```

## Production Checklist

- [ ] Обновлены API ключи в `.env`
- [ ] Настроен JWT_SECRET (уникальный для production)
- [ ] Применены миграции БД
- [ ] Настроены резервные копии БД
- [ ] Настроен HTTPS/TLS для API Gateway
- [ ] Настроен firewall для БД портов
- [ ] Настроен мониторинг (Prometheus/Grafana)
- [ ] Настроены alertы для критических событий
- [ ] Проведено нагрузочное тестирование
- [ ] Настроен log rotation
- [ ] Документированы процедуры восстановления
- [ ] Обучена команда поддержки

## Контакты и поддержка

При возникновении проблем:
1. Проверьте логи: `docker-compose logs <service-name>`
2. Проверьте health endpoints
3. Запустите тесты: `.\test-hierarchical-system.ps1`
4. Проверьте документацию: `HIERARCHICAL_SYSTEM_IMPLEMENTATION.md`

