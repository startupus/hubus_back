# Analytics Service

## Описание

Analytics Service отвечает за сбор, обработку и анализ метрик использования ИИ-сервисов, генерацию отчетов и интеграцию с системами мониторинга.

## Основные функции

- **Сбор метрик** использования ИИ-провайдеров
- **Анализ производительности** и качества ответов
- **Генерация отчетов** по использованию и расходам
- **Интеграция с Prometheus** для мониторинга
- **Анализ трендов** и паттернов использования
- **Алерты и уведомления** о критических событиях
- **Дашборды** для визуализации данных

## Архитектура

```mermaid
graph TB
    Client[Клиент] --> Gateway[API Gateway]
    Gateway --> Analytics[Analytics Service]
    
    Analytics --> AnalyticsDB[(Analytics Database)]
    Analytics --> Prometheus[Prometheus]
    Analytics --> Grafana[Grafana]
    
    Analytics --> RabbitMQ[RabbitMQ]
    Analytics --> Redis[(Redis Cache)]
    
    Billing[Billing Service] --> RabbitMQ
    Proxy[Proxy Service] --> RabbitMQ
    Auth[Auth Service] --> RabbitMQ
```

## Конфигурация

### Переменные окружения

```bash
# Основные настройки
NODE_ENV=development
HOST=0.0.0.0
PORT=3005

# База данных
DATABASE_URL=postgresql://postgres:password@analytics-db:5432/analytics_db

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

# Prometheus
PROMETHEUS_ENDPOINT=http://prometheus:9090
PROMETHEUS_METRICS_PATH=/metrics

# Grafana
GRAFANA_URL=http://grafana:3000
GRAFANA_API_KEY=your_grafana_api_key

# Алерты
ALERT_WEBHOOK_URL=https://hooks.slack.com/your-webhook
ALERT_EMAIL_SMTP_HOST=smtp.gmail.com
ALERT_EMAIL_SMTP_PORT=587
```

### Docker конфигурация

```yaml
analytics-service:
  build:
    context: .
    dockerfile: ./services/analytics-service/Dockerfile
  ports:
    - "3005:3005"
    - "9091:9091"  # Prometheus metrics
  environment:
    - NODE_ENV=development
    - HOST=0.0.0.0
    - PORT=3005
    - DATABASE_URL=postgresql://postgres:password@analytics-db:5432/analytics_db
    - REDIS_URL=redis://redis:6379
    - RABBITMQ_URL=amqp://user:password@rabbitmq:5672
    - PROMETHEUS_ENDPOINT=http://prometheus:9090
  depends_on:
    - analytics-db
    - redis
    - rabbitmq
  networks:
    - ai-aggregator
```

## База данных

### Схема

```sql
-- Метрики использования
CREATE TABLE usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL,
  service_name VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  request_id VARCHAR(255),
  tokens_used INTEGER NOT NULL,
  cost DECIMAL(15,6) NOT NULL,
  response_time_ms INTEGER NOT NULL,
  success BOOLEAN NOT NULL,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Агрегированные метрики
CREATE TABLE aggregated_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  service_name VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  model VARCHAR(100) NOT NULL,
  period VARCHAR(20) NOT NULL, -- hour, day, week, month
  period_start TIMESTAMP NOT NULL,
  period_end TIMESTAMP NOT NULL,
  total_requests INTEGER DEFAULT 0,
  successful_requests INTEGER DEFAULT 0,
  failed_requests INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  total_cost DECIMAL(15,6) DEFAULT 0,
  avg_response_time_ms DECIMAL(10,2) DEFAULT 0,
  p95_response_time_ms DECIMAL(10,2) DEFAULT 0,
  p99_response_time_ms DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- События системы
CREATE TABLE system_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type VARCHAR(100) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- info, warning, error, critical
  message TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Алерты
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  condition JSONB NOT NULL,
  threshold DECIMAL(15,6),
  is_active BOOLEAN DEFAULT true,
  last_triggered TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Уведомления
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_id UUID REFERENCES alerts(id),
  company_id UUID,
  type VARCHAR(50) NOT NULL, -- email, webhook, slack
  recipient VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  sent_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
  created_at TIMESTAMP DEFAULT NOW()
);

-- Индексы
CREATE INDEX idx_usage_metrics_company_id ON usage_metrics(company_id);
CREATE INDEX idx_usage_metrics_created_at ON usage_metrics(created_at);
CREATE INDEX idx_usage_metrics_service ON usage_metrics(service_name, provider, model);
CREATE INDEX idx_aggregated_metrics_period ON aggregated_metrics(period, period_start);
CREATE INDEX idx_system_events_created_at ON system_events(created_at);
CREATE INDEX idx_alerts_is_active ON alerts(is_active);
```

