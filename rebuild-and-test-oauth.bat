@echo off
echo ========================================
echo Пересборка API Gateway и проверка OAuth
echo ========================================
echo.
echo Остановка контейнера...
docker stop project-api-gateway-1 2>nul
echo.
echo Пересборка API Gateway (без кэша)...
docker-compose build --no-cache api-gateway
if %errorlevel% neq 0 (
    echo ОШИБКА при сборке!
    pause
    exit /b 1
)
echo.
echo Запуск контейнера...
docker-compose up -d api-gateway
if %errorlevel% neq 0 (
    echo ОШИБКА при запуске!
    pause
    exit /b 1
)
echo.
echo Ожидание запуска (20 секунд)...
timeout /t 20 /nobreak >nul
echo.
echo Проверка статуса контейнера...
docker ps --filter "name=api-gateway" --format "{{.Names}} - {{.Status}}"
echo.
echo ========================================
echo Логи API Gateway (последние 50 строк):
echo ========================================
docker logs project-api-gateway-1 --tail=50
echo.
echo ========================================
echo Проверка endpoints:
echo ========================================
echo Проверяю /v1/auth/loginus...
curl -I http://localhost:80/v1/auth/loginus 2>nul | findstr "HTTP"
echo.
echo ========================================
echo Готово!
echo.
echo Теперь проверьте полный OAuth flow:
echo 1. Откройте http://localhost:80
echo 2. Нажмите "Вход/Регистрация"
echo 3. Войдите в Loginus (Email/GitHub/Telegram)
echo 4. После входа должен быть редирект обратно на AI Aggregator
echo ========================================
pause

