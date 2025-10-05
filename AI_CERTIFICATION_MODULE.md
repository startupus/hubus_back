# Модуль категоризации и сертификации ИИ

## Обзор

Модуль категоризации и сертификации ИИ предоставляет комплексную систему для оценки, классификации и сертификации ИИ-моделей. Он включает в себя автоматическую классификацию, тестирование безопасности, оценку соответствия стандартам и управление сертификатами.

## Архитектура

### Основные компоненты

1. **AI Classification Service** - Автоматическая классификация ИИ-моделей
2. **AI Certification Service** - Система сертификации и тестирования
3. **AI Safety Service** - Оценка безопасности и рисков
4. **API Controllers** - REST API для всех функций

### Сервисы

```
ai-certification-module/
├── classification/          # Классификация ИИ-моделей
│   ├── auto-classifier/    # Автоматическая классификация
│   ├── manual-review/      # Ручная проверка
│   └── ml-classifier/      # ML-модель для классификации
├── certification/          # Система сертификации
│   ├── test-engine/        # Движок тестирования
│   ├── compliance/         # Проверка соответствия
│   └── audit/             # Аудит и мониторинг
├── safety/                # Оценка безопасности
│   ├── bias-detection/    # Обнаружение предвзятости
│   ├── content-filter/    # Фильтрация контента
│   └── risk-assessment/   # Оценка рисков
└── management/            # Управление сертификатами
    ├── lifecycle/         # Жизненный цикл
    ├── renewal/          # Продление
    └── revocation/       # Отзыв
```

## API Endpoints

### Классификация ИИ

#### `POST /ai/classification/classify`
Классифицирует ИИ-модель по категориям и возможностям.

**Запрос:**
```json
{
  "modelId": "gpt-4",
  "provider": "openai",
  "modelName": "GPT-4",
  "description": "Most capable GPT-4 model",
  "capabilities": ["text_generation", "conversation"],
  "testData": {...}
}
```

**Ответ:**
```json
{
  "success": true,
  "classification": {
    "id": "class_1234567890",
    "modelId": "gpt-4",
    "categories": ["text_generation", "conversation"],
    "primaryCategory": "text_generation",
    "confidence": 0.95,
    "capabilities": [...],
    "limitations": [...],
    "recommendations": [...]
  }
}
```

#### `GET /ai/classification/categories`
Получает список доступных категорий ИИ.

#### `GET /ai/classification/categories/{category}`
Получает информацию о конкретной категории.

### Сертификация ИИ

#### `POST /ai/certification/submit`
Подает заявку на сертификацию ИИ-модели.

**Запрос:**
```json
{
  "modelId": "gpt-4",
  "provider": "openai",
  "modelName": "GPT-4",
  "requestedLevel": "enterprise",
  "testData": {...}
}
```

**Ответ:**
```json
{
  "success": true,
  "certification": {
    "id": "cert_1234567890",
    "modelId": "gpt-4",
    "certificationLevel": "enterprise",
    "status": "approved",
    "issuedAt": "2024-01-01T00:00:00Z",
    "expiresAt": "2025-01-01T00:00:00Z",
    "capabilities": [...],
    "safetyLevel": "safe",
    "compliance": {...}
  }
}
```

#### `GET /ai/certification/levels`
Получает список уровней сертификации.

#### `GET /ai/certification/models/{modelId}`
Получает сертификацию конкретной модели.

#### `POST /ai/certification/revoke/{modelId}`
Отзывает сертификат модели.

### Безопасность ИИ

#### `POST /ai/safety/assess`
Проводит оценку безопасности ИИ-модели.

**Запрос:**
```json
{
  "modelId": "gpt-4",
  "testType": "comprehensive",
  "focusAreas": ["bias", "privacy", "security"]
}
```

**Ответ:**
```json
{
  "success": true,
  "assessment": {
    "id": "safety_1234567890",
    "modelId": "gpt-4",
    "safetyLevel": "safe",
    "riskFactors": [...],
    "mitigationStrategies": [...],
    "monitoringRequirements": [...]
  }
}
```

#### `GET /ai/safety/levels`
Получает список уровней безопасности.

#### `GET /ai/safety/risk-categories`
Получает список категорий рисков.

#### `POST /ai/safety/incidents`
Сообщает об инциденте безопасности.

## Уровни сертификации

### 1. Basic (Базовый)
- **Требования:** 70% прохождение тестов, минимальная оценка 70
- **Тесты:** Производительность, базовая безопасность
- **Стандарты:** Нет

### 2. Standard (Стандартный)
- **Требования:** 80% прохождение тестов, минимальная оценка 80
- **Тесты:** Производительность, безопасность, предвзятость, GDPR
- **Стандарты:** GDPR

### 3. Premium (Премиум)
- **Требования:** 85% прохождение тестов, минимальная оценка 85
- **Тесты:** Все стандартные + безопасность
- **Стандарты:** GDPR, CCPA

### 4. Enterprise (Корпоративный)
- **Требования:** 90% прохождение тестов, минимальная оценка 90
- **Тесты:** Все премиум + HIPAA
- **Стандарты:** GDPR, CCPA, HIPAA, SOX

### 5. Government (Государственный)
- **Требования:** 95% прохождение тестов, минимальная оценка 95
- **Тесты:** Все корпоративные + ISO 27001
- **Стандарты:** GDPR, CCPA, HIPAA, SOX, ISO 27001, SOC 2

