@echo off
echo ========================================
echo Тестирование полного OAuth Flow
echo ========================================
echo.
echo Проверка логов API Gateway:
echo.
docker logs project-api-gateway-1 --tail=100 2>&1 | findstr /i /c:"oauth" /c:"callback" /c:"loginus" /c:"authorize" /c:"token"
echo.
echo ========================================
echo Откройте браузер:
echo 1. http://localhost:80
echo 2. Нажмите "Вход/Регистрация"
echo 3. Войдите в Loginus
echo 4. После входа должен быть редирект обратно на AI Aggregator
echo ========================================
pause

