@echo off
echo Остановка контейнеров...
docker stop project-frontend-1 project-api-gateway-1
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
echo Готово! Проверьте http://localhost:80
pause

