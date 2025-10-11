# Payment Service

## Описание

Payment Service отвечает за обработку платежей, интеграцию с платежными системами (YooKassa), управление курсами валют и обработку webhook'ов от платежных провайдеров.

## Основные функции

- **Интеграция с YooKassa** для обработки SBP платежей в рублях
- **Управление курсами валют** через API Центрального банка России
- **Обработка webhook'ов** от платежных систем
- **Управление статусами платежей** и их отслеживание
- **Конвертация валют** для международных платежей
- **Генерация отчетов** по платежам

## Архитектура

```mermaid
graph TB
    Client[Клиент] --> Gateway[API Gateway]
    Gateway --> Payment[Payment Service]
    
    Payment --> PaymentDB[(Payment Database)]
    Payment --> YooKassa[YooKassa API]
    Payment --> CBR[CBR API]
    
    Payment --> Billing[Billing Service]
    Payment --> Webhook[Webhook Handler]
    
    YooKassa --> Webhook
```

## Конфигурация

### Переменные окружения

```bash
# Основные настройки
NODE_ENV=development
HOST=0.0.0.0
PORT=3006

# База данных
PAYMENT_DATABASE_URL=postgresql://postgres:password@payment-db:5432/payment_db

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# YooKassa
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key

# CBR API
CBR_API_URL=https://www.cbr-xml-daily.ru/daily_json.js

# Frontend
FRONTEND_URL=http://localhost:3000
```

### Docker конфигурация

```yaml
payment-service:
  build:
    context: .
    dockerfile: ./services/payment-service/Dockerfile
  ports:
    - "3006:3006"
  environment:
    - NODE_ENV=development
    - HOST=0.0.0.0
    - PORT=3006
    - PAYMENT_DATABASE_URL=postgresql://postgres:password@payment-db:5432/payment_db
    - JWT_SECRET=your-super-secret-jwt-key-here
    - YOOKASSA_SHOP_ID=your_shop_id
    - YOOKASSA_SECRET_KEY=your_secret_key
    - CBR_API_URL=https://www.cbr-xml-daily.ru/daily_json.js
    - FRONTEND_URL=http://localhost:3000
  depends_on:
    - payment-db
  networks:
    - ai-aggregator
```

## База данных

### Схема

```sql
-- Платежи
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id VARCHAR(255) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  amount_usd DECIMAL(15,2),
  currency VARCHAR(3) DEFAULT 'RUB',
  status VARCHAR(20) DEFAULT 'PENDING', -- PENDING, SUCCEEDED, CANCELED, FAILED
  yookassa_id VARCHAR(255),
  yookassa_url TEXT,
  description TEXT,
  commission DECIMAL(15,2),
  exchange_rate DECIMAL(10,4),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

-- Индексы
CREATE INDEX idx_payments_company_id ON payments(company_id);
CREATE INDEX idx_payments_yookassa_id ON payments(yookassa_id);
CREATE INDEX idx_payments_status ON payments(status);
```

## API Endpoints

### Платежи

#### POST /api/v1/payments
Создание платежа.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Тело запроса:**
```json
{
  "amount": 1000.00,
  "currency": "RUB",
  "description": "Пополнение баланса"
}
```

**Ответ:**
```json
{
  "id": "payment-uuid",
  "status": "pending",
  "confirmationUrl": "https://yookassa.ru/payment/123",
  "amount": "1000.00",
  "currency": "RUB"
}
```

#### GET /api/v1/payments/{id}
Получение платежа по ID.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Ответ:**
```json
{
  "id": "payment-uuid",
  "companyId": "company-uuid",
  "amount": "1000.00",
  "currency": "RUB",
  "status": "succeeded",
  "yookassaId": "yookassa-payment-id",
  "yookassaUrl": "https://yookassa.ru/payment/123",
  "description": "Пополнение баланса",
  "commission": "29.00",
  "exchangeRate": 1.0000,
  "createdAt": "2023-12-01T12:00:00.000Z",
  "paidAt": "2023-12-01T12:05:00.000Z"
}
```