## Уровни безопасности

### 1. Safe (Безопасный)
- Модель безопасна для общего использования
- Минимальные ограничения
- Регулярный мониторинг

### 2. Caution (Осторожность)
- Требует осторожности и мониторинга
- Рекомендуется фильтрация контента
- Человеческий надзор рекомендуется

### 3. Warning (Предупреждение)
- Значительные проблемы безопасности
- Обязательный человеческий надзор
- Ограниченные случаи использования

### 4. Dangerous (Опасный)
- Значительные риски
- Строгий контроль
- Экспертный надзор обязателен

### 5. Restricted (Ограниченный)
- Критические проблемы безопасности
- Только для исследований
- Нет публичного развертывания

## Категории ИИ

### Основные категории
- **text_generation** - Генерация текста
- **code_generation** - Генерация кода
- **image_generation** - Генерация изображений
- **conversation** - Разговоры
- **translation** - Переводы
- **summarization** - Резюмирование
- **question_answering** - Ответы на вопросы
- **sentiment_analysis** - Анализ настроений
- **classification** - Классификация
- **embedding** - Векторные представления

### Специализированные категории
- **medical** - Медицинские приложения
- **legal** - Правовые приложения
- **financial** - Финансовые приложения
- **education** - Образовательные приложения
- **research** - Исследовательские задачи

## Процессы

### 1. Процесс классификации
```
Регистрация модели → Автоматическая классификация → Экспертная проверка → Утверждение категории → Обновление каталога
```

### 2. Процесс сертификации
```
Подача заявки → Автоматическое тестирование → Проверка соответствия → Экспертная оценка → Выдача сертификата → Мониторинг
```

### 3. Процесс оценки безопасности
```
Анализ рисков → Тестирование на предвзятость → Проверка контента → Оценка этичности → Рекомендации по улучшению
```

## Интеграция

### С существующими сервисами
- **Proxy Service** - использует классификацию для маршрутизации
- **Analytics Service** - собирает метрики для сертификации
- **Billing Service** - учитывает уровень сертификации при тарификации
- **Auth Service** - управляет доступом на основе сертификатов

### Конфигурация
```typescript
// services в конфигурации
services: {
  classification: {
    url: process.env.CLASSIFICATION_SERVICE_URL || 'http://classification-service:3006',
    timeout: 10000
  },
  certification: {
    url: process.env.CERTIFICATION_SERVICE_URL || 'http://certification-service:3007',
    timeout: 10000
  },
  safety: {
    url: process.env.SAFETY_SERVICE_URL || 'http://safety-service:3008',
    timeout: 10000
  }
}
```

## Мониторинг и метрики

### KPI качества классификации
- Точность классификации (Accuracy)
- Полнота (Recall)
- Точность (Precision)
- F1-мера

### KPI эффективности сертификации
- Время обработки заявки
- Процент одобренных заявок
- Количество ложных срабатываний

### KPI безопасности
- Количество обнаруженных уязвимостей
- Уровень предвзятости
- Соответствие стандартам

## Безопасность

### Защита данных
- Шифрование конфиденциальной информации
- Анонимизация тестовых данных
- Безопасное хранение сертификатов

### Аудит
- Логирование всех операций
- Отслеживание изменений
- Регулярные аудиты безопасности

## Развертывание

### Docker
```yaml
services:
  classification-service:
    build: ./services/classification-service
    ports:
      - "3006:3006"
    environment:
      - DATABASE_URL=postgresql://user:pass@classification-db:5432/classification
      
  certification-service:
    build: ./services/certification-service
    ports:
      - "3007:3007"
    environment:
      - DATABASE_URL=postgresql://user:pass@certification-db:5432/certification
      
  safety-service:
    build: ./services/safety-service
    ports:
      - "3008:3008"
    environment:
      - DATABASE_URL=postgresql://user:pass@safety-db:5432/safety
```

### Переменные окружения
```bash
# Новые сервисы
CLASSIFICATION_SERVICE_URL=http://classification-service:3006
CERTIFICATION_SERVICE_URL=http://certification-service:3007
SAFETY_SERVICE_URL=http://safety-service:3008

# Порты
CLASSIFICATION_SERVICE_PORT=3006
CERTIFICATION_SERVICE_PORT=3007
SAFETY_SERVICE_PORT=3008
```

## Тестирование

### Примеры тестов
```bash
# Классификация модели
curl -X POST http://localhost:3000/ai/classification/classify \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "gpt-4",
    "provider": "openai",
    "modelName": "GPT-4",
    "description": "Most capable GPT-4 model"
  }'

# Подача на сертификацию
curl -X POST http://localhost:3000/ai/certification/submit \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "gpt-4",
    "provider": "openai",
    "modelName": "GPT-4",
    "requestedLevel": "enterprise"
  }'

# Оценка безопасности
curl -X POST http://localhost:3000/ai/safety/assess \
  -H "Content-Type: application/json" \
  -d '{
    "modelId": "gpt-4",
    "testType": "comprehensive",
    "focusAreas": ["bias", "privacy"]
  }'
```

## Документация API

Полная документация API доступна по адресу: `http://localhost:3000/api/docs`

## Лицензия

MIT License
