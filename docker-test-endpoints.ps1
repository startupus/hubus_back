# ===========================================
# AI AGGREGATOR - DOCKER ENDPOINTS TEST
# Тестирование всех endpoints в Docker-контейнерах
# ===========================================

Write-Host "🧪 Тестирование endpoints AI Aggregator в Docker..." -ForegroundColor Cyan

# Проверка доступности сервисов
$services = @(
    @{Name="API Gateway"; Port=3000; HealthPath="/health"},
    @{Name="Auth Service"; Port=3001; HealthPath="/health"},
    @{Name="Provider Orchestrator"; Port=3002; HealthPath="/health"},
    @{Name="Proxy Service"; Port=3003; HealthPath="/health"},
    @{Name="Billing Service"; Port=3004; HealthPath="/health"},
    @{Name="Analytics Service"; Port=3005; HealthPath="/health"}
)

Write-Host "`n🔍 Проверка доступности сервисов:" -ForegroundColor Green
foreach ($service in $services) {
    $url = "http://localhost:$($service.Port)$($service.HealthPath)"
    try {
        $response = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 5
        Write-Host "✅ $($service.Name): ДОСТУПЕН" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($service.Name): НЕ ДОСТУПЕН ($url)" -ForegroundColor Red
    }
}

# Тестирование API Gateway endpoints
Write-Host "`n🌐 Тестирование API Gateway endpoints:" -ForegroundColor Green

$apiGatewayTests = @(
    @{Name="Health Check"; Method="GET"; Path="/health"},
    @{Name="Auth Register"; Method="POST"; Path="/auth/register"; Body='{"email":"test@example.com","password":"password123","name":"Test User"}'},
    @{Name="Auth Login"; Method="POST"; Path="/auth/login"; Body='{"email":"test@example.com","password":"password123"}'},
    @{Name="Chat Models"; Method="GET"; Path="/chat/models"},
    @{Name="Billing Balance"; Method="GET"; Path="/billing/balance/user123"}
)

foreach ($test in $apiGatewayTests) {
    $url = "http://localhost:3000$($test.Path)"
    try {
        if ($test.Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 5
        } else {
            $response = Invoke-RestMethod -Uri $url -Method $test.Method -Body $test.Body -ContentType "application/json" -TimeoutSec 5
        }
        Write-Host "✅ $($test.Name): OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($test.Name): ОШИБКА - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Тестирование Billing Service endpoints
Write-Host "`n💰 Тестирование Billing Service endpoints:" -ForegroundColor Green

$billingTests = @(
    @{Name="Health Check"; Method="GET"; Path="/health"},
    @{Name="Get Balance"; Method="GET"; Path="/billing/balance/user123"},
    @{Name="Update Balance"; Method="POST"; Path="/billing/balance/update"; Body='{"userId":"user123","amount":100,"operation":"add","description":"Test balance update"}'},
    @{Name="Create Transaction"; Method="POST"; Path="/billing/transactions"; Body='{"userId":"user123","type":"CREDIT","amount":50,"currency":"USD","description":"Test transaction"}'},
    @{Name="Calculate Cost"; Method="POST"; Path="/billing/calculate-cost"; Body='{"userId":"user123","provider":"openai","model":"gpt-3.5-turbo","inputTokens":100,"outputTokens":50}'},
    @{Name="Process Payment"; Method="POST"; Path="/billing/payment"; Body='{"userId":"user123","amount":100,"currency":"USD","paymentMethodId":"pm_test"}'},
    @{Name="Track Usage"; Method="POST"; Path="/billing/usage/track"; Body='{"userId":"user123","service":"ai-chat","resource":"gpt-4","quantity":1,"unit":"request"}'},
    @{Name="Transaction History"; Method="GET"; Path="/billing/transactions/user123"},
    @{Name="Billing Report"; Method="GET"; Path="/billing/report/user123"}
)

foreach ($test in $billingTests) {
    $url = "http://localhost:3004$($test.Path)"
    try {
        if ($test.Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 5
        } else {
            $response = Invoke-RestMethod -Uri $url -Method $test.Method -Body $test.Body -ContentType "application/json" -TimeoutSec 5
        }
        Write-Host "✅ $($test.Name): OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($test.Name): ОШИБКА - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Тестирование Auth Service endpoints
Write-Host "`n🔐 Тестирование Auth Service endpoints:" -ForegroundColor Green

$authTests = @(
    @{Name="Health Check"; Method="GET"; Path="/health"},
    @{Name="User Register"; Method="POST"; Path="/auth/register"; Body='{"email":"test@example.com","password":"password123","name":"Test User"}'},
    @{Name="User Login"; Method="POST"; Path="/auth/login"; Body='{"email":"test@example.com","password":"password123"}'},
    @{Name="Get User"; Method="GET"; Path="/auth/user?email=test@example.com"},
    @{Name="Validate Token"; Method="POST"; Path="/auth/validate-token"; Body='{"token":"test-token"}'},
    @{Name="Create API Key"; Method="POST"; Path="/auth/api-keys"; Body='{"userId":"user123","name":"Test API Key"}'},
    @{Name="Validate API Key"; Method="POST"; Path="/auth/api-keys/validate"; Body='{"apiKey":"test-api-key"}'}
)

foreach ($test in $authTests) {
    $url = "http://localhost:3001$($test.Path)"
    try {
        if ($test.Method -eq "GET") {
            $response = Invoke-RestMethod -Uri $url -Method GET -TimeoutSec 5
        } else {
            $response = Invoke-RestMethod -Uri $url -Method $test.Method -Body $test.Body -ContentType "application/json" -TimeoutSec 5
        }
        Write-Host "✅ $($test.Name): OK" -ForegroundColor Green
    } catch {
        Write-Host "❌ $($test.Name): ОШИБКА - $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Проверка логов на ошибки
Write-Host "`n📝 Проверка логов на ошибки:" -ForegroundColor Yellow
$services = @("api-gateway", "auth-service", "billing-service", "proxy-service", "analytics-service")
foreach ($service in $services) {
    Write-Host "`n🔍 Логи $service:" -ForegroundColor Cyan
    docker-compose logs --tail=5 $service
}

Write-Host "`n🎉 Тестирование завершено!" -ForegroundColor Green
