# Исправления ошибок компиляции

## Исправленные ошибки

### 1. `loginus` не существует в типе `MicroserviceConfig`
**Решение:** Добавлен интерфейс `LoginusConfig` и поле `loginus?: LoginusConfig` в `MicroserviceConfig`

**Файлы:**
- `services/shared/src/interfaces/config.interface.ts` - добавлен интерфейс и поле
- `services/shared/src/index.ts` - экспортирован `LoginusConfig`

### 2. `cookieParser()` не может быть вызван
**Решение:** Изменен импорт с namespace на default import

**Файл:**
- `services/api-gateway/src/main.ts` - изменено `import * as cookieParser` на `import cookieParser`

## Следующий шаг

Пересоберите контейнеры:

```bash
docker-compose build --no-cache frontend api-gateway
docker-compose up -d frontend api-gateway
```

После пересборки проверьте редирект на Loginus.

