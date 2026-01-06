# Исправление проблемы с редиректом после входа в Loginus

## Проблема
После входа в Loginus пользователь не возвращается обратно в AI Aggregator, оставаясь на странице Loginus.

## Причина
Redirect URI не соответствовал реальному endpoint:
- **Указано в Loginus:** `http://localhost:80/auth/callback`
- **Реальный endpoint:** `/v1/auth/callback`
- **Проблема:** Nginx проксирует только `/v1/` на API Gateway, поэтому `/auth/callback` не попадал на backend

## Решение
Исправлен `redirect_uri` на правильный путь: `http://localhost:80/v1/auth/callback`

**Измененные файлы:**
1. `services/api-gateway/src/auth/oauth.controller.ts` - обновлен дефолтный redirectUri
2. `docker-compose.yml` - обновлен `LOGINUS_REDIRECT_URI`
3. `services/api-gateway/src/config/configuration.ts` - обновлен дефолтный redirectUri

## Важно: Обновить в Loginus

**Нужно зарегистрировать новый redirect URI в Loginus:**
- `http://localhost:80/v1/auth/callback` (для разработки)
- `https://yourdomain.com/v1/auth/callback` (для production)

**Старый URI можно оставить или удалить:**
- `http://localhost:80/auth/callback` (больше не используется)

## Следующие шаги

1. **Обновить redirect URI в Loginus:**
   - Зарегистрировать `http://localhost:80/v1/auth/callback`
   - Удалить или оставить старый `http://localhost:80/auth/callback`

2. **Пересобрать контейнеры:**
   ```bash
   docker-compose build --no-cache api-gateway
   docker-compose up -d api-gateway
   ```

3. **Проверить:**
   - Открыть http://localhost:80
   - Нажать "Вход/Регистрация"
   - Войти в Loginus
   - Должен произойти редирект обратно на AI Aggregator с токеном

## Если проблема останется

Проверьте логи API Gateway:
```bash
docker logs project-api-gateway-1 --tail=100 | grep -i "callback\|oauth"
```

Ищите:
- "OAuth callback error" - ошибки при обработке callback
- "Invalid state parameter" - проблема с CSRF защитой
- "No authorization code received" - Loginus не передал код

