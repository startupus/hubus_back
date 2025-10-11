# Auth Service

## Описание

Auth Service отвечает за аутентификацию, управление пользователями (компаниями), создание и управление API ключами, а также систему рефералов.

## Основные функции

- **Аутентификация компаний** через email и пароль
- **Управление JWT токенами** (создание, валидация, обновление)
- **Создание и управление API ключами** для программного доступа
- **Система рефералов** с уникальными ссылками и комиссиями
- **Управление ролями и правами доступа**
- **Аудит безопасности** и логирование событий

## Архитектура

```mermaid
graph TB
    Client[Клиент] --> Gateway[API Gateway]
    Gateway --> Auth[Auth Service]
    
    Auth --> AuthDB[(Auth Database)]
    Auth --> Redis[(Redis Cache)]
    Auth --> Billing[Billing Service]
    
    Auth --> JWT[JWT Tokens]
    Auth --> APIKeys[API Keys]
    Auth --> Referrals[Referral System]
```

## Конфигурация

### Переменные окружения

```bash
# Основные настройки
NODE_ENV=development
HOST=0.0.0.0
PORT=3001

# База данных
DATABASE_URL=postgresql://postgres:password@auth-db:5432/auth_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1h
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://redis:6379

# Внешние сервисы
BILLING_SERVICE_URL=http://billing-service:3004

# Реферальная система
REFERRAL_COMMISSION_RATE=0.1
REFERRAL_BASE_URL=https://ai-aggregator.com/ref
```

### Docker конфигурация

```yaml
auth-service:
  build:
    context: .
    dockerfile: ./services/auth-service/Dockerfile
  ports:
    - "3001:3001"
  environment:
    - NODE_ENV=development
    - HOST=0.0.0.0
    - PORT=3001
    - DATABASE_URL=postgresql://postgres:password@auth-db:5432/auth_db
    - JWT_SECRET=your-super-secret-jwt-key-here
    - REDIS_URL=redis://redis:6379
    - BILLING_SERVICE_URL=http://billing-service:3004
  depends_on:
    - auth-db
    - redis
  networks:
    - ai-aggregator
```

## База данных

### Схема

```sql
-- Компании/пользователи
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  role VARCHAR(50) DEFAULT 'company',
  description TEXT,
  website VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP,
  
  -- Реферальная система
  referred_by UUID REFERENCES companies(id),
  referral_code_id UUID REFERENCES referral_codes(id)
);

-- API ключи
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  is_active BOOLEAN DEFAULT true,
  permissions TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP
);

-- Реферальные коды
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  company_id UUID NOT NULL REFERENCES companies(id),
  is_active BOOLEAN DEFAULT true,
  used_count INTEGER DEFAULT 0,
  max_uses INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP
);

-- События безопасности
CREATE TABLE security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id),
  event_type VARCHAR(100) NOT NULL,
  description TEXT,
  ip_address INET,
  user_agent TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Аутентификация

#### POST /api/v1/auth/register
Регистрация новой компании.

**Тело запроса:**
```json
{
  "email": "admin@company.com",
  "password": "securepassword123",
  "name": "My Company",
  "description": "AI-powered company",
  "website": "https://mycompany.com",
  "phone": "+1234567890",
  "referralCode": "REF123456"
}
```

**Ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "company": {
    "id": "company-uuid",
    "email": "admin@company.com",
    "name": "My Company",
    "role": "company",
    "isVerified": false,
    "referralCode": "REF789012"
  }
}
```

#### POST /api/v1/auth/login
Вход в систему.

**Тело запроса:**
```json
{
  "email": "admin@company.com",
  "password": "securepassword123"
}
```

**Ответ:**
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tokenType": "Bearer",
  "expiresIn": 3600,
  "company": {
    "id": "company-uuid",
    "email": "admin@company.com",
    "name": "My Company",
    "role": "company",
    "isVerified": true
  }
}
```

#### POST /api/v1/auth/refresh
Обновление токена.

**Тело запроса:**
```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### POST /api/v1/auth/logout
Выход из системы.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

### Управление компаниями

#### GET /api/v1/auth/profile
Получение профиля текущей компании.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Ответ:**
```json
{
  "id": "company-uuid",
  "email": "admin@company.com",
  "name": "My Company",
  "description": "AI-powered company",
  "website": "https://mycompany.com",
  "phone": "+1234567890",
  "role": "company",
  "isActive": true,
  "isVerified": true,
  "referralCode": "REF789012",
  "createdAt": "2023-12-01T12:00:00.000Z",
  "lastLoginAt": "2023-12-01T12:00:00.000Z"
}
```

#### PUT /api/v1/auth/profile
Обновление профиля компании.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Тело запроса:**
```json
{
  "name": "Updated Company Name",
  "description": "Updated description",
  "website": "https://updated-website.com",
  "phone": "+0987654321"
}
```

