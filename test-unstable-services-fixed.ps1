# test-unstable-services-fixed.ps1
# Тест исправления нестабильных сервисов

$BASE_URL = "http://localhost:3000"
$passed = 0
$failed = 0
$testResults = @{
    CriticalIssues = @()
    Warnings = @()
    Successes = @()
}

Write-Host "=== ТЕСТ ИСПРАВЛЕНИЯ НЕСТАБИЛЬНЫХ СЕРВИСОВ ===" -ForegroundColor Yellow

# 1. Проверка статуса Docker контейнеров
Write-Host "`n1. ПРОВЕРКА СТАТУСА DOCKER КОНТЕЙНЕРОВ" -ForegroundColor Cyan
try {
    $containers = docker-compose ps --format "table {{.Name}}\t{{.Status}}"
    Write-Host "  Статус контейнеров:" -ForegroundColor Gray
    $containers | ForEach-Object { Write-Host "    $_" -ForegroundColor Gray }
    
    # Проверяем проблемные сервисы
    $unhealthyServices = @("analytics-service", "payment-service", "provider-orchestrator")
    foreach ($service in $unhealthyServices) {
        $status = docker-compose ps --filter "name=$service" --format "{{.Status}}"
        if ($status -match "unhealthy") {
            Write-Host "  ⚠️  ${service}: Unhealthy" -ForegroundColor Yellow
            $testResults.Warnings += "${service}: Unhealthy"
        } elseif ($status -match "healthy") {
            Write-Host "  ✅ ${service}: Healthy" -ForegroundColor Green
            $testResults.Successes += "${service}: Healthy"
            $passed++
        } else {
            Write-Host "  ❓ ${service}: $status" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "  ❌ Ошибка проверки Docker: $($_.Exception.Message)" -ForegroundColor Red
    $failed++
    $testResults.CriticalIssues += "Docker check failed"
}

# 2. Проверка health endpoints
Write-Host "`n2. ПРОВЕРКА HEALTH ENDPOINTS" -ForegroundColor Cyan

$healthEndpoints = @(
    @{Name="API Gateway"; Url="$BASE_URL/health"},
    @{Name="Auth Service"; Url="http://localhost:3001/health"},
    @{Name="Billing Service"; Url="http://localhost:3004/health"},
    @{Name="Analytics Service"; Url="http://localhost:3005/health"},
    @{Name="Payment Service"; Url="http://localhost:3006/health"},
    @{Name="Provider Orchestrator"; Url="http://localhost:3002/health"},
    @{Name="Proxy Service"; Url="http://localhost:3003/health"}
)

foreach ($endpoint in $healthEndpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint.Url -UseBasicParsing -TimeoutSec 5
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ $($endpoint.Name): 200 OK" -ForegroundColor Green
            $testResults.Successes += "$($endpoint.Name): Health OK"
            $passed++
        } else {
            Write-Host "  ⚠️  $($endpoint.Name): $($response.StatusCode)" -ForegroundColor Yellow
            $testResults.Warnings += "$($endpoint.Name): Status $($response.StatusCode)"
        }
    } catch {
        Write-Host "  ❌ $($endpoint.Name): $($_.Exception.Message)" -ForegroundColor Red
        $testResults.CriticalIssues += "$($endpoint.Name): $($_.Exception.Message)"
        $failed++
    }
}

# 3. Проверка основных функций через API Gateway
Write-Host "`n3. ПРОВЕРКА ОСНОВНЫХ ФУНКЦИЙ" -ForegroundColor Cyan

# Регистрация компании
Write-Host "  Регистрация новой компании..." -ForegroundColor Gray
$timestamp = (Get-Date -Format "yyyyMMddHHmmss")
$companyEmail = "test-fixed-$timestamp@example.com"
$companyName = "Test Fixed Company $timestamp"

