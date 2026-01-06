@echo off
echo Пересборка API Gateway...
docker-compose stop api-gateway
docker-compose build api-gateway
docker-compose up -d api-gateway
echo Ожидание запуска...
timeout /t 10 /nobreak
echo Проверка логов:
docker logs --tail=30 project-api-gateway-1
pause

