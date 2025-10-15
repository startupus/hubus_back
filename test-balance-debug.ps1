# Debug test for balance checking

Write-Host "=== BALANCE DEBUG TEST ===" -ForegroundColor Cyan
Write-Host ""

# 1. Login
Write-Host "1. Login..." -ForegroundColor Yellow
$loginHeaders = @{ "Content-Type" = "application/json" }
$loginBody = @{ 
    email = "test@example.com"
    password = "password123" 
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -Headers $loginHeaders -Body $loginBody
    $token = $loginResponse.accessToken
    Write-Host "Success: Logged in" -ForegroundColor Green
    Write-Host "User ID: $($loginResponse.user.id)" -ForegroundColor Gray
} catch {
    Write-Host "Error: Login failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Get balance multiple times to see if it changes
Write-Host "2. Getting balance multiple times..." -ForegroundColor Yellow
$headers = @{ 
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json" 
}

for ($i = 1; $i -le 3; $i++) {
    try {
        $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers $headers
        $balance = [decimal]$balanceResponse.balance.balance
        $currency = $balanceResponse.balance.currency
        Write-Host "Attempt $i - Balance: $balance $currency" -ForegroundColor Green
    } catch {
        Write-Host "Attempt $i - Error: $_" -ForegroundColor Red
    }
    Start-Sleep -Seconds 2
}

Write-Host ""

# 3. Send AI request
Write-Host "3. Sending AI request..." -ForegroundColor Yellow
$chatBody = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Say hello"
        }
    )
    max_tokens = 5
} | ConvertTo-Json -Depth 10

try {
    $chatResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" -Method POST -Headers $headers -Body $chatBody
    Write-Host "Success: Request completed" -ForegroundColor Green
    Write-Host "Model response: $($chatResponse.choices[0].message.content)" -ForegroundColor Gray
    Write-Host "Tokens used: $($chatResponse.usage.total_tokens)" -ForegroundColor Gray
} catch {
    Write-Host "Error: AI request failed: $_" -ForegroundColor Red
}

Write-Host ""

# 4. Wait and check balance again
Write-Host "4. Waiting 10 seconds and checking balance..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

try {
    $balanceAfter = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers $headers
    $finalBalance = [decimal]$balanceAfter.balance.balance
    Write-Host "Final balance: $finalBalance $currency" -ForegroundColor Green
} catch {
    Write-Host "Error: Failed to get final balance: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== DEBUG TEST COMPLETED ===" -ForegroundColor Cyan
