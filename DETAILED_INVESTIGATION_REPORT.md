# Детальное расследование проблемы валидации API ключей

## Дата: 2025-10-12

## Краткое резюме
API ключи с пустым именем успешно создаются (статус 201), несмотря на добавление множества уровней валидации и отладочного логирования.

## Проведенные исследования

### 1. Найденные проблемы в коде
- ✅ auth.controller.ts вызывал несуществующий метод `authService.createApiKey` - **ИСПРАВЛЕНО** (удалены все методы API keys)
- ✅ api-keys.module.ts импортировал несуществующий `ApiKeysService` - **ИСПРАВЛЕНО** (удален импорт)
- ⚠️ Множественные конфликтующие маршруты для `/auth/api-keys`:
  - http.controller.ts - `@Post('api-keys')`
  - api-key.controller.ts - `@Post()` на `@Controller('api-keys')`

### 2. Добавленная валидация (не работает!)
1. **DTO валидация** в `CreateApiKeyDto` с декораторами `@IsNotEmpty`, `@MinLength`, etc.
2. **Глобальный ValidationPipe** в API Gateway
3. **Ручная валидация** в ApiKeyService с подробным логированием
4. **Ручная валидация** в http.controller.ts и api-key.controller.ts
5. **Временная ошибка** в начале ApiKeyService.createApiKey для проверки вызова

### 3. Критическое открытие
**МЕТОД `ApiKeyService.createApiKey` НЕ ВЫЗЫВАЕТСЯ!**

Доказательства:
- Добавлен `throw new BadRequestException('API key creation is temporarily disabled for debugging')` в начало метода
- Запрос все равно прошел с статусом 201
- API ключ был создан (лог показывает "API key created")
- Никакие логи валидации не появились

### 4. Проверенные гипотезы
❌ Кэширование - перезапускали сервис многократно
❌ Конфликт маршрутов - удалили дублирующиеся маршруты
❌ ValidationPipe не работает - добавили ручную валидацию
❌ Логи не видны - использовали разные уровни (DEBUG, WARN, ERROR, INFO)
❌ Неправильный сервис - есть только один ApiKeyService в проекте

### 5. Текущее состояние кода

#### ApiKeyService.createApiKey (services/auth-service/src/modules/api-key/api-key.service.ts):
```typescript
async createApiKey(companyId: string, createApiKeyDto: CreateApiKeyDto): Promise<ApiKey> {
  // TEMPORARY: Force error to check if this method is called
  throw new BadRequestException('API key creation is temporarily disabled for debugging');
  
  // ... остальной код валидации
}
```

#### Тест:
```powershell
POST /v1/auth/api-keys
Body: {"name": "", "description": "Test"}
Result: 201 OK - API key created!
```

### 6. Возможные объяснения
1. **Компиляция TypeScript:** Возможно, dist/ содержит старый код
2. **Docker volumes:** Возможно, монтируется старая версия кода
3. **Другой путь выполнения:** Есть еще один неизвестный способ создания API ключей
4. **Prisma middleware:** Возможно, есть middleware, который перехватывает создание
5. **RabbitMQ:** Возможно, создание происходит через сообщения, а не HTTP

## Рекомендации для продолжения
1. Проверить содержимое dist/ в Docker контейнере
2. Полностью пересобрать все сервисы с нуля
3. Проверить Prisma middleware
4. Проверить RabbitMQ consumers
5. Добавить логирование на уровне Prisma
6. Добавить database constraint на поле `name` как последнее средство защиты

## Следующие шаги
Требуется решение пользователя:
- Продолжить расследование?
- Пересобрать все сервисы?
- Добавить database constraint как временное решение?
- Переключиться на другие задачи (fix_data_types, audit_duplicate_code)?