#### GET /api/v1/payments
Получение платежей компании.

**Параметры запроса:**
- `page` (number): Номер страницы (по умолчанию: 1)
- `limit` (number): Количество записей на странице (по умолчанию: 20)
- `status` (string): Статус платежа (pending, succeeded, failed, canceled)
- `startDate` (string): Дата начала (ISO 8601)
- `endDate` (string): Дата окончания (ISO 8601)

**Ответ:**
```json
{
  "data": [
    {
      "id": "payment-uuid",
      "companyId": "company-uuid",
      "amount": "1000.00",
      "currency": "RUB",
      "status": "succeeded",
      "description": "Пополнение баланса",
      "createdAt": "2023-12-01T12:00:00.000Z",
      "paidAt": "2023-12-01T12:05:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

#### GET /api/v1/payments/stats
Получение статистики платежей.

**Заголовки:**
```http
Authorization: Bearer <jwt-token>
```

**Ответ:**
```json
{
  "totalPayments": 15,
  "totalAmount": 50000.00,
  "successfulPayments": 12,
  "successfulAmount": 48000.00,
  "pendingPayments": 2,
  "failedPayments": 1,
  "averagePayment": 3333.33,
  "thisMonthPayments": 3,
  "thisMonthAmount": 10000.00
}
```

### Webhooks

#### POST /api/v1/webhooks/yookassa
Webhook для обработки уведомлений от YooKassa.

**Заголовки:**
```http
Content-Type: application/json
X-YooKassa-Signature: <signature>
```

**Тело запроса:**
```json
{
  "type": "payment.succeeded",
  "event": {
    "id": "event-uuid",
    "created_at": "2023-12-01T12:05:00.000Z",
    "type": "payment.succeeded"
  },
  "object": {
    "id": "yookassa-payment-id",
    "status": "succeeded",
    "amount": {
      "value": "1000.00",
      "currency": "RUB"
    },
    "created_at": "2023-12-01T12:00:00.000Z",
    "paid": true,
    "paid_at": "2023-12-01T12:05:00.000Z"
  }
}
```

**Ответ:**
```json
{
  "success": true,
  "message": "Webhook processed successfully"
}
```

## Бизнес-логика

### Создание платежа

```typescript
@Injectable()
export class PaymentService {
  async createPayment(
    companyId: string,
    amount: number,
    currency: string = 'RUB',
    description?: string
  ): Promise<PaymentResult> {
    // 1. Валидация суммы
    if (amount < 100) {
      throw new BadRequestException('Minimum payment amount is 100 RUB');
    }
    
    // 2. Получение курса валют
    let exchangeRate = 1.0;
    let amountUsd = amount;
    
    if (currency !== 'RUB') {
      exchangeRate = await this.currencyService.getUsdToRubRate();
      amountUsd = amount;
      amount = amount * exchangeRate;
    }
    
    // 3. Создание платежа в YooKassa
    const yooKassaResult = await this.yooKassaService.createPayment({
      amount: Math.round(amount * 100), // В копейках
      currency: 'RUB',
      returnUrl: `${this.configService.get('FRONTEND_URL')}/payment/success`,
      companyId,
      description: description || `Пополнение баланса на ${amount} RUB`
    });
    
    // 4. Сохранение платежа в БД
    const payment = await this.prisma.payment.create({
      data: {
        companyId,
        amount,
        amountUsd,
        currency,
        status: 'PENDING',
        yookassaId: yooKassaResult.id,
        yookassaUrl: yooKassaResult.confirmationUrl,
        description,
        exchangeRate
      }
    });
    
    return {
      id: payment.id,
      status: 'pending',
      confirmationUrl: yooKassaResult.confirmationUrl,
      amount: amount.toString(),
      currency: 'RUB'
    };
  }
}
```

### Обработка webhook'ов

```typescript
@Injectable()
export class WebhookService {
  async handleYooKassaWebhook(webhookData: any): Promise<WebhookResult> {
    try {
      // 1. Валидация подписи (в production)
      // const signature = headers['x-yookassa-signature'];
      // if (!this.validateSignature(webhookData, signature)) {
      //   throw new UnauthorizedException('Invalid signature');
      // }
      
      // 2. Обработка события
      const result = await this.yooKassaService.processWebhook(webhookData);
      
      if (result.success) {
        // 3. Обновление статуса платежа
        await this.paymentService.updatePaymentStatus(
          result.paymentId,
          result.status,
          result.amount,
          result.currency
        );
        
        // 4. Пополнение баланса в Billing Service
        if (result.status === 'succeeded') {
          await this.billingService.addBalance(
            result.companyId,
            result.amount,
            'Payment received',
            { paymentId: result.paymentId }
          );
        }
        
        return {
          success: true,
          message: 'Webhook processed successfully'
        };
      } else {
        throw new BadRequestException(result.message);
      }
    } catch (error) {
      this.logger.error('Error processing YooKassa webhook', error);
      throw new InternalServerErrorException('Webhook processing failed');
    }
  }
}
```

### Управление курсами валют

```typescript
@Injectable()
export class CurrencyService {
  async getUsdToRubRate(): Promise<number> {
    try {
      // 1. Попытка получить из кэша
      const cachedRate = await this.redis.get('usd_to_rub_rate');
      if (cachedRate) {
        return parseFloat(cachedRate);
      }
      
      // 2. Получение от CBR API
      const response = await this.httpService.axiosRef.get(
        this.configService.get('CBR_API_URL')
      );
      
      const usdRate = response.data.Valute.USD.Value;
      
      // 3. Кэширование на 1 час
      await this.redis.setex('usd_to_rub_rate', 3600, usdRate.toString());
      
      return usdRate;
    } catch (error) {
      this.logger.error('Failed to get USD to RUB rate', error);
      
      // 4. Fallback на последний известный курс
      const fallbackRate = await this.redis.get('usd_to_rub_rate_fallback');
      if (fallbackRate) {
        return parseFloat(fallbackRate);
      }
      
      // 5. Дефолтный курс
      return 95.0;
    }
  }
  
