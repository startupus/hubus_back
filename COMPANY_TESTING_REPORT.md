# Company Flow Testing Report

## Дата тестирования
09.10.2025

## Цель тестирования
Проверить полный цикл работы с пользователями-компаниями через единую точку входа, включая:
1. Регистрацию и авторизацию новых компаний
2. Пополнение баланса компаний
3. Отправку запросов к ИИ сервисам
4. Иерархию списания средств со счета

## Результаты тестирования

### 1. Регистрация и авторизация компаний ✅

**Статус:** УСПЕШНО

**Детали:**
- Регистрация новых компаний работает через эндпоинт `POST /companies/register` в auth-service
- Авторизация компаний работает через эндпоинт `POST /companies/login` в auth-service
- При регистрации автоматически генерируется JWT токен (accessToken и refreshToken)
- Компании создаются с ролью `company` и статусом `isVerified: true`

**Тестовый скрипт:** `test-company-flow.ps1`

**Примеры:**
```powershell
# Регистрация
POST http://localhost:3001/companies/register
{
  "name": "Test Company",
  "email": "test@example.com",
  "password": "TestPassword123!",
  "description": "Test company"
}

# Авторизация
POST http://localhost:3001/companies/login
{
  "email": "test@example.com",
  "password": "TestPassword123!"
}
```

### 2. Пополнение баланса компаний ✅

**Статус:** УСПЕШНО

**Детали:**
- Пополнение баланса работает через эндпоинт `POST /billing/transactions` в billing-service
- Баланс автоматически создается при первом обращении к billing-service
- Транзакции типа `CREDIT` увеличивают баланс компании
- Все транзакции сохраняются в истории

**Эндпоинт:**
```powershell
POST http://localhost:3004/billing/transactions
{
  "userId": "company-id",
  "amount": 100,
  "type": "CREDIT",
  "currency": "USD",
  "description": "Top-up"
}
```

**Проверка баланса:**
```powershell
GET http://localhost:3004/billing/company/{companyId}/balance
```

### 3. Отправка запросов к ИИ сервисам ⚠️

**Статус:** ЧАСТИЧНО РАБОТАЕТ

**Детали:**
- API Gateway доступен на порту 3000
- Эндпоинт `/chat/completions` требует авторизации через JWT токен
- При отправке запросов к внешним ИИ сервисам (OpenAI, OpenRouter) возникают ошибки региона (expected behavior)
- Система корректно обрабатывает ошибки и возвращает информативные сообщения

**Примечание:** Ошибки региона ожидаемы, так как внешние API могут быть недоступны из текущего региона.

### 4. Иерархия списания средств со счета ⚠️

**Статус:** ЧАСТИЧНО РЕАЛИЗОВАНО

**Детали:**
- Модель данных поддерживает иерархию компаний (parentCompanyId, billingMode)
- Доступны два режима биллинга:
  - `SELF_PAID` - компания платит сама за себя
  - `PARENT_PAID` - родительская компания платит за дочернюю
- Эндпоинт для изменения billing mode: `PUT /companies/{companyId}/billing-mode`
- Логика определения плательщика реализована в `billing-service` (метод `determinePayerCompany`)

**Тестовый скрипт:** `test-company-hierarchy.ps1`

**Проблемы:**
- Отсутствует эндпоинт для установки родительской компании (`PUT /companies/{companyId}/parent`)
- Необходимо добавить валидацию при изменении billing mode (проверка наличия родителя)

### 5. Единая точка входа (API Gateway) ⚠️

**Статус:** ТРЕБУЕТ ДОРАБОТКИ

**Детали:**
- API Gateway работает на порту 3000
- Health check доступен: `GET /health`
- Swagger документация доступна: `GET /api/docs`

**Проблемы:**
- AuthController не зарегистрирован в API Gateway
- Маршруты `/auth/register` и `/auth/login` отсутствуют
- Требуется добавить AuthController и AuthService в AuthModule

**Обходное решение:**
- Использовать auth-service напрямую на порту 3001
- Использовать billing-service напрямую на порту 3004

## Архитектура системы

### Сервисы и порты:
- **API Gateway:** 3000 (единая точка входа)
- **Auth Service:** 3001 (аутентификация и управление компаниями)
- **Provider Orchestrator:** 3002 (маршрутизация запросов к ИИ)
- **Proxy Service:** 3003 (интеграция с внешними ИИ провайдерами)
- **Billing Service:** 3004 (биллинг, балансы, транзакции)
- **Analytics Service:** 3005 (метрики и аналитика)
- **AI Certification Service:** 3007 (сертификация моделей)
- **Anonymization Service:** 3008 (анонимизация данных)

### Базы данных:
- **auth-db:** PostgreSQL (порт 5432) - пользователи и компании
- **billing-db:** PostgreSQL (порт 5433) - балансы и транзакции
- **orchestrator-db:** PostgreSQL (порт 5434) - провайдеры и маршрутизация
- **api-gateway-db:** PostgreSQL (порт 5437) - кэш и сессии
- **analytics-db:** PostgreSQL (порт 5435) - метрики и логи
- **certification-db:** PostgreSQL (порт 5436) - сертификаты моделей
- **anonymization-db:** PostgreSQL (порт 5438) - правила анонимизации

### Инфраструктура:
- **Redis:** 6379 (кэширование и сессии)
- **RabbitMQ:** 5672, 15672 (асинхронная коммуникация)

## Рекомендации

### Критичные:
1. ✅ **Добавить AuthController в API Gateway** - исправлено в `services/api-gateway/src/auth/auth.module.ts`
2. ⚠️ **Пересобрать и перезапустить API Gateway** - требуется выполнить
3. ⚠️ **Добавить эндпоинт для установки родительской компании** - требуется реализация

### Желательные:
1. Добавить валидацию при изменении billing mode
2. Добавить тесты для проверки иерархии списания
3. Добавить документацию по API Gateway
4. Настроить CORS для API Gateway

## Выводы

### Что работает:
- ✅ Регистрация и авторизация компаний через auth-service
- ✅ Пополнение баланса через billing-service
- ✅ Проверка баланса и истории транзакций
- ✅ Модель данных для иерархии компаний
- ✅ Логика определения плательщика в billing-service

### Что требует доработки:
- ⚠️ API Gateway не имеет маршрутов для аутентификации
- ⚠️ Отсутствует эндпоинт для установки родительской компании
- ⚠️ Требуется тестирование полного цикла списания средств с учетом иерархии

### Общая оценка:
**7/10** - Основная функциональность работает, но требуется доработка API Gateway и добавление недостающих эндпоинтов для полной поддержки иерархии компаний.

## Тестовые скрипты

Созданы следующие скрипты для тестирования:
- `test-company-flow.ps1` - тестирование базового цикла работы с компаниями
- `test-company-hierarchy.ps1` - тестирование иерархии компаний и списания средств

## Примеры использования

### Регистрация новой компании:
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        name = "My Company"
        email = "company@example.com"
        password = "SecurePassword123!"
        description = "My test company"
    } | ConvertTo-Json)

$companyId = $response.company.id
$accessToken = $response.accessToken
```

### Пополнение баланса:
```powershell
$response = Invoke-RestMethod -Uri "http://localhost:3004/billing/transactions" `
    -Method POST `
    -ContentType "application/json" `
    -Body (@{
        userId = $companyId
        amount = 100
        type = "CREDIT"
        currency = "USD"
        description = "Initial balance"
    } | ConvertTo-Json)
```

### Проверка баланса:
```powershell
$balance = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
    -Method GET

Write-Host "Balance: $($balance.balance.balance) USD"
```

