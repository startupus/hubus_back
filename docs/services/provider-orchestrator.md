# Provider Orchestrator

## Описание

Provider Orchestrator отвечает за управление ИИ-провайдерами, выбор оптимального провайдера для запросов, мониторинг их доступности и балансировку нагрузки.

## Основные функции

- **Выбор оптимального провайдера** для каждого запроса
- **Мониторинг доступности** провайдеров в реальном времени
- **Балансировка нагрузки** между провайдерами
- **Управление конфигурацией** провайдеров
- **Кэширование информации** о провайдерах
- **Анализ производительности** и качества ответов
- **Автоматическое переключение** при сбоях

## Архитектура

```mermaid
graph TB
    Client[Клиент] --> Gateway[API Gateway]
    Gateway --> Orchestrator[Provider Orchestrator]
    
    Orchestrator --> Proxy[Proxy Service]
    Orchestrator --> Redis[(Redis Cache)]
    Orchestrator --> OrchestratorDB[(Orchestrator DB)]
    
    Orchestrator --> OpenAI[OpenAI]
    Orchestrator --> Anthropic[Anthropic]
    Orchestrator --> OpenRouter[OpenRouter]
    Orchestrator --> Google[Google]
    
    Orchestrator --> Billing[Billing Service]
    Orchestrator --> Analytics[Analytics Service]
```

## Конфигурация

### Переменные окружения

```bash
# Основные настройки
NODE_ENV=development
HOST=0.0.0.0
PORT=3002

# База данных
DATABASE_URL=postgresql://postgres:password@orchestrator-db:5432/orchestrator_db

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

# Внешние сервисы
PROXY_SERVICE_URL=http://proxy-service:3003
BILLING_SERVICE_URL=http://billing-service:3004
ANALYTICS_SERVICE_URL=http://analytics-service:3005

# Настройки провайдеров
PROVIDER_HEALTH_CHECK_INTERVAL=30000
PROVIDER_TIMEOUT_MS=30000
PROVIDER_MAX_RETRIES=3

# Балансировка нагрузки
LOAD_BALANCING_STRATEGY=round_robin # round_robin, least_connections, weighted
WEIGHT_OPENAI=1.0
WEIGHT_ANTHROPIC=1.0
WEIGHT_OPENROUTER=0.8
WEIGHT_GOOGLE=0.9
```

### Docker конфигурация

```yaml
provider-orchestrator:
  build:
    context: .
    dockerfile: ./services/provider-orchestrator/Dockerfile
  ports:
    - "3002:3002"
  environment:
    - NODE_ENV=development
    - HOST=0.0.0.0
    - PORT=3002
    - DATABASE_URL=postgresql://postgres:password@orchestrator-db:5432/orchestrator_db
    - REDIS_URL=redis://redis:6379
    - RABBITMQ_URL=amqp://user:password@rabbitmq:5672
    - PROXY_SERVICE_URL=http://proxy-service:3003
  depends_on:
    - orchestrator-db
    - redis
    - rabbitmq
  networks:
    - ai-aggregator
```

## База данных

### Схема

```sql
-- Провайдеры
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  type VARCHAR(50) NOT NULL, -- openai, anthropic, openrouter, google
  base_url VARCHAR(255) NOT NULL,
  api_key_encrypted TEXT,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0,
  weight DECIMAL(3,2) DEFAULT 1.0,
  max_requests_per_minute INTEGER DEFAULT 60,
  max_tokens_per_minute INTEGER DEFAULT 150000,
  cost_per_1k_tokens DECIMAL(10,6),
  response_time_ms INTEGER,
  success_rate DECIMAL(5,4),
  last_health_check TIMESTAMP,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Модели провайдеров
CREATE TABLE provider_models (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id),
  model_name VARCHAR(100) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  context_length INTEGER,
  input_cost_per_1k_tokens DECIMAL(10,6),
  output_cost_per_1k_tokens DECIMAL(10,6),
  supported_features TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Правила маршрутизации
CREATE TABLE routing_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  condition JSONB NOT NULL,
  provider_id UUID NOT NULL REFERENCES providers(id),
  priority INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Статистика провайдеров
CREATE TABLE provider_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id),
  date DATE NOT NULL,
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

-- Индексы
CREATE INDEX idx_providers_is_active ON providers(is_active);
CREATE INDEX idx_providers_type ON providers(type);
CREATE INDEX idx_provider_models_provider_id ON provider_models(provider_id);
CREATE INDEX idx_routing_rules_priority ON routing_rules(priority, is_active);
CREATE INDEX idx_provider_stats_provider_date ON provider_stats(provider_id, date);
```

