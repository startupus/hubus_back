# Скрипт для пересборки API Gateway с новым кодом
Write-Host "Пересборка API Gateway..." -ForegroundColor Yellow

# Остановить контейнер
Write-Host "Остановка контейнера..." -ForegroundColor Yellow
docker-compose stop api-gateway

# Пересобрать образ
Write-Host "Сборка образа..." -ForegroundColor Green
docker-compose build api-gateway

# Запустить контейнер
Write-Host "Запуск контейнера..." -ForegroundColor Green
docker-compose up -d api-gateway

# Ждать запуска
Write-Host "Ожидание запуска (10 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Проверить логи
Write-Host "`nПоследние логи:" -ForegroundColor Cyan
docker logs --tail=30 project-api-gateway-1

Write-Host "`nСтатус контейнера:" -ForegroundColor Cyan
docker ps --filter "name=api-gateway" --format "{{.Names}} - {{.Status}}"

Write-Host "`nДля проверки редиректа:" -ForegroundColor Green
Write-Host "1. Откройте http://localhost:80" -ForegroundColor White
Write-Host "2. Нажмите 'Вход/Регистрация'" -ForegroundColor White
Write-Host "3. Или проверьте напрямую: http://localhost:3000/v1/auth/loginus" -ForegroundColor White

