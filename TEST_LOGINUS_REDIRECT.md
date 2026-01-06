# Инструкция по проверке редиректа на Loginus

## Шаг 1: Перезапуск API Gateway

Выполните в терминале:
```powershell
docker restart project-api-gateway-1
```

Или используйте скрипт:
```powershell
.\restart-api-gateway.ps1
```

## Шаг 2: Проверка переменных окружения

Убедитесь, что в `.env` файле установлены:
```env
LOGINUS_CLIENT_ID=your_client_id
LOGINUS_CLIENT_SECRET=your_client_secret
```

Если переменные не установлены, API Gateway вернет ошибку "OAuth not configured".

## Шаг 3: Проверка через браузер

1. Откройте браузер
2. Перейдите на: `http://localhost:80`
3. Нажмите кнопку **"Вход/Регистрация"**
4. Должен произойти редирект на Loginus OAuth

## Ожидаемое поведение

### Если OAuth настроен:
1. Нажатие на "Вход/Регистрация" → редирект на `/v1/auth/loginus`
2. API Gateway генерирует state и редиректит на:
   ```
   https://vselena.ldmco.ru/oauth/authorize?client_id=...&redirect_uri=...&state=...
   ```

### Если OAuth НЕ настроен:
- Получите ошибку 503 "OAuth not configured"
- Нужно установить `LOGINUS_CLIENT_ID` и `LOGINUS_CLIENT_SECRET`

## Прямая проверка endpoint

Можно также проверить напрямую:
```
http://localhost:3000/v1/auth/loginus
```

Должен произойти редирект на Loginus.

## Проверка логов

```powershell
docker logs --tail=50 project-api-gateway-1
```

Ищите строки:
- "Initiating OAuth flow, redirecting to: ..."
- "OAuth not configured" (если переменные не установлены)

## Отладка

Если редирект не работает:

1. **Проверьте логи API Gateway:**
   ```powershell
   docker logs project-api-gateway-1
   ```

2. **Проверьте переменные окружения в контейнере:**
   ```powershell
   docker exec project-api-gateway-1 env | findstr LOGINUS
   ```

3. **Проверьте, что контейнер запущен:**
   ```powershell
   docker ps | findstr api-gateway
   ```

4. **Проверьте доступность Loginus:**
   ```powershell
   curl https://vselena.ldmco.ru/oauth/authorize
   ```

