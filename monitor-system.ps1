# AI Aggregator - Мониторинг системы
# Этот скрипт предоставляет информацию о состоянии всех сервисов

param(
    [switch]$Watch = $false,
    [switch]$Logs = $false,
    [string]$Service = "",
    [int]$LogLines = 50
)

Write-Host "📊 AI Aggregator - Мониторинг системы" -ForegroundColor Green
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

# Функция для проверки health endpoint
function Test-ServiceHealth {
    param([string]$ServiceName, [string]$Url)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            $content = $response.Content | ConvertFrom-Json
            return @{
                Status = "✅ Healthy"
                Details = $content
            }
        } else {
            return @{
                Status = "⚠️ Status: $($response.StatusCode)"
                Details = $null
            }
        }
    }
    catch {
        return @{
            Status = "❌ Unavailable"
            Details = $null
        }
    }
}

# Функция для отображения статуса сервисов
function Show-ServicesStatus {
    Write-Host "`n🔍 Статус сервисов:" -ForegroundColor Cyan
    Write-Host "===================" -ForegroundColor Cyan
    
    $services = @(
        @{Name="API Gateway"; Url="http://localhost:3000/health"; Port="3000"},
        @{Name="Auth Service"; Url="http://localhost:3001/health"; Port="3001"},
        @{Name="Provider Orchestrator"; Url="http://localhost:3002/health"; Port="3002"},
        @{Name="Proxy Service"; Url="http://localhost:3003/health"; Port="3003"},
        @{Name="Billing Service"; Url="http://localhost:3004/health"; Port="3004"},
        @{Name="Analytics Service"; Url="http://localhost:3005/health"; Port="3005"}
    )
    
    foreach ($service in $services) {
        $health = Test-ServiceHealth $service.Name $service.Url
        Write-Host "• $($service.Name) (:$($service.Port)): $($health.Status)" -ForegroundColor White
        
        if ($health.Details) {
            $status = $health.Details.status
            $uptime = if ($health.Details.uptime) { [math]::Round($health.Details.uptime, 2) } else { "N/A" }
            Write-Host "  └─ Status: $status, Uptime: ${uptime}s" -ForegroundColor Gray
        }
    }
}

# Функция для отображения статуса контейнеров
function Show-ContainersStatus {
    Write-Host "`n🐳 Статус контейнеров:" -ForegroundColor Cyan
    Write-Host "=====================" -ForegroundColor Cyan
    
    $containers = docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
    Write-Host $containers
}

# Функция для отображения логов
function Show-Logs {
    param([string]$ServiceName, [int]$Lines)
    
    if ($ServiceName) {
        Write-Host "`nЛоги сервиса $ServiceName:" -ForegroundColor Cyan
        Write-Host "=============================" -ForegroundColor Cyan
        docker compose logs $ServiceName --tail=$Lines
    } else {
        Write-Host "`nПоследние логи всех сервисов:" -ForegroundColor Cyan
        Write-Host "=================================" -ForegroundColor Cyan
        docker compose logs --tail=$Lines
    }
}

# Функция для отображения использования ресурсов
function Show-ResourceUsage {
    Write-Host "`nИспользование ресурсов:" -ForegroundColor Cyan
    Write-Host "=========================" -ForegroundColor Cyan
    
    $stats = docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}"
    Write-Host $stats
}

# Основная логика
if ($Logs) {
    if ($Service) {
        Show-Logs $Service $LogLines
    } else {
        Show-Logs "" $LogLines
    }
} else {
    Show-ServicesStatus
    Show-ContainersStatus
    Show-ResourceUsage
}

if ($Watch) {
    Write-Host "`nРежим мониторинга (Ctrl+C для выхода)..." -ForegroundColor Yellow
    while ($true) {
        Clear-Host
        Write-Host "AI Aggregator - Мониторинг системы (обновлено: $(Get-Date -Format 'HH:mm:ss'))" -ForegroundColor Green
        Write-Host "================================================" -ForegroundColor Green
        
        Show-ServicesStatus
        Show-ContainersStatus
        
        Start-Sleep -Seconds 10
    }
}
