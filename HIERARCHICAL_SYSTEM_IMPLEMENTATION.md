# Hierarchical Company System - Implementation Complete

## Обзор

Система полностью переработана на иерархическую структуру компаний. **Больше нет обычных пользователей** - каждый пользователь является компанией, которая может иметь дочерние компании.

## Ключевые изменения

### 1. Модель данных

#### Auth Service
- **Удалена** таблица `users`
- **Обновлена** таблица `companies`:
  - `parentCompanyId` - ссылка на родительскую компанию (NULL для root-компаний)
  - `billingMode` - режим биллинга: `SELF_PAID` или `PARENT_PAID`
  - `position` - должность в родительской компании
  - `department` - отдел в родительской компании

#### Billing Service
- **Обновлена** таблица `transactions`:
  - `companyId` - кто платит за транзакцию
  - `initiatorCompanyId` - кто инициировал транзакцию (может отличаться от плательщика)
- **Обновлена** таблица `usage_events`:
  - `companyId` - кто платит за использование
  - `initiatorCompanyId` - кто инициировал запрос

### 2. Billing Logic (Каскадное списание)

**Важно:** Каскадное списание работает только на ОДИН уровень вверх!

```
Company A (root, SELF_PAID)
  └─ Company B (child, PARENT_PAID)
       └─ Company C (grandchild, PARENT_PAID)
```

**Сценарии:**
- **Company A** делает запрос → списывается с **Company A** (она платит за себя)
- **Company B** делает запрос (режим PARENT_PAID) → списывается с **Company A** (её родителя)
- **Company C** делает запрос (режим PARENT_PAID) → списывается с **Company B** (её непосредственного родителя)

**НЕТ сквозного списания!** Company C не списывает с Company A напрямую.

### 3. API Endpoints

#### Company Management

```bash
# Регистрация root-компании
POST /companies/register
{
  "name": "My Company",
  "email": "company@example.com",
  "password": "SecurePass123!",
  "description": "Company description"
}

# Логин компании
POST /companies/login
{
  "email": "company@example.com",
  "password": "SecurePass123!"
}

# Создать дочернюю компанию
POST /companies/{parentId}/child-companies
Authorization: Bearer {token}
{
  "name": "Child Company",
  "email": "child@example.com",
  "password": "ChildPass123!",
  "billingMode": "PARENT_PAID",  // или "SELF_PAID"
  "position": "Manager",
  "department": "Sales"
}

# Получить иерархию
GET /companies/{companyId}/hierarchy?depth=3
Authorization: Bearer {token}

# Изменить режим биллинга
PUT /companies/{companyId}/billing-mode
Authorization: Bearer {token}
{
  "billingMode": "SELF_PAID"  // или "PARENT_PAID"
}
```

#### Billing

```bash
# Получить свой баланс
GET /v1/billing/balance
Authorization: Bearer {token}

# Получить баланс дочерней компании
GET /v1/billing/balance/{companyId}
Authorization: Bearer {token}

# Получить свои транзакции
GET /v1/billing/transactions
Authorization: Bearer {token}

# Получить статистику дочерних компаний
GET /billing/company/{companyId}/users/statistics
```

#### AI Requests

```bash
# Все AI запросы автоматически учитывают иерархию
POST /v1/chat/completions
Authorization: Bearer {token}
{
  "model": "gpt-4o-mini",
  "messages": [{"role": "user", "content": "Hello"}]
}
```

## Логика биллинга

### BillingService.determinePayerCompany()

Метод определяет кто платит за запрос:

```typescript
async determinePayerCompany(initiatorCompanyId: string): Promise<{
  payerId: string;
  initiatorId: string;
}> {
  const company = await prisma.company.findUnique({
    where: { id: initiatorCompanyId },
    include: { parentCompany: { select: { id: true } } }
  });

  // Если режим PARENT_PAID и есть родитель - платит родитель
  if (company.billingMode === 'PARENT_PAID' && company.parentCompany) {
    return {
      payerId: company.parentCompany.id,  // Родитель платит
      initiatorId: initiatorCompanyId      // Кто сделал запрос
    };
  }

  // Иначе платит сама
  return {
    payerId: initiatorCompanyId,
    initiatorId: initiatorCompanyId
  };
}
```

### Tracking Usage

При каждом AI-запросе:
1. Определяется инициатор (из JWT токена)
2. Вызывается `determinePayerCompany(initiatorId)`
3. Списание происходит с `payerId`
4. Создается `usageEvent` с полями:
   - `companyId` = `payerId` (кто платит)
   - `initiatorCompanyId` = `initiatorId` (кто инициировал)
5. Создается `transaction` с аналогичными полями

## Миграции

### Применение миграций

```powershell
# Применить SQL миграции
.\apply-hierarchy-migrations.ps1
```

