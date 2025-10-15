# Testing referral system through API
Write-Host "=== Testing Referral System ===" -ForegroundColor Green

# 1. Login as referral company
Write-Host "`n1. Logging in as referral company..." -ForegroundColor Yellow
$loginData = @{
    email = "referral@company.com"
    password = "password123"
} | ConvertTo-Json

$loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -Body $loginData -ContentType "application/json"
$referralToken = $loginResponse.accessToken

Write-Host "Logged in as: $($loginResponse.user.email)" -ForegroundColor Green

# 2. Make AI request
Write-Host "`n2. Making AI request..." -ForegroundColor Yellow
$aiRequest = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Test request from referral company. Explain quantum physics."
        }
    )
    max_tokens = 100
} | ConvertTo-Json

$aiResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" -Method POST -Body $aiRequest -ContentType "application/json" -Headers @{Authorization="Bearer $referralToken"}

Write-Host "AI request completed successfully" -ForegroundColor Green
Write-Host "Response: $($aiResponse.choices[0].message.content.Substring(0, 100))..." -ForegroundColor Cyan

# 3. Check billing-service logs
Write-Host "`n3. Checking billing-service logs..." -ForegroundColor Yellow
$logs = docker logs project-billing-service-1 --tail 20
Write-Host "Recent logs:" -ForegroundColor Cyan
$logs | ForEach-Object { Write-Host $_ }

# 4. Check referral transactions in DB
Write-Host "`n4. Checking referral transactions in database..." -ForegroundColor Yellow
$referralTransactions = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT * FROM referral_transactions;" 2>$null
Write-Host "Referral transactions:" -ForegroundColor Cyan
Write-Host $referralTransactions

Write-Host "`n=== Test completed ===" -ForegroundColor Green