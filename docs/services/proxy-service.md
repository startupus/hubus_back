# Proxy Service

## Описание

Proxy Service отвечает за проксирование запросов к внешним ИИ-провайдерам, трансформацию форматов запросов и ответов, обработку ошибок и retry логику.

## Основные функции

- **Проксирование запросов** к OpenAI, Anthropic, OpenRouter и другим провайдерам
- **Трансформация форматов** запросов и ответов между различными API
- **Обработка ошибок** и автоматические повторы запросов
- **Rate limiting** и управление лимитами провайдеров
- **Кэширование ответов** для оптимизации производительности
- **Мониторинг производительности** провайдеров
- **Анонимизация данных** для защиты конфиденциальности

## Архитектура

```mermaid
graph TB
    Client[Клиент] --> Gateway[API Gateway]
    Gateway --> Orchestrator[Provider Orchestrator]
    Orchestrator --> Proxy[Proxy Service]
    
    Proxy --> OpenAI[OpenAI API]
    Proxy --> Anthropic[Anthropic API]
    Proxy --> OpenRouter[OpenRouter API]
    Proxy --> Google[Google Gemini API]
    
    Proxy --> Redis[(Redis Cache)]
    Proxy --> RabbitMQ[RabbitMQ]
    Proxy --> Analytics[Analytics Service]
```

## Конфигурация

### Переменные окружения

```bash
# Основные настройки
NODE_ENV=development
HOST=0.0.0.0
PORT=3003

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

# Внешние сервисы
ANALYTICS_SERVICE_URL=http://analytics-service:3005
BILLING_SERVICE_URL=http://billing-service:3004

# OpenAI
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1

# Anthropic
ANTHROPIC_API_KEY=your_anthropic_api_key
ANTHROPIC_BASE_URL=https://api.anthropic.com

# OpenRouter
OPENROUTER_API_KEY=your_openrouter_api_key
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1

# Google
GOOGLE_API_KEY=your_google_api_key
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com/v1

# Retry настройки
MAX_RETRIES=3
RETRY_DELAY_MS=1000
RETRY_BACKOFF_MULTIPLIER=2

# Rate limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Кэширование
CACHE_TTL_SECONDS=3600
CACHE_MAX_SIZE=1000
```

### Docker конфигурация

```yaml
proxy-service:
  build:
    context: .
    dockerfile: ./services/proxy-service/Dockerfile
  ports:
    - "3003:3003"
  environment:
    - NODE_ENV=development
    - HOST=0.0.0.0
    - PORT=3003
    - REDIS_URL=redis://redis:6379
    - RABBITMQ_URL=amqp://user:password@rabbitmq:5672
    - OPENAI_API_KEY=your_openai_api_key
    - ANTHROPIC_API_KEY=your_anthropic_api_key
    - OPENROUTER_API_KEY=your_openrouter_api_key
    - GOOGLE_API_KEY=your_google_api_key
  depends_on:
    - redis
    - rabbitmq
  networks:
    - ai-aggregator
```

## Поддерживаемые провайдеры

### OpenAI
- **GPT-4** (gpt-4, gpt-4-turbo)
- **GPT-3.5** (gpt-3.5-turbo)
- **DALL-E** (dall-e-2, dall-e-3)
- **Embeddings** (text-embedding-ada-002)

### Anthropic
- **Claude 3 Sonnet** (claude-3-sonnet-20240229)
- **Claude 3 Haiku** (claude-3-haiku-20240307)
- **Claude 3 Opus** (claude-3-opus-20240229)

### OpenRouter
- **Доступ к множеству моделей** через единый API
- **Автоматическое переключение** между провайдерами
- **Унифицированное ценообразование**

### Google
- **Gemini Pro** (gemini-pro)
- **Gemini Pro Vision** (gemini-pro-vision)

## API Endpoints

### Чат

#### POST /api/v1/chat/completions
Создание чата с ИИ.

**Тело запроса:**
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Привет! Как дела?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 1000,
  "stream": false
}
```

**Ответ:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Привет! У меня все отлично, спасибо за вопрос!"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 15,
    "total_tokens": 25
  },
  "cost": 0.00125,
  "provider": "openai",
  "response_time_ms": 1200
}
```

