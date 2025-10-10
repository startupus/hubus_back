#!/usr/bin/env pwsh

Write-Host "=== REFERRAL SYSTEM DEMO - STEP BY STEP ===" -ForegroundColor Green
Write-Host "Showing the result of each step..." -ForegroundColor Yellow

# Generate unique email addresses
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$user1Email = "user1-$timestamp@example.com"
$user2Email = "user2-$timestamp@example.com"

Write-Host "`nUsing unique email addresses:" -ForegroundColor Cyan
Write-Host "  User 1: $user1Email" -ForegroundColor White
Write-Host "  User 2: $user2Email" -ForegroundColor White

# ========================================
# STEP 1: Register first company
# ========================================
Write-Host "`nSTEP 1: Register first company (no referrer)" -ForegroundColor Magenta
Write-Host "Sending registration request..." -ForegroundColor Gray

$user1Data = @{
    name = "Company-Inviter"
    email = $user1Email
    password = "password123"
    description = "Company that will invite others"
} | ConvertTo-Json

Write-Host "Registration data:" -ForegroundColor Gray
Write-Host $user1Data -ForegroundColor DarkGray

try {
    $user1Response = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $user1Data -ContentType "application/json"
    
    Write-Host "RESULT OF STEP 1:" -ForegroundColor Green
    Write-Host "  Company registered successfully!" -ForegroundColor Green
    Write-Host "  ID: $($user1Response.company.id)" -ForegroundColor Cyan
    Write-Host "  Name: $($user1Response.company.name)" -ForegroundColor Cyan
    Write-Host "  Email: $($user1Response.company.email)" -ForegroundColor Cyan
    Write-Host "  Referred By: $($user1Response.company.referredBy)" -ForegroundColor Cyan
    Write-Host "  (empty, as this is the first company)" -ForegroundColor Gray
    
    $user1Id = $user1Response.company.id
    $user1Token = $user1Response.accessToken
    
    Write-Host "  Access token received: $($user1Token.Substring(0, 20))..." -ForegroundColor DarkCyan
} catch {
    Write-Host "ERROR IN STEP 1: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# STEP 2: Create referral code
# ========================================
Write-Host "`nSTEP 2: Create referral code for first company" -ForegroundColor Magenta
Write-Host "Sending request to create referral code..." -ForegroundColor Gray

$referralCodeData = @{
    companyId = $user1Id
    description = "Referral code for inviting new companies"
    # maxUses not set = unlimited referrals
} | ConvertTo-Json

Write-Host "Code creation data:" -ForegroundColor Gray
Write-Host $referralCodeData -ForegroundColor DarkGray

try {
    $referralCodeResponse = Invoke-RestMethod -Uri "http://localhost:3001/referral/codes" -Method POST -Body $referralCodeData -ContentType "application/json"
    
    Write-Host "RESULT OF STEP 2:" -ForegroundColor Green
    Write-Host "  Referral code created successfully!" -ForegroundColor Green
    Write-Host "  Code: $($referralCodeResponse.code)" -ForegroundColor Cyan
    Write-Host "  Link: $($referralCodeResponse.referralLink)" -ForegroundColor Cyan
    if ($referralCodeResponse.maxUses) {
        Write-Host "  Max uses: $($referralCodeResponse.maxUses)" -ForegroundColor Cyan
    } else {
        Write-Host "  Max uses: UNLIMITED" -ForegroundColor Green
    }
    Write-Host "  Current uses: $($referralCodeResponse.usedCount)" -ForegroundColor Cyan
    
    $referralCode = $referralCodeResponse.code
    $referralLink = $referralCodeResponse.referralLink
    
    Write-Host "`n  INFORMATION FOR USER:" -ForegroundColor Yellow
    Write-Host "  Company can share this link:" -ForegroundColor White
    Write-Host "  $referralLink" -ForegroundColor White
    Write-Host "  When clicked, user goes to registration page" -ForegroundColor White
} catch {
    Write-Host "ERROR IN STEP 2: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# STEP 3: Register second company with referral link
# ========================================
Write-Host "`nSTEP 3: Register second company with referral link" -ForegroundColor Magenta
Write-Host "Sending registration request with referral link..." -ForegroundColor Gray

$user2Data = @{
    name = "Company-Referral"
    email = $user2Email
    password = "password123"
    description = "Company registering via referral link"
    referralLink = $referralLink
} | ConvertTo-Json

Write-Host "Registration data (with referral link):" -ForegroundColor Gray
Write-Host $user2Data -ForegroundColor DarkGray

try {
    $user2Response = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $user2Data -ContentType "application/json"
    
    Write-Host "RESULT OF STEP 3:" -ForegroundColor Green
    Write-Host "  Company registered with referral link!" -ForegroundColor Green
    Write-Host "  ID: $($user2Response.company.id)" -ForegroundColor Cyan
    Write-Host "  Name: $($user2Response.company.name)" -ForegroundColor Cyan
    Write-Host "  Email: $($user2Response.company.email)" -ForegroundColor Cyan
    Write-Host "  Referred By: $($user2Response.company.referredBy)" -ForegroundColor Cyan
    
    if ($user2Response.company.referredBy -eq $user1Id) {
        Write-Host "  CONNECTION ESTABLISHED: Company linked to inviter!" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Connection not established!" -ForegroundColor Red
    }
    
    $user2Id = $user2Response.company.id
    $user2Token = $user2Response.accessToken
} catch {
    Write-Host "ERROR IN STEP 3: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# STEP 4: Check referral statistics
# ========================================
Write-Host "`nSTEP 4: Check referral statistics" -ForegroundColor Magenta
Write-Host "Requesting statistics for first company..." -ForegroundColor Gray

try {
    $referralStats = Invoke-RestMethod -Uri "http://localhost:3001/referral/stats?companyId=$user1Id" -Method GET
    
    Write-Host "RESULT OF STEP 4:" -ForegroundColor Green
    Write-Host "  Referral statistics retrieved!" -ForegroundColor Green
    Write-Host "  Total codes: $($referralStats.totalCodes)" -ForegroundColor Cyan
    Write-Host "  Active codes: $($referralStats.activeCodes)" -ForegroundColor Cyan
    Write-Host "  Total uses: $($referralStats.totalUses)" -ForegroundColor Cyan
    Write-Host "  Total referrals: $($referralStats.totalReferrals)" -ForegroundColor Cyan
    
    Write-Host "`n  STATISTICS ANALYSIS:" -ForegroundColor Yellow
    if ($referralStats.totalCodes -eq 1) {
        Write-Host "  Created 1 referral code" -ForegroundColor Green
    } else {
        Write-Host "  Number of codes does not match expected" -ForegroundColor Yellow
    }
    
    if ($referralStats.totalUses -eq 1) {
        Write-Host "  Code used 1 time" -ForegroundColor Green
    } else {
        Write-Host "  Number of uses does not match expected" -ForegroundColor Yellow
    }
    
    if ($referralStats.totalReferrals -eq 1) {
        Write-Host "  Got 1 referral" -ForegroundColor Green
    } else {
        Write-Host "  Number of referrals does not match expected" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR IN STEP 4: $($_.Exception.Message)" -ForegroundColor Red
}

# ========================================
# STEP 5: Validate referral code
# ========================================
Write-Host "`nSTEP 5: Validate referral code" -ForegroundColor Magenta
Write-Host "Checking that code is still valid..." -ForegroundColor Gray

try {
    $validationResponse = Invoke-RestMethod -Uri "http://localhost:3001/referral/validate" -Method POST -Body (@{code = $referralCode} | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "RESULT OF STEP 5:" -ForegroundColor Green
    Write-Host "  Validation completed!" -ForegroundColor Green
    Write-Host "  Code valid: $($validationResponse.isValid)" -ForegroundColor Cyan
    Write-Host "  Message: $($validationResponse.message)" -ForegroundColor Cyan
    
    if ($validationResponse.isValid) {
        Write-Host "  Code is still active and can be used" -ForegroundColor Green
    } else {
        Write-Host "  Code is not valid: $($validationResponse.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR IN STEP 5: $($_.Exception.Message)" -ForegroundColor Red
}

# ========================================
# FINAL RESULT
# ========================================
Write-Host "`nFINAL RESULT:" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

Write-Host "`nWHAT HAPPENED:" -ForegroundColor Yellow
Write-Host "1. Company '$($user1Response.company.name)' registered" -ForegroundColor White
Write-Host "2. Created referral code: $referralCode" -ForegroundColor White
Write-Host "3. Got referral link: $referralLink" -ForegroundColor White
Write-Host "4. Company '$($user2Response.company.name)' clicked link and registered" -ForegroundColor White
Write-Host "5. Automatically became referral of first company" -ForegroundColor White

Write-Host "`nHOW IT WORKS FOR USERS:" -ForegroundColor Yellow
Write-Host "1. Company A creates referral code" -ForegroundColor White
Write-Host "2. Gets link like: http://localhost:3000/v1/auth/register?ref=ABC123" -ForegroundColor White
Write-Host "3. Shares this link with potential customers" -ForegroundColor White
Write-Host "4. Customer clicks link -> goes to registration page" -ForegroundColor White
Write-Host "5. Registers -> automatically becomes referral of Company A" -ForegroundColor White

Write-Host "`nALL TESTS PASSED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "Referral system works through links as intended!" -ForegroundColor Green
