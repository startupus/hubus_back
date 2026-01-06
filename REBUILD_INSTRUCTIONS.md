# Инструкция по пересборке контейнеров

## ✅ Исправления внесены

Все файлы обновлены с правильным URL для Loginus:
- `https://vselena.ldmco.ru/api` (с `/api` согласно отчету)

## Команды для пересборки

### Вариант 1: Использовать bat-файл (рекомендуется)

Откройте **Command Prompt** (cmd.exe, не PowerShell!) и выполните:

```cmd
rebuild-services.bat
```

### Вариант 2: Команды вручную

Откройте **Command Prompt** (cmd.exe) и выполните по порядку:

```cmd
docker stop project-frontend-1 project-api-gateway-1
docker-compose build --no-cache frontend api-gateway
docker-compose up -d frontend api-gateway
```

После пересборки подождите 15-20 секунд и проверьте логи:

```cmd
docker logs project-api-gateway-1 --tail=50
```

## Проверка после пересборки

1. **Откройте браузер:** http://localhost:80
2. **Нажмите кнопку:** "Вход/Регистрация"
3. **Ожидаемый результат:** Редирект на `https://vselena.ldmco.ru/index.html?oauth_flow=true&return_to=/oauth/authorize`

## Если редирект не работает

Проверьте логи API Gateway:

```cmd
docker logs project-api-gateway-1 --tail=100 | findstr /i "loginus oauth"
```

Ищите сообщения:
- "Initiating OAuth flow" - начало OAuth
- Ошибки с деталями

## Текущая конфигурация

Согласно отчету проверки Loginus:
- ✅ Client ID: `ai-aggregator-1dfc0546e55a761187a9e64d034c982c`
- ✅ Client Secret: `cd024fc585ac2008b767e3c46f41123bd618fd0ab1af7a10158549b405ae9d37`
- ✅ OAuth URL: `https://vselena.ldmco.ru/api`
- ✅ Redirect URI: `http://localhost:80/auth/callback`
- ✅ Redirect URI зарегистрирован в Loginus

Все настроено правильно!