try {
    $registerBody = @{
        name = $companyName
        email = $companyEmail
        password = "TestPassword123!"
        phone = "+7-999-111-22-33"
        description = "Company for testing fixed services"
        website = "https://test-fixed-$timestamp.example.com"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "$BASE_URL/v1/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $registerBody -ErrorAction Stop
    
    if ($registerResponse -and $registerResponse.accessToken) {
        Write-Host "  ✅ Регистрация: Успешно" -ForegroundColor Green
        $testResults.Successes += "Company registration: Success"
        $passed++
        
        $accessToken = $registerResponse.accessToken
        
        # Проверка баланса
        Write-Host "  Проверка баланса..." -ForegroundColor Gray
        try {
            $balanceResponse = Invoke-RestMethod -Uri "$BASE_URL/v1/billing/balance" -Method GET -Headers @{"Authorization"="Bearer $accessToken"} -ErrorAction Stop
            if ($balanceResponse -and $balanceResponse.success) {
                Write-Host "  ✅ Баланс: $($balanceResponse.balance) $($balanceResponse.currency)" -ForegroundColor Green
                $testResults.Successes += "Balance check: Success"
                $passed++
            } else {
                Write-Host "  ❌ Баланс: Ошибка получения" -ForegroundColor Red
                $testResults.CriticalIssues += "Balance check: Failed"
                $failed++
            }
        } catch {
            Write-Host "  ❌ Баланс: $($_.Exception.Message)" -ForegroundColor Red
            $testResults.CriticalIssues += "Balance check: $($_.Exception.Message)"
            $failed++
        }
        
        # Проверка AI Models
        Write-Host "  Проверка AI Models..." -ForegroundColor Gray
        try {
            $modelsResponse = Invoke-RestMethod -Uri "$BASE_URL/v1/models" -Method GET -Headers @{"Authorization"="Bearer $accessToken"} -ErrorAction Stop
            if ($modelsResponse -and $modelsResponse.success) {
                Write-Host "  ✅ AI Models: $($modelsResponse.total) моделей" -ForegroundColor Green
                $testResults.Successes += "AI Models: Success"
                $passed++
            } else {
                Write-Host "  ❌ AI Models: Ошибка получения" -ForegroundColor Red
                $testResults.CriticalIssues += "AI Models: Failed"
                $failed++
            }
        } catch {
            Write-Host "  ❌ AI Models: $($_.Exception.Message)" -ForegroundColor Red
            $testResults.CriticalIssues += "AI Models: $($_.Exception.Message)"
            $failed++
        }
        
    } else {
        Write-Host "  ❌ Регистрация: Не удалось получить токен" -ForegroundColor Red
        $testResults.CriticalIssues += "Company registration: No token"
        $failed++
    }
} catch {
    Write-Host "  ❌ Регистрация: $($_.Exception.Message)" -ForegroundColor Red
    $testResults.CriticalIssues += "Company registration: $($_.Exception.Message)"
    $failed++
}

# 4. Итоговый отчет
Write-Host "`n=== ИТОГОВЫЙ ОТЧЕТ ===" -ForegroundColor Yellow
Write-Host "✅ Успешных тестов: $passed" -ForegroundColor Green
Write-Host "❌ Неудачных тестов: $failed" -ForegroundColor Red

if ($testResults.Successes.Count -gt 0) {
    Write-Host "`n✅ УСПЕХИ:" -ForegroundColor Green
    $testResults.Successes | ForEach-Object { Write-Host "  - $_" -ForegroundColor Green }
}

if ($testResults.Warnings.Count -gt 0) {
    Write-Host "`n⚠️  ПРЕДУПРЕЖДЕНИЯ:" -ForegroundColor Yellow
    $testResults.Warnings | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

if ($testResults.CriticalIssues.Count -gt 0) {
    Write-Host "`n❌ КРИТИЧЕСКИЕ ПРОБЛЕМЫ:" -ForegroundColor Red
    $testResults.CriticalIssues | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

$successRate = if (($passed + $failed) -gt 0) { [math]::Round(($passed / ($passed + $failed)) * 100, 2) } else { 0 }
Write-Host "`n📊 Общий процент успеха: $successRate%" -ForegroundColor Cyan

if ($successRate -ge 80) {
    Write-Host "🎉 СИСТЕМА РАБОТАЕТ СТАБИЛЬНО!" -ForegroundColor Green
} elseif ($successRate -ge 60) {
    Write-Host "⚠️  СИСТЕМА РАБОТАЕТ С ОГРАНИЧЕНИЯМИ" -ForegroundColor Yellow
} else {
    Write-Host "❌ СИСТЕМА ТРЕБУЕТ ДОПОЛНИТЕЛЬНОГО ИСПРАВЛЕНИЯ" -ForegroundColor Red
}
