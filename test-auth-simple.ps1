# Simple auth test
Write-Host "Testing authentication..."

# Test login
$body = '{"email":"referral@example.com","password":"password123"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -ContentType "application/json" -Body $body

Write-Host "Response: $response"
Write-Host "Token: $($response.accessToken)"
Write-Host "Expires: $($response.expiresIn)"

# Test token
$headers = @{"Authorization" = "Bearer $($response.accessToken)"}
$balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers $headers
Write-Host "Balance: $($balanceResponse.balance) $($balanceResponse.currency)"
