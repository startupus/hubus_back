# Исправленные проблемы

## 1. Неправильный URL для Loginus OAuth
**Проблема:** В коде использовался URL `https://vselena.ldmco.ru/api`, но в документации указан `https://vselena.ldmco.ru`

**Исправлено:**
- `services/api-gateway/src/auth/oauth.controller.ts` - убран `/api` из URL
- `docker-compose.yml` - обновлен `LOGINUS_OAUTH_URL`

## 2. Проверка пользователя
**Статус:** Код проверки пользователя выглядит корректно:
- Используется endpoint `/auth/user` с параметром `email`
- Если пользователь не найден (404), создается новый
- Поддерживаются псевдо-email для Telegram/GitHub пользователей

## 3. Redirect URI
**Текущая конфигурация:** `http://localhost:80/auth/callback`

**Важно:** 
- Frontend проксирует `/v1/` на API Gateway
- API Gateway endpoint: `/v1/auth/callback`
- После редиректа от Loginus, пользователь попадает на `/v1/auth/callback`
- Затем происходит редирект на `/?token=...&success=true`

## Что нужно проверить на стороне Loginus

1. **Redirect URI зарегистрирован?**
   - Убедитесь, что `http://localhost:80/auth/callback` зарегистрирован в Loginus для клиента `ai-aggregator-1dfc0546e55a761187a9e64d034c982c`
   - Если используется production, нужно зарегистрировать production URL

2. **Client ID и Secret правильные?**
   - Проверьте, что `LOGINUS_CLIENT_ID` и `LOGINUS_CLIENT_SECRET` соответствуют реальным значениям в Loginus
   - Значения по умолчанию в коде могут не работать, если они не были зарегистрированы

3. **OAuth endpoints доступны?**
   - `/oauth/authorize` - должен редиректить неавторизованных на страницу логина
   - `/oauth/token` - должен обменивать код на токен
   - `/oauth/userinfo` - должен возвращать информацию о пользователе

## Следующие шаги

1. Пересобрать контейнеры:
   ```bash
   docker-compose build --no-cache frontend api-gateway
   docker-compose up -d frontend api-gateway
   ```

2. Проверить логи:
   ```bash
   docker logs project-api-gateway-1 --tail=50
   ```

3. Проверить редирект:
   - Открыть http://localhost:80
   - Нажать "Вход/Регистрация"
   - Должен произойти редирект на Loginus

4. Если есть ошибки, проверить:
   - Что redirect_uri зарегистрирован в Loginus
   - Что client_id и client_secret правильные
   - Что endpoints Loginus доступны

