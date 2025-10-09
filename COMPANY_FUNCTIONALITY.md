# Функционал компаний

## Обзор

Компании теперь имеют полный функционал, аналогичный обычным пользователям (сотрудникам), плюс дополнительные административные возможности:

### Базовый функционал (как у пользователей):
- ✅ Регистрация и аутентификация
- ✅ Создание и управление API ключами
- ✅ Выполнение запросов к AI моделям
- ✅ Просмотр баланса и транзакций
- ✅ Получение отчетов по использованию

### Дополнительный функционал (только для компаний):
- ✅ Регистрация сотрудников
- ✅ Просмотр списка сотрудников
- ✅ Статистика по использованию сотрудниками
- ✅ Пополнение баланса
- ✅ Управление настройками компании

## API Эндпоинты

### 1. Регистрация компании

**POST** `/v1/companies/register`

**Body:**
```json
{
  "name": "Company Name",
  "email": "company@example.com",
  "password": "SecurePassword123!",
  "description": "Company description (optional)"
}
```

**Response:**
```json
{
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "email": "company@example.com",
    "role": "company",
    "isActive": true,
    "isVerified": true,
    "createdAt": "2025-10-09T..."
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

### 2. Логин компании

**POST** `/v1/companies/login`

**Body:**
```json
{
  "email": "company@example.com",
  "password": "SecurePassword123!"
}
```

**Response:**
```json
{
  "company": {
    "id": "uuid",
    "name": "Company Name",
    "email": "company@example.com",
    "role": "company",
    "isActive": true,
    "isVerified": true,
    "lastLoginAt": "2025-10-09T..."
  },
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token"
}
```

### 3. Создание API ключа

**POST** `/v1/companies/:companyId/api-keys`

**Headers:** `Authorization: Bearer <access-token>`

**Body:**
```json
{
  "name": "API Key Name",
  "description": "Optional description",
  "permissions": ["chat:read", "chat:write"],
  "expiresAt": "2026-01-01T00:00:00Z" // optional
}
```

**Response:**
```json
{
  "id": "uuid",
  "key": "sk-comp-...",
  "name": "API Key Name",
  "description": "Optional description",
  "isActive": true,
  "permissions": ["chat:read", "chat:write"],
  "createdAt": "2025-10-09T...",
  "expiresAt": "2026-01-01T00:00:00Z"
}
```

### 4. Получение списка API ключей

**GET** `/v1/companies/:companyId/api-keys`

**Headers:** `Authorization: Bearer <access-token>`

**Response:**
```json
[
  {
    "id": "uuid",
    "key": "sk-comp-...",
    "name": "API Key Name",
    "isActive": true,
    "permissions": ["chat:read", "chat:write"],
    "lastUsedAt": "2025-10-09T...",
    "createdAt": "2025-10-09T..."
  }
]
```

### 5. Создание сотрудника

**POST** `/v1/companies/:companyId/users`

**Headers:** `Authorization: Bearer <access-token>`

**Body:**
```json
{
  "email": "employee@example.com",
  "password": "EmployeePass123!",
  "firstName": "John",
  "lastName": "Doe",
  "position": "Developer",
  "department": "Engineering"
}
```

**Response:**
```json
{
  "id": "uuid",
  "email": "employee@example.com",
  "firstName": "John",
  "lastName": "Doe",
  "position": "Developer",
  "department": "Engineering",
  "isActive": true,
  "isVerified": true,
  "createdAt": "2025-10-09T..."
}
```

### 6. Получение списка сотрудников

**GET** `/v1/companies/:companyId/users`

**Headers:** `Authorization: Bearer <access-token>`

**Response:**
```json
[
  {
    "id": "uuid",
    "email": "employee@example.com",
    "firstName": "John",
    "lastName": "Doe",
    "position": "Developer",
    "department": "Engineering",
    "isActive": true,
    "isVerified": true,
    "createdAt": "2025-10-09T..."
  }
]
```

### 7. Запрос к AI (как обычный пользователь)

**POST** `/v1/chat/completions?provider=openai`

**Headers:** `Authorization: Bearer <access-token>`

**Body:**
```json
{
  "model": "gpt-4o-mini",
  "messages": [
    {
      "role": "user",
      "content": "Привет! Это запрос от компании."
    }
  ]
}
```

**Response:**
```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-4o-mini",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Привет! Чем могу помочь?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

### 8. Получение баланса компании

