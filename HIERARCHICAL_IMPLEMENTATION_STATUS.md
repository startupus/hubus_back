# Статус внедрения иерархической системы компаний

## ✅ Выполнено

### 1. Схема БД (Auth Service & Billing Service)

**Auth Service (`services/auth-service/prisma/schema.prisma`)**
- ✅ Удалена модель `User`
- ✅ Добавлены поля в `Company`:
  - `parentCompanyId` - ID родительской компании
  - `billingMode` - режим оплаты (SELF_PAID / PARENT_PAID)
  - `position` - должность в родительской компании
  - `department` - отдел
- ✅ Добавлены self-relations для иерархии
- ✅ Обновлены все модели (ApiKey, RefreshToken, LoginAttempt, etc.)
- ✅ Добавлен enum `BillingMode`
- ✅ Удален enum `OwnerType`

**Billing Service (`services/billing-service/prisma/schema.prisma`)**
- ✅ Удалена модель `User`
- ✅ Добавлены аналогичные поля в `Company`
- ✅ Обновлены `Transaction` и `UsageEvent`:
  - `companyId` - с кого списывается
  - `initiatorCompanyId` - кто инициировал запрос
- ✅ Добавлен enum `BillingMode`

### 2. Company Service

**Новые методы:**
- ✅ `createChildCompany()` - создание дочерней компании
- ✅ `getChildCompanies()` - получение списка дочерних компаний
- ✅ `getCompanyHierarchy()` - получение дерева иерархии
- ✅ `updateBillingMode()` - изменение режима оплаты
- ✅ `buildHierarchyTree()` - рекурсивное построение дерева

**Обновленные методы:**
- ✅ `createCompanyApiKey()` - использует новую схему (companyId вместо ownerId/ownerType)
- ✅ `getCompanyApiKeys()` - использует новую схему

### 3. Company Controller

**Новые эндпоинты:**
- ✅ `POST /companies/:id/child-companies` - создать дочернюю компанию
- ✅ `GET /companies/:id/child-companies` - список дочерних компаний
- ✅ `GET /companies/:id/hierarchy?depth=3` - дерево иерархии
- ✅ `PUT /companies/:id/billing-mode` - изменить режим оплаты

**Обновленные эндпоинты:**
- ✅ `/companies/:id/api-keys` - работает с новой схемой

## 🔄 В процессе / Требуется

### 4. Billing Service

**Необходимо реализовать:**
- ❌ Каскадное списание средств
- ❌ Метод `determinePayerCompany()` - определение кто платит
- ❌ Обновление `trackUsage()` для работы с иерархией
- ❌ Обновление `getCompanyUsersStatistics()` для дочерних компаний
- ❌ Новый метод `getHierarchyStatistics()` - статистика по всему дереву

### 5. API Gateway

**Необходимо обновить:**
- ❌ Проброс `initiatorCompanyId` в billing events
- ❌ Обновление истории запросов

### 6. Миграции БД

**Необходимо создать:**
- ❌ Миграция auth-service для добавления новых полей
- ❌ Миграция billing-service для добавления новых полей
- ❌ Скрипт преобразования существующих данных (если есть)

### 7. Тестирование

**Необходимо протестировать:**
- ❌ Создание иерархии компаний
- ❌ Каскадное списание средств
- ❌ Переключение между режимами оплаты
- ❌ Статистику по иерархии
- ❌ Ограничения (циклы, глубина)

## 📋 Новые API Эндпоинты

### Создание дочерней компании
```
POST /companies/:parentId/child-companies
Authorization: Bearer <parent-token>
Body:
{
  "name": "Child Company Name",
  "email": "child@example.com",
  "password": "password",
  "billingMode": "PARENT_PAID",  // or "SELF_PAID"
  "position": "Manager",
  "department": "Sales",
  "description": "Optional description"
}
```

### Получение дочерних компаний
```
GET /companies/:id/child-companies
Authorization: Bearer <token>
Response:
[
  {
    "id": "uuid",
    "name": "Child 1",
    "email": "child1@example.com",
    "billingMode": "PARENT_PAID",
    "position": "Manager",
    "department": "Sales",
    ...
  }
]
```

