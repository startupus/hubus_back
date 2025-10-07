# Корпоративная модель пользователей - Отчет о реализации

## Обзор

Реализована корпоративная модель пользователей, где:
- **Компании** регистрируются и имеют корпоративный счет
- **Компании** создают пользователей (сотрудников)
- **Пользователи** тратят деньги с корпоративного счета
- **ФСБ** имеет доступ ко всему
- **Единая авторизация** для всех ролей

## Архитектура

### 1. Модель данных

#### Auth Service
```prisma
model Company {
  id              String    @id @default(uuid())
  name            String
  email           String    @unique
  passwordHash    String    @map("password_hash")
  isActive        Boolean   @default(true) @map("is_active")
  isVerified      Boolean   @default(false) @map("is_verified")
  role            UserRole  @default(company)
  description     String?
  website         String?
  phone           String?
  address         Json?
  settings        Json?
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  lastLoginAt     DateTime? @map("last_login_at")
  metadata        Json?

  // Relations
  users           User[]
  apiKeys         ApiKey[]
  refreshTokens   RefreshToken[]
  // ... другие связи
}

model User {
  id           String    @id @default(uuid())
  companyId    String    @map("company_id")
  email        String    @unique
  passwordHash String    @map("password_hash")
  isActive     Boolean   @default(true) @map("is_active")
  isVerified   Boolean   @default(false) @map("is_verified")
  role         UserRole  @default(user)
  firstName    String?   @map("first_name")
  lastName     String?   @map("last_name")
  position     String?   // Должность в компании
  department   String?   // Отдел в компании
  permissions  Json      @default("[]") // Права доступа в компании
  createdAt    DateTime  @default(now()) @map("created_at")
  updatedAt    DateTime  @updatedAt @map("updated_at")
  lastLoginAt  DateTime? @map("last_login_at")
  metadata     Json?

  // Relations
  company          Company @relation(fields: [companyId], references: [id], onDelete: Cascade)
  // ... другие связи
}

enum UserRole {
  admin
  user
  company
  service
  fsb
}

enum OwnerType {
  user
  company
}
```

#### Billing Service
```prisma
model Company {
  id                String    @id @default(uuid())
  name              String
  email             String    @unique
  isActive          Boolean   @default(true) @map("is_active")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  
  // Billing relations
  balance           CompanyBalance?
  transactions      Transaction[]
  usageEvents       UsageEvent[]
  invoices          Invoice[]
  subscriptions     Subscription[]
  paymentMethods    PaymentMethod[]
  discountRules     DiscountRule[]
  users             User[]
}

model CompanyBalance {
  id                String    @id @default(uuid())
  companyId         String    @unique @map("company_id")
  balance           Decimal   @default(0) @db.Decimal(10, 4)
  currency          String    @default("USD")
  creditLimit       Decimal?  @map("credit_limit") @db.Decimal(10, 2)
  lastUpdated       DateTime  @default(now()) @map("last_updated")
  createdAt         DateTime  @default(now()) @map("created_at")
  updatedAt         DateTime  @updatedAt @map("updated_at")
  
  // Relations
  company           Company   @relation(fields: [companyId], references: [id], onDelete: Cascade)
}

model Transaction {
  id                String            @id @default(uuid())
  companyId         String            @map("company_id")
  userId            String?           @map("user_id") // Пользователь, который инициировал транзакцию
  type              TransactionType
  amount            Decimal           @db.Decimal(10, 4)
  currency          String            @default("USD")
  description       String?
  status            TransactionStatus @default(PENDING)
  reference         String?           @unique
  metadata          Json?
  processedAt       DateTime?         @map("processed_at")
  createdAt         DateTime          @default(now()) @map("created_at")
  updatedAt         DateTime          @updatedAt @map("updated_at")
  
  // Relations
  company           Company           @relation(fields: [companyId], references: [id], onDelete: Cascade)
  user              User?             @relation(fields: [userId], references: [id], onDelete: SetNull)
  // ... другие связи
}
```

### 2. Сервисы

#### CompanyService
```typescript
class CompanyService {
  // Создание компании
  async createCompany(data: CreateCompanyRequest): Promise<CompanyResponse>
  
  // Создание пользователя в компании
  async createUser(data: CreateUserRequest): Promise<UserResponse>
  
  // Единая аутентификация для всех ролей
  async authenticate(email: string, password: string): Promise<{
    id: string;
    email: string;
    role: string;
    ownerType: 'user' | 'company';
    companyId?: string;
    permissions?: string[];
  }>
  
  // Управление пользователями
  async getCompanyUsers(companyId: string): Promise<UserResponse[]>
  async updateUser(id: string, updates: any): Promise<UserResponse>
  async deleteUser(id: string): Promise<boolean>
  
  // Административные функции
  async getAllCompanies(): Promise<CompanyResponse[]>
  async getAllUsers(): Promise<UserResponse[]>
}
```

#### CompanyController
```typescript
@Controller('company')
export class CompanyController {
  // Регистрация компании
  @Post('register')
  async registerCompany(@Body() data: CreateCompanyRequest)
  
  // Создание пользователя
  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin', 'fsb')
  async createUser(@Body() data: CreateUserRequest, @Request() req: any)
  
  // Единая аутентификация
  @Post('auth')
  async authenticate(@Body() body: { email: string; password: string })
  
  // Получение профиля
  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any)
  
  // Управление пользователями
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('company', 'admin', 'fsb')
  async getCompanyUsers(@Query('companyId') companyId?: string, @Request() req?: any)
  
  // Административные функции
  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('admin', 'fsb')
  async getAllCompanies()
}
```

## Поток работы