**GET** `/v1/billing/company/:companyId/balance`

**Response:**
```json
{
  "success": true,
  "message": "Company balance retrieved successfully",
  "balance": {
    "id": "uuid",
    "companyId": "uuid",
    "balance": "100.0000",
    "currency": "USD",
    "creditLimit": null,
    "lastUpdated": "2025-10-09T...",
    "createdAt": "2025-10-09T..."
  }
}
```

### 9. Получение транзакций компании

**GET** `/v1/billing/company/:companyId/transactions?limit=50&offset=0`

**Response:**
```json
{
  "success": true,
  "message": "Company transactions retrieved successfully",
  "transactions": [
    {
      "id": "uuid",
      "companyId": "uuid",
      "userId": "uuid",
      "type": "DEBIT",
      "amount": "0.0050",
      "currency": "USD",
      "description": "AI request cost",
      "status": "COMPLETED",
      "createdAt": "2025-10-09T..."
    }
  ]
}
```

### 10. Получение статистики по сотрудникам

**GET** `/v1/billing/company/:companyId/users/statistics?startDate=2025-10-01&endDate=2025-10-31`

**Response:**
```json
{
  "success": true,
  "message": "Company users statistics retrieved successfully",
  "statistics": {
    "companyId": "uuid",
    "period": {
      "start": "2025-10-01T00:00:00Z",
      "end": "2025-10-31T23:59:59Z"
    },
    "totals": {
      "totalUsers": 5,
      "totalRequests": 150,
      "totalCost": 7.50,
      "totalTransactions": 150
    },
    "users": [
      {
        "user": {
          "id": "uuid",
          "email": "employee@example.com",
          "firstName": "John",
          "lastName": "Doe",
          "position": "Developer",
          "department": "Engineering"
        },
        "statistics": {
          "totalRequests": 50,
          "totalCost": 2.50,
          "totalTransactions": 50,
          "byService": {
            "openai": {
              "count": 30,
              "cost": 1.50
            },
            "openrouter": {
              "count": 20,
              "cost": 1.00
            }
          }
        }
      }
    ]
  }
}
```

### 11. Получение отчета по биллингу

**GET** `/v1/billing/company/:companyId/report?startDate=2025-10-01&endDate=2025-10-31`

**Response:**
```json
{
  "success": true,
  "message": "Company billing report generated successfully",
  "report": {
    "userId": "company-uuid",
    "period": {
      "start": "2025-10-01T00:00:00Z",
      "end": "2025-10-31T23:59:59Z"
    },
    "totalUsage": 150,
    "totalCost": 7.50,
    "currency": "USD",
    "breakdown": {
      "byService": {
        "openai": {
          "count": 80,
          "cost": 4.00
        },
        "openrouter": {
          "count": 70,
          "cost": 3.50
        }
      },
      "byResource": {
        "gpt-4o-mini": {
          "count": 100,
          "cost": 5.00
        },
        "claude-3.5-sonnet": {
          "count": 50,
          "cost": 2.50
        }
      },
      "byDay": {
        "2025-10-01": {
          "count": 10,
          "cost": 0.50
        }
      }
    },
    "transactions": []
  }
}
```

### 12. Получение информации о компании

**GET** `/v1/companies/:companyId`

**Headers:** `Authorization: Bearer <access-token>`

**Response:**
```json
{
  "id": "uuid",
  "name": "Company Name",
  "email": "company@example.com",
  "description": "Company description",
  "isActive": true,
  "isVerified": true,
  "createdAt": "2025-10-09T...",
  "updatedAt": "2025-10-09T...",
  "users": [
    {
      "id": "uuid",
      "email": "employee@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "position": "Developer",
      "department": "Engineering"
    }
  ]
}
```

### 13. Обновление информации о компании

**PUT** `/v1/companies/:companyId`

**Headers:** `Authorization: Bearer <access-token>`

**Body:**
```json
{
  "name": "New Company Name",
  "description": "Updated description",
  "isActive": true
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "New Company Name",
  "email": "company@example.com",
  "description": "Updated description",
  "isActive": true,
  "updatedAt": "2025-10-09T..."
}
```

## Архитектура

### JWT Токены

Компании получают JWT токены с полем `type: 'company'`:

```json
{
  "sub": "company-uuid",
  "email": "company@example.com",
  "role": "company",
  "type": "company",
  "iat": 1234567890,
  "exp": 1234571490
}
```

### API Ключи

