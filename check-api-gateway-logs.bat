@echo off
echo Проверка логов API Gateway для OAuth flow
echo ========================================
echo.
echo Поиск сообщений об OAuth, callback, loginus:
echo.
docker logs project-api-gateway-1 --tail=200 2>&1 | findstr /i /c:"oauth" /c:"callback" /c:"loginus" /c:"authorize"
echo.
echo ========================================
echo Последние 100 строк логов:
echo ========================================
docker logs project-api-gateway-1 --tail=100
echo.
pause