## API Endpoints

### Провайдеры

#### GET /api/v1/providers
Получение списка провайдеров.

**Ответ:**
```json
{
  "data": [
    {
      "id": "provider-uuid",
      "name": "OpenAI",
      "type": "openai",
      "isActive": true,
      "priority": 1,
      "weight": 1.0,
      "maxRequestsPerMinute": 60,
      "maxTokensPerMinute": 150000,
      "responseTimeMs": 1200,
      "successRate": 0.985,
      "lastHealthCheck": "2023-12-01T12:00:00.000Z",
      "models": [
        {
          "id": "model-uuid",
          "name": "gpt-4",
          "displayName": "GPT-4",
          "contextLength": 8192,
          "inputCostPer1kTokens": 0.03,
          "outputCostPer1kTokens": 0.06,
          "supportedFeatures": ["chat", "completion", "function_calling"]
        }
      ]
    }
  ]
}
```

#### GET /api/v1/providers/{id}
Получение провайдера по ID.

#### POST /api/v1/providers
Создание нового провайдера.

**Тело запроса:**
```json
{
  "name": "Custom OpenAI",
  "type": "openai",
  "baseUrl": "https://api.openai.com/v1",
  "apiKey": "sk-...",
  "priority": 1,
  "weight": 1.0,
  "maxRequestsPerMinute": 60,
  "maxTokensPerMinute": 150000
}
```

#### PUT /api/v1/providers/{id}
Обновление провайдера.

#### DELETE /api/v1/providers/{id}
Удаление провайдера.

### Модели

#### GET /api/v1/providers/{providerId}/models
Получение моделей провайдера.

#### POST /api/v1/providers/{providerId}/models
Добавление модели к провайдеру.

**Тело запроса:**
```json
{
  "modelName": "gpt-4-turbo",
  "displayName": "GPT-4 Turbo",
  "contextLength": 128000,
  "inputCostPer1kTokens": 0.01,
  "outputCostPer1kTokens": 0.03,
  "supportedFeatures": ["chat", "completion", "function_calling", "vision"]
}
```

### Маршрутизация

#### GET /api/v1/routing/rules
Получение правил маршрутизации.

**Ответ:**
```json
{
  "data": [
    {
      "id": "rule-uuid",
      "name": "GPT-4 for complex tasks",
      "condition": {
        "model": "gpt-4",
        "maxTokens": { ">": 1000 },
        "temperature": { ">": 0.7 }
      },
      "providerId": "openai-provider-uuid",
      "priority": 1,
      "isActive": true
    }
  ]
}
```

#### POST /api/v1/routing/rules
Создание правила маршрутизации.

**Тело запроса:**
```json
{
  "name": "Anthropic for creative tasks",
  "condition": {
    "model": "claude-3-sonnet",
    "temperature": { ">": 0.8 },
    "messages": {
      "contains": "creative"
    }
  },
  "providerId": "anthropic-provider-uuid",
  "priority": 2
}
```

### Выбор провайдера

#### POST /api/v1/routing/select
Выбор оптимального провайдера для запроса.

