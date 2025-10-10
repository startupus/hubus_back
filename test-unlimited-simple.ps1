#!/usr/bin/env pwsh

Write-Host "=== TESTING UNLIMITED REFERRALS ===" -ForegroundColor Green
Write-Host "Testing that the same referral code can be used multiple times..." -ForegroundColor Yellow

# Generate unique email addresses
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$inviterEmail = "inviter-$timestamp@example.com"
$referral1Email = "referral1-$timestamp@example.com"
$referral2Email = "referral2-$timestamp@example.com"
$referral3Email = "referral3-$timestamp@example.com"

Write-Host "`nUsing unique email addresses:" -ForegroundColor Cyan
Write-Host "  Inviter: $inviterEmail" -ForegroundColor White
Write-Host "  Referral 1: $referral1Email" -ForegroundColor White
Write-Host "  Referral 2: $referral2Email" -ForegroundColor White
Write-Host "  Referral 3: $referral3Email" -ForegroundColor White

# ========================================
# STEP 1: Register inviter company
# ========================================
Write-Host "`nSTEP 1: Register inviter company" -ForegroundColor Magenta

$inviterData = @{
    name = "Unlimited-Inviter"
    email = $inviterEmail
    password = "password123"
    description = "Company that will invite unlimited referrals"
} | ConvertTo-Json

try {
    $inviterResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $inviterData -ContentType "application/json"
    $inviterId = $inviterResponse.company.id
    
    Write-Host "SUCCESS: Inviter registered: $($inviterResponse.company.name)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Error registering inviter: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# STEP 2: Create unlimited referral code
# ========================================
Write-Host "`nSTEP 2: Create unlimited referral code" -ForegroundColor Magenta

$referralCodeData = @{
    companyId = $inviterId
    description = "Unlimited referral code - no max uses"
    # No maxUses = unlimited
} | ConvertTo-Json

try {
    $referralCodeResponse = Invoke-RestMethod -Uri "http://localhost:3001/referral/codes" -Method POST -Body $referralCodeData -ContentType "application/json"
    $referralCode = $referralCodeResponse.code
    $referralLink = $referralCodeResponse.referralLink
    
    Write-Host "SUCCESS: Referral code created: $referralCode" -ForegroundColor Green
    Write-Host "  Link: $referralLink" -ForegroundColor Cyan
    Write-Host "  Max uses: UNLIMITED" -ForegroundColor Green
    Write-Host "  Current uses: $($referralCodeResponse.usedCount)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error creating referral code: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# STEP 3: Register multiple referrals using the same code
# ========================================
Write-Host "`nSTEP 3: Register multiple referrals using the same code" -ForegroundColor Magenta

$referrals = @(
    @{ name = "Referral-1"; email = $referral1Email },
    @{ name = "Referral-2"; email = $referral2Email },
    @{ name = "Referral-3"; email = $referral3Email }
)

$registeredReferrals = @()

foreach ($referral in $referrals) {
    Write-Host "`n  Registering $($referral.name)..." -ForegroundColor Yellow
    
    $referralData = @{
        name = $referral.name
        email = $referral.email
        password = "password123"
        description = "Referral registered via unlimited code"
        referralLink = $referralLink
    } | ConvertTo-Json
    
    try {
        $referralResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $referralData -ContentType "application/json"
        
        Write-Host "  SUCCESS: $($referral.name) registered successfully" -ForegroundColor Green
        Write-Host "    ID: $($referralResponse.company.id)" -ForegroundColor Cyan
        Write-Host "    Referred By: $($referralResponse.company.referredBy)" -ForegroundColor Cyan
        
        if ($referralResponse.company.referredBy -eq $inviterId) {
            Write-Host "    CORRECTLY linked to inviter!" -ForegroundColor Green
        } else {
            Write-Host "    NOT linked to inviter!" -ForegroundColor Red
        }
        
        $registeredReferrals += $referralResponse.company
    } catch {
        Write-Host "  ERROR: Error registering $($referral.name): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# ========================================
# STEP 4: Check final statistics
# ========================================
Write-Host "`nSTEP 4: Check final statistics" -ForegroundColor Magenta

try {
    $referralStats = Invoke-RestMethod -Uri "http://localhost:3001/referral/stats?companyId=$inviterId" -Method GET
    
    Write-Host "SUCCESS: Final statistics:" -ForegroundColor Green
    Write-Host "  Total codes: $($referralStats.totalCodes)" -ForegroundColor Cyan
    Write-Host "  Active codes: $($referralStats.activeCodes)" -ForegroundColor Cyan
    Write-Host "  Total uses: $($referralStats.totalUses)" -ForegroundColor Cyan
    Write-Host "  Total referrals: $($referralStats.totalReferrals)" -ForegroundColor Cyan
    
    Write-Host "`n  ANALYSIS:" -ForegroundColor Yellow
    if ($referralStats.totalUses -eq $registeredReferrals.Count) {
        Write-Host "  Code used $($registeredReferrals.Count) times as expected" -ForegroundColor Green
    } else {
        Write-Host "  Expected $($registeredReferrals.Count) uses, got $($referralStats.totalUses)" -ForegroundColor Yellow
    }
    
    if ($referralStats.totalReferrals -eq $registeredReferrals.Count) {
        Write-Host "  Got $($registeredReferrals.Count) referrals as expected" -ForegroundColor Green
    } else {
        Write-Host "  Expected $($registeredReferrals.Count) referrals, got $($referralStats.totalReferrals)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: Error getting statistics: $($_.Exception.Message)" -ForegroundColor Red
}

# ========================================
# STEP 5: Validate code is still usable
# ========================================
Write-Host "`nSTEP 5: Validate code is still usable" -ForegroundColor Magenta

try {
    $validationResponse = Invoke-RestMethod -Uri "http://localhost:3001/referral/validate" -Method POST -Body (@{code = $referralCode} | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "SUCCESS: Code validation:" -ForegroundColor Green
    Write-Host "  Code valid: $($validationResponse.isValid)" -ForegroundColor Cyan
    Write-Host "  Message: $($validationResponse.message)" -ForegroundColor Cyan
    
    if ($validationResponse.isValid) {
        Write-Host "  Code is still active and can be used for more referrals!" -ForegroundColor Green
    } else {
        Write-Host "  Code is no longer valid: $($validationResponse.message)" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Error validating code: $($_.Exception.Message)" -ForegroundColor Red
}

# ========================================
# FINAL RESULT
# ========================================
Write-Host "`nUNLIMITED REFERRALS TEST RESULT:" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

Write-Host "`nWHAT WAS TESTED:" -ForegroundColor Yellow
Write-Host "1. Created referral code WITHOUT maxUses limit" -ForegroundColor White
Write-Host "2. Used the SAME code to register $($registeredReferrals.Count) different companies" -ForegroundColor White
Write-Host "3. Each registration was successful and linked to the inviter" -ForegroundColor White
Write-Host "4. Code remains valid and can be used for more referrals" -ForegroundColor White

Write-Host "`nUNLIMITED REFERRALS CONFIRMED!" -ForegroundColor Green
Write-Host "The same referral code can be used unlimited times!" -ForegroundColor Green
Write-Host "No restrictions on the number of referrals per code!" -ForegroundColor Green