#### POST /api/v1/chat/completions (Streaming)
Стриминг чата.

**Тело запроса:**
```json
{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Расскажи длинную историю"
    }
  ],
  "stream": true
}
```

**Ответ (Server-Sent Events):**
```
data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4","choices":[{"index":0,"delta":{"role":"assistant","content":"Однажды"},"finish_reason":null}]}

data: {"id":"chatcmpl-123","object":"chat.completion.chunk","created":1677652288,"model":"gpt-4","choices":[{"index":0,"delta":{"content":" в далекой"},"finish_reason":null}]}

data: [DONE]
```

### Изображения

#### POST /api/v1/images/generations
Генерация изображений.

**Тело запроса:**
```json
{
  "model": "dall-e-3",
  "prompt": "A beautiful sunset over the ocean",
  "n": 1,
  "size": "1024x1024",
  "quality": "standard"
}
```

**Ответ:**
```json
{
  "created": 1677652288,
  "data": [
    {
      "url": "https://oaidalleapiprodscus.blob.core.windows.net/private/...",
      "revised_prompt": "A beautiful sunset over the ocean with vibrant colors"
    }
  ],
  "cost": 0.04,
  "provider": "openai"
}
```

### Эмбеддинги

#### POST /api/v1/embeddings
Создание эмбеддингов.

**Тело запроса:**
```json
{
  "model": "text-embedding-ada-002",
  "input": "The quick brown fox jumps over the lazy dog"
}
```

**Ответ:**
```json
{
  "object": "list",
  "data": [
    {
      "object": "embedding",
      "index": 0,
      "embedding": [0.0023064255, -0.009327292, ...]
    }
  ],
  "model": "text-embedding-ada-002",
  "usage": {
    "prompt_tokens": 9,
    "total_tokens": 9
  },
  "cost": 0.000009,
  "provider": "openai"
}
```

## Бизнес-логика

### Проксирование запросов

```typescript
@Injectable()
export class ProxyService {
  async proxyRequest(
    provider: string,
    model: string,
    request: ChatCompletionRequest
  ): Promise<ChatCompletionResponse> {
    const startTime = Date.now();
    
    try {
      // 1. Проверка кэша
      const cacheKey = this.generateCacheKey(provider, model, request);
      const cachedResponse = await this.getCachedResponse(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }
      
      // 2. Выбор провайдера
      const providerClient = this.getProviderClient(provider);
      
      // 3. Трансформация запроса
      const transformedRequest = this.transformRequest(provider, request);
      
      // 4. Отправка запроса с retry логикой
      const response = await this.sendRequestWithRetry(
        providerClient,
        transformedRequest
      );
      
      // 5. Трансформация ответа
      const transformedResponse = this.transformResponse(provider, response);
      
      // 6. Кэширование ответа
      await this.cacheResponse(cacheKey, transformedResponse);
      
      // 7. Отправка метрик
      await this.sendMetrics({
        provider,
        model,
        request,
        response: transformedResponse,
        responseTime: Date.now() - startTime
      });
      
      return transformedResponse;
    } catch (error) {
      // 8. Обработка ошибок
      await this.handleError(provider, model, request, error);
      throw error;
    }
  }
  
  private async sendRequestWithRetry(
    client: any,
    request: any,
    retries: number = 0
  ): Promise<any> {
    try {
      return await client.createChatCompletion(request);
    } catch (error) {
      if (retries < this.configService.get('MAX_RETRIES', 3)) {
        const delay = this.calculateRetryDelay(retries);
        await this.sleep(delay);
        return this.sendRequestWithRetry(client, request, retries + 1);
      }
      throw error;
    }
  }
  
  private calculateRetryDelay(retries: number): number {
    const baseDelay = this.configService.get('RETRY_DELAY_MS', 1000);
    const multiplier = this.configService.get('RETRY_BACKOFF_MULTIPLIER', 2);
    return baseDelay * Math.pow(multiplier, retries);
  }
}
```

