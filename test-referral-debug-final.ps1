# Test referral system with debug logging
Write-Host "Testing referral system with debug logging..."

# Get fresh token
$body = '{"email":"referral@example.com","password":"password123"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
$token = $response.accessToken
Write-Host "Token obtained: $($token.Substring(0,20))..."

$headers = @{"Authorization" = "Bearer $token"}

# Test 1: Make an AI request
Write-Host "1. Making an AI request..."
$aiRequest = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Hello, this is a test request for referral system debugging"
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

# Test 2: Check billing service logs
Write-Host "2. Checking billing service logs..."
$billingLogs = docker logs project-billing-service-1 --tail 30
Write-Host "Billing service logs: $billingLogs"

# Test 3: Check for referral transactions
Write-Host "3. Checking for referral transactions..."
$referralTransactions = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT COUNT(*) FROM referral_transactions;"
Write-Host "Referral transactions count: $referralTransactions"

Write-Host "Referral system debug test completed."
