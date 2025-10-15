# Test balance type and values

Write-Host "=== BALANCE TYPE TEST ===" -ForegroundColor Cyan
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
} catch {
    Write-Host "Error: Login failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Test different balance endpoints
Write-Host "2. Testing different balance endpoints..." -ForegroundColor Yellow
$headers = @{ 
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json" 
}

# Test API Gateway endpoint
Write-Host "API Gateway endpoint:" -ForegroundColor Green
try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers $headers
    Write-Host "  Balance: $($response1.balance.balance)" -ForegroundColor Gray
    Write-Host "  Type: $($response1.balance.balance.GetType().Name)" -ForegroundColor Gray
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}

# Test direct billing service endpoint
Write-Host "Direct billing service endpoint:" -ForegroundColor Green
try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/9ef2c7b8-d80e-4877-af80-c100b6392bfb" -Method GET
    Write-Host "  Balance: $($response2.balance.balance)" -ForegroundColor Gray
    Write-Host "  Type: $($response2.balance.balance.GetType().Name)" -ForegroundColor Gray
} catch {
    Write-Host "  Error: $_" -ForegroundColor Red
}

Write-Host ""

# 3. Test with different amounts
Write-Host "3. Testing with different amounts..." -ForegroundColor Yellow
$testAmounts = @(0.001, 0.01, 0.1, 1.0, 10.0, 100.0)

foreach ($amount in $testAmounts) {
    Write-Host "Testing amount: $amount" -ForegroundColor Gray
    $result = 100 - $amount
    Write-Host "  100 - $amount = $result" -ForegroundColor Gray
    if ($result -lt 0) {
        Write-Host "  WARNING: Result is negative!" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=== TEST COMPLETED ===" -ForegroundColor Cyan
