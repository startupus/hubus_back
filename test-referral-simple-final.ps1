# Simple test for referral system
Write-Host "Testing referral system..."

# Get fresh token
$body = '{"email":"referral@example.com","password":"password123"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
$token = $response.accessToken

$headers = @{"Authorization" = "Bearer $token"}

# Test 1: Make an AI request
Write-Host "1. Making an AI request..."
$aiRequest = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Hello, this is a test request for referral system"
        }
    )
    max_tokens = 50
} | ConvertTo-Json -Depth 3

try {
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" -Method POST -ContentType "application/json" -Headers $headers -Body $aiRequest
    Write-Host "AI request successful"
} catch {
    Write-Host "AI request failed: $($_.Exception.Message)"
}

# Test 2: Check billing service logs for referral bonus
Write-Host "2. Checking billing service logs..."
$billingLogs = docker logs project-billing-service-1 --tail 50 | findstr "Referral bonus condition check"
Write-Host "Referral bonus condition check logs: $billingLogs"

# Test 3: Check for referral transactions
Write-Host "3. Checking for referral transactions..."
$referralTransactions = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT COUNT(*) FROM referral_transactions;"
Write-Host "Referral transactions count: $referralTransactions"

Write-Host "Referral system test completed."
