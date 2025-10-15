# Test subscription system directly with billing service
Write-Host "Testing subscription system directly with billing service..."

# Get fresh token
$body = '{"email":"referral@example.com","password":"password123"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
$token = $response.accessToken
Write-Host "Token obtained: $($token.Substring(0,20))..."

$headers = @{"Authorization" = "Bearer $token"}

# Test 1: Get pricing plans directly from billing service
Write-Host "1. Getting pricing plans directly from billing service..."
try {
    $plansResponse = Invoke-RestMethod -Uri "http://localhost:3004/pricing/plans" -Method GET -Headers $headers
    Write-Host "Pricing plans: $plansResponse"
} catch {
    Write-Host "Failed to get pricing plans: $($_.Exception.Message)"
}

# Test 2: Get subscriptions directly from billing service
Write-Host "2. Getting subscriptions directly from billing service..."
try {
    $subscriptionsResponse = Invoke-RestMethod -Uri "http://localhost:3004/pricing/subscriptions/fb20fa7b-8f0f-448d-ba17-bd82cadcd04a" -Method GET -Headers $headers
    Write-Host "Subscriptions: $subscriptionsResponse"
} catch {
    Write-Host "Failed to get subscriptions: $($_.Exception.Message)"
}

# Test 3: Get active subscription directly from billing service
Write-Host "3. Getting active subscription directly from billing service..."
try {
    $activeSubscription = Invoke-RestMethod -Uri "http://localhost:3004/pricing/subscriptions/fb20fa7b-8f0f-448d-ba17-bd82cadcd04a/active" -Method GET -Headers $headers
    Write-Host "Active subscription: $activeSubscription"
} catch {
    Write-Host "Failed to get active subscription: $($_.Exception.Message)"
}

Write-Host "Direct billing service test completed."
