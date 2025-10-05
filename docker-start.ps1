# ===========================================
# AI AGGREGATOR - DOCKER STARTUP SCRIPT
# Запуск всех сервисов в Docker-контейнерах
# ===========================================

Write-Host "🐳 Запуск AI Aggregator в Docker-контейнерах..." -ForegroundColor Cyan

# Проверка наличия Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker не установлен! Установите Docker Desktop." -ForegroundColor Red
    exit 1
}

# Проверка наличия Docker Compose
if (-not (Get-Command docker-compose -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Docker Compose не установлен! Установите Docker Compose." -ForegroundColor Red
    exit 1
}

# Остановить существующие контейнеры
Write-Host "🛑 Остановка существующих контейнеров..." -ForegroundColor Yellow
docker-compose down --remove-orphans

# Очистить неиспользуемые образы
Write-Host "🧹 Очистка неиспользуемых образов..." -ForegroundColor Yellow
docker image prune -f

# Собрать образы
Write-Host "🔨 Сборка Docker образов..." -ForegroundColor Green
docker-compose build --no-cache

# Запустить сервисы
Write-Host "🚀 Запуск сервисов..." -ForegroundColor Green
docker-compose up -d

# Ждать запуска сервисов
Write-Host "⏳ Ожидание запуска сервисов..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Проверить статус сервисов
Write-Host "📊 Статус сервисов:" -ForegroundColor Cyan
docker-compose ps

# Проверить логи
Write-Host "📝 Последние логи:" -ForegroundColor Cyan
docker-compose logs --tail=20

# Проверить доступность endpoints
Write-Host "🔍 Проверка доступности endpoints..." -ForegroundColor Green

$endpoints = @(
    @{Name="API Gateway"; Url="http://localhost:3000/health"},
    @{Name="Auth Service"; Url="http://localhost:3001/health"},
    @{Name="Provider Orchestrator"; Url="http://localhost:3002/health"},
    @{Name="Proxy Service"; Url="http://localhost:3003/health"},
    @{Name="Billing Service"; Url="http://localhost:3004/health"},
    @{Name="Analytics Service"; Url="http://localhost:3005/health"}
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-RestMethod -Uri $endpoint.Url -Method GET -TimeoutSec 5
        Write-Host "✅ $($endpoint.Name): OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($endpoint.Name): НЕ ДОСТУПЕН" -ForegroundColor Red
    }
}

Write-Host "`n🎉 Запуск завершен!" -ForegroundColor Green
Write-Host "📋 Доступные сервисы:" -ForegroundColor Cyan
Write-Host "  • API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "  • Auth Service: http://localhost:3001" -ForegroundColor White
Write-Host "  • Provider Orchestrator: http://localhost:3002" -ForegroundColor White
Write-Host "  • Proxy Service: http://localhost:3003" -ForegroundColor White
Write-Host "  • Billing Service: http://localhost:3004" -ForegroundColor White
Write-Host "  • Analytics Service: http://localhost:3005" -ForegroundColor White
Write-Host "`n📊 Мониторинг:" -ForegroundColor Cyan
Write-Host "  • RabbitMQ Management: http://localhost:15672" -ForegroundColor White
Write-Host "  • Redis: localhost:6379" -ForegroundColor White
Write-Host "`n🔧 Управление:" -ForegroundColor Cyan
Write-Host "  • Остановить: docker-compose down" -ForegroundColor White
Write-Host "  • Логи: docker-compose logs -f [service-name]" -ForegroundColor White
Write-Host "  • Перезапустить: docker-compose restart [service-name]" -ForegroundColor White
