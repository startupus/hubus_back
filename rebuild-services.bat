@echo off
echo ========================================
echo Пересборка Frontend и API Gateway
echo ========================================
echo.
echo Остановка контейнеров...
docker stop project-frontend-1 2>nul
docker stop project-api-gateway-1 2>nul
echo.
echo Пересборка Frontend (без кэша)...
docker-compose build --no-cache frontend
if %errorlevel% neq 0 (
    echo ОШИБКА при сборке frontend!
    pause
    exit /b 1
)
echo.
echo Пересборка API Gateway (без кэша)...
docker-compose build --no-cache api-gateway
if %errorlevel% neq 0 (
    echo ОШИБКА при сборке api-gateway!
    pause
    exit /b 1
)
echo.
echo Запуск контейнеров...
docker-compose up -d frontend api-gateway
if %errorlevel% neq 0 (
    echo ОШИБКА при запуске контейнеров!
    pause
    exit /b 1
)
echo.
echo Ожидание запуска (15 секунд)...
timeout /t 15 /nobreak >nul
echo.
echo Проверка статуса контейнеров...
docker ps --filter "name=frontend" --format "{{.Names}} - {{.Status}}"
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
echo ========================================
pause

