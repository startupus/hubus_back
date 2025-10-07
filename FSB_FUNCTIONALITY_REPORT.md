# ФСБ Функциональность - Отчет о реализации

## Обзор

Реализована специальная функциональность для ФСБ с полным доступом к истории запросов пользователей и управлением настройками обезличивания данных.

## Реализованные компоненты

### 1. Конфигурация обезличивания

**Файл:** `services/api-gateway/src/config/configuration.ts`

```typescript
anonymization: {
  enabled: process.env.ANONYMIZATION_ENABLED === 'true',
  enabledForProvider: process.env.ANONYMIZATION_PROVIDER || '',
  enabledForModel: process.env.ANONYMIZATION_MODEL || '',
  preserveMetadata: process.env.ANONYMIZATION_PRESERVE_METADATA === 'true',
}
```

**Переменные окружения:**
- `ANONYMIZATION_ENABLED` - включить/выключить обезличивание
- `ANONYMIZATION_PROVIDER` - обезличивать только для конкретного провайдера
- `ANONYMIZATION_MODEL` - обезличивать только для конкретной модели
- `ANONYMIZATION_PRESERVE_METADATA` - сохранять метаданные при обезличивании

### 2. Контроллер ФСБ

**Файл:** `services/api-gateway/src/fsb/fsb.controller.ts`

**Основные эндпоинты:**

#### Поиск по истории запросов
```
GET /fsb/search/requests
```
- Поиск по содержимому запросов и ответов
- Фильтрация по пользователю, провайдеру, модели, датам
- Пагинация результатов

#### Поиск по пользователям
```
GET /fsb/search/users
```
- Поиск пользователей по паттернам активности
- Статистика по пользователям
- Группировка по активности

#### Управление настройками обезличивания
```
GET /fsb/anonymization/settings
POST /fsb/anonymization/settings
```
- Получение текущих настроек
- Обновление настроек в реальном времени

#### Восстановление обезличенных данных
```
POST /fsb/anonymization/deanonymize
```
- Восстановление данных по маппингу обезличивания
- Только для пользователей с ролью 'fsb'

### 3. Расширенный HistoryService

**Файл:** `services/api-gateway/src/history/history.service.ts`

**Новые методы:**

#### searchRequests()
- Поиск по содержимому JSON полей
- Фильтрация по множественным критериям
- Пагинация результатов

#### searchUsers()
- Группировка запросов по пользователям
- Статистика активности пользователей
- Анализ паттернов использования

#### getSystemStatistics()
- Общая статистика системы
- Распределение по провайдерам и моделям
- Анализ активности

### 4. Интеграция обезличивания

**Файл:** `services/api-gateway/src/chat/chat.controller.ts`

**Логика обезличивания:**
- Проверка конфигурации перед сохранением
- Условное обезличивание по провайдеру/модели
- Сохранение оригинальных данных для ФСБ

```typescript
private shouldAnonymizeRequest(provider: string, model: string, config: any): boolean {
  if (!config.enabled) return false;
  if (config.enabledForProvider && config.enabledForProvider !== provider) return false;
  if (config.enabledForModel && config.enabledForModel !== model) return false;
  return true;
}
```

## Безопасность

### 1. Контроль доступа
- Только пользователи с ролью 'fsb' имеют доступ
- Проверка роли в каждом эндпоинте
- Логирование всех действий ФСБ

### 2. Обезличивание данных
- Использование существующего AnonymizationService
- Настраиваемое обезличивание по провайдерам/моделям
- Возможность восстановления данных для ФСБ

### 3. Аудит
- Все действия ФСБ логируются
- Отслеживание доступа к данным
- Сохранение метаданных запросов

## Использование

### 1. Создание пользователя ФСБ

```bash
# Запуск скрипта создания пользователя ФСБ
./create-fsb-user.ps1
```

**Создается пользователь:**
- Email: `fsb@internal.gov`
- Роль: `fsb`
- Полный доступ к истории

### 2. Настройка обезличивания

```bash
# Включить обезличивание для всех запросов
export ANONYMIZATION_ENABLED=true

# Обезличивать только запросы к OpenAI
export ANONYMIZATION_ENABLED=true
export ANONYMIZATION_PROVIDER=openai

# Обезличивать только GPT-3.5-turbo
export ANONYMIZATION_ENABLED=true
export ANONYMIZATION_MODEL=gpt-3.5-turbo
```

### 3. Тестирование функциональности

```bash
# Запуск тестов ФСБ
./test-fsb-functionality.ps1
```

## API Примеры

### Поиск запросов по содержимому

```bash
curl -H "Authorization: Bearer <fsb-token>" \
  "http://localhost:3000/fsb/search/requests?query=password&limit=10"
```

### Поиск пользователей

```bash
curl -H "Authorization: Bearer <fsb-token>" \
  "http://localhost:3000/fsb/search/users?fromDate=2024-01-01"
```

### Обновление настроек обезличивания

```bash
curl -X POST -H "Authorization: Bearer <fsb-token>" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true, "enabledForProvider": "openai"}' \
  "http://localhost:3000/fsb/anonymization/settings"
```

### Восстановление обезличенных данных

```bash
curl -X POST -H "Authorization: Bearer <fsb-token>" \
  -H "Content-Type: application/json" \
  -d '{"anonymizedData": [...], "mapping": {...}}' \
  "http://localhost:3000/fsb/anonymization/deanonymize"
```

## Архитектурные особенности

### 1. Использование существующего AnonymizationService
- Переиспользование кода из shared пакета
- Консистентность обезличивания
- Централизованное управление

### 2. Гибкая конфигурация
- Настройка через переменные окружения
- Возможность изменения в реальном времени
- Селективное обезличивание

### 3. Полный аудит
- Логирование всех действий
- Отслеживание доступа к данным
- Сохранение контекста запросов

## Мониторинг и логирование

### 1. Логи ФСБ
- Все действия логируются с уровнем INFO
- Включают ID пользователя и контекст
- Отдельные логи для поиска и управления

### 2. Метрики
- Количество поисковых запросов
- Доступ к обезличенным данным
- Обновления настроек

### 3. Алерты
- Неудачные попытки доступа
- Ошибки обезличивания
- Подозрительная активность

## Заключение

Реализована полнофункциональная система для ФСБ с:
- ✅ Полным доступом к истории запросов
- ✅ Гибким управлением обезличиванием
- ✅ Поиском по содержимому и пользователям
- ✅ Восстановлением обезличенных данных
- ✅ Аудитом и безопасностью
- ✅ Интеграцией с существующей системой

Система готова к использованию и тестированию.
