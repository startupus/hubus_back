# ✅ Инструкция по проверке редиректа на Loginus

## Шаг 1: Перезапуск API Gateway

В PowerShell выполните:
```powershell
docker restart project-api-gateway-1
```

Или используйте скрипт:
```powershell
.\restart-api-gateway.ps1
```

## Шаг 2: Проверка в браузере

### Вариант 1: Через главную страницу
1. Откройте: `http://localhost:80`
2. Нажмите кнопку **"Вход/Регистрация"**
3. Должен произойти редирект на Loginus

### Вариант 2: Прямая проверка endpoint
Откройте в браузере:
```
http://localhost:3000/v1/auth/loginus
```

**Ожидаемый результат:**
- Редирект на `https://vselena.ldmco.ru/oauth/authorize?client_id=...&redirect_uri=...&state=...`

## Если видите ошибку

### Ошибка: "OAuth not configured"

**Причина:** Не установлены переменные окружения `LOGINUS_CLIENT_ID` и `LOGINUS_CLIENT_SECRET`

**Решение:**
1. Создайте или отредактируйте файл `.env` в корне проекта
2. Добавьте:
   ```env
   LOGINUS_CLIENT_ID=your_client_id_from_loginus
   LOGINUS_CLIENT_SECRET=your_client_secret_from_loginus
   ```
3. Перезапустите контейнер:
   ```powershell
   docker-compose restart api-gateway
   ```

### Ошибка: "Cannot GET /v1/auth/loginus"

**Причина:** API Gateway не запущен или код не скомпилирован

**Решение:**
1. Проверьте статус контейнера:
   ```powershell
   docker ps | findstr api-gateway
   ```
2. Проверьте логи на ошибки:
   ```powershell
   docker logs project-api-gateway-1
   ```
3. Пересоберите контейнер:
   ```powershell
   docker-compose build api-gateway
   docker-compose up -d api-gateway
   ```

## Проверка логов

```powershell
docker logs --tail=50 project-api-gateway-1 | Select-String "loginus|OAuth|Initiating"
```

**Успешный запуск:**
```
[OAuthController] Initiating OAuth flow, redirecting to: https://vselena.ldmco.ru/oauth/authorize?...
```

**Ошибка конфигурации:**
```
[OAuthController] OAuth not configured. Please set LOGINUS_CLIENT_ID and LOGINUS_CLIENT_SECRET...
```

## Проверка переменных окружения

```powershell
docker exec project-api-gateway-1 env | findstr LOGINUS
```

Должны увидеть:
```
LOGINUS_OAUTH_URL=https://vselena.ldmco.ru
LOGINUS_CLIENT_ID=...
LOGINUS_CLIENT_SECRET=...
LOGINUS_REDIRECT_URI=http://localhost:80/auth/callback
LOGINUS_SCOPE=openid email profile
```

## Быстрая проверка через curl

```powershell
curl -I http://localhost:3000/v1/auth/loginus
```

Должен вернуть `302 Found` с заголовком `Location: https://vselena.ldmco.ru/oauth/authorize?...`

## Что должно работать

✅ Нажатие "Вход/Регистрация" → редирект на `/v1/auth/loginus`
✅ `/v1/auth/loginus` → редирект на Loginus OAuth
✅ Loginus OAuth → после авторизации → callback → frontend с токеном

## Если что-то не работает

1. Проверьте логи API Gateway
2. Проверьте переменные окружения
3. Убедитесь, что контейнер запущен
4. Проверьте, что Loginus доступен: `curl https://vselena.ldmco.ru`