## API Endpoints

### Метрики

#### GET /api/v1/analytics/metrics
Получение метрик использования.

**Параметры запроса:**
- `companyId` (string): ID компании (опционально)
- `startDate` (string): Дата начала (ISO 8601)
- `endDate` (string): Дата окончания (ISO 8601)
- `service` (string): Название сервиса
- `provider` (string): Провайдер
- `model` (string): Модель
- `groupBy` (string): Группировка (hour, day, week, month)

**Ответ:**
```json
{
  "data": [
    {
      "period": "2023-12-01T00:00:00.000Z",
      "service": "chat",
      "provider": "openai",
      "model": "gpt-4",
      "totalRequests": 150,
      "successfulRequests": 145,
      "failedRequests": 5,
      "totalTokens": 4500,
      "totalCost": 12.50,
      "avgResponseTime": 1.2,
      "p95ResponseTime": 2.1,
      "p99ResponseTime": 3.5
    }
  ],
  "summary": {
    "totalRequests": 150,
    "totalCost": 12.50,
    "avgResponseTime": 1.2,
    "successRate": 96.67
  }
}
```

#### POST /api/v1/analytics/metrics
Создание метрики (внутренний API).

**Тело запроса:**
```json
{
  "companyId": "company-uuid",
  "serviceName": "chat",
  "provider": "openai",
  "model": "gpt-4",
  "requestId": "req-uuid",
  "tokensUsed": 25,
  "cost": 0.00125,
  "responseTimeMs": 1200,
  "success": true,
  "metadata": {
    "temperature": 0.7,
    "maxTokens": 1000
  }
}
```

### Отчеты

#### GET /api/v1/analytics/reports/usage
Получение отчета об использовании.

**Параметры запроса:**
- `companyId` (string): ID компании
- `startDate` (string): Дата начала
- `endDate` (string): Дата окончания
- `format` (string): Формат отчета (json, csv, pdf)

**Ответ:**
```json
{
  "reportId": "report-uuid",
  "companyId": "company-uuid",
  "period": {
    "startDate": "2023-12-01T00:00:00.000Z",
    "endDate": "2023-12-31T23:59:59.999Z"
  },
  "summary": {
    "totalRequests": 1500,
    "totalCost": 125.50,
    "avgResponseTime": 1.2,
    "successRate": 96.67
  },
  "byProvider": [
    {
      "provider": "openai",
      "requests": 800,
      "cost": 80.50,
      "avgResponseTime": 1.1
    },
    {
      "provider": "anthropic",
      "requests": 700,
      "cost": 45.00,
      "avgResponseTime": 1.3
    }
  ],
  "byModel": [
    {
      "model": "gpt-4",
      "requests": 500,
      "cost": 60.00,
      "avgResponseTime": 1.0
    },
    {
      "model": "claude-3-sonnet",
      "requests": 700,
      "cost": 45.00,
      "avgResponseTime": 1.3
    }
  ],
  "timeline": [
    {
      "date": "2023-12-01",
      "requests": 50,
      "cost": 4.20,
      "avgResponseTime": 1.1
    }
  ]
}
```

