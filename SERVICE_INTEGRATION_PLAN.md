# 🔗 План интеграции сервисов AI Aggregator Platform

## 📊 Текущее состояние

### ✅ **Что уже работает:**
- **Микросервисы**: 6 сервисов запущены и работают
- **HTTP связи**: Provider Orchestrator → Proxy Service (реальные HTTP вызовы)
- **RabbitMQ**: Инфраструктура настроена, сервис готов
- **Базы данных**: Каждый сервис имеет свою БД
- **Docker**: Все сервисы контейнеризованы

### ❌ **Что нужно исправить:**
- **API Gateway**: Все методы - заглушки, нет HTTP вызовов к микросервисам
- **RabbitMQ**: Не используется для критических операций
- **Service Discovery**: Отсутствует автоматическое обнаружение сервисов

---

## 🎯 План интеграции

### **Фаза 1: API Gateway HTTP Integration (КРИТИЧНО)**

#### 1.1 Auth Service Integration
```typescript
// services/api-gateway/src/auth/auth.service.ts
async createApiKey(createApiKeyDto: any): Promise<any> {
  try {
    const response = await this.httpService.post(`${this.authServiceUrl}/auth/api-keys`, createApiKeyDto);
    return response.data;
  } catch (error) {
    throw new HttpException('Failed to create API key', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
```

#### 1.2 Billing Service Integration
```typescript
// services/api-gateway/src/billing/billing.service.ts
async getBalance(userId: string): Promise<UserBalanceDto> {
  try {
    const response = await this.httpService.get(`${this.billingServiceUrl}/billing/balance/${userId}`);
    return response.data;
  } catch (error) {
    throw new HttpException('Failed to get balance', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
```

#### 1.3 Analytics Service Integration
```typescript
// services/api-gateway/src/analytics/analytics.service.ts
async getMetrics(): Promise<any> {
  try {
    const response = await this.httpService.get(`${this.analyticsServiceUrl}/analytics/metrics`);
    return response.data;
  } catch (error) {
    throw new HttpException('Failed to get metrics', HttpStatus.INTERNAL_SERVER_ERROR);
  }
}
```

### **Фаза 2: RabbitMQ Critical Operations (ВЫСОКО)**

#### 2.1 Billing Service → Analytics Service
```typescript
// При создании транзакции отправлять событие в Analytics
async createTransaction(data: any): Promise<any> {
  const transaction = await this.prisma.transaction.create(data);
  
  // Отправка события в Analytics через RabbitMQ
  await this.rabbitmqService.publishCriticalMessage('analytics.events', {
    eventType: 'transaction_created',
    userId: data.userId,
    amount: data.amount,
    transactionId: transaction.id,
    timestamp: new Date().toISOString()
  });
  
  return transaction;
}
```

#### 2.2 Proxy Service → Billing Service
```typescript
// При обработке AI запроса отправлять событие биллинга
async processAIRequest(request: any): Promise<any> {
  const response = await this.sendToProvider(request);
  
  // Отправка события биллинга через RabbitMQ
  await this.rabbitmqService.publishCriticalMessage('billing.usage', {
    userId: request.userId,
    service: 'ai-chat',
    resource: request.model,
    tokens: response.usage.total_tokens,
    cost: this.calculateCost(request.model, response.usage),
    timestamp: new Date().toISOString()
  });
  
  return response;
}
```

### **Фаза 3: Service Discovery & Configuration (СРЕДНЕ)**

#### 3.1 Environment Variables
```yaml
# docker-compose.yml
environment:
  - AUTH_SERVICE_URL=http://auth-service:3001
  - BILLING_SERVICE_URL=http://billing-service:3004
  - ANALYTICS_SERVICE_URL=http://analytics-service:3005
  - PROXY_SERVICE_URL=http://proxy-service:3003
  - ORCHESTRATOR_SERVICE_URL=http://provider-orchestrator:3002
```

