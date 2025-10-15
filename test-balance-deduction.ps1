# Test balance deduction after AI request

Write-Host "=== TEST BALANCE DEDUCTION ===" -ForegroundColor Cyan
Write-Host ""

# 1. Login
Write-Host "1. Login..." -ForegroundColor Yellow
$loginHeaders = @{ "Content-Type" = "application/json" }
$loginBody = @{ 
    email = "test2@example.com"
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

# 2. Get initial balance
Write-Host "2. Getting initial balance..." -ForegroundColor Yellow
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

Write-Host ""

# 3. Send AI request
Write-Host "3. Sending AI request..." -ForegroundColor Yellow
$chatBody = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Hello! Say one word."
        }
    )
    max_tokens = 10
} | ConvertTo-Json -Depth 10

try {
    $chatResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" -Method POST -Headers $headers -Body $chatBody
    Write-Host "Success: Request completed" -ForegroundColor Green
    Write-Host "Model response: $($chatResponse.choices[0].message.content)" -ForegroundColor Gray
    Write-Host "Tokens used: $($chatResponse.usage.total_tokens)" -ForegroundColor Gray
} catch {
    Write-Host "Error: AI request failed: $_" -ForegroundColor Red
    Write-Host "Details: $($_.Exception.Message)" -ForegroundColor Gray
}

Write-Host ""

# Wait for RabbitMQ processing
Write-Host "4. Waiting for payment processing (5 seconds)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host ""

# 5. Get balance after request
Write-Host "5. Getting balance after request..." -ForegroundColor Yellow
try {
    $balanceAfter = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers $headers
    $finalBalance = [decimal]$balanceAfter.balance.balance
    Write-Host "Success: Final balance: $finalBalance $currency" -ForegroundColor Green
} catch {
    Write-Host "Error: Failed to get balance: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 6. Compare results
Write-Host "=== RESULTS ===" -ForegroundColor Cyan
Write-Host "Initial balance: $initialBalance $currency"
$difference = $initialBalance - $finalBalance
Write-Host "Final balance:   $finalBalance $currency"
Write-Host "Deducted:        $difference $currency"

if ($difference -gt 0) {
    Write-Host "SUCCESS: Funds were deducted from balance!" -ForegroundColor Green
} elseif ($difference -eq 0) {
    Write-Host "WARNING: Funds were NOT deducted!" -ForegroundColor Yellow
} else {
    Write-Host "ERROR: Balance increased!" -ForegroundColor Red
}

Write-Host ""

# 7. Get transaction history
Write-Host "7. Transaction history..." -ForegroundColor Yellow
try {
    $transactions = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/transactions?limit=5" -Method GET -Headers $headers
    Write-Host "Success: Recent transactions:" -ForegroundColor Green
    $transactions.data | ForEach-Object {
        Write-Host "  - $($_.type): $($_.amount) RUB ($($_.description))" -ForegroundColor Gray
    }
} catch {
    Write-Host "Error: Failed to get transactions: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST COMPLETED ===" -ForegroundColor Cyan

