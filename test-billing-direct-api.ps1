# Прямой тест биллинга через HTTP API
Write-Host "=== DIRECT BILLING API TEST ===" -ForegroundColor Cyan

# 1. Login
Write-Host "1. Login..." -ForegroundColor Yellow
$loginBody = @{ 
    email = "test2@example.com"
    password = "password123" 
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.accessToken
    $userId = $loginResponse.user.id
    Write-Host "Success: Logged in" -ForegroundColor Green
    Write-Host "User ID: $userId" -ForegroundColor Gray
} catch {
    Write-Host "Error: Login failed: $_" -ForegroundColor Red
    exit 1
}

# 2. Get initial balance
Write-Host "`n2. Getting initial balance..." -ForegroundColor Yellow
$headers = @{ 
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json" 
}

try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers $headers
    $initialBalance = [decimal]$balanceResponse.balance.balance
    $currency = $balanceResponse.balance.currency
    Write-Host "Success: Initial balance: $initialBalance $currency" -ForegroundColor Green
} catch {
    Write-Host "Error: Failed to get balance: $_" -ForegroundColor Red
    exit 1
}

# 3. Send billing event directly to billing service
Write-Host "`n3. Sending billing event to billing service..." -ForegroundColor Yellow

$billingEvent = @{
    companyId = $userId
    service = "ai-chat"
    resource = "tokens"
    quantity = 14
    metadata = @{
        provider = "openai"
        model = "gpt-3.5-turbo"
        tokens = 14
        currency = "USD"
        requestId = "test-request-$(Get-Date -Format 'yyyyMMdd-HHmmss-fff')"
    }
} | ConvertTo-Json

try {
    # Send directly to billing service
    $billingResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/usage/track" -Method POST -Body $billingEvent -ContentType "application/json"
    Write-Host "Success: Billing event sent to billing service" -ForegroundColor Green
    Write-Host "Response: $($billingResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "Error: Failed to send billing event: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

# 4. Wait for processing
Write-Host "`n4. Waiting for payment processing (5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 5. Get final balance
Write-Host "`n5. Getting balance after request..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers $headers
    $finalBalance = [decimal]$balanceResponse.balance.balance
    Write-Host "Success: Final balance: $finalBalance $currency" -ForegroundColor Green
} catch {
    Write-Host "Error: Failed to get final balance: $_" -ForegroundColor Red
    exit 1
}

# 6. Results
Write-Host "`n=== RESULTS ===" -ForegroundColor Cyan
Write-Host "Initial balance: $initialBalance $currency" -ForegroundColor White
Write-Host "Final balance:   $finalBalance $currency" -ForegroundColor White
$deducted = $initialBalance - $finalBalance
Write-Host "Deducted:        $deducted $currency" -ForegroundColor White

if ($deducted -gt 0) {
    Write-Host "SUCCESS: Funds were deducted!" -ForegroundColor Green
} else {
    Write-Host "WARNING: Funds were NOT deducted!" -ForegroundColor Red
}

Write-Host "`n=== TEST COMPLETED ===" -ForegroundColor Cyan
