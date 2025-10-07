# Биллинг в стиле OpenRouter - Отчет о реализации

## Обзор

Реализован биллинг в стиле OpenRouter с дополнительной функциональностью классификации провайдеров на отечественные и зарубежные для российского рынка.

## Ключевые особенности

### 1. Ценообразование как в OpenRouter
- **Стоимость за токен** - основная единица расчета
- **Поддержка различных типов** - PER_TOKEN, PER_REQUEST, FIXED
- **Гибкие правила** - для конкретных провайдеров и моделей
- **Приоритизация** - правила с разными приоритетами

### 2. Классификация провайдеров
- **Отечественные (DOMESTIC)** - Yandex, Sber, RuGPT, Kandinsky
- **Зарубежные (FOREIGN)** - OpenAI, Anthropic, Google, Meta, OpenRouter
- **Автоматическое определение** - по названию провайдера
- **Расширяемая база** - легко добавлять новых провайдеров

### 3. Российские особенности
- **Разные налоги** - 20% НДС для отечественных, 0% для зарубежных
- **Скидки для отечественных** - поощрение использования российских ИИ
- **Поддержка валют** - USD для зарубежных, RUB для отечественных

## Архитектура

### 1. ProviderClassificationService
```typescript
// Классификация провайдеров
classifyProvider(provider: string): ProviderType
getProviderInfo(provider: string): ProviderInfo
isDomestic(provider: string): boolean
isForeign(provider: string): boolean
```

### 2. PricingService (OpenRouter Style)
```typescript
// Расчет стоимости
calculateUsageCost(
  service: string,
  resource: string,
  quantity: number,
  userId?: string,
  metadata?: {
    provider?: string;
    model?: string;
    tokens?: {
      prompt?: number;
      completion?: number;
      total?: number;
    };
  }
): Promise<{
  success: boolean;
  cost?: number;
  currency?: string;
  breakdown?: CostBreakdown;
  providerType?: ProviderType;
  error?: string;
}>
```

### 3. База данных
```prisma
model PricingRule {
  id                String            @id @default(uuid())
  name              String
  service           String
  resource          String?
  provider          String?           // openai, openrouter, yandex, etc.
  model             String?           // gpt-3.5-turbo, gpt-4, etc.
  providerType      ProviderType      @default(FOREIGN)
  type              PricingRuleType   @default(PER_TOKEN)
  price             Decimal           @db.Decimal(10, 6)
  currency          String            @default("USD")
  // ... другие поля
}

enum ProviderType {
  DOMESTIC    // Отечественные (Yandex, Sber, etc.)
  FOREIGN     // Зарубежные (OpenAI, Anthropic, etc.)
}
```

## Примеры использования

### 1. Расчет стоимости для OpenAI
```typescript
const result = await pricingService.calculateUsageCost(
  'ai',
  'chat_completion',
  1000, // токены
  'user123',
  {
    provider: 'openai',
    model: 'gpt-3.5-turbo',
    tokens: { total: 1000 }
  }
);

// Результат:
// {
//   success: true,
//   cost: 0.5, // $0.5
//   currency: 'USD',
//   providerType: 'FOREIGN',
//   breakdown: {
//     baseCost: 0.5,
//     usageCost: 0.5,
//     tax: 0, // Нет НДС для зарубежных
//     discounts: 0,
//     total: 0.5,
//     currency: 'USD'
//   }
// }
```

### 2. Расчет стоимости для Yandex
```typescript
const result = await pricingService.calculateUsageCost(
  'ai',
  'chat_completion',
  1000, // токены
  'user123',
  {
    provider: 'yandex',
    model: 'yandex-gpt',
    tokens: { total: 1000 }
  }
);

// Результат:
// {
//   success: true,
//   cost: 0.12, // 0.1 RUB + 20% НДС
//   currency: 'RUB',
//   providerType: 'DOMESTIC',
//   breakdown: {
//     baseCost: 0.1,
//     usageCost: 0.1,
//     tax: 0.02, // 20% НДС для отечественных
//     discounts: 0,
//     total: 0.12,
//     currency: 'RUB'
//   }
// }
```

## Поддерживаемые провайдеры

### Отечественные (DOMESTIC)
- **Yandex** - yandex-gpt, yandex-gpt-plus
- **Sber** - gigachat, kandinsky
- **RuGPT** - rugpt-3, rugpt-4
- **Kandinsky** - kandinsky-ai

