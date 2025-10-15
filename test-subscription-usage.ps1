# Test subscription usage
Write-Host "Testing subscription usage..."

# Get fresh token
$body = '{"email":"referral@example.com","password":"password123"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
$token = $response.accessToken
Write-Host "Token obtained: $($token.Substring(0,20))..."

$headers = @{"Authorization" = "Bearer $token"}

# Test 1: Check subscription before AI request
Write-Host "1. Checking subscription before AI request..."
$subscriptionBefore = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT input_tokens_used, output_tokens_used, input_tokens_limit, output_tokens_limit FROM subscriptions WHERE company_id = 'fb20fa7b-8f0f-448d-ba17-bd82cadcd04a';"
Write-Host "Subscription before: $subscriptionBefore"

# Test 2: Make an AI request
Write-Host "2. Making an AI request..."
$aiRequest = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Hello, this is a test request for subscription usage tracking"
        }
    )
    max_tokens = 100
} | ConvertTo-Json -Depth 3

try {
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" -Method POST -ContentType "application/json" -Headers $headers -Body $aiRequest
    Write-Host "AI request successful: $($aiResponse.choices[0].message.content)"
} catch {
    Write-Host "AI request failed: $($_.Exception.Message)"
}

# Test 3: Check subscription after AI request
Write-Host "3. Checking subscription after AI request..."
$subscriptionAfter = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT input_tokens_used, output_tokens_used, input_tokens_limit, output_tokens_limit FROM subscriptions WHERE company_id = 'fb20fa7b-8f0f-448d-ba17-bd82cadcd04a';"
Write-Host "Subscription after: $subscriptionAfter"

# Test 4: Check balance after AI request
Write-Host "4. Checking balance after AI request..."
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers $headers
    Write-Host "Balance after: $($balanceResponse.balance) $($balanceResponse.currency)"
} catch {
    Write-Host "Failed to get balance: $($_.Exception.Message)"
}

# Test 5: Check billing service logs
Write-Host "5. Checking billing service logs..."
$billingLogs = docker logs project-billing-service-1 --tail 20
Write-Host "Billing service logs: $billingLogs"

Write-Host "Subscription usage test completed."
