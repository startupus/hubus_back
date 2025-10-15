# Test subscription system with data
Write-Host "Testing subscription system with data..."

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

# Test 3: Get active subscription
Write-Host "3. Getting active subscription..."
try {
    $activeSubscription = Invoke-RestMethod -Uri "http://localhost:3000/v1/pricing/subscriptions/fb20fa7b-8f0f-448d-ba17-bd82cadcd04a/active" -Method GET -Headers $headers
    Write-Host "Active subscription: $activeSubscription"
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

# Test 5: Make an AI request to test subscription usage
Write-Host "5. Making an AI request to test subscription usage..."
$aiRequest = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Hello, this is a test request for subscription system"
        }
    )
    max_tokens = 50
} | ConvertTo-Json -Depth 3

try {
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" -Method POST -ContentType "application/json" -Headers $headers -Body $aiRequest
    Write-Host "AI request successful: $($aiResponse.choices[0].message.content)"
} catch {
    Write-Host "AI request failed: $($_.Exception.Message)"
}

# Test 6: Check subscription usage after AI request
Write-Host "6. Checking subscription usage after AI request..."
$subscriptionUsage = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT input_tokens_used, output_tokens_used FROM subscriptions WHERE company_id = 'fb20fa7b-8f0f-448d-ba17-bd82cadcd04a';"
Write-Host "Subscription usage: $subscriptionUsage"

Write-Host "Subscription system test completed."
