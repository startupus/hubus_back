# Иерархическая система компаний

## Обзор изменений

### Концепция
Все пользователи теперь являются компаниями. Компании могут добавлять других компаний себе в "сотрудники" (дочерние компании). Иерархия может быть многоуровневой.

### Ключевые особенности

1. **Иерархия компаний**
   - Компания может иметь родительскую компанию (`parentCompanyId`)
   - Компания может иметь множество дочерних компаний (`childCompanies`)
   - Неограниченная вложенность

2. **Режимы оплаты (`BillingMode`)**
   - `SELF_PAID` - компания оплачивает свои запросы сама
   - `PARENT_PAID` - запросы оплачивает родительская компания

3. **Регистрация**
   - Самостоятельная регистрация - компания без родителя
   - Регистрация дочерней компании - через родительскую компанию

## Изменения в схеме БД

### Auth Service

#### Company Model (обновлено)
```prisma
model Company {
  id              String    @id @default(uuid())
  name            String
  email           String    @unique
  passwordHash    String
  isActive        Boolean   @default(true)
  isVerified      Boolean   @default(false)
  role            UserRole  @default(company)
  
  // NEW: Hierarchy fields
  parentCompanyId String?
  billingMode     BillingMode @default(SELF_PAID)
  position        String?   // Должность в родительской компании
  department      String?   // Отдел в родительской компании
  
  // Relations
  parentCompany   Company?  @relation("CompanyHierarchy", fields: [parentCompanyId], ...)
  childCompanies  Company[] @relation("CompanyHierarchy")
  apiKeys         ApiKey[]
  ...
}
```

#### User Model (УДАЛЕНО)
- Модель User полностью удалена
- Вся функциональность перенесена на Company

#### ApiKey Model (упрощено)
```prisma
model ApiKey {
  id          String @id
  companyId   String  // Вместо polymorphic ownerId/ownerType
  company     Company @relation(...)
  ...
}
```

#### Новые Enums
```prisma
enum BillingMode {
  SELF_PAID     // Компания платит сама
  PARENT_PAID   // Платит родительская компания
}

// UserRole обновлен - убрано 'user'
enum UserRole {
  admin
  company
  service
  fsb
}

// OwnerType удален
```

### Billing Service

Аналогичные изменения:
- Company с полями `parentCompanyId` и `billingMode`
- User удален
- UsageEvent и Transaction теперь привязаны только к Company

## API Endpoints

### Регистрация компаний

#### Самостоятельная регистрация
```
POST /companies/register
Body: {
  "name": "Company Name",
  "email": "company@example.com",
  "password": "password",
  "description": "..."
}
Response: {
  "company": { id, name, email, ... },
  "accessToken": "...",
  "refreshToken": "..."
}
```

#### Регистрация дочерней компании
```
POST /companies/:parentId/child-companies
Headers: Authorization: Bearer <parent-token>
Body: {
  "name": "Child Company Name",
  "email": "child@example.com",
  "password": "password",
  "billingMode": "PARENT_PAID" | "SELF_PAID",
  "position": "Manager",
  "department": "Sales"
}
```

### Управление иерархией

#### Получить дочерние компании
```
GET /companies/:id/child-companies
Response: [
  {
    "id": "uuid",
    "name": "Child Company 1",
    "email": "child1@example.com",
    "billingMode": "PARENT_PAID",
    "position": "Manager",
    ...
  }
]
```

#### Изменить режим оплаты
```
PUT /companies/:id/billing-mode
Body: {
  "billingMode": "SELF_PAID" | "PARENT_PAID"
}
```

#### Получить структуру компании (дерево)
```
GET /companies/:id/hierarchy
Response: {
  "id": "uuid",
  "name": "Root Company",
  "childCompanies": [
    {
      "id": "uuid",
      "name": "Child 1",
      "childCompanies": [...]
    }
  ]
}
```

## Логика биллинга

### Каскадное списание

```typescript
// Когда компания делает запрос
async chargeForRequest(companyId: string, cost: number) {
  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { parentCompany: true }
  });
  
  if (company.billingMode === 'SELF_PAID') {
    // Списать с собственного баланса
    await debitBalance(company.id, cost);
  } else if (company.billingMode === 'PARENT_PAID' && company.parentCompany) {
    // Списать с баланса родителя
    await debitBalance(company.parentCompany.id, cost);
    
    // Создать транзакцию с пометкой о том, кто реально сделал запрос
    await createTransaction({
      companyId: company.parentCompany.id,
      initiatorCompanyId: company.id,
      amount: cost,
      type: 'DEBIT',
      description: `Request by ${company.name}`
    });
  }
}
```

### Статистика

- Родительская компания видит агрегированную статистику по всем дочерним компаниям
- Может фильтровать по конкретной дочерней компании
- Видит кто сколько потратил

## Примеры использования

### Сценарий 1: Фриланс-агентство

```
DesignStudio (ROOT)
├── FrontendTeam (PARENT_PAID)
│   ├── Developer1 (PARENT_PAID)
│   └── Developer2 (SELF_PAID)
└── BackendTeam (PARENT_PAID)
    ├── Developer3 (PARENT_PAID)
    └── Developer4 (PARENT_PAID)
```

- DesignStudio платит за все команды и Dev1, Dev3, Dev4
- Developer2 платит за себя сам

### Сценарий 2: Корпорация

```
MegaCorp (ROOT)
├── DepartmentA (PARENT_PAID)
│   ├── TeamA1 (PARENT_PAID)
│   └── TeamA2 (PARENT_PAID)
└── DepartmentB (SELF_PAID)
    ├── TeamB1 (PARENT_PAID)
    └── TeamB2 (SELF_PAID)
```

- MegaCorp платит за DepartmentA и все его команды
- DepartmentB платит за себя и TeamB1
- TeamB2 платит за себя сам

## Миграция данных

### Из старой схемы

1. **Преобразование User в Company**
   ```sql
   INSERT INTO companies (id, name, email, password_hash, parent_company_id, billing_mode, position, department)
   SELECT 
     id,
     CONCAT(first_name, ' ', last_name) as name,
     email,
     password_hash,
     company_id as parent_company_id,
     'PARENT_PAID' as billing_mode,
     position,
     department
   FROM users;
   ```

2. **Обновление ссылок**
   - ApiKey.ownerId -> ApiKey.companyId
   - Transaction.userId -> Transaction.companyId (или initiatorCompanyId)
   - UsageEvent.userId -> UsageEvent.companyId

## Безопасность

### Проверки доступа

```typescript
// Компания может управлять только своими дочерними компаниями
async canManageCompany(parentId: string, childId: string): boolean {
  const child = await prisma.company.findUnique({
    where: { id: childId }
  });
  
  return child?.parentCompanyId === parentId;
}
```

### Изоляция данных

- Компания видит только себя и свои дочерние компании
- Не может видеть другие ветви иерархии
- Admin видит всю иерархию

## Преимущества новой архитектуры

1. **Гибкость** - любая компания может добавлять дочерние
2. **Прозрачность биллинга** - выбор кто платит
3. **Масштабируемость** - неограниченная вложенность
4. **Упрощение** - одна модель вместо двух
5. **Консистентность** - единая логика для всех

## Недостатки и риски

1. **Циклические ссылки** - нужна проверка при создании
2. **Сложность запросов** - recursive CTE для deep hierarchies
3. **Миграция данных** - требует аккуратности

## Рекомендации по внедрению

1. Создать миграции БД
2. Обновить все сервисы одновременно
3. Протестировать каскадное списание
4. Добавить проверку на циклы
5. Реализовать лимиты глубины иерархии (например, макс 10 уровней)

