# Скрипт для перезапуска API Gateway
Write-Host "Перезапуск API Gateway..." -ForegroundColor Yellow

docker restart project-api-gateway-1

Write-Host "Ожидание запуска..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Проверка логов..." -ForegroundColor Cyan
docker logs --tail=30 project-api-gateway-1

Write-Host "`nСтатус контейнера:" -ForegroundColor Cyan
docker ps --filter "name=api-gateway" --format "{{.Names}} - {{.Status}}"

Write-Host "`nДля проверки редиректа откройте:" -ForegroundColor Green
Write-Host "http://localhost:80" -ForegroundColor White
Write-Host "И нажмите кнопку 'Вход/Регистрация'" -ForegroundColor White