  async convertCurrency(
    amount: number,
    fromCurrency: string,
    toCurrency: string
  ): Promise<number> {
    if (fromCurrency === toCurrency) {
      return amount;
    }
    
    if (fromCurrency === 'USD' && toCurrency === 'RUB') {
      const rate = await this.getUsdToRubRate();
      return amount * rate;
    }
    
    if (fromCurrency === 'RUB' && toCurrency === 'USD') {
      const rate = await this.getUsdToRubRate();
      return amount / rate;
    }
    
    throw new BadRequestException(`Unsupported currency conversion: ${fromCurrency} to ${toCurrency}`);
  }
}
```

### Интеграция с YooKassa

```typescript
@Injectable()
export class YooKassaService {
  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService
  ) {}
  
  async createPayment(data: {
    amount: number;
    currency: string;
    returnUrl: string;
    companyId: string;
    description?: string;
  }): Promise<YooKassaPaymentResult> {
    const paymentData = {
      amount: {
        value: (data.amount / 100).toFixed(2), // Конвертация из копеек
        currency: data.currency
      },
      confirmation: {
        type: 'redirect',
        return_url: data.returnUrl
      },
      description: data.description || 'Пополнение баланса',
      metadata: {
        company_id: data.companyId
      }
    };
    
    try {
      const response = await this.httpService.axiosRef.post(
        'https://api.yookassa.ru/v3/payments',
        paymentData,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(
              `${this.configService.get('YOOKASSA_SHOP_ID')}:${this.configService.get('YOOKASSA_SECRET_KEY')}`
            ).toString('base64')}`,
            'Content-Type': 'application/json',
            'Idempotence-Key': uuidv4()
          }
        }
      );
      
      return {
        id: response.data.id,
        status: response.data.status,
        confirmationUrl: response.data.confirmation?.confirmation_url,
        amount: response.data.amount.value,
        currency: response.data.amount.currency
      };
    } catch (error) {
      this.logger.error('YooKassa payment creation failed', error);
      throw new InternalServerErrorException('Payment creation failed');
    }
  }
  
  async processWebhook(webhookData: any): Promise<WebhookProcessResult> {
    const paymentId = webhookData.object?.id;
    const status = webhookData.object?.status;
    const amount = webhookData.object?.amount?.value;
    const currency = webhookData.object?.amount?.currency;
    
    if (!paymentId || !status) {
      return {
        success: false,
        message: 'Invalid webhook data'
      };
    }
    
    // Поиск платежа в БД
    const payment = await this.prisma.payment.findFirst({
      where: { yookassaId: paymentId }
    });
    
    if (!payment) {
      return {
        success: false,
        message: 'Payment not found'
      };
    }
    
    return {
      success: true,
      paymentId: payment.id,
      status: this.mapYooKassaStatus(status),
      amount: amount || payment.amount.toString(),
      currency: currency || payment.currency,
      companyId: payment.companyId
    };
  }
  
  private mapYooKassaStatus(status: string): string {
    const statusMap = {
      'pending': 'PENDING',
      'succeeded': 'SUCCEEDED',
      'canceled': 'CANCELED',
      'failed': 'FAILED'
    };
    
    return statusMap[status] || 'PENDING';
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
    private readonly currencyService: CurrencyService
  ) {}
  
  @Get()
  async checkHealth() {
    const checks = await Promise.allSettled([
      this.checkDatabase(),
      this.checkCurrencyService()
    ]);
    
    const isHealthy = checks.every(check => 
      check.status === 'fulfilled'
    );
    
    return {
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: checks[0].status === 'fulfilled' ? 'up' : 'down',
        currency: checks[1].status === 'fulfilled' ? 'up' : 'down'
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
  
  private async checkCurrencyService(): Promise<boolean> {
    try {
      await this.currencyService.getUsdToRubRate();
      return true;
    } catch (error) {
      return false;
    }
  }
}
```

## Troubleshooting

### Частые проблемы

#### 1. Ошибки создания платежа

```bash
# Проверка конфигурации YooKassa
echo $YOOKASSA_SHOP_ID
echo $YOOKASSA_SECRET_KEY

# Проверка логов
docker-compose logs payment-service | grep "YooKassa"
```

#### 2. Проблемы с webhook'ами

```bash
# Проверка webhook'ов в БД
docker-compose exec payment-db psql -U postgres -d payment_db -c "SELECT * FROM payments WHERE status = 'PENDING' ORDER BY created_at DESC LIMIT 10;"

# Проверка логов webhook'ов
docker-compose logs payment-service | grep "webhook"
```

#### 3. Проблемы с курсами валют

```bash
# Проверка CBR API
curl https://www.cbr-xml-daily.ru/daily_json.js | jq '.Valute.USD.Value'

# Проверка кэша курсов
docker-compose exec redis redis-cli GET usd_to_rub_rate
```

### Полезные команды

```bash
# Перезапуск сервиса
docker-compose restart payment-service

# Просмотр логов
docker-compose logs -f payment-service

# Проверка статуса платежей
docker-compose exec payment-db psql -U postgres -d payment_db -c "SELECT status, COUNT(*) FROM payments GROUP BY status;"

# Очистка старых платежей
docker-compose exec payment-db psql -U postgres -d payment_db -c "DELETE FROM payments WHERE created_at < NOW() - INTERVAL '30 days' AND status = 'FAILED';"
```
