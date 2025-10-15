# Упрощенное тестирование системы
Write-Host "=== SIMPLE SYSTEM TEST ===" -ForegroundColor Cyan

# 1. Регистрация пользователя
Write-Host "1. Registering new user..." -ForegroundColor Yellow
$testEmail = "testuser$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$testPassword = "TestPassword123!"

try {
    $registerBody = @{
        email = $testEmail
        password = $testPassword
        firstName = "Test"
        lastName = "User"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    
    if ($registerResponse.accessToken -and $registerResponse.user) {
        $token = $registerResponse.accessToken
        $userId = $registerResponse.user.id
        Write-Host "SUCCESS: User registered - $($registerResponse.user.email)" -ForegroundColor Green
    } else {
        Write-Host "FAILED: Registration failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: Registration failed - $_" -ForegroundColor Red
    exit 1
}

# 2. Проверка синхронизации с billing
Write-Host "`n2. Checking billing sync..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers @{ "Authorization" = "Bearer $token" }
    
    if ($balanceResponse.balance -and $balanceResponse.balance.balance -eq 100) {
        Write-Host "SUCCESS: Billing sync working - Balance: $($balanceResponse.balance.balance) $($balanceResponse.balance.currency)" -ForegroundColor Green
        $initialBalance = [decimal]$balanceResponse.balance.balance
    } else {
        Write-Host "FAILED: Billing sync failed" -ForegroundColor Red
        Write-Host "Response: $($balanceResponse | ConvertTo-Json)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: Billing sync failed - $_" -ForegroundColor Red
}

# 3. Тест ИИ запроса
Write-Host "`n3. Testing AI request..." -ForegroundColor Yellow
try {
    $aiRequest = @{
        model = "gpt-3.5-turbo"
        messages = @(
            @{
                role = "user"
                content = "Hello! This is a test message."
            }
        )
        max_tokens = 50
        temperature = 0.7
    } | ConvertTo-Json

    $aiResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" -Method POST -Body $aiRequest -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $token" }
    
    if ($aiResponse.choices -and $aiResponse.choices.Count -gt 0) {
        Write-Host "SUCCESS: AI request completed" -ForegroundColor Green
        Write-Host "Response: $($aiResponse.choices[0].message.content.Substring(0, [Math]::Min(50, $aiResponse.choices[0].message.content.Length)))..." -ForegroundColor Gray
    } else {
        Write-Host "FAILED: AI request failed" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: AI request failed - $_" -ForegroundColor Red
}

# 4. Проверка списания средств
Write-Host "`n4. Checking balance deduction..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers @{ "Authorization" = "Bearer $token" }
    
    if ($balanceResponse.balance) {
        $finalBalance = [decimal]$balanceResponse.balance.balance
        $deducted = $initialBalance - $finalBalance
        
        if ($deducted -gt 0) {
            Write-Host "SUCCESS: Funds deducted - $deducted USD (was: $initialBalance, now: $finalBalance)" -ForegroundColor Green
        } else {
            Write-Host "WARNING: No funds deducted (balance: $finalBalance)" -ForegroundColor Yellow
        }
    } else {
        Write-Host "FAILED: Could not get balance" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Balance check failed - $_" -ForegroundColor Red
}

# 5. Прямой тест billing service
Write-Host "`n5. Testing billing service directly..." -ForegroundColor Yellow
try {
    $billingEvent = @{
        companyId = $userId
        service = "ai-chat"
        resource = "tokens"
        quantity = 5
        metadata = @{
            provider = "openai"
            model = "gpt-3.5-turbo"
            tokens = 5
            currency = "USD"
            requestId = "test-direct-$(Get-Date -Format 'yyyyMMdd-HHmmss-fff')"
        }
    } | ConvertTo-Json

    $billingResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/usage/track" -Method POST -Body $billingEvent -ContentType "application/json"
    
    if ($billingResponse.success) {
        Write-Host "SUCCESS: Direct billing event processed - Cost: $($billingResponse.cost)" -ForegroundColor Green
    } else {
        Write-Host "FAILED: Direct billing event failed - $($billingResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Direct billing test failed - $_" -ForegroundColor Red
}

# 6. Health checks
Write-Host "`n6. Checking service health..." -ForegroundColor Yellow
$services = @(
    @{ Name = "API Gateway"; Url = "http://localhost:3000/health" },
    @{ Name = "Auth Service"; Url = "http://localhost:3001/health" },
    @{ Name = "Billing Service"; Url = "http://localhost:3004/health" },
    @{ Name = "Provider Orchestrator"; Url = "http://localhost:3002/health" },
    @{ Name = "Proxy Service"; Url = "http://localhost:3003/health" }
)

foreach ($service in $services) {
    try {
        $healthResponse = Invoke-RestMethod -Uri $service.Url -Method GET
        Write-Host "SUCCESS: $($service.Name) is healthy" -ForegroundColor Green
    } catch {
        Write-Host "FAILED: $($service.Name) is not responding" -ForegroundColor Red
    }
}

Write-Host "`n=== TEST COMPLETED ===" -ForegroundColor Cyan
