#!/usr/bin/env pwsh

Write-Host "=== Testing Referral System (Clean) ===" -ForegroundColor Green

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
    Write-Host "  Referral Code: $($user1Response.company.referralCode)" -ForegroundColor Cyan
    
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

Write-Host "`n=== Testing completed ===" -ForegroundColor Green
