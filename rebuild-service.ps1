# AI Aggregator - Пересборка конкретного сервиса
# Этот скрипт позволяет быстро пересобрать только один сервис

param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceName,
    [switch]$NoCache = $false,
    [switch]$Restart = $true,
    [switch]$Verbose = $false
)

Write-Host "🔧 AI Aggregator - Пересборка сервиса: $ServiceName" -ForegroundColor Green
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

# Проверка существования сервиса
$availableServices = @("api-gateway", "auth-service", "provider-orchestrator", "proxy-service", "billing-service", "analytics-service")
if ($ServiceName -notin $availableServices) {
    Write-Log "❌ Неизвестный сервис: $ServiceName" "ERROR"
    Write-Log "Доступные сервисы: $($availableServices -join ', ')" "INFO"
    exit 1
}

# 1. Остановка сервиса
Write-Log "🛑 Остановка сервиса $ServiceName..." "INFO"
Invoke-SafeCommand "docker compose stop $ServiceName" "Остановка сервиса"

# 2. Пересборка образа
$buildCommand = "docker compose build"
if ($NoCache) {
    $buildCommand += " --no-cache"
}
$buildCommand += " $ServiceName"

Write-Log "🔨 Пересборка образа $ServiceName..." "INFO"
Invoke-SafeCommand $buildCommand "Пересборка образа"

# 3. Перезапуск сервиса
if ($Restart) {
    Write-Log "🚀 Перезапуск сервиса $ServiceName..." "INFO"
    Invoke-SafeCommand "docker compose up -d $ServiceName" "Перезапуск сервиса"
    
    # Ожидание готовности
    Write-Log "⏳ Ожидание готовности сервиса..." "INFO"
    Start-Sleep -Seconds 15
    
    # Проверка статуса
    Write-Log "📊 Проверка статуса сервиса..." "INFO"
    $status = docker compose ps $ServiceName --format "{{.Status}}"
    Write-Host "Статус: $status" -ForegroundColor Cyan
    
    # Тестирование health endpoint
    $healthUrl = switch ($ServiceName) {
        "api-gateway" { "http://localhost:3000/health" }
        "auth-service" { "http://localhost:3001/health" }
        "provider-orchestrator" { "http://localhost:3002/health" }
        "proxy-service" { "http://localhost:3003/health" }
        "billing-service" { "http://localhost:3004/health" }
        "analytics-service" { "http://localhost:3005/health" }
    }
    
    try {
        $response = Invoke-WebRequest -Uri $healthUrl -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Log "✅ $ServiceName - работает корректно" "SUCCESS"
        } else {
            Write-Log "⚠️ $ServiceName - статус $($response.StatusCode)" "WARN"
        }
    }
    catch {
        Write-Log "❌ $ServiceName - недоступен" "ERROR"
    }
}

Write-Log "🎉 Пересборка сервиса $ServiceName завершена!" "SUCCESS"
