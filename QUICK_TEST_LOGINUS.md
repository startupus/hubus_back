# Быстрая проверка редиректа на Loginus

## Команды для выполнения (скопируйте в PowerShell):

```powershell
# 1. Перезапустить API Gateway
docker restart project-api-gateway-1

# 2. Подождать 5 секунд
Start-Sleep -Seconds 5

# 3. Проверить логи
docker logs --tail=30 project-api-gateway-1

# 4. Открыть браузер
Start-Process "http://localhost:80"
```

## Что проверить:

1. **Откройте http://localhost:80**
2. **Нажмите кнопку "Вход/Регистрация"**
3. **Должен произойти редирект на Loginus**

## Если видите ошибку "OAuth not configured":

Установите переменные окружения в `.env` файле:
```env
LOGINUS_CLIENT_ID=your_client_id_here
LOGINUS_CLIENT_SECRET=your_client_secret_here
```

Затем перезапустите контейнер:
```powershell
docker-compose restart api-gateway
```

## Прямая проверка endpoint:

Откройте в браузере:
```
http://localhost:3000/v1/auth/loginus
```

Должен произойти редирект на:
```
https://vselena.ldmco.ru/oauth/authorize?client_id=...&redirect_uri=...
```

## Проверка логов:

```powershell
docker logs project-api-gateway-1 | Select-String "loginus|OAuth|Initiating"
```

Ищите строку:
```
Initiating OAuth flow, redirecting to: https://vselena.ldmco.ru/oauth/authorize...
```