### 1. Регистрация компании
```bash
POST /company/register
{
  "name": "ООО Технологии",
  "email": "admin@techcompany.ru",
  "password": "SecurePassword123!",
  "description": "Инновационная IT компания",
  "website": "https://techcompany.ru",
  "phone": "+7 (495) 123-45-67",
  "address": {
    "city": "Москва",
    "street": "Тверская, 1",
    "zipCode": "101000"
  }
}
```

### 2. Аутентификация компании
```bash
POST /company/auth
{
  "email": "admin@techcompany.ru",
  "password": "SecurePassword123!"
}

# Ответ:
{
  "id": "company-uuid",
  "email": "admin@techcompany.ru",
  "role": "company",
  "ownerType": "company",
  "token": "jwt-token"
}
```

### 3. Создание пользователей в компании
```bash
POST /company/users
Authorization: Bearer <company-token>
{
  "companyId": "company-uuid",
  "email": "ivan.petrov@techcompany.ru",
  "password": "UserPassword123!",
  "firstName": "Иван",
  "lastName": "Петров",
  "position": "Разработчик",
  "department": "IT",
  "permissions": ["ai_chat", "ai_image"]
}
```

### 4. Аутентификация пользователя
```bash
POST /company/auth
{
  "email": "ivan.petrov@techcompany.ru",
  "password": "UserPassword123!"
}

# Ответ:
{
  "id": "user-uuid",
  "email": "ivan.petrov@techcompany.ru",
  "role": "user",
  "ownerType": "user",
  "companyId": "company-uuid",
  "permissions": ["ai_chat", "ai_image"],
  "token": "jwt-token"
}
```

## Права доступа

### Компания (company)
- ✅ Создание пользователей в своей компании
- ✅ Просмотр профиля своей компании
- ✅ Управление пользователями своей компании
- ❌ Доступ к другим компаниям
- ❌ Доступ к административным функциям

### Пользователь (user)
- ✅ Просмотр своего профиля
- ✅ Обновление своего профиля
- ❌ Создание других пользователей
- ❌ Доступ к профилю компании
- ❌ Доступ к списку пользователей

### ФСБ (fsb)
- ✅ Доступ ко всем компаниям
- ✅ Доступ ко всем пользователям
- ✅ Все административные функции
- ✅ Управление настройками обезличивания
- ✅ Поиск по истории запросов

### Админ (admin)
- ✅ Доступ ко всем компаниям
- ✅ Доступ ко всем пользователям
- ✅ Административные функции
- ❌ ФСБ функции

## Биллинг

### Корпоративные счета
- **Компания** имеет корпоративный счет
- **Пользователи** тратят деньги с корпоративного счета
- **Транзакции** привязаны к компании и пользователю
- **Отчеты** по использованию на уровне компании и пользователя

### Структура транзакций
```typescript
interface Transaction {
  id: string;
  companyId: string;        // ID компании
  userId?: string;          // ID пользователя (если применимо)
  type: TransactionType;    // DEBIT, CREDIT, REFUND, etc.
  amount: Decimal;
  currency: string;
  description?: string;
  status: TransactionStatus;
  // ... другие поля
}
```

### Использование сервисов
```typescript
interface UsageEvent {
  id: string;
  companyId: string;        // ID компании
  userId?: string;          // ID пользователя
  service: string;          // ai, api, etc.
  resource: string;         // chat_completion, image_generation, etc.
  quantity: number;         // Количество использований
  cost: Decimal;            // Стоимость
  currency: string;
  // ... другие поля
}
```

## API эндпоинты

### Регистрация и аутентификация
```
POST /company/register          # Регистрация компании
POST /company/auth              # Аутентификация (компания/пользователь)
GET  /company/profile           # Профиль текущего пользователя/компании
```

### Управление пользователями
```
POST   /company/users           # Создание пользователя
GET    /company/users           # Список пользователей компании
GET    /company/users/:id       # Получение пользователя
PUT    /company/users/:id       # Обновление пользователя
DELETE /company/users/:id       # Удаление пользователя
```

### Административные функции
```
GET /company/all                # Все компании (admin/fsb)
GET /company/users/all          # Все пользователи (admin/fsb)
GET /company/:id                # Компания по ID
```

## Тестирование

### Запуск тестов
```bash
./test-corporate-model.ps1
```

### Тестовые сценарии
1. **Регистрация компании** - создание новой компании
2. **Аутентификация компании** - вход в систему
3. **Создание пользователей** - добавление сотрудников
4. **Аутентификация пользователей** - вход пользователей
5. **Проверка прав доступа** - тестирование ограничений
6. **ФСБ функции** - тестирование расширенных прав

## Преимущества

### 1. Корпоративная безопасность
- **Изоляция данных** - каждая компания видит только своих пользователей
- **Контроль доступа** - гибкая система прав и разрешений
- **Аудит** - полное отслеживание действий пользователей

### 2. Удобство управления
- **Централизованное управление** - компания управляет всеми пользователями
- **Корпоративный биллинг** - единый счет для всех пользователей
- **Масштабируемость** - легко добавлять новых пользователей

### 3. Соответствие требованиям
- **ФСБ доступ** - полный контроль для государственных органов
- **Обезличивание** - настраиваемое для разных провайдеров
- **Аудит** - полная история всех операций

## Заключение

Реализована полнофункциональная корпоративная модель с:

- ✅ **Регистрация только компаний** - пользователи создаются компаниями
- ✅ **Единая авторизация** - для всех ролей через один эндпоинт
- ✅ **Корпоративные счета** - биллинг на уровне компании
- ✅ **Гибкие права доступа** - разные уровни для разных ролей
- ✅ **ФСБ функции** - расширенные права для государственных органов
- ✅ **Масштабируемость** - легко добавлять новых пользователей и компании

Система готова к использованию в корпоративной среде! 🎉