**Тело запроса:**
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Explain quantum computing"
    }
  ],
  "temperature": 0.7,
  "maxTokens": 1000,
  "companyId": "company-uuid"
}
```

**Ответ:**
```json
{
  "providerId": "openai-provider-uuid",
  "providerName": "OpenAI",
  "model": "gpt-4",
  "reason": "best_performance",
  "estimatedCost": 0.00125,
  "estimatedResponseTime": 1200,
  "confidence": 0.95
}
```

### Статистика

#### GET /api/v1/providers/stats
Получение статистики провайдеров.

**Параметры запроса:**
- `startDate` (string): Дата начала
- `endDate` (string): Дата окончания
- `providerId` (string): ID провайдера (опционально)

**Ответ:**
```json
{
  "data": [
    {
      "providerId": "openai-provider-uuid",
      "providerName": "OpenAI",
      "date": "2023-12-01",
      "totalRequests": 1500,
      "successfulRequests": 1475,
      "failedRequests": 25,
      "totalTokens": 45000,
      "totalCost": 12.50,
      "avgResponseTime": 1200,
      "p95ResponseTime": 2100,
      "p99ResponseTime": 3500,
      "successRate": 0.983
    }
  ]
}
```

## Бизнес-логика

### Выбор провайдера

```typescript
@Injectable()
export class ProviderSelectionService {
  async selectProvider(
    request: ProviderSelectionRequest
  ): Promise<ProviderSelectionResult> {
    // 1. Получение доступных провайдеров
    const availableProviders = await this.getAvailableProviders(request.model);
    
    if (availableProviders.length === 0) {
      throw new NoAvailableProvidersException(request.model);
    }
    
    // 2. Применение правил маршрутизации
    const routingRules = await this.getRoutingRules();
    const matchingRules = this.findMatchingRules(routingRules, request);
    
    if (matchingRules.length > 0) {
      const rule = matchingRules[0]; // Приоритетное правило
      const provider = availableProviders.find(p => p.id === rule.providerId);
      if (provider) {
        return this.createSelectionResult(provider, request, 'routing_rule');
      }
    }
    
    // 3. Выбор по стратегии балансировки
    const strategy = this.configService.get('LOAD_BALANCING_STRATEGY', 'round_robin');
    const selectedProvider = this.selectByStrategy(availableProviders, strategy);
    
    return this.createSelectionResult(selectedProvider, request, 'load_balancing');
  }
  
  private async getAvailableProviders(model: string): Promise<Provider[]> {
    const providers = await this.prisma.provider.findMany({
      where: {
        isActive: true,
        models: {
          some: {
            modelName: model,
            isActive: true
          }
        }
      },
      include: {
        models: {
          where: {
            modelName: model,
            isActive: true
          }
        }
      }
    });
    
    // Фильтрация по доступности
    const availableProviders = [];
    for (const provider of providers) {
      const isHealthy = await this.checkProviderHealth(provider);
      if (isHealthy) {
        availableProviders.push(provider);
      }
    }
    
    return availableProviders;
  }
  
  private selectByStrategy(providers: Provider[], strategy: string): Provider {
    switch (strategy) {
      case 'round_robin':
        return this.selectRoundRobin(providers);
      case 'least_connections':
        return this.selectLeastConnections(providers);
      case 'weighted':
        return this.selectWeighted(providers);
      default:
        return providers[0];
    }
  }
  
  private selectRoundRobin(providers: Provider[]): Provider {
    const index = this.roundRobinIndex % providers.length;
    this.roundRobinIndex++;
    return providers[index];
  }
  
  private selectWeighted(providers: Provider[]): Provider {
    const totalWeight = providers.reduce((sum, p) => sum + p.weight, 0);
    const random = Math.random() * totalWeight;
    
    let currentWeight = 0;
    for (const provider of providers) {
      currentWeight += provider.weight;
      if (random <= currentWeight) {
        return provider;
      }
    }
    
    return providers[providers.length - 1];
  }
}
```

### Мониторинг провайдеров

```typescript
@Injectable()
export class ProviderMonitoringService {
  @Cron('*/30 * * * * *') // Каждые 30 секунд
  async checkProviderHealth(): Promise<void> {
    const providers = await this.prisma.provider.findMany({
      where: { isActive: true }
    });
    
    for (const provider of providers) {
      try {
        const isHealthy = await this.pingProvider(provider);
        await this.updateProviderHealth(provider.id, isHealthy);
        
        if (isHealthy) {
          await this.updateProviderStats(provider.id);
        }
      } catch (error) {
        this.logger.error(`Health check failed for provider ${provider.name}`, error);
        await this.updateProviderHealth(provider.id, false);
      }
    }
  }
  
