@echo off
echo ========================================
echo Пересборка API Gateway
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
echo Ожидание запуска (15 секунд)...
timeout /t 15 /nobreak >nul
echo.
echo Проверка статуса...
docker ps --filter "name=api-gateway" --format "{{.Names}} - {{.Status}}"
echo.
echo ========================================
echo Логи API Gateway (последние 30 строк):
echo ========================================
docker logs project-api-gateway-1 --tail=30
echo.
echo ========================================
echo Готово! Проверьте:
echo 1. http://localhost:80 - главная страница
echo 2. Нажмите "Вход/Регистрация" - должен быть редирект на Loginus
echo 3. После входа в Loginus должен быть редирект обратно
echo ========================================
pause

