# Инструкция по пересборке и проверке

## Проблема
При клике на кнопку "Вход/Регистрация" открывается локальная форма вместо редиректа на Loginus.

## Решение
Frontend контейнер не пересобран с новым кодом. Нужно пересобрать оба контейнера.

## Команды для пересборки

```bash
# Остановка контейнеров
docker stop project-frontend-1 project-api-gateway-1

# Пересборка без кэша
docker-compose build --no-cache frontend api-gateway

# Запуск контейнеров
docker-compose up -d frontend api-gateway

# Проверка логов
docker logs project-frontend-1 --tail=20
docker logs project-api-gateway-1 --tail=20
```

## Или используйте bat-файл
Запустите `rebuild-frontend-api-gateway.bat`

## Проверка
1. Откройте http://localhost:80
2. Нажмите "Вход/Регистрация"
3. Должен произойти редирект на https://vselena.ldmco.ru/oauth/authorize

## Если не работает
1. Очистите кэш браузера (Ctrl+Shift+Delete)
2. Проверьте логи контейнеров
3. Проверьте, что endpoint `/v1/auth/loginus` доступен: http://localhost:80/v1/auth/loginus

