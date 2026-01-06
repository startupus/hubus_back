# ✅ Финальная пересборка и проверка

## Обновления в коде

✅ **Обновлены credentials:**
- `LOGINUS_CLIENT_ID`: `ai-aggregator-1dfc0546e55a761187a9e64d034c982c`
- `LOGINUS_CLIENT_SECRET`: `cd024fc585ac2008b767e3c46f41123bd618fd0ab1af7a10158549b405ae9d37`
- `LOGINUS_OAUTH_URL`: `https://vselena.ldmco.ru/api`

✅ **Обновлены файлы:**
- `docker-compose.yml` - добавлены значения по умолчанию
- `services/api-gateway/src/config/configuration.ts` - обновлены дефолтные значения
- `services/api-gateway/src/auth/oauth.controller.ts` - обновлены дефолтные значения

## Пересборка контейнера

### Вариант 1: Через cmd-файл (рекомендуется)

```cmd
rebuild-api-gateway.cmd
```

### Вариант 2: Вручную

```cmd
docker stop project-api-gateway-1
docker-compose build api-gateway
docker-compose up -d api-gateway
timeout /t 15
docker logs --tail=30 project-api-gateway-1
```

## Проверка после пересборки

### 1. Проверка endpoint

Откройте в браузере:
```
http://localhost:3000/v1/auth/loginus
```

**Ожидаемый результат:**
- Редирект 302 на `https://vselena.ldmco.ru/api/oauth/authorize?client_id=ai-aggregator-1dfc0546e55a761187a9e64d034c982c&...`

### 2. Проверка через главную страницу

1. Откройте: `http://localhost:80`
2. Нажмите "Вход/Регистрация"
3. Должен произойти редирект на Loginus

### 3. Проверка логов

```cmd
docker logs project-api-gateway-1 | findstr "loginus\|OAuth\|Initiating"
```

Должны увидеть:
```
[OAuthController] Initiating OAuth flow, redirecting to: https://vselena.ldmco.ru/api/oauth/authorize?...
```

## Что должно работать

✅ Редирект на Loginus при нажатии "Вход/Регистрация"
✅ Регистрация через Email/GitHub/Telegram в Loginus
✅ Авторизация через Email/GitHub/Telegram в Loginus
✅ Callback с токеном от Loginus
✅ Синхронизация пользователя в AI Aggregator
✅ Получение JWT токена для AI Aggregator

## Структура URL

**Base URL Loginus:** `https://vselena.ldmco.ru/api`

**Endpoints:**
- Authorization: `https://vselena.ldmco.ru/api/oauth/authorize`
- Token: `https://vselena.ldmco.ru/api/oauth/token`
- UserInfo: `https://vselena.ldmco.ru/api/oauth/userinfo`

## Если что-то не работает

1. **Проверьте логи:** `docker logs project-api-gateway-1`
2. **Проверьте переменные:** `docker exec project-api-gateway-1 env | findstr LOGINUS`
3. **Проверьте, что контейнер запущен:** `docker ps | findstr api-gateway`
4. **Убедитесь, что redirect_uri зарегистрирован в Loginus:** `http://localhost:80/auth/callback`

