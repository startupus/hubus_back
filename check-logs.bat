@echo off
echo ========================================
echo Проверка логов API Gateway
echo ========================================
echo.
echo Логи с упоминанием oauth, loginus, callback:
echo.
docker logs project-api-gateway-1 --tail=200 2>&1 | findstr /i "oauth loginus callback authorize"
echo.
echo ========================================
echo Последние 50 строк логов:
echo ========================================
docker logs project-api-gateway-1 --tail=50
echo.
pause