  private async pingProvider(provider: Provider): Promise<boolean> {
    try {
      const response = await this.httpService.axiosRef.get(
        `${provider.baseUrl}/models`,
        {
          headers: {
            'Authorization': `Bearer ${provider.apiKeyEncrypted}`,
            'Content-Type': 'application/json'
          },
          timeout: this.configService.get('PROVIDER_TIMEOUT_MS', 30000)
        }
      );
      
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
  
  private async updateProviderHealth(providerId: string, isHealthy: boolean): Promise<void> {
    await this.prisma.provider.update({
      where: { id: providerId },
      data: {
        lastHealthCheck: new Date(),
        isActive: isHealthy
      }
    });
    
    // Кэширование статуса
    await this.redis.setex(
      `provider:health:${providerId}`,
      60, // 1 минута
      isHealthy.toString()
    );
  }
}
```

### Управление правилами маршрутизации

```typescript
@Injectable()
export class RoutingRuleService {
  async createRule(ruleData: CreateRoutingRuleDto): Promise<RoutingRule> {
    // 1. Валидация условия
    this.validateCondition(ruleData.condition);
    
    // 2. Проверка существования провайдера
    const provider = await this.prisma.provider.findUnique({
      where: { id: ruleData.providerId }
    });
    
    if (!provider) {
      throw new ProviderNotFoundException(ruleData.providerId);
    }
    
    // 3. Создание правила
    const rule = await this.prisma.routingRule.create({
      data: {
        name: ruleData.name,
        condition: ruleData.condition,
        providerId: ruleData.providerId,
        priority: ruleData.priority || 0,
        isActive: true
      }
    });
    
    // 4. Обновление кэша правил
    await this.refreshRoutingRulesCache();
    
    return rule;
  }
  
  private validateCondition(condition: any): void {
    if (!condition || typeof condition !== 'object') {
      throw new BadRequestException('Invalid condition format');
    }
    
    // Проверка поддерживаемых операторов
    const supportedOperators = ['>', '<', '>=', '<=', '==', '!=', 'contains', 'in'];
    
    for (const [key, value] of Object.entries(condition)) {
      if (typeof value === 'object' && value !== null) {
        for (const operator of Object.keys(value)) {
          if (!supportedOperators.includes(operator)) {
            throw new BadRequestException(`Unsupported operator: ${operator}`);
          }
        }
      }
    }
  }
  
  async findMatchingRules(
    rules: RoutingRule[],
    request: ProviderSelectionRequest
  ): Promise<RoutingRule[]> {
    const matchingRules = [];
    
    for (const rule of rules) {
      if (this.evaluateCondition(rule.condition, request)) {
        matchingRules.push(rule);
      }
    }
    
    // Сортировка по приоритету
    return matchingRules.sort((a, b) => b.priority - a.priority);
  }
  
  private evaluateCondition(condition: any, request: any): boolean {
    for (const [key, value] of Object.entries(condition)) {
      if (typeof value === 'object' && value !== null) {
        for (const [operator, expectedValue] of Object.entries(value)) {
          const actualValue = this.getNestedValue(request, key);
          
          if (!this.compareValues(actualValue, operator, expectedValue)) {
            return false;
          }
        }
      } else {
        const actualValue = this.getNestedValue(request, key);
        if (actualValue !== value) {
          return false;
        }
      }
    }
    
    return true;
  }
  
  private compareValues(actual: any, operator: string, expected: any): boolean {
    switch (operator) {
      case '>':
        return actual > expected;
      case '<':
        return actual < expected;
      case '>=':
        return actual >= expected;
      case '<=':
        return actual <= expected;
      case '==':
        return actual === expected;
      case '!=':
        return actual !== expected;
      case 'contains':
        return actual && actual.includes(expected);
      case 'in':
        return Array.isArray(expected) && expected.includes(actual);
      default:
        return false;
    }
  }
}
```

### Анализ производительности

```typescript
@Injectable()
export class PerformanceAnalysisService {
  async analyzeProviderPerformance(providerId: string): Promise<PerformanceAnalysis> {
    const stats = await this.prisma.providerStats.findMany({
      where: {
        providerId,
        date: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // Последние 7 дней
        }
      },
      orderBy: { date: 'asc' }
    });
    
    if (stats.length === 0) {
      throw new NoDataException('No performance data available');
    }
    
    // Расчет трендов
    const trends = this.calculateTrends(stats);
    
    // Анализ аномалий
    const anomalies = this.detectAnomalies(stats);
    
    // Рекомендации
    const recommendations = this.generateRecommendations(stats, trends, anomalies);
    
    return {
      providerId,
      period: {
        startDate: stats[0].date,
        endDate: stats[stats.length - 1].date
      },
      trends,
      anomalies,
      recommendations,
      summary: this.calculateSummary(stats)
    };
  }
  
  private calculateTrends(stats: ProviderStats[]): PerformanceTrends {
    const responseTimeTrend = this.calculateTrend(stats.map(s => s.avgResponseTimeMs));
    const successRateTrend = this.calculateTrend(stats.map(s => s.successRate));
    const costTrend = this.calculateTrend(stats.map(s => s.totalCost));
    
    return {
      responseTime: responseTimeTrend,
      successRate: successRateTrend,
      cost: costTrend
    };
  }
  
  private calculateTrend(values: number[]): TrendDirection {
    if (values.length < 2) return 'stable';
    
    const firstHalf = values.slice(0, Math.floor(values.length / 2));
    const secondHalf = values.slice(Math.floor(values.length / 2));
    
    const firstAvg = firstHalf.reduce((sum, val) => sum + val, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((sum, val) => sum + val, 0) / secondHalf.length;
    
    const change = (secondAvg - firstAvg) / firstAvg;
    
    if (Math.abs(change) < 0.05) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
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
      this.checkRabbitMQ(),
      this.checkProviders()
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
        rabbitmq: checks[2].status === 'fulfilled' ? 'up' : 'down',
        providers: checks[3].status === 'fulfilled' ? 'up' : 'down'
      }
    };
  }
  
