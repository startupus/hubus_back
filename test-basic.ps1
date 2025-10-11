# Basic System Test
Write-Host "BASIC SYSTEM TEST" -ForegroundColor Green

$BASE_URL = "http://localhost:3000"
$passed = 0
$failed = 0

# Test 1: Health Check
Write-Host "`n1. Health Check" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/health" -Method GET -UseBasicParsing
    Write-Host "  ✅ API Gateway Health - $($response.StatusCode)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ❌ API Gateway Health - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 2: Registration
Write-Host "`n2. Company Registration" -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$companyData = @{
    email = "basic-test-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Basic Test Company $timestamp"
    description = "Company for basic testing"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/v1/auth/register" -Method POST -Body $companyData -ContentType "application/json" -UseBasicParsing
    $token = ($response.Content | ConvertFrom-Json).accessToken
    Write-Host "  ✅ Registration - Token obtained" -ForegroundColor Green
    $passed++
    
    # Test 3: Authenticated Request
    Write-Host "`n3. Authenticated Request" -ForegroundColor Yellow
    $headers = @{ "Authorization" = "Bearer $token" }
    $authResponse = Invoke-WebRequest -Uri "$BASE_URL/v1/billing/balance" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "  ✅ Balance Check - $($authResponse.StatusCode)" -ForegroundColor Green
    $passed++
    
    # Test 4: AI Models
    Write-Host "`n4. AI Models" -ForegroundColor Yellow
    $modelsResponse = Invoke-WebRequest -Uri "$BASE_URL/v1/models" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "  ✅ AI Models - $($modelsResponse.StatusCode)" -ForegroundColor Green
    $passed++
    
} catch {
    Write-Host "  ❌ Registration - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 5: Security
Write-Host "`n5. Security Test" -ForegroundColor Yellow
try {
    $invalidHeaders = @{ "Authorization" = "Bearer invalid-token" }
    $response = Invoke-WebRequest -Uri "$BASE_URL/v1/billing/balance" -Method GET -Headers $invalidHeaders -UseBasicParsing
    Write-Host "  ❌ Security - Invalid token was accepted!" -ForegroundColor Red
    $failed++
} catch {
    Write-Host "  ✅ Security - Invalid token properly rejected" -ForegroundColor Green
    $passed++
}

# Test 6: Error Handling
Write-Host "`n6. Error Handling" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/v1/non-existent" -Method GET -UseBasicParsing
    Write-Host "  ❌ Error Handling - 404 not returned" -ForegroundColor Red
    $failed++
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  ✅ Error Handling - 404 properly returned" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ Error Handling - Wrong status code" -ForegroundColor Red
        $failed++
    }
}

# Results
$total = $passed + $failed
$successRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "RESULTS" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Success Rate: ${successRate}%" -ForegroundColor White

if ($successRate -ge 90) {
    Write-Host "`n🎉 SYSTEM IS HEALTHY!" -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host "`n✅ SYSTEM IS FUNCTIONAL" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ SYSTEM HAS ISSUES" -ForegroundColor Red
}