### Зарубежные (FOREIGN)
- **OpenAI** - gpt-3.5-turbo, gpt-4, gpt-4o
- **Anthropic** - claude-3-haiku, claude-3-sonnet, claude-3-opus
- **Google** - gemini-pro, gemini-pro-vision
- **Meta** - llama-3-8b, llama-3-70b
- **Mistral** - mistral-7b, mixtral-8x7b
- **OpenRouter** - различные модели через агрегатор

## Цены (примеры)

### OpenAI
- GPT-3.5-turbo: $0.0005 за токен
- GPT-4: $0.03 за токен
- GPT-4o: $0.005 за токен

### Anthropic
- Claude-3-haiku: $0.00025 за токен
- Claude-3-sonnet: $0.003 за токен
- Claude-3-opus: $0.015 за токен

### Отечественные
- Yandex GPT: 0.0001 RUB за токен
- GigaChat: 0.0002 RUB за токен
- RuGPT-3: 0.00005 RUB за токен

## Налогообложение

### Отечественные провайдеры
- **НДС: 20%** - применяется к стоимости услуг
- **Валюта: RUB** - расчеты в российских рублях
- **Скидки: 10%** - поощрение использования отечественных ИИ

### Зарубежные провайдеры
- **НДС: 0%** - пока не применяется
- **Валюта: USD** - расчеты в долларах США
- **Скидки: 0%** - стандартные цены

## API эндпоинты

### Расчет стоимости
```
POST /billing/calculate-cost
{
  "service": "ai",
  "resource": "chat_completion",
  "quantity": 1000,
  "metadata": {
    "provider": "openai",
    "model": "gpt-3.5-turbo",
    "tokens": { "total": 1000 }
  }
}
```

### Создание правила ценообразования
```
POST /billing/pricing-rules
{
  "name": "OpenAI GPT-3.5-turbo",
  "service": "ai",
  "resource": "chat_completion",
  "provider": "openai",
  "model": "gpt-3.5-turbo",
  "providerType": "FOREIGN",
  "type": "PER_TOKEN",
  "price": 0.0005,
  "currency": "USD"
}
```

### Получение всех правил
```
GET /billing/pricing-rules
```

## Инициализация

### 1. Запуск скрипта инициализации
```bash
./init-openrouter-pricing.ps1
```

### 2. Создание правил ценообразования
Скрипт автоматически создает:
- Правила для OpenAI (GPT-3.5, GPT-4, GPT-4o)
- Правила для Anthropic (Claude-3)
- Правила для отечественных провайдеров
- Правила для OpenRouter моделей
- Скидки для отечественных провайдеров

### 3. Тестирование
Скрипт тестирует расчет стоимости для различных провайдеров и моделей.

## Мониторинг и логирование

### 1. Логи расчета стоимости
- Детальная информация о каждом расчете
- Классификация провайдеров
- Применение скидок и налогов
- Время выполнения операций

### 2. Метрики
- Количество расчетов по провайдерам
- Средняя стоимость запросов
- Использование отечественных vs зарубежных провайдеров
- Эффективность скидок

### 3. Алерты
- Неизвестные провайдеры
- Ошибки в расчете стоимости
- Превышение лимитов

## Преимущества

### 1. Совместимость с OpenRouter
- **Одинаковая логика** - ценообразование за токены
- **Поддержка метаданных** - provider, model, tokens
- **Гибкие правила** - для конкретных моделей

### 2. Российские особенности
- **Классификация провайдеров** - автоматическое определение
- **Разные налоги** - НДС для отечественных
- **Поощрение отечественных** - скидки и льготы

### 3. Масштабируемость
- **Легкое добавление** - новых провайдеров и моделей
- **Гибкие правила** - различные типы ценообразования
- **Кэширование** - для быстрого доступа к правилам

## Заключение

Реализован полнофункциональный биллинг в стиле OpenRouter с поддержкой:

- ✅ **Ценообразование за токены** - как в OpenRouter
- ✅ **Классификация провайдеров** - отечественные/зарубежные
- ✅ **Российские особенности** - НДС, скидки, валюты
- ✅ **Гибкие правила** - для конкретных моделей
- ✅ **Мониторинг и логирование** - полная наблюдаемость
- ✅ **API совместимость** - с существующими системами

Система готова к использованию и легко расширяется для новых провайдеров и моделей!