API ключи компаний имеют префикс `sk-comp-` для идентификации:

```
sk-comp-ABC123DEF456GHI789...
```

### База данных

Компании хранятся в отдельных таблицах:
- `auth_db.companies` - информация о компании
- `billing_db.companies` - биллинг компании
- `billing_db.company_balances` - балансы компаний
- `billing_db.users` - сотрудники компаний

### Биллинг

- Компании имеют свой баланс (`CompanyBalance`)
- Запросы компаний списываются с баланса компании
- Запросы сотрудников также списываются с баланса компании
- Статистика ведется как по компании в целом, так и по каждому сотруднику

## Тестирование

Для тестирования функционала компаний используйте скрипт:

```powershell
.\test-company-functionality.ps1
```

Этот скрипт проверяет:
1. Регистрацию компании
2. Логин компании
3. Создание API ключей
4. Создание сотрудников
5. Запросы к AI
6. Просмотр баланса и транзакций
7. Статистику по сотрудникам
8. Отчеты по биллингу

## Примеры использования

### Сценарий 1: Регистрация и первый запрос

```powershell
# 1. Регистрация компании
$register = Invoke-RestMethod -Uri "http://localhost:3000/v1/companies/register" -Method POST -Body (@{
    name = "My Company"
    email = "company@example.com"
    password = "SecurePass123!"
} | ConvertTo-Json) -ContentType "application/json"

$token = $register.accessToken
$companyId = $register.company.id

# 2. Запрос к AI
$chat = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions?provider=openai" -Method POST -Body (@{
    model = "gpt-4o-mini"
    messages = @(@{
        role = "user"
        content = "Hello from company!"
    })
} | ConvertTo-Json -Depth 10) -ContentType "application/json" -Headers @{Authorization = "Bearer $token"}

Write-Host $chat.choices[0].message.content
```

### Сценарий 2: Управление сотрудниками

```powershell
# 1. Создание сотрудника
$employee = Invoke-RestMethod -Uri "http://localhost:3000/v1/companies/$companyId/users" -Method POST -Body (@{
    email = "employee@example.com"
    password = "EmployeePass123!"
    firstName = "John"
    lastName = "Doe"
    position = "Developer"
    department = "Engineering"
} | ConvertTo-Json) -ContentType "application/json" -Headers @{Authorization = "Bearer $token"}

# 2. Просмотр всех сотрудников
$employees = Invoke-RestMethod -Uri "http://localhost:3000/v1/companies/$companyId/users" -Method GET -Headers @{Authorization = "Bearer $token"}

Write-Host "Employees: $($employees.length)"
```

### Сценарий 3: Мониторинг использования

```powershell
# 1. Проверка баланса
$balance = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/company/$companyId/balance" -Method GET

Write-Host "Balance: $($balance.balance.balance) $($balance.balance.currency)"

# 2. Статистика по сотрудникам
$stats = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/company/$companyId/users/statistics" -Method GET

Write-Host "Total requests: $($stats.statistics.totals.totalRequests)"
Write-Host "Total cost: $($stats.statistics.totals.totalCost)"

# 3. Детальный отчет
$report = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/company/$companyId/report" -Method GET

Write-Host "Report period: $($report.report.period.start) - $($report.report.period.end)"
```

## Безопасность

### Аутентификация
- Компании используют JWT токены для аутентификации
- Токены содержат `type: 'company'` для идентификации
- Refresh токены действуют 7 дней

### Авторизация
- Компании имеют роль `company`
- Guards проверяют роль перед доступом к эндпоинтам
- Компании могут управлять только своими сотрудниками

### API Ключи
- API ключи компаний имеют префикс `sk-comp-`
- Поддерживаются права доступа (permissions)
- Можно установить срок действия (expiresAt)

### Логирование
- Все действия компаний логируются
- Логируются попытки входа (успешные и неуспешные)
- Security events записываются в БД

## Ограничения

- Компания не может создавать другие компании
- Сотрудники не могут управлять компанией
- API ключи компании не могут использоваться сотрудниками
- Баланс компании общий для всех сотрудников

## Roadmap

Планируемые улучшения:
- [ ] Роли и права для сотрудников
- [ ] Лимиты использования для сотрудников
- [ ] Уведомления о превышении бюджета
- [ ] Экспорт отчетов в PDF/Excel
- [ ] Интеграция с корпоративным SSO
- [ ] Webhooks для событий биллинга

