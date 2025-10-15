# Test subscription system
Write-Host "Testing subscription system..."

# Get fresh token
$body = '{"email":"referral@example.com","password":"password123"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
$token = $response.accessToken
Write-Host "Token obtained: $($token.Substring(0,20))..."

$headers = @{"Authorization" = "Bearer $token"}

# Test 1: Get subscription plans
Write-Host "1. Getting subscription plans..."
try {
    $plansResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/pricing/plans" -Method GET -Headers $headers
    Write-Host "Subscription plans: $plansResponse"
} catch {
    Write-Host "Failed to get subscription plans: $($_.Exception.Message)"
}

# Test 2: Get current subscription
Write-Host "2. Getting current subscription..."
try {
    $currentSubscription = Invoke-RestMethod -Uri "http://localhost:3000/v1/pricing/subscriptions/fb20fa7b-8f0f-448d-ba17-bd82cadcd04a" -Method GET -Headers $headers
    Write-Host "Current subscription: $currentSubscription"
} catch {
    Write-Host "Failed to get current subscription: $($_.Exception.Message)"
}

# Test 3: Get subscription usage
Write-Host "3. Getting subscription usage..."
try {
    $usageResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/pricing/subscriptions/fb20fa7b-8f0f-448d-ba17-bd82cadcd04a/active" -Method GET -Headers $headers
    Write-Host "Active subscription: $usageResponse"
} catch {
    Write-Host "Failed to get active subscription: $($_.Exception.Message)"
}

# Test 4: Check current balance
Write-Host "4. Checking current balance..."
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers $headers
    Write-Host "Current balance: $($balanceResponse.balance) $($balanceResponse.currency)"
} catch {
    Write-Host "Failed to get balance: $($_.Exception.Message)"
}

Write-Host "Subscription system test completed."