#### GET /api/v1/analytics/reports/performance
Получение отчета о производительности.

**Ответ:**
```json
{
  "reportId": "perf-report-uuid",
  "period": {
    "startDate": "2023-12-01T00:00:00.000Z",
    "endDate": "2023-12-31T23:59:59.999Z"
  },
  "performance": {
    "avgResponseTime": 1.2,
    "p95ResponseTime": 2.1,
    "p99ResponseTime": 3.5,
    "maxResponseTime": 8.2,
    "minResponseTime": 0.1
  },
  "reliability": {
    "successRate": 96.67,
    "uptime": 99.9,
    "errorRate": 3.33
  },
  "byProvider": [
    {
      "provider": "openai",
      "avgResponseTime": 1.1,
      "successRate": 98.5,
      "errorRate": 1.5
    }
  ]
}
```

### Алерты

#### GET /api/v1/analytics/alerts
Получение списка алертов.

**Ответ:**
```json
{
  "data": [
    {
      "id": "alert-uuid",
      "name": "High Error Rate",
      "description": "Alert when error rate exceeds 5%",
      "condition": {
        "metric": "error_rate",
        "operator": ">",
        "threshold": 0.05
      },
      "isActive": true,
      "lastTriggered": "2023-12-01T12:00:00.000Z",
      "createdAt": "2023-11-01T00:00:00.000Z"
    }
  ]
}
```

#### POST /api/v1/analytics/alerts
Создание алерта.

**Тело запроса:**
```json
{
  "name": "High Cost Alert",
  "description": "Alert when daily cost exceeds $100",
  "condition": {
    "metric": "daily_cost",
    "operator": ">",
    "threshold": 100.0
  },
  "notifications": [
    {
      "type": "email",
      "recipient": "admin@company.com"
    },
    {
      "type": "webhook",
      "recipient": "https://hooks.slack.com/webhook"
    }
  ]
}
```

### Системные события

#### GET /api/v1/analytics/events
Получение системных событий.

**Параметры запроса:**
- `severity` (string): Уровень серьезности (info, warning, error, critical)
- `startDate` (string): Дата начала
- `endDate` (string): Дата окончания
- `limit` (number): Количество записей

**Ответ:**
```json
{
  "data": [
    {
      "id": "event-uuid",
      "eventType": "service_down",
      "severity": "critical",
      "message": "Auth Service is down",
      "metadata": {
        "service": "auth-service",
        "duration": "5m 30s"
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

## Бизнес-логика

### Сбор метрик

```typescript
@Injectable()
export class MetricsCollectorService {
  async collectMetric(metricData: MetricData): Promise<void> {
    // 1. Сохранение метрики в БД
    await this.prisma.usageMetrics.create({
      data: {
        companyId: metricData.companyId,
        serviceName: metricData.serviceName,
        provider: metricData.provider,
        model: metricData.model,
        requestId: metricData.requestId,
        tokensUsed: metricData.tokensUsed,
        cost: metricData.cost,
        responseTimeMs: metricData.responseTimeMs,
        success: metricData.success,
        errorMessage: metricData.errorMessage,
        metadata: metricData.metadata
      }
    });
    
    // 2. Обновление агрегированных метрик
    await this.updateAggregatedMetrics(metricData);
    
    // 3. Отправка в Prometheus
    await this.sendToPrometheus(metricData);
    
    // 4. Проверка алертов
    await this.checkAlerts(metricData);
  }
  
