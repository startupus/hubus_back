# ===========================================
# AI AGGREGATOR - DOCKER STOP SCRIPT
# Остановка всех сервисов в Docker-контейнерах
# ===========================================

Write-Host "🛑 Остановка AI Aggregator Docker-контейнеров..." -ForegroundColor Yellow

# Остановить все сервисы
Write-Host "⏹️ Остановка сервисов..." -ForegroundColor Yellow
docker-compose down

# Удалить неиспользуемые контейнеры
Write-Host "🗑️ Удаление неиспользуемых контейнеров..." -ForegroundColor Yellow
docker container prune -f

# Удалить неиспользуемые образы
Write-Host "🧹 Удаление неиспользуемых образов..." -ForegroundColor Yellow
docker image prune -f

# Удалить неиспользуемые тома (опционально)
$removeVolumes = Read-Host "Удалить тома данных? (y/N)"
if ($removeVolumes -eq "y" -or $removeVolumes -eq "Y") {
    Write-Host "🗑️ Удаление томов данных..." -ForegroundColor Red
    docker volume prune -f
}

Write-Host "✅ Остановка завершена!" -ForegroundColor Green
