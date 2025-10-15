# Test balance update via API
Write-Host "=== Testing Balance Update ===" -ForegroundColor Green

# 1. Get current balance
Write-Host "1. Getting current balance..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/813879da-56eb-49d2-a85d-d1ae92ac3f90" -Method GET
    Write-Host "Current balance: $($balanceResponse.balance.balance) $($balanceResponse.balance.currency)" -ForegroundColor Cyan
} catch {
    Write-Host "Error getting balance: $_" -ForegroundColor Red
    exit 1
}

# 2. Send billing event via API
Write-Host "2. Sending billing event via API..." -ForegroundColor Yellow
$billingEvent = @{
    companyId = "813879da-56eb-49d2-a85d-d1ae92ac3f90"
    service = "ai-chat"
    resource = "tokens"
    quantity = 100
    metadata = @{
        provider = "openai"
        model = "gpt-3.5-turbo"
        tokens = 100
        currency = "USD"
        requestId = "test-api-$(Get-Date -Format 'yyyyMMdd-HHmmss-fff')"
    }
} | ConvertTo-Json

try {
    $trackResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/usage/track" -Method POST -Body $billingEvent -ContentType "application/json"
    Write-Host "Billing event sent successfully" -ForegroundColor Green
    Write-Host "Response: $($trackResponse | ConvertTo-Json)" -ForegroundColor Gray
} catch {
    Write-Host "Error sending billing event: $_" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

# 3. Wait for processing
Write-Host "3. Waiting for processing (3 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# 4. Check updated balance
Write-Host "4. Checking updated balance..." -ForegroundColor Yellow
try {
    $newBalanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/813879da-56eb-49d2-a85d-d1ae92ac3f90" -Method GET
    Write-Host "New balance: $($newBalanceResponse.balance.balance) $($newBalanceResponse.balance.currency)" -ForegroundColor Cyan
    
    $oldBalance = [decimal]$balanceResponse.balance.balance
    $newBalance = [decimal]$newBalanceResponse.balance.balance
    $difference = $oldBalance - $newBalance
    
    if ($difference -gt 0) {
        Write-Host "SUCCESS: Balance updated! Debited: $difference" -ForegroundColor Green
    } else {
        Write-Host "FAILED: Balance NOT updated!" -ForegroundColor Red
    }
} catch {
    Write-Host "Error getting updated balance: $_" -ForegroundColor Red
}

Write-Host "=== Test completed ===" -ForegroundColor Green
