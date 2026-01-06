# ✅ Финальная проверка и пересборка API Gateway

## Проблема
Endpoint `/v1/auth/loginus` возвращает 404, потому что контейнер не пересобран с новым кодом.

## Решение

### Шаг 1: Пересборка контейнера

Выполните в PowerShell (или используйте bat-файл `rebuild-and-test.bat`):

```powershell
# Остановить контейнер
docker-compose stop api-gateway

# Пересобрать образ (с очисткой кэша)
docker-compose build --no-cache api-gateway

# Запустить контейнер
docker-compose up -d api-gateway

# Подождать 15 секунд
Start-Sleep -Seconds 15
```

### Шаг 2: Проверка логов

```powershell
docker logs --tail=50 project-api-gateway-1
```

Ищите строки:
- `"API Gateway is running on http://0.0.0.0:3000"`
- `"Loginus OAuth credentials not configured"` (если переменные не установлены)
- Или ошибки компиляции

### Шаг 3: Проверка endpoint

```powershell
# Должен вернуть 302 (редирект) или 503 (если не настроен OAuth)
curl -I http://localhost:3000/v1/auth/loginus
```

### Шаг 4: Проверка через браузер

1. Откройте `http://localhost:80`
2. Нажмите "Вход/Регистрация"
3. Должен произойти редирект на Loginus

## Ожидаемое поведение после пересборки

### Если OAuth настроен (LOGINUS_CLIENT_ID и LOGINUS_CLIENT_SECRET установлены):
- Редирект на: `https://vselena.ldmco.ru/oauth/authorize?client_id=...&redirect_uri=...&state=...`

### Если OAuth НЕ настроен:
- Ошибка 503: "OAuth not configured. Please contact administrator..."

## Проверка переменных окружения

```powershell
docker exec project-api-gateway-1 env | findstr LOGINUS
```

Должны быть установлены:
- `LOGINUS_CLIENT_ID`
- `LOGINUS_CLIENT_SECRET`
- `LOGINUS_OAUTH_URL`
- `LOGINUS_REDIRECT_URI`
- `LOGINUS_SCOPE`

## Если после пересборки все еще 404

1. Проверьте, что файл `services/api-gateway/src/auth/oauth.controller.ts` существует
2. Проверьте, что `OAuthController` добавлен в `auth.module.ts`:
   ```typescript
   controllers: [AuthController, OAuthController]
   ```
3. Проверьте логи на ошибки компиляции
4. Убедитесь, что контейнер запущен: `docker ps | findstr api-gateway`