### Трансформация запросов

```typescript
@Injectable()
export class RequestTransformerService {
  transformRequest(provider: string, request: ChatCompletionRequest): any {
    switch (provider) {
      case 'openai':
        return this.transformToOpenAI(request);
      case 'anthropic':
        return this.transformToAnthropic(request);
      case 'openrouter':
        return this.transformToOpenRouter(request);
      case 'google':
        return this.transformToGoogle(request);
      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
  }
  
  private transformToOpenAI(request: ChatCompletionRequest): any {
    return {
      model: request.model,
      messages: request.messages,
      temperature: request.temperature,
      max_tokens: request.max_tokens,
      stream: request.stream,
      top_p: request.top_p,
      n: request.n,
      stop: request.stop,
      presence_penalty: request.presence_penalty,
      frequency_penalty: request.frequency_penalty
    };
  }
  
  private transformToAnthropic(request: ChatCompletionRequest): any {
    return {
      model: request.model,
      max_tokens: request.max_tokens,
      messages: request.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      temperature: request.temperature,
      top_p: request.top_p,
      stop_sequences: request.stop
    };
  }
  
  private transformToGoogle(request: ChatCompletionRequest): any {
    return {
      contents: request.messages.map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      })),
      generationConfig: {
        temperature: request.temperature,
        maxOutputTokens: request.max_tokens,
        topP: request.top_p
      }
    };
  }
}
```

### Трансформация ответов

