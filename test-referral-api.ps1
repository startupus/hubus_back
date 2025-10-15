# Test referral system through API
Write-Host "Testing referral system through API..."

# Test 1: Check if referral system is working by checking the API
Write-Host "1. Checking referral system through API..."

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
    
    # Now try to get referral earnings
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
    
    # Try to get referral earnings summary
    try {
        $referralSummaryResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/referral/earnings/summary/648d62be-32b7-44be-b5c3-1ceec6fbd80d" -Method GET -Headers $referralHeaders
        Write-Host "Referral earnings summary response: $referralSummaryResponse"
    } catch {
        Write-Host "Referral earnings summary request failed: $($_.Exception.Message)"
    }
    
    # Try to get referrals list
    try {
        $referralsResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/referral/referrals/648d62be-32b7-44be-b5c3-1ceec6fbd80d" -Method GET -Headers $referralHeaders
        Write-Host "Referrals list response: $referralsResponse"
    } catch {
        Write-Host "Referrals list request failed: $($_.Exception.Message)"
    }
    
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
}

Write-Host "Referral system API test completed."
