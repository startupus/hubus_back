@echo off
echo ========================================
echo Пересборка Frontend и API Gateway
echo ========================================
echo.
echo Остановка контейнеров...
docker stop project-frontend-1 project-api-gateway-1 2>nul
echo.
echo Пересборка Frontend...
docker-compose build frontend
echo.
echo Пересборка API Gateway...
docker-compose build api-gateway
echo.
echo Запуск контейнеров...
docker-compose up -d frontend api-gateway
echo.
echo Ожидание запуска (20 секунд)...
timeout /t 20 /nobreak >nul
echo.
echo Проверка статуса...
docker ps --filter "name=frontend" --format "{{.Names}} - {{.Status}}"
docker ps --filter "name=api-gateway" --format "{{.Names}} - {{.Status}}"
echo.
echo Логи API Gateway:
docker logs --tail=20 project-api-gateway-1
echo.
echo ========================================
echo Готово! Проверьте:
echo 1. http://localhost:80 - главная страница
echo 2. http://localhost:3000/v1/auth/loginus - должен быть редирект
echo ========================================
pause

