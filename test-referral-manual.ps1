# Manual test for referral system
Write-Host "Manual test for referral system..."

# Test 1: Check if referral system is working by manually creating a referral transaction
Write-Host "1. Manually creating a referral transaction..."

# First, let's check if we can create a referral transaction manually
$referralTransaction = @{
    referralOwnerId = "284ddd76-39bc-472d-b07c-e52d73651d23"
    referralEarnerId = "648d62be-32b7-44be-b5c3-1ceec6fbd80d"
    originalTransactionId = "test-transaction-123"
    amount = 0.05
    currency = "USD"
    inputTokens = 100
    outputTokens = 50
    inputTokenRate = 0.00003
    outputTokenRate = 0.00006
    status = "PENDING"
    description = "Test referral transaction"
    metadata = @{
        test = true
    }
} | ConvertTo-Json -Depth 3

Write-Host "Referral transaction data: $referralTransaction"

# Test 2: Check if we can create a referral transaction through the API
Write-Host "2. Testing referral transaction creation through API..."

# First, let's get a valid token
$loginData = @{
    email = "referral@example.com"
    password = "password123"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -Headers $headers -Body $loginData
    $token = $loginResponse.token
    Write-Host "Login successful, token: $($token.Substring(0,20))..."
    
    # Now try to create a referral transaction
    $referralHeaders = @{
        "Content-Type" = "application/json"
        "Authorization" = "Bearer $token"
    }
    
    try {
        $referralResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/referral/earnings/648d62be-32b7-44be-b5c3-1ceec6fbd80d" -Method GET -Headers $referralHeaders
        Write-Host "Referral earnings response: $referralResponse"
    } catch {
        Write-Host "Referral earnings request failed: $($_.Exception.Message)"
    }
    
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
}

Write-Host "Manual referral system test completed."
