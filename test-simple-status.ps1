# test-simple-status.ps1
# Простой тест статуса сервисов

Write-Host "=== ПРОВЕРКА СТАТУСА СЕРВИСОВ ===" -ForegroundColor Yellow

# 1. Статус Docker контейнеров
Write-Host "`n1. СТАТУС DOCKER КОНТЕЙНЕРОВ" -ForegroundColor Cyan
docker-compose ps

# 2. Проверка health endpoints
Write-Host "`n2. ПРОВЕРКА HEALTH ENDPOINTS" -ForegroundColor Cyan

$endpoints = @(
    "http://localhost:3000/health",
    "http://localhost:3001/health", 
    "http://localhost:3004/health",
    "http://localhost:3005/health",
    "http://localhost:3006/health",
    "http://localhost:3002/health",
    "http://localhost:3003/health"
)

foreach ($url in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 3
        Write-Host "  ✅ $url - $($response.StatusCode)" -ForegroundColor Green
    } catch {
        Write-Host "  ❌ $url - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Тест регистрации через API Gateway
Write-Host "`n3. ТЕСТ РЕГИСТРАЦИИ" -ForegroundColor Cyan
$timestamp = (Get-Date -Format "yyyyMMddHHmmss")
$companyEmail = "test-status-$timestamp@example.com"

try {
    $registerBody = @{
        name = "Test Status Company $timestamp"
        email = $companyEmail
        password = "TestPassword123!"
        phone = "+7-999-111-22-33"
        description = "Company for status testing"
        website = "https://test-status-$timestamp.example.com"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/register" -Method POST -Headers @{"Content-Type"="application/json"} -Body $registerBody -ErrorAction Stop
    
    if ($registerResponse -and $registerResponse.accessToken) {
        Write-Host "  ✅ Регистрация успешна" -ForegroundColor Green
        
        # Тест баланса
        try {
            $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers @{"Authorization"="Bearer $($registerResponse.accessToken)"} -ErrorAction Stop
            Write-Host "  ✅ Баланс: $($balanceResponse.balance) $($balanceResponse.currency)" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ Ошибка получения баланса: $($_.Exception.Message)" -ForegroundColor Red
        }
        
        # Тест AI Models
        try {
            $modelsResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/models" -Method GET -Headers @{"Authorization"="Bearer $($registerResponse.accessToken)"} -ErrorAction Stop
            Write-Host "  ✅ AI Models: $($modelsResponse.total) моделей" -ForegroundColor Green
        } catch {
            Write-Host "  ❌ Ошибка получения AI Models: $($_.Exception.Message)" -ForegroundColor Red
        }
        
    } else {
        Write-Host "  ❌ Ошибка регистрации" -ForegroundColor Red
    }
} catch {
    Write-Host "  ❌ Ошибка регистрации: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ПРОВЕРКА ЗАВЕРШЕНА ===" -ForegroundColor Yellow
