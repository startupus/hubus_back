# Simple Referral System Test
Write-Host "Testing Referral System (Simple)..." -ForegroundColor Green

$baseUrl = "http://localhost:3000"
$authUrl = "http://localhost:3001"
$billingUrl = "http://localhost:3004"

# Test data with unique emails
$referrerData = @{
    name = "Referrer Company 2"
    email = "referrer2@example.com"
    password = "password123"
    description = "Company that refers others"
}

$refereeData = @{
    name = "Referred Company 2"
    email = "referred2@example.com"
    password = "password123"
    description = "Company referred by referrer"
}

Write-Host "`n=== Step 1: Register Referrer Company ===" -ForegroundColor Cyan
try {
    $referrerResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body ($referrerData | ConvertTo-Json) -ContentType "application/json"
    Write-Host "Referrer registered: $($referrerResponse.user.email)" -ForegroundColor Green
    $referrerToken = $referrerResponse.accessToken
    $referrerCompanyId = $referrerResponse.user.id
} catch {
    Write-Host "Error registering referrer: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== Step 2: Test Referral Endpoints ===" -ForegroundColor Cyan
try {
    # Test referral codes endpoint
    $referralCodesResponse = Invoke-RestMethod -Uri "$authUrl/referral/codes" -Method Get -Headers @{Authorization = "Bearer $referrerToken"}
    Write-Host "Referral codes endpoint works!" -ForegroundColor Green
    Write-Host "Response: $($referralCodesResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Yellow
} catch {
    Write-Host "Referral codes endpoint error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    # Test referral stats endpoint
    $referralStatsResponse = Invoke-RestMethod -Uri "$authUrl/referral/stats" -Method Get -Headers @{Authorization = "Bearer $referrerToken"}
    Write-Host "Referral stats endpoint works!" -ForegroundColor Green
    Write-Host "Response: $($referralStatsResponse | ConvertTo-Json -Depth 3)" -ForegroundColor Yellow
} catch {
    Write-Host "Referral stats endpoint error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Step 3: Test Create Referral Code ===" -ForegroundColor Cyan
try {
    $createCodeData = @{
        description = "My referral code"
        maxUses = 10
    }
    $createCodeResponse = Invoke-RestMethod -Uri "$authUrl/referral/codes" -Method Post -Body ($createCodeData | ConvertTo-Json) -ContentType "application/json" -Headers @{Authorization = "Bearer $referrerToken"}
    Write-Host "Referral code created!" -ForegroundColor Green
    Write-Host "Code: $($createCodeResponse.code)" -ForegroundColor Yellow
    Write-Host "Link: $($createCodeResponse.referralLink)" -ForegroundColor Yellow
    $referralCode = $createCodeResponse.code
} catch {
    Write-Host "Error creating referral code: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Step 4: Register Company with Referral Code ===" -ForegroundColor Cyan
try {
    $refereeDataWithCode = $refereeData + @{referralCode = $referralCode}
    $refereeResponse = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body ($refereeDataWithCode | ConvertTo-Json) -ContentType "application/json"
    Write-Host "Referred company registered: $($refereeResponse.user.email)" -ForegroundColor Green
    $refereeToken = $refereeResponse.accessToken
    $refereeCompanyId = $refereeResponse.user.id
} catch {
    Write-Host "Error registering referee: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Completed ===" -ForegroundColor Green
Write-Host "Referrer Company ID: $referrerCompanyId" -ForegroundColor Cyan
Write-Host "Referred Company ID: $refereeCompanyId" -ForegroundColor Cyan
Write-Host "Referral Code: $referralCode" -ForegroundColor Cyan
