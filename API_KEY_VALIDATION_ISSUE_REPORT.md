# Отчет о проблеме валидации API ключей

## Дата: 2025-10-12

## Проблема
API ключи с пустым именем успешно создаются, несмотря на добавление валидации.

## Проведенные исследования

### 1. Найденные конфликты маршрутизации
- **auth.controller.ts** - имел дублирующий маршрут `@Post('api-keys')`, который вызывал несуществующий метод `authService.createApiKey` ✅ **ИСПРАВЛЕНО**
- **http.controller.ts** - имеет маршрут `@Post('api-keys')` с валидацией
- **api-key.controller.ts** - имеет маршрут `@Post()` на `@Controller('api-keys')`

### 2. Добавленная валидация

#### В `services/shared/src/dto/auth.dto.ts`:
```typescript
export class CreateApiKeyDto {
  @IsNotEmpty({ message: 'Name is required' })
  @IsString({ message: 'Name must be a string' })
  @MinLength(1, { message: 'Name cannot be empty' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name!: string;
  // ...
}
```

#### В `services/auth-service/src/modules/api-key/api-key.service.ts`:
```typescript
async createApiKey(companyId: string, createApiKeyDto: CreateApiKeyDto): Promise<ApiKey> {
  try {
    LoggerUtil.warn('auth-service', 'ApiKeyService.createApiKey called', { ... });
    
    // Validate name
    if (!createApiKeyDto.name || typeof createApiKeyDto.name !== 'string' || createApiKeyDto.name.trim().length === 0) {
      LoggerUtil.error('auth-service', 'Validation failed: empty name', new Error('Empty name'), { name: createApiKeyDto.name });
      throw new BadRequestException('Name is required and cannot be empty');
    }
    // ...
  }
}
```

### 3. Проблема
Несмотря на добавление валидации:
- API ключи с пустым именем все еще создаются (статус 201)
- Логи валидации (`LoggerUtil.warn`) не появляются в логах Auth Service
- Логи показывают только "API key created", но не показывают вызов метода `createApiKey`

### 4. Возможные причины
1. **Кэширование** - возможно, используется старая версия кода
2. **Другой путь выполнения** - возможно, есть еще один путь создания API ключей, который мы не нашли
3. **Проблема с логированием** - возможно, логи WARN не выводятся в Docker
4. **ValidationPipe не применяется** - возможно, глобальная валидация не работает

## Действия

### Выполнено:
✅ Добавлены декораторы валидации в `CreateApiKeyDto`
✅ Включен глобальный `ValidationPipe` в API Gateway
✅ Добавлена ручная валидация в `ApiKeyService`
✅ Удален дублирующий маршрут из `auth.controller.ts`
✅ Добавлено подробное логирование

### Требуется:
❌ Определить, почему валидация не срабатывает
❌ Найти реальный путь выполнения запроса
❌ Исправить валидацию

## Рекомендации
1. Проверить, есть ли другие места создания API ключей через Prisma
2. Добавить логирование на уровне Prisma для отслеживания всех вызовов `apiKey.create`
3. Проверить, правильно ли работает ValidationPipe
4. Возможно, стоит добавить database constraint на уровне БД для поля `name`

