@echo off
echo ========================================
echo Пересборка API Gateway
echo ========================================
echo.
echo Остановка контейнера...
docker stop project-api-gateway-1 2>nul
echo.
echo Сборка образа...
docker-compose build api-gateway
echo.
echo Запуск контейнера...
docker-compose up -d api-gateway
echo.
echo Ожидание запуска (15 секунд)...
timeout /t 15 /nobreak >nul
echo.
echo Проверка статуса...
docker ps --filter "name=api-gateway" --format "{{.Names}} - {{.Status}}"
echo.
echo Последние логи:
docker logs --tail=20 project-api-gateway-1
echo.
echo ========================================
echo Готово! Проверьте endpoint: http://localhost:3000/v1/auth/loginus
echo ========================================
pause