```typescript
@Injectable()
export class ResponseTransformerService {
  transformResponse(provider: string, response: any): ChatCompletionResponse {
    switch (provider) {
      case 'openai':
        return this.transformFromOpenAI(response);
      case 'anthropic':
        return this.transformFromAnthropic(response);
      case 'openrouter':
        return this.transformFromOpenRouter(response);
      case 'google':
        return this.transformFromGoogle(response);
      default:
        throw new BadRequestException(`Unsupported provider: ${provider}`);
    }
  }
  
  private transformFromOpenAI(response: any): ChatCompletionResponse {
    return {
      id: response.id,
      object: response.object,
      created: response.created,
      model: response.model,
      choices: response.choices,
      usage: response.usage,
      cost: this.calculateCost(response.usage),
      provider: 'openai'
    };
  }
  
  private transformFromAnthropic(response: any): ChatCompletionResponse {
    return {
      id: `claude-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: response.model,
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.content[0].text
        },
        finish_reason: response.stop_reason
      }],
      usage: {
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens,
        total_tokens: response.usage.input_tokens + response.usage.output_tokens
      },
      cost: this.calculateCost({
        prompt_tokens: response.usage.input_tokens,
        completion_tokens: response.usage.output_tokens
      }),
      provider: 'anthropic'
    };
  }
  
  private transformFromGoogle(response: any): ChatCompletionResponse {
    return {
      id: `gemini-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: 'gemini-pro',
      choices: [{
        index: 0,
        message: {
          role: 'assistant',
          content: response.candidates[0].content.parts[0].text
        },
        finish_reason: response.candidates[0].finishReason
      }],
      usage: {
        prompt_tokens: response.usageMetadata.promptTokenCount,
        completion_tokens: response.usageMetadata.candidatesTokenCount,
        total_tokens: response.usageMetadata.totalTokenCount
      },
      cost: this.calculateCost({
        prompt_tokens: response.usageMetadata.promptTokenCount,
        completion_tokens: response.usageMetadata.candidatesTokenCount
      }),
      provider: 'google'
    };
  }
}
```

### Кэширование

```typescript
@Injectable()
export class CacheService {
  async getCachedResponse(cacheKey: string): Promise<ChatCompletionResponse | null> {
    try {
      const cached = await this.redis.get(cacheKey);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      this.logger.error('Cache get error', error);
      return null;
    }
  }
  
  async cacheResponse(
    cacheKey: string,
    response: ChatCompletionResponse,
    ttl: number = 3600
  ): Promise<void> {
    try {
      await this.redis.setex(
        cacheKey,
        ttl,
        JSON.stringify(response)
      );
    } catch (error) {
      this.logger.error('Cache set error', error);
    }
  }
  
  private generateCacheKey(
    provider: string,
    model: string,
    request: ChatCompletionRequest
  ): string {
    const hash = crypto
      .createHash('md5')
      .update(JSON.stringify({
        provider,
        model,
        messages: request.messages,
        temperature: request.temperature,
        max_tokens: request.max_tokens
      }))
      .digest('hex');
    
    return `proxy:cache:${provider}:${model}:${hash}`;
  }
}
```

### Обработка ошибок

```typescript
@Injectable()
export class ErrorHandlerService {
  async handleError(
    provider: string,
    model: string,
    request: ChatCompletionRequest,
    error: any
  ): Promise<void> {
    const errorInfo = {
      provider,
      model,
      requestId: request.requestId,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };
    
    // 1. Логирование ошибки
    this.logger.error('Proxy request failed', errorInfo);
    
    // 2. Отправка метрик об ошибке
    await this.sendErrorMetrics(errorInfo);
    
    // 3. Уведомление о критических ошибках
    if (this.isCriticalError(error)) {
      await this.sendCriticalErrorAlert(errorInfo);
    }
    
    // 4. Обновление статистики провайдера
    await this.updateProviderStats(provider, 'error');
  }
  
  private isCriticalError(error: any): boolean {
    const criticalErrors = [
      'ECONNREFUSED',
      'ETIMEDOUT',
      'ENOTFOUND',
      'UNAUTHORIZED',
      'FORBIDDEN'
    ];
    
    return criticalErrors.some(criticalError => 
      error.message?.includes(criticalError)
    );
  }
}
```

## Мониторинг

### Health Check

```typescript
@Controller('health')
export class HealthController {
  constructor(
    private readonly redis: RedisService,
    private readonly rabbitMQ: RabbitMQService
  ) {}
  
  @Get()
  async checkHealth() {
    const checks = await Promise.allSettled([
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
        redis: checks[0].status === 'fulfilled' ? 'up' : 'down',
        rabbitmq: checks[1].status === 'fulfilled' ? 'up' : 'down',
        providers: checks[2].status === 'fulfilled' ? 'up' : 'down'
      }
    };
  }
  
  private async checkProviders(): Promise<boolean> {
    try {
      // Проверка доступности провайдеров
      const providers = ['openai', 'anthropic', 'openrouter', 'google'];
      const checks = await Promise.allSettled(
        providers.map(provider => this.pingProvider(provider))
      );
      
      const successCount = checks.filter(check => 
        check.status === 'fulfilled'
      ).length;
      
      return successCount >= providers.length / 2; // Хотя бы половина работает
    } catch (error) {
      return false;
    }
  }
}
```

## Troubleshooting

### Частые проблемы

#### 1. Ошибки подключения к провайдерам

```bash
# Проверка API ключей
echo $OPENAI_API_KEY
echo $ANTHROPIC_API_KEY
echo $OPENROUTER_API_KEY

# Проверка подключения к провайдерам
curl -H "Authorization: Bearer $OPENAI_API_KEY" https://api.openai.com/v1/models
curl -H "x-api-key: $ANTHROPIC_API_KEY" https://api.anthropic.com/v1/messages
```

#### 2. Проблемы с кэшированием

```bash
# Проверка Redis
docker-compose exec redis redis-cli ping

# Проверка кэша
docker-compose exec redis redis-cli KEYS "proxy:cache:*"

# Очистка кэша
docker-compose exec redis redis-cli FLUSHDB
```

#### 3. Проблемы с retry логикой

```bash
# Проверка логов retry
docker-compose logs proxy-service | grep "retry"

# Проверка конфигурации retry
docker-compose exec proxy-service env | grep RETRY
```

### Полезные команды

```bash
# Перезапуск сервиса
docker-compose restart proxy-service

# Просмотр логов
docker-compose logs -f proxy-service

# Проверка метрик
curl http://localhost:3003/metrics

# Тестирование провайдеров
curl -X POST http://localhost:3003/api/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```