  private async checkProviders(): Promise<boolean> {
    try {
      const activeProviders = await this.prisma.provider.count({
        where: { isActive: true }
      });
      
      return activeProviders > 0;
    } catch (error) {
      return false;
    }
  }
}
```

## Troubleshooting

### Частые проблемы

#### 1. Нет доступных провайдеров

```bash
# Проверка статуса провайдеров
docker-compose exec orchestrator-db psql -U postgres -d orchestrator_db -c "SELECT name, is_active, last_health_check FROM providers;"

# Проверка API ключей
docker-compose exec provider-orchestrator env | grep API_KEY

# Ручная проверка провайдеров
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
```

#### 2. Проблемы с маршрутизацией

```bash
# Проверка правил маршрутизации
docker-compose exec orchestrator-db psql -U postgres -d orchestrator_db -c "SELECT * FROM routing_rules WHERE is_active = true ORDER BY priority DESC;"

# Проверка кэша правил
docker-compose exec redis redis-cli KEYS "routing:rules:*"
```

#### 3. Проблемы с балансировкой

```bash
# Проверка весов провайдеров
docker-compose exec orchestrator-db psql -U postgres -d orchestrator_db -c "SELECT name, weight, priority FROM providers WHERE is_active = true;"

# Проверка статистики
docker-compose exec orchestrator-db psql -U postgres -d orchestrator_db -c "SELECT * FROM provider_stats ORDER BY date DESC LIMIT 10;"
```

### Полезные команды

```bash
# Перезапуск сервиса
docker-compose restart provider-orchestrator

# Просмотр логов
docker-compose logs -f provider-orchestrator

# Очистка кэша
docker-compose exec redis redis-cli FLUSHDB

# Обновление статистики провайдеров
curl -X POST http://localhost:3002/api/v1/providers/health-check
```
