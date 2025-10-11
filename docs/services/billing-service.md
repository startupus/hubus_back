# Billing Service

## Описание

Billing Service отвечает за управление биллингом, тарификацией, балансами компаний, обработку транзакций и систему реферальных комиссий.

## Основные функции

- **Управление балансами компаний** и кредитными лимитами
- **Обработка транзакций** (списание, пополнение, возвраты)
- **Тарификация запросов** к ИИ-провайдерам
- **Система подписок** с планами и включенными токенами
- **Pay-as-you-go тарификация** для запросов без подписки
- **Реферальная система** с комиссиями
- **Генерация отчетов** и аналитика расходов

## Архитектура

```mermaid
graph TB
    Client[Клиент] --> Gateway[API Gateway]
    Gateway --> Billing[Billing Service]
    
    Billing --> BillingDB[(Billing Database)]
    Billing --> Redis[(Redis Cache)]
    Billing --> RabbitMQ[RabbitMQ]
    
    Billing --> Auth[Auth Service]
    Billing --> Payment[Payment Service]
    Billing --> Analytics[Analytics Service]
    
    Billing --> Pricing[Pricing Engine]
    Billing --> Referrals[Referral System]
```

## Конфигурация

### Переменные окружения

```bash
# Основные настройки
NODE_ENV=development
HOST=0.0.0.0
PORT=3004

# База данных
DATABASE_URL=postgresql://postgres:password@billing-db:5432/billing_db

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

# Внешние сервисы
AUTH_SERVICE_URL=http://auth-service:3001
PAYMENT_SERVICE_URL=http://payment-service:3006

# Тарификация
DEFAULT_BALANCE=100.0
CREDIT_LIMIT=1000.0
REFERRAL_COMMISSION_RATE=0.1
```

### Docker конфигурация

```yaml
billing-service:
  build:
    context: .
    dockerfile: ./services/billing-service/Dockerfile
  ports:
    - "3004:3004"
  environment:
    - NODE_ENV=development
    - HOST=0.0.0.0
    - PORT=3004
    - DATABASE_URL=postgresql://postgres:password@billing-db:5432/billing_db
    - REDIS_URL=redis://redis:6379
    - RABBITMQ_URL=amqp://user:password@rabbitmq:5672
    - AUTH_SERVICE_URL=http://auth-service:3001
    - PAYMENT_SERVICE_URL=http://payment-service:3006
  depends_on:
    - billing-db
    - redis
    - rabbitmq
  networks:
    - ai-aggregator
```

## База данных

### Схема

