# Debug Referral System
Write-Host "Debugging Referral System..." -ForegroundColor Green

$authUrl = "http://localhost:3001"

# Test if referral endpoints exist
Write-Host "`n=== Testing Referral Endpoints ===" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$authUrl/referral/codes" -Method Get
    Write-Host "Referral codes endpoint exists! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Referral codes endpoint error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "$authUrl/referral/stats" -Method Get
    Write-Host "Referral stats endpoint exists! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Referral stats endpoint error: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $response = Invoke-WebRequest -Uri "$authUrl/referral/validate" -Method Post -Body '{"code":"TEST"}' -ContentType "application/json"
    Write-Host "Referral validate endpoint exists! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Referral validate endpoint error: $($_.Exception.Message)" -ForegroundColor Red
}

# Test if we can access the service directly
Write-Host "`n=== Testing Direct Service Access ===" -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "$authUrl/health" -Method Get
    Write-Host "Health endpoint works! Status: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "Health endpoint error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Debug Completed ===" -ForegroundColor Green
