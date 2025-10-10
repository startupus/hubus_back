Write-Host "=== Testing Referral System ===" -ForegroundColor Green

# Step 1: Register user 1
Write-Host "`n1. Registering user 1..." -ForegroundColor Yellow
$user1Data = '{"name":"User 1 Company","email":"user1-basic@example.com","password":"password123","description":"Test company for user 1"}'

try {
    $user1Response = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $user1Data -ContentType "application/json"
    Write-Host "✓ User 1 registered" -ForegroundColor Green
    Write-Host "  ID: $($user1Response.company.id)" -ForegroundColor Cyan
    Write-Host "  Email: $($user1Response.company.email)" -ForegroundColor Cyan
    Write-Host "  Referral Code: $($user1Response.company.referralCode)" -ForegroundColor Cyan
    
    $user1Id = $user1Response.company.id
    $user1Token = $user1Response.accessToken
} catch {
    Write-Host "✗ Error registering user 1: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create referral code for user 1
Write-Host "`n2. Creating referral code for user 1..." -ForegroundColor Yellow
$referralCodeData = "{\"companyId\":\"$user1Id\",\"description\":\"Test referral code\",\"maxUses\":10}"

try {
    $referralCodeResponse = Invoke-RestMethod -Uri "http://localhost:3001/referral/codes" -Method POST -Body $referralCodeData -ContentType "application/json"
    Write-Host "✓ Referral code created" -ForegroundColor Green
    Write-Host "  Code: $($referralCodeResponse.code)" -ForegroundColor Cyan
    Write-Host "  Link: $($referralCodeResponse.referralLink)" -ForegroundColor Cyan
    
    $referralCode = $referralCodeResponse.code
} catch {
    Write-Host "✗ Error creating referral code: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Register user 2 with referral code
Write-Host "`n3. Registering user 2 with referral code..." -ForegroundColor Yellow
$user2Data = "{\"name\":\"User 2 Company\",\"email\":\"user2-basic@example.com\",\"password\":\"password123\",\"description\":\"Test company for user 2\",\"referralCode\":\"$referralCode\"}"

try {
    $user2Response = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $user2Data -ContentType "application/json"
    Write-Host "✓ User 2 registered with referral code" -ForegroundColor Green
    Write-Host "  ID: $($user2Response.company.id)" -ForegroundColor Cyan
    Write-Host "  Email: $($user2Response.company.email)" -ForegroundColor Cyan
    Write-Host "  Referred By: $($user2Response.company.referredBy)" -ForegroundColor Cyan
    
    $user2Id = $user2Response.company.id
    $user2Token = $user2Response.accessToken
} catch {
    Write-Host "✗ Error registering user 2: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Check user 1 balance before
Write-Host "`n4. Checking user 1 balance before..." -ForegroundColor Yellow
try {
    $user1BalanceBefore = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance" -Method GET -Headers @{"Authorization" = "Bearer $user1Token"}
    Write-Host "✓ User 1 balance before: $($user1BalanceBefore.balance)" -ForegroundColor Green
} catch {
    Write-Host "✗ Error getting user 1 balance: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Top up user 2 balance
Write-Host "`n5. Topping up user 2 balance..." -ForegroundColor Yellow
$topupData = '{"amount":100.0,"currency":"USD","description":"Test topup for referral testing"}'

try {
    $topupResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/update" -Method POST -Body $topupData -ContentType "application/json" -Headers @{"Authorization" = "Bearer $user2Token"}
    Write-Host "✓ User 2 balance topped up" -ForegroundColor Green
    Write-Host "  Amount: $($topupResponse.balance)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Error topping up balance: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 6: Check user 1 balance after
Write-Host "`n6. Checking user 1 balance after..." -ForegroundColor Yellow
try {
    $user1BalanceAfter = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance" -Method GET -Headers @{"Authorization" = "Bearer $user1Token"}
    Write-Host "✓ User 1 balance after: $($user1BalanceAfter.balance)" -ForegroundColor Green
    
    $referralEarnings = $user1BalanceAfter.balance - $user1BalanceBefore.balance
    Write-Host "  Referral earnings: $referralEarnings" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Error getting user 1 balance: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 7: Check referral stats
Write-Host "`n7. Checking referral stats..." -ForegroundColor Yellow
try {
    $referralStats = Invoke-RestMethod -Uri "http://localhost:3001/referral/stats?companyId=$user1Id" -Method GET
    Write-Host "✓ Referral stats retrieved" -ForegroundColor Green
    Write-Host "  Total codes: $($referralStats.totalCodes)" -ForegroundColor Cyan
    Write-Host "  Active codes: $($referralStats.activeCodes)" -ForegroundColor Cyan
    Write-Host "  Total uses: $($referralStats.totalUses)" -ForegroundColor Cyan
    Write-Host "  Total referrals: $($referralStats.totalReferrals)" -ForegroundColor Cyan
} catch {
    Write-Host "✗ Error getting referral stats: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Testing completed ===" -ForegroundColor Green