  private async updateAggregatedMetrics(metricData: MetricData): Promise<void> {
    const period = this.getCurrentPeriod();
    
    await this.prisma.aggregatedMetrics.upsert({
      where: {
        companyId_serviceName_provider_model_period_periodStart: {
          companyId: metricData.companyId,
          serviceName: metricData.serviceName,
          provider: metricData.provider,
          model: metricData.model,
          period: period.type,
          periodStart: period.start
        }
      },
      update: {
        totalRequests: { increment: 1 },
        successfulRequests: { increment: metricData.success ? 1 : 0 },
        failedRequests: { increment: metricData.success ? 0 : 1 },
        totalTokens: { increment: metricData.tokensUsed },
        totalCost: { increment: metricData.cost },
        avgResponseTimeMs: this.calculateAverageResponseTime(metricData),
        p95ResponseTimeMs: this.calculatePercentileResponseTime(metricData, 95),
        p99ResponseTimeMs: this.calculatePercentileResponseTime(metricData, 99)
      },
      create: {
        companyId: metricData.companyId,
        serviceName: metricData.serviceName,
        provider: metricData.provider,
        model: metricData.model,
        period: period.type,
        periodStart: period.start,
        periodEnd: period.end,
        totalRequests: 1,
        successfulRequests: metricData.success ? 1 : 0,
        failedRequests: metricData.success ? 0 : 1,
        totalTokens: metricData.tokensUsed,
        totalCost: metricData.cost,
        avgResponseTimeMs: metricData.responseTimeMs,
        p95ResponseTimeMs: metricData.responseTimeMs,
        p99ResponseTimeMs: metricData.responseTimeMs
      }
    });
  }
}
```

### Генерация отчетов

```typescript
@Injectable()
export class ReportGeneratorService {
  async generateUsageReport(
    companyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<UsageReport> {
    // 1. Получение агрегированных данных
    const metrics = await this.prisma.aggregatedMetrics.findMany({
      where: {
        companyId,
        periodStart: { gte: startDate },
        periodEnd: { lte: endDate }
      }
    });
    
    // 2. Агрегация по провайдерам
    const byProvider = this.aggregateByProvider(metrics);
    
    // 3. Агрегация по моделям
    const byModel = this.aggregateByModel(metrics);
    
    // 4. Создание временной шкалы
    const timeline = this.createTimeline(metrics);
    
    // 5. Расчет общих метрик
    const summary = this.calculateSummary(metrics);
    
    return {
      reportId: uuidv4(),
      companyId,
      period: { startDate, endDate },
      summary,
      byProvider,
      byModel,
      timeline
    };
  }
  
  async generatePerformanceReport(
    startDate: Date,
    endDate: Date
  ): Promise<PerformanceReport> {
    const metrics = await this.prisma.usageMetrics.findMany({
      where: {
        createdAt: { gte: startDate, lte: endDate }
      }
    });
    
    return {
      reportId: uuidv4(),
      period: { startDate, endDate },
      performance: this.calculatePerformanceMetrics(metrics),
      reliability: this.calculateReliabilityMetrics(metrics),
      byProvider: this.calculateProviderMetrics(metrics)
    };
  }
}
```

### Система алертов

```typescript
@Injectable()
export class AlertService {
  async checkAlerts(metricData: MetricData): Promise<void> {
    const alerts = await this.prisma.alert.findMany({
      where: { isActive: true }
    });
    
    for (const alert of alerts) {
      const shouldTrigger = await this.evaluateAlertCondition(alert, metricData);
      
      if (shouldTrigger) {
        await this.triggerAlert(alert, metricData);
      }
    }
  }
  
  private async evaluateAlertCondition(
    alert: Alert,
    metricData: MetricData
  ): Promise<boolean> {
    const condition = alert.condition;
    
    switch (condition.metric) {
      case 'error_rate':
        return await this.checkErrorRate(condition, metricData);
      case 'response_time':
        return await this.checkResponseTime(condition, metricData);
      case 'cost':
        return await this.checkCost(condition, metricData);
      default:
        return false;
    }
  }
  
  private async triggerAlert(alert: Alert, metricData: MetricData): Promise<void> {
    // 1. Обновление времени последнего срабатывания
    await this.prisma.alert.update({
      where: { id: alert.id },
      data: { lastTriggered: new Date() }
    });
    
    // 2. Создание уведомлений
    const notifications = await this.prisma.notification.findMany({
      where: { alertId: alert.id }
    });
    
    for (const notification of notifications) {
      await this.sendNotification(notification, alert, metricData);
    }
  }
}
```

### Интеграция с Prometheus

```typescript
@Injectable()
export class PrometheusService {
  private readonly register = new prometheus.Registry();
  