#### DELETE /api/v1/auth/profile
Деактивация компании.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

### API ключи

#### GET /api/v1/auth/api-keys
Получение списка API ключей.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Ответ:**
```json
{
  "data": [
    {
      "id": "api-key-uuid",
      "name": "Production API Key",
      "key": "ak_live_1234567890abcdef",
      "isActive": true,
      "permissions": ["chat", "billing", "analytics"],
      "createdAt": "2023-12-01T12:00:00.000Z",
      "expiresAt": "2024-12-01T12:00:00.000Z",
      "lastUsedAt": "2023-12-01T15:30:00.000Z"
    }
  ]
}
```

#### POST /api/v1/auth/api-keys
Создание нового API ключа.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Тело запроса:**
```json
{
  "name": "Development API Key",
  "permissions": ["chat", "billing"],
  "expiresAt": "2024-06-01T12:00:00.000Z"
}
```

**Ответ:**
```json
{
  "id": "api-key-uuid",
  "name": "Development API Key",
  "key": "ak_live_abcdef1234567890",
  "isActive": true,
  "permissions": ["chat", "billing"],
  "createdAt": "2023-12-01T12:00:00.000Z",
  "expiresAt": "2024-06-01T12:00:00.000Z"
}
```

#### PUT /api/v1/auth/api-keys/{id}
Обновление API ключа.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Тело запроса:**
```json
{
  "name": "Updated API Key Name",
  "permissions": ["chat", "billing", "analytics"]
}
```

#### DELETE /api/v1/auth/api-keys/{id}
Удаление API ключа.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

#### POST /api/v1/auth/api-keys/{id}/regenerate
Перегенерация API ключа.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Ответ:**
```json
{
  "id": "api-key-uuid",
  "name": "Production API Key",
  "key": "ak_live_newkey1234567890",
  "isActive": true,
  "permissions": ["chat", "billing", "analytics"],
  "createdAt": "2023-12-01T12:00:00.000Z",
  "expiresAt": "2024-12-01T12:00:00.000Z"
}
```

### Реферальная система

#### GET /api/v1/auth/referral/info
Получение информации о реферальной программе.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Ответ:**
```json
{
  "referralCode": "REF789012",
  "referralLink": "https://ai-aggregator.com/ref/REF789012",
  "totalReferrals": 5,
  "totalEarnings": 25.50,
  "commissionRate": 0.1,
  "isActive": true
}
```

#### GET /api/v1/auth/referral/stats
Получение статистики рефералов.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Ответ:**
```json
{
  "totalReferrals": 5,
  "activeReferrals": 3,
  "totalEarnings": 25.50,
  "thisMonthEarnings": 5.25,
  "referrals": [
    {
      "id": "referral-uuid",
      "email": "referral@company.com",
      "name": "Referral Company",
      "joinedAt": "2023-12-01T12:00:00.000Z",
      "totalSpent": 255.00,
      "commissionEarned": 25.50,
      "isActive": true
    }
  ]
}
```

#### POST /api/v1/auth/referral/validate
Валидация реферального кода.

**Тело запроса:**
```json
{
  "referralCode": "REF123456"
}
```

**Ответ:**
```json
{
  "isValid": true,
  "referrerName": "Referrer Company",
  "commissionRate": 0.1
}
```

## Бизнес-логика

### Аутентификация

```typescript
@Injectable()
export class AuthService {
  async loginCompany(credentials: LoginDto): Promise<AuthResult> {
    // 1. Поиск компании по email
    const company = await this.prisma.company.findUnique({
      where: { email: credentials.email }
    });
    
    if (!company) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // 2. Проверка пароля
    const isValidPassword = await bcrypt.compare(
      credentials.password, 
      company.passwordHash
    );
    
    if (!isValidPassword) {
      throw new UnauthorizedException('Invalid credentials');
    }
    
    // 3. Генерация токенов
    const tokens = await this.generateTokens(company);
    
    // 4. Обновление времени последнего входа
    await this.prisma.company.update({
      where: { id: company.id },
      data: { lastLoginAt: new Date() }
    });
    
    // 5. Логирование события
    await this.logSecurityEvent(company.id, 'LOGIN_SUCCESS');
    
    return {
      company: this.mapCompanyToDto(company),
      ...tokens
    };
  }
}
```

### Управление API ключами

```typescript
@Injectable()
export class ApiKeyService {
  async createApiKey(
    companyId: string, 
    createApiKeyDto: CreateApiKeyDto
  ): Promise<ApiKey> {
    // 1. Генерация уникального ключа
    const key = this.generateApiKey();
    
    // 2. Создание записи в БД
    const apiKey = await this.prisma.apiKey.create({
      data: {
        key,
        name: createApiKeyDto.name,
        companyId,
        permissions: createApiKeyDto.permissions,
        expiresAt: createApiKeyDto.expiresAt
      }
    });
    
    // 3. Логирование события
    await this.logSecurityEvent(companyId, 'API_KEY_CREATED', {
      apiKeyId: apiKey.id,
      apiKeyName: apiKey.name
    });
    
    return apiKey;
  }
  
  private generateApiKey(): string {
    const prefix = 'ak_live_';
    const randomBytes = crypto.randomBytes(16);
    const key = randomBytes.toString('hex');
    return prefix + key;
  }
}
```