#### 3.2 HTTP Client Configuration
```typescript
// services/api-gateway/src/config/configuration.ts
export default () => ({
  services: {
    auth: {
      url: process.env.AUTH_SERVICE_URL || 'http://auth-service:3001',
      timeout: 5000,
      retries: 3
    },
    billing: {
      url: process.env.BILLING_SERVICE_URL || 'http://billing-service:3004',
      timeout: 10000,
      retries: 3
    },
    analytics: {
      url: process.env.ANALYTICS_SERVICE_URL || 'http://analytics-service:3005',
      timeout: 5000,
      retries: 2
    }
  }
});
```

---

## 🔧 Детальная реализация

### **HTTP Integration Patterns**

#### Pattern 1: Direct HTTP Calls
```typescript
// Синхронные вызовы для критических операций
async validateUser(token: string): Promise<User> {
  const response = await this.httpService.get(`${this.authServiceUrl}/auth/validate`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return response.data;
}
```

#### Pattern 2: Circuit Breaker
```typescript
// Защита от каскадных сбоев
async callWithCircuitBreaker<T>(service: string, operation: () => Promise<T>): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    this.circuitBreaker.recordFailure(service);
    throw error;
  }
}
```

### **RabbitMQ Integration Patterns**

#### Pattern 1: Critical Operations
```typescript
// Критические операции через RabbitMQ
async processPayment(paymentData: any): Promise<void> {
  await this.rabbitmqService.publishCriticalMessage('billing.payments', {
    type: 'payment_processing',
    data: paymentData,
    timestamp: new Date().toISOString(),
    retryCount: 0
  });
}
```

#### Pattern 2: Event Sourcing
```typescript
// События для аудита и аналитики
async trackUserAction(userId: string, action: string, metadata: any): Promise<void> {
  await this.rabbitmqService.publishCriticalMessage('analytics.events', {
    eventType: 'user_action',
    userId,
    action,
    metadata,
    timestamp: new Date().toISOString()
  });
}
```

---

## 📋 Checklist реализации

### **HTTP Integration**
- [ ] Auth Service HTTP calls
- [ ] Billing Service HTTP calls  
- [ ] Analytics Service HTTP calls
- [ ] Orchestrator Service HTTP calls
- [ ] Proxy Service HTTP calls
- [ ] Error handling for HTTP calls
- [ ] Timeout configuration
- [ ] Retry logic
- [ ] Circuit breaker pattern

### **RabbitMQ Integration**
- [ ] Billing → Analytics events
- [ ] Proxy → Billing usage events
- [ ] Auth → Analytics user events
- [ ] Orchestrator → Analytics routing events
- [ ] Dead letter queue configuration
- [ ] Message persistence
- [ ] Retry mechanisms
- [ ] Monitoring and alerting

### **Configuration**
- [ ] Service URLs configuration
- [ ] Timeout settings
- [ ] Retry policies
- [ ] Circuit breaker thresholds
- [ ] RabbitMQ connection settings
- [ ] Health check endpoints
- [ ] Monitoring configuration

---

## 🎯 Приоритеты

### **🔴 КРИТИЧНО (день 1-2):**
1. API Gateway HTTP integration
2. Basic error handling
3. Service discovery configuration

### **🟡 ВЫСОКО (день 3-4):**
1. RabbitMQ critical operations
2. Event sourcing implementation
3. Circuit breaker pattern

### **🟢 СРЕДНЕ (день 5-7):**
1. Advanced monitoring
2. Performance optimization
3. Advanced retry logic

---

## 📊 Ожидаемые результаты

### **После Фазы 1:**
- ✅ API Gateway полностью интегрирован с микросервисами
- ✅ Все заглушки заменены на реальные HTTP вызовы
- ✅ Система готова к production

### **После Фазы 2:**
- ✅ Критические операции через RabbitMQ
- ✅ Гарантированная доставка сообщений
- ✅ Event-driven архитектура

### **После Фазы 3:**
- ✅ Автоматическое обнаружение сервисов
- ✅ Продвинутый мониторинг
- ✅ Высокая отказоустойчивость

---

**Статус**: 🚧 **В РАЗРАБОТКЕ**  
**Время реализации**: 5-7 дней  
**Критичность**: 🔴 **ВЫСОКАЯ**
