# Test Referral System
Write-Host "Testing Referral System..." -ForegroundColor Green

$baseUrl = "http://localhost:3000"
$authUrl = "http://localhost:3001"
$billingUrl = "http://localhost:3004"

# Test data
$referrerData = @{
    name = "Referrer Company"
    email = "referrer@example.com"
    password = "password123"
    description = "Company that refers others"
}

$refereeData = @{
    name = "Referred Company"
    email = "referred@example.com"
    password = "password123"
    description = "Company referred by referrer"
}

Write-Host "`n=== Step 1: Register Referrer Company ===" -ForegroundColor Cyan
$referrerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body ($referrerData | ConvertTo-Json) -ContentType "application/json"
Write-Host "Referrer registered: $($referrerResponse.user.email)" -ForegroundColor Green
$referrerToken = $referrerResponse.accessToken
$referrerCompanyId = $referrerResponse.user.id

Write-Host "`n=== Step 2: Create Referral Code ===" -ForegroundColor Cyan
$referralCodeData = @{
    description = "My referral code"
    maxUses = 10
}
$referralCodeResponse = Invoke-RestMethod -Uri "$authUrl/referral/codes" -Method Post -Body ($referralCodeData | ConvertTo-Json) -ContentType "application/json" -Headers @{Authorization = "Bearer $referrerToken"}
Write-Host "Referral code created: $($referralCodeResponse.code)" -ForegroundColor Green
$referralCode = $referralCodeResponse.code

Write-Host "`n=== Step 3: Register Company with Referral Code ===" -ForegroundColor Cyan
$refereeDataWithCode = $refereeData + @{referralCode = $referralCode}
$refereeResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body ($refereeDataWithCode | ConvertTo-Json) -ContentType "application/json"
Write-Host "Referred company registered: $($refereeResponse.user.email)" -ForegroundColor Green
$refereeToken = $refereeResponse.accessToken
$refereeCompanyId = $refereeResponse.user.id

Write-Host "`n=== Step 4: Check Referral Statistics ===" -ForegroundColor Cyan
$referralStats = Invoke-RestMethod -Uri "$authUrl/referral/stats" -Method Get -Headers @{Authorization = "Bearer $referrerToken"}
Write-Host "Referral stats:" -ForegroundColor Yellow
Write-Host "  Total codes: $($referralStats.totalCodes)"
Write-Host "  Active codes: $($referralStats.activeCodes)"
Write-Host "  Total uses: $($referralStats.totalUses)"
Write-Host "  Total referrals: $($referralStats.totalReferrals)"

Write-Host "`n=== Step 5: Add Balance to Referred Company ===" -ForegroundColor Cyan
$balanceData = @{
    amount = 100
    operation = "add"
    description = "Initial balance for testing"
}
$balanceResponse = Invoke-RestMethod -Uri "$billingUrl/billing/balance/update" -Method Post -Body ($balanceData | ConvertTo-Json) -ContentType "application/json" -Headers @{Authorization = "Bearer $refereeToken"}
Write-Host "Balance added: $($balanceResponse.balance.balance)" -ForegroundColor Green

Write-Host "`n=== Step 6: Simulate AI Request (with token usage) ===" -ForegroundColor Cyan
$aiRequestData = @{
    amount = 5.50
    operation = "subtract"
    description = "AI request - GPT-4 usage"
    metadata = @{
        inputTokens = 1000
        outputTokens = 500
        inputTokenPrice = 0.00003
        outputTokenPrice = 0.00006
        provider = "openai"
        model = "gpt-4"
    }
}
$aiResponse = Invoke-RestMethod -Uri "$billingUrl/billing/balance/update" -Method Post -Body ($aiRequestData | ConvertTo-Json) -ContentType "application/json" -Headers @{Authorization = "Bearer $refereeToken"}
Write-Host "AI request processed. New balance: $($aiResponse.balance.balance)" -ForegroundColor Green

Write-Host "`n=== Step 7: Check Referral Bonuses ===" -ForegroundColor Cyan
Start-Sleep -Seconds 2  # Wait for referral processing
$referralBonuses = Invoke-RestMethod -Uri "$billingUrl/referral/stats" -Method Get -Headers @{Authorization = "Bearer $referrerToken"}
Write-Host "Referral bonuses earned:" -ForegroundColor Yellow
Write-Host "  Total earnings: $($referralBonuses.totalEarnings)"
Write-Host "  Total transactions: $($referralBonuses.totalTransactions)"

Write-Host "`n=== Step 8: Check Referrer's Balance ===" -ForegroundColor Cyan
$referrerBalance = Invoke-RestMethod -Uri "$billingUrl/billing/balance" -Method Get -Headers @{Authorization = "Bearer $referrerToken"}
Write-Host "Referrer's balance: $($referrerBalance.balance)" -ForegroundColor Green

Write-Host "`n=== Step 9: Get Referral Transactions ===" -ForegroundColor Cyan
$referralTransactions = Invoke-RestMethod -Uri "$billingUrl/referral/transactions" -Method Get -Headers @{Authorization = "Bearer $referrerToken"}
Write-Host "Referral transactions:" -ForegroundColor Yellow
foreach ($transaction in $referralTransactions.transactions) {
    Write-Host "  Amount: $($transaction.amount), Status: $($transaction.status), Description: $($transaction.description)"
}

Write-Host "`n=== Referral System Test Completed! ===" -ForegroundColor Green
Write-Host "Referrer Company ID: $referrerCompanyId" -ForegroundColor Cyan
Write-Host "Referred Company ID: $refereeCompanyId" -ForegroundColor Cyan
Write-Host "Referral Code: $referralCode" -ForegroundColor Cyan
