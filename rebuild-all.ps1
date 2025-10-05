# AI Aggregator - Полная пересборка и перезапуск системы
# Этот скрипт обеспечивает полную пересборку всех контейнеров с актуальными версиями

param(
    [switch]$SkipTests = $false,
    [switch]$KeepVolumes = $false,
    [switch]$Verbose = $false
)

Write-Host "🚀 AI Aggregator - Полная пересборка системы" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Функция для логирования
function Write-Log {
    param([string]$Message, [string]$Level = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        "ERROR" { "Red" }
        "WARN" { "Yellow" }
        "SUCCESS" { "Green" }
        default { "White" }
    }
    Write-Host "[$timestamp] [$Level] $Message" -ForegroundColor $color
}

# Функция для выполнения команд с обработкой ошибок
function Invoke-SafeCommand {
    param([string]$Command, [string]$Description)
    
    Write-Log "Выполняется: $Description" "INFO"
    if ($Verbose) {
        Write-Host "Команда: $Command" -ForegroundColor Gray
    }
    
    try {
        Invoke-Expression $Command
        if ($LASTEXITCODE -ne 0) {
            throw "Команда завершилась с ошибкой (код: $LASTEXITCODE)"
        }
        Write-Log "✅ $Description - успешно" "SUCCESS"
    }
    catch {
        Write-Log "❌ Ошибка при выполнении: $Description" "ERROR"
        Write-Log "Ошибка: $($_.Exception.Message)" "ERROR"
        exit 1
    }
}

# 1. Остановка всех контейнеров
Write-Log "🛑 Остановка всех контейнеров..." "INFO"
Invoke-SafeCommand "docker compose down" "Остановка контейнеров"

# 2. Очистка Docker кэша (опционально)
if (-not $KeepVolumes) {
    Write-Log "🧹 Очистка Docker кэша..." "INFO"
    Invoke-SafeCommand "docker system prune -f" "Очистка кэша"
}

# 3. Пересборка всех образов с нуля
Write-Log "🔨 Пересборка всех образов..." "INFO"
Invoke-SafeCommand "docker compose build --no-cache" "Пересборка образов"

# 4. Запуск всех контейнеров
Write-Log "🚀 Запуск всех контейнеров..." "INFO"
Invoke-SafeCommand "docker compose up -d" "Запуск контейнеров"

# 5. Ожидание готовности сервисов
Write-Log "⏳ Ожидание готовности сервисов..." "INFO"
Start-Sleep -Seconds 30

# 6. Проверка статуса контейнеров
Write-Log "📊 Проверка статуса контейнеров..." "INFO"
$containers = docker compose ps --format "table {{.Name}}\t{{.Status}}"
Write-Host $containers

# 7. Тестирование основных endpoints
if (-not $SkipTests) {
    Write-Log "🧪 Тестирование основных endpoints..." "INFO"
    
    $endpoints = @(
        @{Name="API Gateway"; Url="http://localhost:3000/health"},
        @{Name="Auth Service"; Url="http://localhost:3001/health"},
        @{Name="Analytics Service"; Url="http://localhost:3005/health"}
    )
    
    foreach ($endpoint in $endpoints) {
        try {
            $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 10
            if ($response.StatusCode -eq 200) {
                Write-Log "✅ $($endpoint.Name) - работает" "SUCCESS"
            } else {
                Write-Log "⚠️ $($endpoint.Name) - статус $($response.StatusCode)" "WARN"
            }
        }
        catch {
            Write-Log "❌ $($endpoint.Name) - недоступен" "ERROR"
        }
    }
}

# 8. Показ логов analytics-service для проверки JSON логирования
Write-Log "📋 Показ последних логов analytics-service..." "INFO"
Write-Host "`n=== ЛОГИ ANALYTICS-SERVICE ===" -ForegroundColor Cyan
docker compose logs analytics-service --tail=10

Write-Log "🎉 Пересборка завершена успешно!" "SUCCESS"
Write-Host "`nДоступные сервисы:" -ForegroundColor Green
Write-Host "• API Gateway: http://localhost:3000" -ForegroundColor White
Write-Host "• Auth Service: http://localhost:3001" -ForegroundColor White
Write-Host "• Provider Orchestrator: http://localhost:3002" -ForegroundColor White
Write-Host "• Proxy Service: http://localhost:3003" -ForegroundColor White
Write-Host "• Billing Service: http://localhost:3004" -ForegroundColor White
Write-Host "• Analytics Service: http://localhost:3005" -ForegroundColor White
Write-Host "• RabbitMQ Management: http://localhost:15672" -ForegroundColor White
Write-Host "• Redis: localhost:6379" -ForegroundColor White
