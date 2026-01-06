@echo off
echo Пересборка API Gateway с новыми credentials...
docker stop project-api-gateway-1
docker-compose build api-gateway
docker-compose up -d api-gateway
echo Ожидание 15 секунд...
timeout /t 15 /nobreak >nul
echo Проверка логов:
docker logs --tail=30 project-api-gateway-1
echo.
echo Проверка endpoint:
curl -I http://localhost:3000/v1/auth/loginus
pause

