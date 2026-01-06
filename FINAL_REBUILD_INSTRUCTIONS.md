# Финальная инструкция по пересборке и тестированию

## ✅ Все исправления внесены!

### На стороне AI Aggregator:
- ✅ URL Loginus: `https://vselena.ldmco.ru/api`
- ✅ Redirect URI: `http://localhost:80/v1/auth/callback`
- ✅ Код обработки OAuth готов

### На стороне Loginus:
- ✅ Frontend проверяет `oauth_flow=true`
- ✅ Backend поддерживает продолжение OAuth flow
- ✅ Redirect URI зарегистрирован

## Пересборка API Gateway

### Вариант 1: Использовать bat-файл (рекомендуется)

Откройте **Command Prompt** (cmd.exe) и выполните:

```cmd
rebuild-and-test-oauth.bat
```

### Вариант 2: Команды вручную

```cmd
docker stop project-api-gateway-1
docker-compose build --no-cache api-gateway
docker-compose up -d api-gateway
```

Подождите 20 секунд после запуска, затем проверьте логи:

```cmd
docker logs project-api-gateway-1 --tail=50
```

## Тестирование полного OAuth flow

1. **Откройте браузер:** http://localhost:80

2. **Нажмите "Вход/Регистрация"**
   - Должен произойти редирект на Loginus

3. **Войдите в Loginus** (Email/GitHub/Telegram)
   - После успешной авторизации Loginus должен автоматически редиректить обратно

4. **Проверьте результат:**
   - Вы должны вернуться на http://localhost:80
   - В URL должен быть параметр `?token=...&success=true`
   - Пользователь должен быть авторизован

## Проверка логов при проблемах

Если что-то не работает, проверьте логи:

```cmd
docker logs project-api-gateway-1 --tail=100 | findstr /i "oauth callback loginus"
```

Ищите:
- "Initiating OAuth flow" - начало OAuth
- "OAuth callback error" - ошибки при обработке callback
- "User info received" - получение информации о пользователе
- "User synchronized" - успешная синхронизация

## Если редирект не работает после входа в Loginus

Проверьте в Loginus:
1. Cookies сохраняются при редиректе на index.html
2. После авторизации проверяется `oauth_flow=true`
3. Происходит редирект на `/api/oauth/authorize` с восстановленными параметрами

## Статус

✅ **Все готово!** Осталось только пересобрать контейнер и протестировать.

