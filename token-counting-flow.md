# Система подсчета токенов для расчета стоимости запросов

## Обзор процесса

В вашем проекте реализована многоуровневая система подсчета токенов и расчета стоимости запросов к ИИ-провайдерам. Вот как это работает:

## 1. Получение токенов от провайдеров

### В Proxy Service (`services/proxy-service/src/http/http.controller.ts`)

```typescript
// Строки 79-84: Извлечение токенов из ответа провайдера
tokens: (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0),
cost: (response.usage?.prompt_tokens || 0) * 0.00003 + (response.usage?.completion_tokens || 0) * 0.00006,
```

**Источники токенов:**
- `response.usage.prompt_tokens` - токены входного запроса
- `response.usage.completion_tokens` - токены ответа
- `response.usage.total_tokens` - общее количество токенов

## 2. Оценка токенов (до отправки запроса)

### В Proxy Service (`services/proxy-service/src/proxy/proxy.service.ts`)

```typescript
// Строки 551-565: Оценка токенов для валидации
private estimateTokens(request: ChatCompletionRequest): number {
  let totalTokens = 0;
  const messages = request.messages || [];
  messages.forEach(message => {
    // Примерная оценка: 1 токен = 4 символа
    const content = message.content || '';
    totalTokens += Math.ceil(content.length / 4);
  });
  // Добавляем токены для системных сообщений
  totalTokens += 10;
  return totalTokens;
}
```

## 3. Расчет стоимости в Billing Service

### Основной расчет (`services/billing-service/src/billing/pricing.service.ts`)

```typescript
// Строки 117-129: Расчет стоимости по типам правил
for (const rule of pricingRules) {
  if (rule.type === 'per_token') {
    // Стоимость за токен
    const tokenCount = tokens.total || quantity;
    baseCost += Number(rule.price) * tokenCount;
  } else if (rule.type === 'per_unit') {
    // Стоимость за запрос
    baseCost += Number(rule.price) * quantity;
  } else if (rule.type === 'fixed') {
    // Фиксированная стоимость
    baseCost += Number(rule.price);
  }
}
```

### HTTP API для расчета (`services/billing-service/src/billing/billing.controller.ts`)

```typescript
// Строки 167-168: Простой расчет стоимости
const inputCost = (body.input_tokens || 0) * 0.001;
const outputCost = (body.output_tokens || 0) * 0.002;
```

## 4. Тарифы и цены

### Инициализация цен (`services/billing-service/init-pricing-data.sql`)

```sql
-- GPT-4: $0.00003 за токен
INSERT INTO pricing_rules (name, service, resource, type, price, currency) VALUES
('AI Chat - GPT-4', 'ai-chat', 'gpt-4', 'PER_TOKEN', 0.00003, 'USD'),

-- GPT-3.5 Turbo: $0.000002 за токен  
('AI Chat - GPT-3.5 Turbo', 'ai-chat', 'gpt-3.5-turbo', 'PER_TOKEN', 0.000002, 'USD'),

-- Claude 3: $0.000015 за токен
('AI Text - Claude 3', 'ai-chat', 'claude-3-sonnet', 'PER_TOKEN', 0.000015, 'USD');
```

## 5. Типы токенов в системе

### Структура токенов (`services/shared/src/types/billing.ts`)

```typescript
export interface BillingRecord {
  tokens: {
    prompt_tokens: number;    // Входные токены
    completion_tokens: number; // Выходные токены  
    total_tokens: number;     // Общее количество
  };
}
```

### Расчет стоимости (`services/shared/src/types/billing.ts`)

```typescript
export interface CostCalculation {
  provider: string;
  model: string;
  inputTokens: number;   // prompt_tokens
  outputTokens: number;  // completion_tokens
  inputCost: number;     // стоимость входных токенов
  outputCost: number;    // стоимость выходных токенов
  totalCost: number;     // общая стоимость
  currency: string;
}
```

## 6. Процесс биллинга

### Отправка события биллинга

1. **Proxy Service** получает ответ от ИИ-провайдера с информацией о токенах
2. **Извлекает токены** из `response.usage`
3. **Отправляет событие** в Billing Service через RabbitMQ:

```typescript
await this.proxyService.sendBillingEvent({
  userId: data.userId,
  service: 'ai-chat',
  resource: data.model,
  tokens: (response.usage?.prompt_tokens || 0) + (response.usage?.completion_tokens || 0),
  cost: calculatedCost,
  provider: response.provider,
  model: response.model
});
```

4. **Billing Service** обрабатывает событие и списывает средства

## 7. Особенности реализации

### Разные цены для разных типов токенов
- **Входные токены** (prompt): обычно дешевле
- **Выходные токены** (completion): обычно дороже
- **Общая стоимость** = inputCost + outputCost

### Fallback логика
- Если OpenAI недоступен, система переключается на OpenRouter
- Модели адаптируются под провайдера (`gpt-4` → `openai/gpt-4`)

### Валидация и оценка
- Предварительная оценка токенов перед отправкой
- Проверка баланса пользователя
- Ограничения по лимитам

## 8. Пример расчета

Для запроса к GPT-4:
- **Входные токены**: 1000
- **Выходные токены**: 500
- **Цена за входной токен**: $0.00003
- **Цена за выходной токен**: $0.00006 (примерно)

**Расчет:**
- Входная стоимость: 1000 × $0.00003 = $0.03
- Выходная стоимость: 500 × $0.00006 = $0.03
- **Общая стоимость**: $0.06

## Заключение

Система подсчета токенов в вашем проекте работает на нескольких уровнях:
1. **Получение точных данных** от ИИ-провайдеров
2. **Предварительная оценка** для валидации
3. **Гибкая система тарифов** с поддержкой разных типов ценообразования
4. **Асинхронная обработка** биллинга через RabbitMQ
5. **Поддержка множественных провайдеров** с fallback логикой
