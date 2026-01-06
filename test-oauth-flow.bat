@echo off
echo ========================================
echo Тестирование OAuth Flow
echo ========================================
echo.
echo 1. Проверка endpoint /v1/auth/loginus:
echo.
curl -I http://localhost:80/v1/auth/loginus 2>nul | findstr "HTTP"
echo.
echo 2. Проверка логов API Gateway:
echo.
docker logs project-api-gateway-1 --tail=50 2>&1 | findstr /i "oauth loginus callback authorize"
echo.
echo ========================================
echo Откройте браузер и проверьте:
echo 1. http://localhost:80
echo 2. Нажмите "Вход/Регистрация"
echo 3. Войдите в Loginus
echo 4. После входа должен быть редирект обратно на AI Aggregator
echo ========================================
pause