  constructor() {
    this.initializeMetrics();
  }
  
  private initializeMetrics(): void {
    // Счетчик запросов
    const requestCounter = new prometheus.Counter({
      name: 'ai_requests_total',
      help: 'Total number of AI requests',
      labelNames: ['service', 'provider', 'model', 'status']
    });
    
    // Гистограмма времени ответа
    const responseTimeHistogram = new prometheus.Histogram({
      name: 'ai_response_time_seconds',
      help: 'AI response time in seconds',
      labelNames: ['service', 'provider', 'model'],
      buckets: [0.1, 0.5, 1, 2, 5, 10]
    });
    
    // Счетчик токенов
    const tokensCounter = new prometheus.Counter({
      name: 'ai_tokens_total',
      help: 'Total number of tokens used',
      labelNames: ['service', 'provider', 'model']
    });
    
    // Счетчик стоимости
    const costCounter = new prometheus.Counter({
      name: 'ai_cost_total',
      help: 'Total cost of AI requests',
      labelNames: ['service', 'provider', 'model']
    });
    
    this.register.register(requestCounter);
    this.register.register(responseTimeHistogram);
    this.register.register(tokensCounter);
    this.register.register(costCounter);
  }
  
  async recordMetric(metricData: MetricData): Promise<void> {
    const labels = {
      service: metricData.serviceName,
      provider: metricData.provider,
      model: metricData.model,
      status: metricData.success ? 'success' : 'error'
    };
    
    // Увеличение счетчиков
    this.requestCounter.inc(labels);
    this.tokensCounter.inc(
      { ...labels, service: metricData.serviceName },
      metricData.tokensUsed
    );
    this.costCounter.inc(
      { ...labels, service: metricData.serviceName },
      metricData.cost
    );
    
    // Запись времени ответа
    this.responseTimeHistogram.observe(
      { ...labels, service: metricData.serviceName },
      metricData.responseTimeMs / 1000
    );
  }
  
  @Get('/metrics')
  async getMetrics(): Promise<string> {
    return this.register.metrics();
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

#### 1. Проблемы с метриками

```bash
# Проверка метрик в БД
docker-compose exec analytics-db psql -U postgres -d analytics_db -c "SELECT COUNT(*) FROM usage_metrics WHERE created_at > NOW() - INTERVAL '1 hour';"

# Проверка Prometheus метрик
curl http://localhost:3005/metrics
```

#### 2. Проблемы с отчетами

```bash
# Проверка агрегированных метрик
docker-compose exec analytics-db psql -U postgres -d analytics_db -c "SELECT * FROM aggregated_metrics ORDER BY created_at DESC LIMIT 10;"

# Проверка логов генерации отчетов
docker-compose logs analytics-service | grep "report"
```

#### 3. Проблемы с алертами

```bash
# Проверка алертов
docker-compose exec analytics-db psql -U postgres -d analytics_db -c "SELECT * FROM alerts WHERE is_active = true;"

# Проверка уведомлений
docker-compose exec analytics-db psql -U postgres -d analytics_db -c "SELECT * FROM notifications WHERE status = 'failed' ORDER BY created_at DESC LIMIT 10;"
```

### Полезные команды

```bash
# Перезапуск сервиса
docker-compose restart analytics-service

# Просмотр логов
docker-compose logs -f analytics-service

# Проверка Prometheus метрик
curl http://localhost:3005/metrics | grep ai_requests_total

# Очистка старых метрик
docker-compose exec analytics-db psql -U postgres -d analytics_db -c "DELETE FROM usage_metrics WHERE created_at < NOW() - INTERVAL '30 days';"
```
