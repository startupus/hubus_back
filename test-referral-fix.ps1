# Test referral system after fix
Write-Host "Testing referral system after fix..."

# First, let's register the referral company again
Write-Host "Registering referral company..."
$registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/register" -Method POST -ContentType "application/json" -Body '{"email":"referral@example.com","password":"password123","companyName":"Referral Company"}'
Write-Host "Registration successful"

# Login as referral company
Write-Host "Logging in as referral company..."
$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -ContentType "application/json" -Body '{"email":"referral@example.com","password":"password123"}'
$token = $loginResponse.token
Write-Host "Login successful. Token: $($token.Substring(0,20))..."

# Check balance
Write-Host "Checking balance..."
$balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers @{"Authorization"="Bearer $token"}
Write-Host "Balance: $($balanceResponse.balance) $($balanceResponse.currency)"

# Make AI request
Write-Host "Making AI request..."
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
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" -Method POST -ContentType "application/json" -Headers @{"Authorization"="Bearer $token"} -Body $aiRequest
    Write-Host "AI request successful: $($aiResponse.choices[0].message.content)"
} catch {
    Write-Host "AI request failed: $($_.Exception.Message)"
}

# Check balance after request
Write-Host "Checking balance after request..."
$balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers @{"Authorization"="Bearer $token"}
Write-Host "Balance after request: $($balanceResponse.balance) $($balanceResponse.currency)"

# Check billing service logs
Write-Host "Checking billing service logs..."
docker logs project-billing-service-1 --tail 20

# Check for referral transactions in database
Write-Host "Checking for referral transactions..."
docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT * FROM \"ReferralTransaction\" ORDER BY \"createdAt\" DESC LIMIT 5;"

Write-Host "Referral system test completed."