# Get new token for referral user
$loginData = @{
    email = "referral@example.com"
    password = "password123"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -Headers $headers -Body $loginData
    Write-Host "New token: $($response.token)"
    Write-Host "Token expires at: $($response.expiresAt)"
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
}
