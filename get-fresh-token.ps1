# Get fresh token for testing
Write-Host "Getting fresh token for testing..."

# Login as referral company
$loginData = @{
    email = "referral@example.com"
    password = "password123"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -Headers $headers -Body $loginData
    Write-Host "Login successful!"
    Write-Host "Token: $($response.token)"
    Write-Host "Expires at: $($response.expiresAt)"
    
    # Save token to file
    $response.token | Out-File -FilePath "fresh-token.txt" -Encoding UTF8
    Write-Host "Token saved to fresh-token.txt"
    
    # Test the token by making a simple request
    $testHeaders = @{
        "Authorization" = "Bearer $($response.token)"
    }
    
    try {
        $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers $testHeaders
        Write-Host "Token test successful! Balance: $($balanceResponse.balance) $($balanceResponse.currency)"
    } catch {
        Write-Host "Token test failed: $($_.Exception.Message)"
    }
    
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}
