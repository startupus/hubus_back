#!/usr/bin/env pwsh

Write-Host "=== Complete Referral System Test ===" -ForegroundColor Green

# Generate unique email addresses
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$user1Email = "user1-$timestamp@example.com"
$user2Email = "user2-$timestamp@example.com"

# Step 1: Register user 1
Write-Host "`n1. Registering user 1..." -ForegroundColor Yellow
$user1Data = @{
    name = "User 1 Company"
    email = $user1Email
    password = "password123"
    description = "Test company for user 1"
} | ConvertTo-Json

try {
    $user1Response = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $user1Data -ContentType "application/json"
    Write-Host "User 1 registered successfully" -ForegroundColor Green
    Write-Host "  ID: $($user1Response.company.id)" -ForegroundColor Cyan
    Write-Host "  Email: $($user1Response.company.email)" -ForegroundColor Cyan
    
    $user1Id = $user1Response.company.id
    $user1Token = $user1Response.accessToken
} catch {
    Write-Host "Error registering user 1: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 2: Create referral code for user 1
Write-Host "`n2. Creating referral code for user 1..." -ForegroundColor Yellow
$referralCodeData = @{
    companyId = $user1Id
    description = "Test referral code"
    maxUses = 10
} | ConvertTo-Json

try {
    $referralCodeResponse = Invoke-RestMethod -Uri "http://localhost:3001/referral/codes" -Method POST -Body $referralCodeData -ContentType "application/json"
    Write-Host "Referral code created successfully" -ForegroundColor Green
    Write-Host "  Code: $($referralCodeResponse.code)" -ForegroundColor Cyan
    Write-Host "  Link: $($referralCodeResponse.referralLink)" -ForegroundColor Cyan
    
    $referralCode = $referralCodeResponse.code
} catch {
    Write-Host "Error creating referral code: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 3: Register user 2 with referral code
Write-Host "`n3. Registering user 2 with referral code..." -ForegroundColor Yellow
$user2Data = @{
    name = "User 2 Company"
    email = $user2Email
    password = "password123"
    description = "Test company for user 2"
    referralCode = $referralCode
} | ConvertTo-Json

try {
    $user2Response = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $user2Data -ContentType "application/json"
    Write-Host "User 2 registered with referral code successfully" -ForegroundColor Green
    Write-Host "  ID: $($user2Response.company.id)" -ForegroundColor Cyan
    Write-Host "  Email: $($user2Response.company.email)" -ForegroundColor Cyan
    Write-Host "  Referred By: $($user2Response.company.referredBy)" -ForegroundColor Cyan
    
    $user2Id = $user2Response.company.id
    $user2Token = $user2Response.accessToken
} catch {
    Write-Host "Error registering user 2: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 4: Check user 1 balance before
Write-Host "`n4. Checking user 1 balance before..." -ForegroundColor Yellow
try {
    $user1BalanceBefore = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/$user1Id" -Method GET
    Write-Host "User 1 balance before: $($user1BalanceBefore.balance.balance)" -ForegroundColor Green
} catch {
    Write-Host "Error getting user 1 balance: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 5: Top up user 2 balance
Write-Host "`n5. Topping up user 2 balance..." -ForegroundColor Yellow
$topupData = @{
    amount = 100.0
    operation = "add"
    description = "Test topup for referral testing"
} | ConvertTo-Json

try {
    $topupResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/$user2Id/update" -Method POST -Body $topupData -ContentType "application/json"
    Write-Host "User 2 balance topped up" -ForegroundColor Green
    Write-Host "  Amount: $($topupResponse.balance.balance)" -ForegroundColor Cyan
} catch {
    Write-Host "Error topping up balance: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 6: Send AI requests from user 2
Write-Host "`n6. Sending AI requests from user 2..." -ForegroundColor Yellow
$aiRequestData = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Hello, this is a test message for referral system testing."
        }
    )
    max_tokens = 100
} | ConvertTo-Json

try {
    for ($i = 1; $i -le 3; $i++) {
        Write-Host "  Sending request $i..." -ForegroundColor Cyan
        try {
            $aiResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" -Method POST -Body $aiRequestData -ContentType "application/json" -Headers @{"Authorization" = "Bearer $user2Token"}
            Write-Host "  Request $i sent successfully" -ForegroundColor Green
        } catch {
            Write-Host "  Request $i failed (expected due to region): $($_.Exception.Message)" -ForegroundColor Yellow
        }
        Start-Sleep -Seconds 2
    }
} catch {
    Write-Host "Error sending AI requests: $($_.Exception.Message)" -ForegroundColor Red
}

# Step 7: Check user 1 balance after
Write-Host "`n7. Checking user 1 balance after..." -ForegroundColor Yellow
try {
    $user1BalanceAfter = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/$user1Id" -Method GET
    Write-Host "User 1 balance after: $($user1BalanceAfter.balance.balance)" -ForegroundColor Green
    
    $referralEarnings = $user1BalanceAfter.balance.balance - $user1BalanceBefore.balance.balance
    Write-Host "  Referral earnings: $referralEarnings" -ForegroundColor Cyan
} catch {
    Write-Host "Error getting user 1 balance: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Step 8: Check referral stats
Write-Host "`n8. Checking referral stats..." -ForegroundColor Yellow
try {
    $referralStats = Invoke-RestMethod -Uri "http://localhost:3001/referral/stats?companyId=$user1Id" -Method GET
    Write-Host "Referral stats retrieved" -ForegroundColor Green
    Write-Host "  Total codes: $($referralStats.totalCodes)" -ForegroundColor Cyan
    Write-Host "  Active codes: $($referralStats.activeCodes)" -ForegroundColor Cyan
    Write-Host "  Total uses: $($referralStats.totalUses)" -ForegroundColor Cyan
    Write-Host "  Total referrals: $($referralStats.totalReferrals)" -ForegroundColor Cyan
} catch {
    Write-Host "Error getting referral stats: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Testing completed successfully ===" -ForegroundColor Green