Скрипт выполнит:
1. Миграцию Auth Service DB
2. Миграцию Billing Service DB
3. Генерацию Prisma клиентов

### Rebuild сервисов

```powershell
# Пересобрать сервисы
docker-compose build auth-service billing-service api-gateway

# Перезапустить
docker-compose up -d auth-service billing-service api-gateway
```

## Тестирование

```powershell
# Полный тест иерархической системы
.\test-hierarchical-system.ps1
```

Тест проверит:
- ✅ Создание root-компании
- ✅ Создание дочерних компаний с PARENT_PAID
- ✅ Создание дочерних компаний с SELF_PAID
- ✅ Получение иерархии
- ✅ AI-запросы с учетом биллинга
- ✅ Списание с правильного плательщика
- ✅ Статистику дочерних компаний
- ✅ Изменение режима биллинга

## Примеры использования

### Сценарий 1: Компания с сотрудниками (PARENT_PAID)

```
TechCorp (root, SELF_PAID, баланс: $1000)
  ├─ Sales Dept (PARENT_PAID, баланс: $0)
  ├─ Engineering (PARENT_PAID, баланс: $0)
  └─ Support (PARENT_PAID, баланс: $0)
```

Все AI-запросы от Sales/Engineering/Support → списываются с **TechCorp**

### Сценарий 2: Компания с партнерами (SELF_PAID)

```
MainCompany (root, SELF_PAID, баланс: $500)
  ├─ Partner A (SELF_PAID, баланс: $200)
  └─ Partner B (SELF_PAID, баланс: $300)
```

Каждая компания платит за свои запросы сама

### Сценарий 3: Смешанный режим

```
Enterprise (root, SELF_PAID, баланс: $5000)
  ├─ Internal Team (PARENT_PAID, баланс: $0)
  ├─ External Contractor (SELF_PAID, баланс: $1000)
  └─ Subsidiary Company (SELF_PAID, баланс: $2000)
       └─ Subsidiary Team (PARENT_PAID, баланс: $0)
```

- **Internal Team** → списывается с **Enterprise**
- **External Contractor** → платит сам
- **Subsidiary Company** → платит сама
- **Subsidiary Team** → списывается с **Subsidiary Company** (НЕ с Enterprise!)

## Статистика и отчеты

### Статистика дочерних компаний

```bash
GET /billing/company/{companyId}/users/statistics
```

Возвращает:
```json
{
  "companyId": "root-company-id",
  "period": {
    "start": "2025-01-01",
    "end": "2025-01-31"
  },
  "totals": {
    "totalChildCompanies": 3,
    "totalRequests": 150,
    "totalCost": 45.50,
    "totalTransactions": 150
  },
  "childCompanies": [
    {
      "company": {
        "id": "child-1-id",
        "name": "Sales Dept",
        "billingMode": "PARENT_PAID"
      },
      "statistics": {
        "totalRequests": 50,
        "totalCost": 15.20,
        "byService": {
          "openai": { "count": 30, "cost": 10.00 },
          "openrouter": { "count": 20, "cost": 5.20 }
        }
      }
    }
  ]
}
```

## Безопасность

### Проверка прав доступа

- Компания может управлять только своими дочерними компаниями
- JWT токен содержит `id` компании и `role`
- Guards проверяют ownership перед операциями

### Валидация

- Email должен быть уникальным
- Пароль должен соответствовать требованиям безопасности
- billingMode может быть только `SELF_PAID` или `PARENT_PAID`
- Нельзя создать циклическую зависимость в иерархии

## Мониторинг

### Логирование

Все операции логируются с контекстом:
```typescript
LoggerUtil.info('billing-service', 'Usage tracked successfully', {
  payerId: 'parent-company-id',
  initiatorId: 'child-company-id',
  service: 'openai',
  cost: 0.05
});
```

### Метрики

- Количество запросов по компаниям
- Стоимость по компаниям
- Распределение по сервисам
- Динамика использования

## Troubleshooting

### Проблема: Не списываются деньги

**Решение:**
1. Проверить режим биллинга: `GET /companies/{id}`
2. Проверить баланс родителя (если PARENT_PAID)
3. Проверить логи billing-service

### Проблема: Дочерняя компания не может делать запросы

**Решение:**
1. Проверить что компания активна
2. Проверить JWT токен
3. Если PARENT_PAID - проверить баланс родителя

### Проблема: Неправильная статистика

**Решение:**
1. Проверить фильтрацию по `initiatorCompanyId` vs `companyId`
2. Проверить период запроса
3. Проверить timezone settings

## Следующие шаги

- [ ] Добавить лимиты для дочерних компаний
- [ ] Добавить уведомления при низком балансе
- [ ] Добавить детальную аналитику
- [ ] Добавить экспорт отчетов
- [ ] Добавить автоматическое пополнение