### Реферальная система

```typescript
@Injectable()
export class ReferralService {
  async createReferralCode(companyId: string): Promise<ReferralCode> {
    // 1. Генерация уникального кода
    const code = this.generateReferralCode();
    
    // 2. Создание реферального кода
    const referralCode = await this.prisma.referralCode.create({
      data: {
        code,
        companyId,
        isActive: true
      }
    });
    
    return referralCode;
  }
  
  async processReferral(
    referralCode: string, 
    newCompanyId: string
  ): Promise<void> {
    // 1. Поиск реферального кода
    const referral = await this.prisma.referralCode.findUnique({
      where: { code: referralCode },
      include: { company: true }
    });
    
    if (!referral || !referral.isActive) {
      throw new BadRequestException('Invalid referral code');
    }
    
    // 2. Обновление компании
    await this.prisma.company.update({
      where: { id: newCompanyId },
      data: {
        referredBy: referral.companyId,
        referralCodeId: referral.id
      }
    });
    
    // 3. Уведомление реферера
    await this.notifyReferrer(referral.companyId, newCompanyId);
  }
  
  private generateReferralCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
```

## Безопасность

### Хеширование паролей

```typescript
@Injectable()
export class PasswordService {
  async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
  }
  
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
```

### JWT токены

```typescript
@Injectable()
export class JwtService {
  generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '1h'
    });
  }
  
  generateRefreshToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET'),
      expiresIn: '7d'
    });
  }
  
  verifyToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token, {
        secret: this.configService.get('JWT_SECRET')
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
```

### Аудит безопасности

```typescript
@Injectable()
export class SecurityService {
  async logSecurityEvent(
    companyId: string,
    eventType: string,
    metadata: any = {}
  ): Promise<void> {
    await this.prisma.securityEvent.create({
      data: {
        companyId,
        eventType,
        description: this.getEventDescription(eventType),
        metadata,
        ipAddress: this.getClientIp(),
        userAgent: this.getUserAgent()
      }
    });
  }
  
  private getEventDescription(eventType: string): string {
    const descriptions = {
      'LOGIN_SUCCESS': 'Successful login',
      'LOGIN_FAILED': 'Failed login attempt',
      'API_KEY_CREATED': 'API key created',
      'API_KEY_DELETED': 'API key deleted',
      'PASSWORD_CHANGED': 'Password changed',
      'PROFILE_UPDATED': 'Profile updated'
    };
    
    return descriptions[eventType] || 'Unknown event';
  }
}
```

## Мониторинг

### Health Check

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService
  ) {}
  
  @Get()
  async checkHealth() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis()
    ]);
    
    const isHealthy = checks.every(check => 
      check.status === 'fulfilled'
    );
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: checks[0].status === 'fulfilled' ? 'up' : 'down',
        redis: checks[1].status === 'fulfilled' ? 'up' : 'down'
      }
    };
  }
  
  private async checkDatabase(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      return false;
    }
  }
  
  private async checkRedis(): Promise<boolean> {
    try {
      await this.redis.ping();
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

## Troubleshooting

### Частые проблемы

#### 1. Ошибки аутентификации

```bash
# Проверка JWT секрета
echo $JWT_SECRET

# Проверка токена
jwt decode <your-token>

# Проверка логов
docker-compose logs auth-service | grep "LOGIN_FAILED"
```

#### 2. Проблемы с API ключами

```bash
# Проверка API ключа в БД
docker-compose exec auth-db psql -U postgres -d auth_db -c "SELECT * FROM api_keys WHERE key = 'your-api-key';"

# Проверка прав доступа
docker-compose exec auth-db psql -U postgres -d auth_db -c "SELECT permissions FROM api_keys WHERE key = 'your-api-key';"
```

#### 3. Проблемы с реферальной системой

```bash
# Проверка реферальных кодов
docker-compose exec auth-db psql -U postgres -d auth_db -c "SELECT * FROM referral_codes WHERE code = 'REF123456';"

# Проверка рефералов компании
docker-compose exec auth-db psql -U postgres -d auth_db -c "SELECT * FROM companies WHERE referred_by = 'company-uuid';"
```

### Полезные команды

```bash
# Перезапуск сервиса
docker-compose restart auth-service

# Просмотр логов
docker-compose logs -f auth-service

# Выполнение команд в контейнере
docker-compose exec auth-service bash

# Проверка подключения к БД
docker-compose exec auth-service npx prisma db pull
```