```sql
-- Балансы компаний
CREATE TABLE company_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID UNIQUE NOT NULL,
  balance DECIMAL(15,2) DEFAULT 100.0,
  credit_limit DECIMAL(15,2) DEFAULT 1000.0,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Транзакции
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL, -- DEBIT, CREDIT
  amount DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- События использования
CREATE TABLE usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  provider VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  cost DECIMAL(15,6) NOT NULL,
  tokens JSONB NOT NULL, -- {prompt_tokens, completion_tokens, total_tokens}
  request_id VARCHAR(255),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Правила тарификации
CREATE TABLE pricing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  service VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  provider VARCHAR(100),
  model VARCHAR(100),
  provider_type VARCHAR(20) DEFAULT 'FOREIGN', -- DOMESTIC, FOREIGN
  type VARCHAR(20) NOT NULL, -- fixed, per_unit, per_token, tiered
  price DECIMAL(15,6) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  limits JSONB DEFAULT '{}',
  discounts JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Подписки
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  plan_name VARCHAR(100) NOT NULL,
  plan_type VARCHAR(50) NOT NULL, -- monthly, yearly
  price DECIMAL(15,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  included_tokens INTEGER DEFAULT 0,
  discount_rate DECIMAL(5,4) DEFAULT 0.0,
  status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## API Endpoints

### Баланс

#### GET /api/v1/billing/balance
Получение баланса компании.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Ответ:**
```json
{
  "companyId": "company-uuid",
  "balance": 100.50,
  "currency": "USD",
  "creditLimit": 1000.00,
  "availableCredit": 899.50,
  "lastUpdated": "2023-12-01T12:00:00.000Z"
}
```

#### POST /api/v1/billing/balance/update
Обновление баланса (внутренний API).

**Тело запроса:**
```json
{
  "companyId": "company-uuid",
  "amount": 50.00,
  "operation": "add",
  "description": "Payment received",
  "metadata": {
    "paymentId": "payment-uuid",
    "source": "payment_service"
  }
}
```

### Транзакции

#### GET /api/v1/billing/transactions
Получение истории транзакций.

**Параметры запроса:**
- `page` (number): Номер страницы (по умолчанию: 1)
- `limit` (number): Количество записей на странице (по умолчанию: 20)
- `startDate` (string): Дата начала (ISO 8601)
- `endDate` (string): Дата окончания (ISO 8601)
- `type` (string): Тип транзакции (DEBIT, CREDIT)

**Ответ:**
```json
{
  "data": [
    {
      "id": "transaction-uuid",
      "type": "DEBIT",
      "amount": 0.00125,
      "currency": "USD",
      "description": "GPT-4 usage",
      "metadata": {
        "provider": "openai",
        "model": "gpt-4",
        "tokens": 25
      },
      "createdAt": "2023-12-01T12:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

#### POST /api/v1/billing/transactions
Создание транзакции (внутренний API).

**Тело запроса:**
```json
{
  "companyId": "company-uuid",
  "type": "DEBIT",
  "amount": 0.00125,
  "description": "GPT-4 usage",
  "metadata": {
    "provider": "openai",
    "model": "gpt-4",
    "tokens": 25
  }
}
```

### Тарификация

#### GET /api/v1/billing/pricing/rules
Получение правил тарификации.

**Ответ:**
```json
{
  "data": [
    {
      "id": "rule-uuid",
      "name": "OpenAI GPT-4",
      "service": "chat",
      "resource": "completion",
      "provider": "openai",
      "model": "gpt-4",
      "type": "per_token",
      "price": 0.00003,
      "currency": "USD",
      "isActive": true
    }
  ]
}
```

#### POST /api/v1/billing/pricing/calculate
Расчет стоимости запроса.

**Тело запроса:**
```json
{
  "provider": "openai",
  "model": "gpt-4",
  "tokens": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  }
}
```

**Ответ:**
```json
{
  "cost": 0.00125,
  "currency": "USD",
  "breakdown": {
    "promptCost": 0.0003,
    "completionCost": 0.0009,
    "totalCost": 0.00125
  },
  "pricingRule": {
    "id": "rule-uuid",
    "name": "OpenAI GPT-4",
    "inputPrice": 0.00003,
    "outputPrice": 0.00006
  }
}
```

### Подписки

#### GET /api/v1/billing/subscriptions
Получение подписок компании.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Ответ:**
```json
{
  "data": [
    {
      "id": "subscription-uuid",
      "planName": "Pro Plan",
      "planType": "monthly",
      "price": 99.00,
      "currency": "USD",
      "includedTokens": 100000,
      "discountRate": 0.1,
      "status": "active",
      "startedAt": "2023-12-01T12:00:00.000Z",
      "expiresAt": "2024-01-01T12:00:00.000Z"
    }
  ]
}
```

#### POST /api/v1/billing/subscriptions
Создание подписки.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Тело запроса:**
```json
{
  "planName": "Pro Plan",
  "planType": "monthly",
  "paymentMethod": "card"
}
```

### Отчеты

#### GET /api/v1/billing/reports/usage
Получение отчета об использовании.

**Параметры запроса:**
- `startDate` (string): Дата начала (ISO 8601)
- `endDate` (string): Дата окончания (ISO 8601)
- `groupBy` (string): Группировка (day, week, month, provider, model)

**Ответ:**
```json
{
  "period": {
    "startDate": "2023-12-01T00:00:00.000Z",
    "endDate": "2023-12-31T23:59:59.999Z"
  },
  "summary": {
    "totalRequests": 1500,
    "totalTokens": 45000,
    "totalCost": 12.50,
    "averageCostPerRequest": 0.0083
  },
  "byProvider": [
    {
      "provider": "openai",
      "requests": 800,
      "tokens": 25000,
      "cost": 8.50
    }
  ],
  "byModel": [
    {
      "model": "gpt-4",
      "requests": 500,
      "tokens": 15000,
      "cost": 6.00
    }
  ],
  "timeline": [
    {
      "date": "2023-12-01",
      "requests": 50,
      "tokens": 1500,
      "cost": 0.42
    }
  ]
}
```

## Бизнес-логика

### Управление балансом

```typescript
@Injectable()
export class BillingService {
  async getBalance(companyId: string): Promise<CompanyBalance> {
    // 1. Получение баланса из кэша
    const cachedBalance = await this.cacheService.getCachedCompanyBalance(companyId);
    if (cachedBalance) {
      return cachedBalance;
    }
    
    // 2. Получение баланса из БД
    let balance = await this.prisma.companyBalance.findUnique({
      where: { companyId }
    });
    
    // 3. Создание баланса если не существует
    if (!balance) {
      balance = await this.prisma.companyBalance.create({
        data: {
          companyId,
          balance: this.configService.get('DEFAULT_BALANCE', 100.0),
          creditLimit: this.configService.get('CREDIT_LIMIT', 1000.0)
        }
      });
    }
    
    // 4. Кэширование баланса
    await this.cacheService.cacheCompanyBalance(companyId, balance);
    
    return balance;
  }
  
  async updateBalance(
    companyId: string,
    amount: number,
    operation: 'add' | 'subtract',
    description: string,
    metadata: any = {}
  ): Promise<Transaction> {
    return await this.prisma.$transaction(async (tx) => {
      // 1. Получение текущего баланса
      const balance = await tx.companyBalance.findUnique({
        where: { companyId }
      });
      
      if (!balance) {
        throw new CompanyNotFoundException(companyId);
      }
      
      // 2. Проверка достаточности средств
      const newAmount = operation === 'add' 
        ? balance.balance.add(amount)
        : balance.balance.sub(amount);
        
      if (operation === 'subtract' && newAmount.lt(0)) {
        const availableCredit = balance.balance.add(balance.creditLimit);
        if (availableCredit.lt(amount)) {
          throw new InsufficientBalanceException(companyId, amount);
        }
      }
      
      // 3. Обновление баланса
      await tx.companyBalance.update({
        where: { companyId },
        data: { balance: newAmount }
      });
      
      // 4. Создание транзакции
      const transaction = await tx.transaction.create({
        data: {
          companyId,
          type: operation === 'add' ? 'CREDIT' : 'DEBIT',
          amount,
          description,
          metadata
        }
      });
      
      // 5. Обновление кэша
      await this.cacheService.cacheCompanyBalance(companyId, {
        ...balance,
        balance: newAmount
      });
      
      return transaction;
    });
  }
}
```

### Тарификация

```typescript
@Injectable()
export class PricingService {
  async calculateCost(
    provider: string,
    model: string,
    tokens: TokenUsage
  ): Promise<PricingResult> {
    // 1. Поиск правила тарификации
    const pricingRule = await this.findPricingRule(provider, model);
    
    if (!pricingRule) {
      throw new PricingRuleNotFoundException(provider, model);
    }
    
    // 2. Расчет стоимости
    let cost = new Decimal(0);
    
    if (pricingRule.type === 'per_token') {
      const promptCost = new Decimal(tokens.prompt_tokens).mul(pricingRule.price);
      const completionCost = new Decimal(tokens.completion_tokens).mul(pricingRule.outputPrice || pricingRule.price);
      cost = promptCost.add(completionCost);
    } else if (pricingRule.type === 'fixed') {
      cost = new Decimal(pricingRule.price);
    }
    
    // 3. Применение скидок
    const discounts = await this.calculateDiscounts(provider, model, cost);
    const finalCost = cost.sub(discounts.total);
    
    return {
      cost: finalCost.toNumber(),
      currency: pricingRule.currency,
      breakdown: {
        promptCost: promptCost?.toNumber() || 0,
        completionCost: completionCost?.toNumber() || 0,
        totalCost: finalCost.toNumber()
      },
      discounts: discounts,
      pricingRule: {
        id: pricingRule.id,
        name: pricingRule.name,
        inputPrice: pricingRule.price,
        outputPrice: pricingRule.outputPrice
      }
    };
  }
  
  private async findPricingRule(provider: string, model: string): Promise<PricingRule | null> {
    // Поиск по провайдеру и модели
    let rule = await this.prisma.pricingRule.findFirst({
      where: {
        provider,
        model,
        isActive: true
      }
    });
    
    // Поиск по провайдеру (общее правило)
    if (!rule) {
      rule = await this.prisma.pricingRule.findFirst({
        where: {
          provider,
          model: null,
          isActive: true
        }
      });
    }
    
    return rule;
  }
}
```

### Обработка использования

```typescript
@Injectable()
export class UsageTrackingService {
  async trackUsage(
    companyId: string,
    provider: string,
    model: string,
    tokens: TokenUsage,
    requestId: string,
    metadata: any = {}
  ): Promise<UsageEvent> {
    // 1. Расчет стоимости
    const pricingResult = await this.pricingService.calculateCost(
      provider,
      model,
      tokens
    );
    
    // 2. Создание события использования
    const usageEvent = await this.prisma.usageEvent.create({
      data: {
        companyId,
        provider,
        model,
        cost: pricingResult.cost,
        tokens: {
          prompt_tokens: tokens.prompt_tokens,
          completion_tokens: tokens.completion_tokens,
          total_tokens: tokens.total_tokens
        },
        requestId,
        metadata: {
          ...metadata,
          pricingRule: pricingResult.pricingRule
        }
      }
    });
    
    // 3. Списание с баланса
    await this.billingService.updateBalance(
      companyId,
      pricingResult.cost,
      'subtract',
      `${provider}/${model} usage`,
      {
        usageEventId: usageEvent.id,
        requestId,
        tokens: tokens.total_tokens
      }
    );
    
    // 4. Обработка реферальных комиссий
    await this.referralService.processReferralCommission(
      companyId,
      pricingResult.cost
    );
    
    // 5. Отправка метрик в Analytics Service
    await this.analyticsService.trackUsage(usageEvent);
    
    return usageEvent;
  }
}
```

### Реферальная система

```typescript
@Injectable()
export class ReferralService {
  async processReferralCommission(
    companyId: string,
    amount: number
  ): Promise<void> {
    // 1. Поиск реферера
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { referredBy: true }
    });
    
    if (!company?.referredBy) {
      return; // Нет реферера
    }
    
    // 2. Расчет комиссии
    const commissionRate = this.configService.get('REFERRAL_COMMISSION_RATE', 0.1);
    const commission = new Decimal(amount).mul(commissionRate);
    
    // 3. Начисление комиссии рефереру
    await this.billingService.updateBalance(
      company.referredBy.id,
      commission.toNumber(),
      'add',
      `Referral commission from ${company.email}`,
      {
        referredCompanyId: companyId,
        originalAmount: amount,
        commissionRate
      }
    );
    
    // 4. Логирование события
    await this.logReferralCommission(
      company.referredBy.id,
      companyId,
      commission.toNumber()
    );
  }
  
  async getReferralStats(companyId: string): Promise<ReferralStats> {
    const stats = await this.prisma.$queryRaw`
      SELECT 
        COUNT(DISTINCT c.id) as total_referrals,
        COUNT(DISTINCT CASE WHEN c.is_active THEN c.id END) as active_referrals,
        COALESCE(SUM(t.amount), 0) as total_earnings,
        COALESCE(SUM(CASE WHEN t.created_at >= date_trunc('month', NOW()) THEN t.amount ELSE 0 END), 0) as this_month_earnings
      FROM companies c
      LEFT JOIN transactions t ON t.company_id = ${companyId} 
        AND t.description LIKE '%Referral commission%'
        AND t.type = 'CREDIT'
      WHERE c.referred_by = ${companyId}
    `;
    
    return stats[0];
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
    private readonly redis: RedisService,
    private readonly rabbitMQ: RabbitMQService
  ) {}
  
  @Get()
  async checkHealth() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
      this.checkRabbitMQ()
    ]);
    
    const isHealthy = checks.every(check => 
      check.status === 'fulfilled'
    );
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: checks[0].status === 'fulfilled' ? 'up' : 'down',
        redis: checks[1].status === 'fulfilled' ? 'up' : 'down',
        rabbitmq: checks[2].status === 'fulfilled' ? 'up' : 'down'
      }
    };
  }
}
```

## Troubleshooting

### Частые проблемы

#### 1. Ошибки баланса

```bash
# Проверка баланса компании
docker-compose exec billing-db psql -U postgres -d billing_db -c "SELECT * FROM company_balances WHERE company_id = 'company-uuid';"

# Проверка транзакций
docker-compose exec billing-db psql -U postgres -d billing_db -c "SELECT * FROM transactions WHERE company_id = 'company-uuid' ORDER BY created_at DESC LIMIT 10;"
```

#### 2. Проблемы с тарификацией

```bash
# Проверка правил тарификации
docker-compose exec billing-db psql -U postgres -d billing_db -c "SELECT * FROM pricing_rules WHERE provider = 'openai' AND model = 'gpt-4';"

# Проверка событий использования
docker-compose exec billing-db psql -U postgres -d billing_db -c "SELECT * FROM usage_events WHERE company_id = 'company-uuid' ORDER BY created_at DESC LIMIT 10;"
```

#### 3. Проблемы с реферальной системой

```bash
# Проверка рефералов
docker-compose exec billing-db psql -U postgres -d billing_db -c "SELECT * FROM companies WHERE referred_by = 'company-uuid';"

# Проверка реферальных комиссий
docker-compose exec billing-db psql -U postgres -d billing_db -c "SELECT * FROM transactions WHERE description LIKE '%Referral commission%' AND company_id = 'company-uuid';"
```

### Полезные команды

```bash
# Перезапуск сервиса
docker-compose restart billing-service

# Просмотр логов
docker-compose logs -f billing-service

# Очистка кэша Redis
docker-compose exec redis redis-cli FLUSHDB

# Проверка очередей RabbitMQ
docker-compose exec rabbitmq rabbitmqctl list_queues
```