### Получение иерархии
```
GET /companies/:id/hierarchy?depth=3
Authorization: Bearer <token>
Response:
{
  "id": "root-uuid",
  "name": "Root Company",
  "billingMode": "SELF_PAID",
  "childCompanies": [
    {
      "id": "child-uuid",
      "name": "Child Company",
      "billingMode": "PARENT_PAID",
      "childCompanies": [...]
    }
  ]
}
```

### Изменение режима оплаты
```
PUT /companies/:id/billing-mode
Authorization: Bearer <token>
Body:
{
  "billingMode": "SELF_PAID"  // or "PARENT_PAID"
}
```

## 🔧 Технические детали

### Каскадное списание (логика для BillingService)

```typescript
async determinePayerCompany(initiatorCompanyId: string): Promise<string> {
  const company = await prisma.company.findUnique({
    where: { id: initiatorCompanyId },
    include: { parentCompany: true }
  });

  if (company.billingMode === 'SELF_PAID') {
    return company.id; // Платит сама
  }

  if (company.billingMode === 'PARENT_PAID' && company.parentCompany) {
    return company.parentCompany.id; // Платит родитель
  }

  // Fallback - платит сама
  return company.id;
}

async trackUsage(initiatorCompanyId: string, cost: number, metadata: any) {
  const payerCompanyId = await this.determinePayerCompany(initiatorCompanyId);
  
  // Списать с плательщика
  await this.debitBalance(payerCompanyId, cost);
  
  // Создать usage event
  await prisma.usageEvent.create({
    data: {
      companyId: payerCompanyId,          // Кто платит
      initiatorCompanyId: initiatorCompanyId, // Кто запросил
      cost,
      ...metadata
    }
  });
  
  // Создать транзакцию
  await prisma.transaction.create({
    data: {
      companyId: payerCompanyId,
      initiatorCompanyId: initiatorCompanyId,
      type: 'DEBIT',
      amount: cost,
      description: `Request by ${initiatorCompanyId}`,
      status: 'COMPLETED'
    }
  });
}
```

### Проверка циклов

```typescript
async validateNoCycles(companyId: string, newParentId: string): Promise<boolean> {
  let currentId = newParentId;
  const visited = new Set<string>();
  
  while (currentId) {
    if (visited.has(currentId)) {
      return false; // Цикл обнаружен
    }
    if (currentId === companyId) {
      return false; // Попытка сделать себя своим предком
    }
    
    visited.add(currentId);
    
    const company = await prisma.company.findUnique({
      where: { id: currentId },
      select: { parentCompanyId: true }
    });
    
    currentId = company?.parentCompanyId;
  }
  
  return true; // Циклов нет
}
```

## 🚀 Следующие шаги

1. **Реализовать каскадное списание в BillingService**
   - Файл: `services/billing-service/src/billing/billing.service.ts`
   - Методы: `determinePayerCompany()`, обновить `trackUsage()`

2. **Создать миграции БД**
   - `prisma migrate dev --name add-company-hierarchy`

3. **Обновить тесты**
   - Создать новый `test-hierarchical-companies.ps1`

4. **Добавить валидацию**
   - Проверка на циклы при создании дочерних компаний
   - Ограничение глубины иерархии (например, макс 10 уровней)

5. **Обновить документацию**
   - API документацию
   - Swagger/OpenAPI спецификацию

## ⚠️ Важные замечания

1. **Обратная несовместимость**
   - Полностью изменена структура БД
   - Удалена модель User
   - Требуется миграция данных

2. **Производительность**
   - Рекурсивные запросы для глубоких иерархий могут быть медленными
   - Рекомендуется ограничить глубину дерева

3. **Безопасность**
   - Компания может управлять только своими дочерними компаниями
   - Нужна проверка прав доступа при изменении billing mode

4. **Биллинг**
   - При удалении родительской компании нужно решить что делать с дочерними
   - Возможно переключить их на SELF_PAID автоматически

