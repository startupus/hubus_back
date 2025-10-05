# AI Aggregator - Простой мониторинг системы
param(
    [switch]$Logs = $false,
    [string]$Service = "",
    [int]$LogLines = 50
)

Write-Host "AI Aggregator - Мониторинг системы" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Функция для проверки health endpoint
function Test-ServiceHealth {
    param([string]$ServiceName, [string]$Url)
    
    try {
        $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            return "Healthy"
        } else {
            return "Status: $($response.StatusCode)"
        }
    }
    catch {
        return "Unavailable"
    }
}

# Показ статуса сервисов
Write-Host "`nСтатус сервисов:" -ForegroundColor Cyan
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
    $status = if ($health -eq "Healthy") { "✅" } else { "❌" }
    Write-Host "$status $($service.Name) (:$($service.Port)): $health" -ForegroundColor White
}

# Показ статуса контейнеров
Write-Host "`nСтатус контейнеров:" -ForegroundColor Cyan
Write-Host "=====================" -ForegroundColor Cyan

$containers = docker compose ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
Write-Host $containers

# Показ логов
if ($Logs) {
    Write-Host "`nЛоги:" -ForegroundColor Cyan
    Write-Host "=====" -ForegroundColor Cyan
    
    if ($Service) {
        docker compose logs $Service --tail=$LogLines
    } else {
        docker compose logs --tail=$LogLines
    }
}
