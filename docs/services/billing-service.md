# Billing Service

## 🚀 Overview

The Billing Service handles all financial operations including balance management, transaction processing, pricing plans, subscriptions, and referral commissions. It provides comprehensive billing functionality with real-time balance tracking and transaction history.

## 🔧 Configuration

### Environment Variables
```env
PORT=3004
NODE_ENV=production
DATABASE_URL=postgresql://billing_user:billing_password@localhost:5432/billing_service
RABBITMQ_URL=amqp://user:password@localhost:5672
BILLING_CURRENCY=USD
DEFAULT_BALANCE=100.0
COMMISSION_RATE=0.1
```

### Dependencies
- **PostgreSQL**: Financial data storage
- **RabbitMQ**: Asynchronous communication
- **Auth Service**: User validation
- **Provider Orchestrator**: Cost calculation

## 📋 API Endpoints

### Balance Management

#### Get Balance
```http
GET /v1/billing/balance
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "balance": {
    "id": "balance-id",
    "userId": "company-id",
    "balance": 100.0,
    "currency": "USD",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

#### Update Balance
```http
POST /v1/billing/balance
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "amount": 100.0,
  "operation": "CREDIT"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Balance updated successfully",
  "balance": {
    "id": "balance-id",
    "userId": "company-id",
    "balance": 200.0,
    "currency": "USD",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

### Transaction Management

#### Get Transactions
```http
GET /v1/billing/transactions?limit=50&offset=0
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "transaction-id",
      "userId": "company-id",
      "type": "DEBIT",
      "amount": 10.0,
      "currency": "USD",
      "description": "AI request",
      "provider": "openai",
      "metadata": {
        "model": "gpt-4",
        "tokens": 100
      },
      "createdAt": "2024-12-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Create Transaction
```http
POST /v1/billing/transactions
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "DEBIT",
  "amount": 10.0,
  "currency": "USD",
  "description": "AI request",
  "provider": "openai",
  "metadata": {
    "model": "gpt-4",
    "tokens": 100
  }
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "transaction-id",
    "userId": "company-id",
    "type": "DEBIT",
    "amount": 10.0,
    "currency": "USD",
    "description": "AI request",
    "provider": "openai",
    "metadata": {
      "model": "gpt-4",
      "tokens": 100
    },
    "createdAt": "2024-12-01T00:00:00.000Z"
  }
}
```

### Pricing Plans

#### Get Pricing Plans
```http
GET /v1/billing/pricing-plans
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "plans": [
    {
      "id": "plan-id",
      "name": "Basic Plan",
      "description": "Basic monthly plan",
      "type": "TOKEN_BASED",
      "price": 50.0,
      "currency": "USD",
      "inputTokens": 10000,
      "outputTokens": 20000,
      "inputTokenPrice": 0.001,
      "outputTokenPrice": 0.002,
      "discountPercent": 10,
      "isActive": true,
      "createdAt": "2024-12-01T00:00:00.000Z"
    }
  ]
}
```

#### Subscribe to Plan
```http
POST /v1/billing/subscribe
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "planId": "plan-id",
  "paymentMethod": "balance"
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "subscription-id",
    "companyId": "company-id",
    "planId": "plan-id",
    "status": "ACTIVE",
    "inputTokensUsed": 0,
    "outputTokensUsed": 0,
    "inputTokensLimit": 10000,
    "outputTokensLimit": 20000,
    "startsAt": "2024-12-01T00:00:00.000Z",
    "expiresAt": "2025-01-01T00:00:00.000Z",
    "createdAt": "2024-12-01T00:00:00.000Z"
  }
}
```

### Referral System

#### Get Referral Stats
```http
GET /v1/billing/referral-stats
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalReferrals": 10,
    "activeReferrals": 8,
    "totalCommission": 150.0,
    "commissionRate": 0.1,
    "referralCode": "ABC123"
  }
}
```

#### Get Referral History
```http
GET /v1/billing/referral-history
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "referrals": [
    {
      "id": "referral-id",
      "referrerId": "referrer-company-id",
      "referredId": "referred-company-id",
      "commissionAmount": 15.0,
      "status": "ACTIVE",
      "createdAt": "2024-12-01T00:00:00.000Z"
    }
  ]
}
```

## 🗄️ Database Schema

### Company Balances Table
```sql
CREATE TABLE company_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  balance DECIMAL(10,2) DEFAULT 100.0,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Transactions Table
```sql
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL, -- DEBIT, CREDIT
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  provider VARCHAR(50),
  metadata JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'COMPLETED',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Pricing Plans Table
```sql
CREATE TABLE pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  type VARCHAR(20) NOT NULL, -- MONTHLY, TOKEN_BASED
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  input_tokens INTEGER,
  output_tokens INTEGER,
  input_token_price DECIMAL(10,6),
  output_token_price DECIMAL(10,6),
  discount_percent DECIMAL(5,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Subscriptions Table
```sql
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES pricing_plans(id),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  input_tokens_used INTEGER DEFAULT 0,
  output_tokens_used INTEGER DEFAULT 0,
  input_tokens_limit INTEGER,
  output_tokens_limit INTEGER,
  starts_at TIMESTAMP NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Referral Transactions Table
```sql
CREATE TABLE referral_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 💰 Business Logic

### Balance Management
```typescript
// Update balance with transaction
async updateCompanyBalance(
  companyId: string,
  amount: number,
  operation: 'CREDIT' | 'DEBIT',
  description: string,
  metadata: any = {}
): Promise<CompanyBalance> {
  return await this.prisma.$transaction(async (tx) => {
    // Get current balance
    const currentBalance = await tx.companyBalance.findUnique({
      where: { userId: companyId }
    });

    if (!currentBalance) {
      throw new Error('Company balance not found');
    }

    // Calculate new balance
    const newBalance = operation === 'CREDIT' 
      ? currentBalance.balance + amount
      : currentBalance.balance - amount;

    // Check for insufficient balance
    if (operation === 'DEBIT' && newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    // Update balance
    const updatedBalance = await tx.companyBalance.update({
      where: { userId: companyId },
      data: { balance: newBalance }
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        userId: companyId,
        type: operation,
        amount,
        currency: 'USD',
        description,
        metadata,
        status: 'COMPLETED'
      }
    });

    return updatedBalance;
  });
}
```

### Pricing Calculation
```typescript
// Calculate cost for AI request
async calculateRequestCost(
  model: string,
  inputTokens: number,
  outputTokens: number,
  provider: string
): Promise<number> {
  // Get pricing for model
  const pricing = await this.getModelPricing(model, provider);
  
  // Calculate cost
  const inputCost = inputTokens * pricing.inputTokenPrice;
  const outputCost = outputTokens * pricing.outputTokenPrice;
  
  return inputCost + outputCost;
}

// Apply subscription discounts
async applySubscriptionDiscount(
  companyId: string,
  cost: number
): Promise<number> {
  const subscription = await this.getActiveSubscription(companyId);
  
  if (!subscription) {
    return cost;
  }
  
  const discount = subscription.plan.discountPercent / 100;
  return cost * (1 - discount);
}
```

### Referral Commission
```typescript
// Process referral commission
async processReferralCommission(
  referrerId: string,
  referredId: string,
  amount: number,
  commissionRate: number = 0.1
): Promise<void> {
  const commissionAmount = amount * commissionRate;
  
  // Update referrer balance
  await this.updateCompanyBalance(
    referrerId,
    commissionAmount,
    'CREDIT',
    'Referral commission',
    { referredId, originalAmount: amount }
  );
  
  // Create referral transaction record
  await this.prisma.referralTransaction.create({
    data: {
      referrerId,
      referredId,
      commissionAmount,
      status: 'COMPLETED',
      metadata: {
        originalAmount: amount,
        commissionRate
      }
    }
  });
}
```

## 🔄 Message Queue Integration

### RabbitMQ Handlers
```typescript
// Handle billing events
@RabbitSubscribe('billing.transaction')
async handleTransactionEvent(data: TransactionEvent) {
  try {
    await this.processTransaction(data);
    logger.info('Transaction processed successfully', { transactionId: data.id });
  } catch (error) {
    logger.error('Failed to process transaction', { error, transactionId: data.id });
    // Implement retry logic or dead letter queue
  }
}

// Handle referral events
@RabbitSubscribe('billing.referral')
async handleReferralEvent(data: ReferralEvent) {
  try {
    await this.processReferralCommission(data);
    logger.info('Referral commission processed', { referrerId: data.referrerId });
  } catch (error) {
    logger.error('Failed to process referral commission', { error, referrerId: data.referrerId });
  }
}
```

### Event Publishing
```typescript
// Publish billing events
async publishBillingEvent(event: BillingEvent) {
  await this.rabbitMQService.publish('billing.events', event);
}

// Publish analytics events
async publishAnalyticsEvent(event: AnalyticsEvent) {
  await this.rabbitMQService.publish('analytics.events', event);
}
```

## 📊 Monitoring & Analytics

### Business Metrics
```typescript
// Get billing metrics
async getBillingMetrics(companyId: string, period: string) {
  const startDate = this.getPeriodStartDate(period);
  
  const metrics = await this.prisma.transaction.aggregate({
    where: {
      userId: companyId,
      createdAt: { gte: startDate }
    },
    _sum: {
      amount: true
    },
    _count: {
      id: true
    }
  });
  
  return {
    totalSpent: metrics._sum.amount || 0,
    transactionCount: metrics._count.id,
    averageTransaction: metrics._sum.amount / metrics._count.id
  };
}
```

### Cost Analysis
```typescript
// Analyze costs by provider
async getCostAnalysis(companyId: string, period: string) {
  const startDate = this.getPeriodStartDate(period);
  
  const costs = await this.prisma.transaction.groupBy({
    by: ['provider'],
    where: {
      userId: companyId,
      type: 'DEBIT',
      createdAt: { gte: startDate }
    },
    _sum: {
      amount: true
    },
    _count: {
      id: true
    }
  });
  
  return costs.map(cost => ({
    provider: cost.provider,
    totalCost: cost._sum.amount,
    transactionCount: cost._count.id
  }));
}
```

## 🧪 Testing

### Unit Tests
```typescript
describe('BillingService', () => {
  let service: BillingService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should update balance successfully', async () => {
    const companyId = 'test-company-id';
    const amount = 100.0;
    const operation = 'CREDIT';

    const mockBalance = {
      id: 'balance-id',
      userId: companyId,
      balance: 100.0,
      currency: 'USD'
    };

    const updatedBalance = {
      ...mockBalance,
      balance: 200.0
    };

    jest.spyOn(prismaService.companyBalance, 'findUnique').mockResolvedValue(mockBalance);
    jest.spyOn(prismaService.companyBalance, 'update').mockResolvedValue(updatedBalance);
    jest.spyOn(prismaService.transaction, 'create').mockResolvedValue({} as any);

    const result = await service.updateCompanyBalance(companyId, amount, operation, 'Test credit');

    expect(result.balance).toBe(200.0);
    expect(prismaService.companyBalance.update).toHaveBeenCalled();
    expect(prismaService.transaction.create).toHaveBeenCalled();
  });
});
```

### Integration Tests
```typescript
describe('Billing Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(PrismaService)
    .useValue(mockPrismaService)
    .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle complete billing flow', async () => {
    // Get balance
    const balanceResponse = await request(app.getHttpServer())
      .get('/v1/billing/balance')
      .set('Authorization', 'Bearer test-token')
      .expect(200);

    expect(balanceResponse.body.balance).toBeDefined();

    // Update balance
    const updateResponse = await request(app.getHttpServer())
      .post('/v1/billing/balance')
      .set('Authorization', 'Bearer test-token')
      .send({
        amount: 50.0,
        operation: 'CREDIT'
      })
      .expect(200);

    expect(updateResponse.body.balance.balance).toBe(150.0);
  });
});
```

## 🚀 Deployment

### Docker Configuration
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3004

CMD ["node", "dist/main.js"]
```

### Docker Compose
```yaml
billing-service:
  build: ./services/billing-service
  ports:
    - "3004:3004"
  environment:
    - PORT=3004
    - DATABASE_URL=postgresql://billing_user:billing_password@billing-db:5432/billing_service
    - RABBITMQ_URL=amqp://user:password@rabbitmq:5672
    - BILLING_CURRENCY=USD
    - DEFAULT_BALANCE=100.0
  depends_on:
    - billing-db
    - rabbitmq

billing-db:
  image: postgres:14
  environment:
    - POSTGRES_DB=billing_service
    - POSTGRES_USER=billing_user
    - POSTGRES_PASSWORD=billing_password
  volumes:
    - billing_data:/var/lib/postgresql/data
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database status
docker-compose logs billing-db

# Test database connection
psql -h localhost -U billing_user -d billing_service -c "SELECT 1;"
```

#### RabbitMQ Issues
```bash
# Check RabbitMQ status
docker-compose logs rabbitmq

# Check queues
docker exec -it rabbitmq rabbitmqctl list_queues
```

#### Balance Calculation Issues
```sql
-- Check balance calculations
SELECT 
  user_id,
  balance,
  (SELECT SUM(amount) FROM transactions WHERE user_id = cb.user_id AND type = 'CREDIT') as total_credits,
  (SELECT SUM(amount) FROM transactions WHERE user_id = cb.user_id AND type = 'DEBIT') as total_debits
FROM company_balances cb;
```

### Performance Issues

#### Slow Transaction Queries
```sql
-- Check transaction table performance
EXPLAIN ANALYZE SELECT * FROM transactions 
WHERE user_id = 'company-id' 
ORDER BY created_at DESC 
LIMIT 50;

-- Add indexes if needed
CREATE INDEX idx_transactions_user_id_created_at ON transactions(user_id, created_at DESC);
```

#### Memory Issues
```bash
# Check memory usage
docker stats billing-service

# Check for memory leaks
docker-compose logs billing-service | grep -i memory
```

---

**Last Updated**: December 2024
**Service Version**: 1.0.0