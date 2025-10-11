# Simple Manual System Verification
# Basic testing of all system components

Write-Host "================================================" -ForegroundColor Green
Write-Host "  SIMPLE MANUAL SYSTEM VERIFICATION" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$BASE_URL = "http://localhost:3000"
$AUTH_URL = "http://localhost:3001"
$BILLING_URL = "http://localhost:3004"
$PAYMENT_URL = "http://localhost:3006"

$testResults = @{
    TotalTests = 0
    PassedTests = 0
    FailedTests = 0
    CriticalIssues = @()
}

function Invoke-SimpleTest {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [string]$TestName = ""
    )
    
    $testResults.TotalTests++
    
    try {
        $requestParams = @{
            Method = $Method
            Uri = $Url
            Headers = $Headers
            ContentType = "application/json"
            UseBasicParsing = $true
            TimeoutSec = 30
        }
        
        if ($Body) {
            $requestParams.Body = $Body
        }
        
        $startTime = Get-Date
        $response = Invoke-WebRequest @requestParams
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        $testResults.PassedTests++
        Write-Host "  ✅ ${TestName} - ${responseTime}ms (${response.StatusCode})" -ForegroundColor Green
        
        return @{
            Success = $true
            ResponseTime = $responseTime
            StatusCode = $response.StatusCode
            Content = $response.Content
        }
    }
    catch {
        $testResults.FailedTests++
        $errorMessage = $_.Exception.Message
        Write-Host "  ❌ ${TestName} - ${errorMessage}" -ForegroundColor Red
        $testResults.CriticalIssues += "${TestName}: ${errorMessage}"
        
        return @{
            Success = $false
            Error = $errorMessage
        }
    }
}

# PHASE 1: HEALTH CHECKS
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 1: HEALTH CHECKS" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n1.1 API Gateway Health..." -ForegroundColor Cyan
$apiHealth = Invoke-SimpleTest -Method "GET" -Url "$BASE_URL/health" -TestName "API Gateway Health"

Write-Host "`n1.2 Auth Service Health..." -ForegroundColor Cyan
$authHealth = Invoke-SimpleTest -Method "GET" -Url "$AUTH_URL/health" -TestName "Auth Service Health"

Write-Host "`n1.3 Billing Service Health..." -ForegroundColor Cyan
$billingHealth = Invoke-SimpleTest -Method "GET" -Url "$BILLING_URL/health" -TestName "Billing Service Health"

Write-Host "`n1.4 Payment Service Health..." -ForegroundColor Cyan
$paymentHealth = Invoke-SimpleTest -Method "GET" -Url "$PAYMENT_URL/api/v1/health" -TestName "Payment Service Health"

# PHASE 2: AUTHENTICATION
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 2: AUTHENTICATION" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n2.1 Company Registration..." -ForegroundColor Cyan
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$companyData = @{
    email = "simple-test-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Simple Test Company $timestamp"
    description = "Company for simple testing"
} | ConvertTo-Json

$registerResult = Invoke-SimpleTest -Method "POST" -Url "$BASE_URL/v1/auth/register" -Body $companyData -TestName "Company Registration"

if ($registerResult.Success) {
    $token = ($registerResult.Content | ConvertFrom-Json).accessToken
    Write-Host "  ✅ Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green
    
    Write-Host "`n2.2 Token Validation..." -ForegroundColor Cyan
    $headers = @{ "Authorization" = "Bearer $token" }
    $tokenValidation = Invoke-SimpleTest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $headers -TestName "Token Validation"
    
    Write-Host "`n2.3 Invalid Token Test..." -ForegroundColor Cyan
    $invalidHeaders = @{ "Authorization" = "Bearer invalid-token" }
    $invalidTokenTest = Invoke-SimpleTest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $invalidHeaders -TestName "Invalid Token Test"
    
    if (-not $invalidTokenTest.Success) {
        Write-Host "  ✅ Invalid token properly rejected" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Invalid token was accepted (security issue!)" -ForegroundColor Red
        $testResults.CriticalIssues += "Security: Invalid token was accepted"
    }
} else {
    Write-Host "  ❌ Registration failed - cannot continue with auth tests" -ForegroundColor Red
    $testResults.CriticalIssues += "Authentication: Company registration failed"
}

# PHASE 3: BILLING SYSTEM
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 3: BILLING SYSTEM" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "`n3.1 Balance Retrieval..." -ForegroundColor Cyan
    $balanceResult = Invoke-SimpleTest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $headers -TestName "Balance Retrieval"
    
    Write-Host "`n3.2 Transaction History..." -ForegroundColor Cyan
    $transactionsResult = Invoke-SimpleTest -Method "GET" -Url "$BASE_URL/v1/billing/transactions" -Headers $headers -TestName "Transaction History"
    
    Write-Host "`n3.3 Balance Addition..." -ForegroundColor Cyan
    $addBalanceData = @{
        amount = 1000.50
        currency = "RUB"
        description = "Simple test balance addition"
    } | ConvertTo-Json
    
    $addBalanceResult = Invoke-SimpleTest -Method "POST" -Url "$BASE_URL/v1/billing/balance/add" -Headers $headers -Body $addBalanceData -TestName "Balance Addition"
}

# PHASE 4: AI MODELS
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 4: AI MODELS" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "`n4.1 AI Models List..." -ForegroundColor Cyan
    $modelsResult = Invoke-SimpleTest -Method "GET" -Url "$BASE_URL/v1/models" -Headers $headers -TestName "AI Models List"
    
    Write-Host "`n4.2 AI Models Providers..." -ForegroundColor Cyan
    $providersResult = Invoke-SimpleTest -Method "GET" -Url "$BASE_URL/v1/models/providers" -Headers $headers -TestName "AI Models Providers"
    
    Write-Host "`n4.3 AI Models Categories..." -ForegroundColor Cyan
    $categoriesResult = Invoke-SimpleTest -Method "GET" -Url "$BASE_URL/v1/models/categories" -Headers $headers -TestName "AI Models Categories"
}

# PHASE 5: PAYMENT SYSTEM
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 5: PAYMENT SYSTEM" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "`n5.1 Payment Creation..." -ForegroundColor Cyan
    $paymentData = @{
        amount = 500.00
        currency = "RUB"
        description = "Simple test payment"
    } | ConvertTo-Json
    
    $paymentResult = Invoke-SimpleTest -Method "POST" -Url "$PAYMENT_URL/api/v1/payments" -Headers $headers -Body $paymentData -TestName "Payment Creation"
    
    if ($paymentResult.Success) {
        $paymentId = ($paymentResult.Content | ConvertFrom-Json).paymentId
        Write-Host "  ✅ Payment created: $paymentId" -ForegroundColor Green
        
        Write-Host "`n5.2 Payment Status Check..." -ForegroundColor Cyan
        $paymentStatusResult = Invoke-SimpleTest -Method "GET" -Url "$PAYMENT_URL/api/v1/payments/$paymentId" -Headers $headers -TestName "Payment Status Check"
    }
}

# PHASE 6: ERROR HANDLING
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 6: ERROR HANDLING" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n6.1 404 Error Test..." -ForegroundColor Cyan
$notFoundResult = Invoke-SimpleTest -Method "GET" -Url "$BASE_URL/v1/non-existent-endpoint" -TestName "404 Error Test"

Write-Host "`n6.2 401 Error Test..." -ForegroundColor Cyan
$unauthorizedResult = Invoke-SimpleTest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -TestName "401 Error Test"

# PHASE 7: DATABASE CONNECTIVITY
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 7: DATABASE CONNECTIVITY" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n7.1 Database Containers..." -ForegroundColor Cyan
$dbContainers = @("auth-db", "billing-db", "orchestrator-db", "payment-db", "api-gateway-db")
foreach ($db in $dbContainers) {
    try {
        $container = docker ps --filter "name=$db" --format "table {{.Names}}\t{{.Status}}"
        if ($container -match "Up") {
            Write-Host "  ✅ ${db}: Running" -ForegroundColor Green
        } else {
            Write-Host "  ❌ ${db}: Not running" -ForegroundColor Red
            $testResults.CriticalIssues += "Database: ${db} is not running"
        }
    } catch {
        Write-Host "  ❌ ${db}: Error checking status" -ForegroundColor Red
        $testResults.CriticalIssues += "Database: Error checking ${db} status"
    }
}

Write-Host "`n7.2 Redis Connectivity..." -ForegroundColor Cyan
try {
    $redisResult = docker exec redis redis-cli ping
    if ($redisResult -match "PONG") {
        Write-Host "  ✅ Redis: Connected and responding" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Redis: Not responding properly" -ForegroundColor Red
        $testResults.CriticalIssues += "Redis: Not responding to ping"
    }
} catch {
    Write-Host "  ❌ Redis: Connection failed" -ForegroundColor Red
    $testResults.CriticalIssues += "Redis: Connection failed"
}

Write-Host "`n7.3 RabbitMQ Connectivity..." -ForegroundColor Cyan
try {
    $rabbitmqResult = docker exec rabbitmq rabbitmq-diagnostics ping
    if ($rabbitmqResult -match "pong") {
        Write-Host "  ✅ RabbitMQ: Connected and responding" -ForegroundColor Green
    } else {
        Write-Host "  ❌ RabbitMQ: Not responding properly" -ForegroundColor Red
        $testResults.CriticalIssues += "RabbitMQ: Not responding to ping"
    }
} catch {
    Write-Host "  ❌ RabbitMQ: Connection failed" -ForegroundColor Red
    $testResults.CriticalIssues += "RabbitMQ: Connection failed"
}

# FINAL RESULTS
Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  FINAL VERIFICATION RESULTS" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

Write-Host "`nSUMMARY:" -ForegroundColor Cyan
Write-Host "  Total Tests: $($testResults.TotalTests)" -ForegroundColor White
Write-Host "  Passed: $($testResults.PassedTests)" -ForegroundColor Green
Write-Host "  Failed: $($testResults.FailedTests)" -ForegroundColor Red
Write-Host "  Success Rate: $([math]::Round(($testResults.PassedTests / $testResults.TotalTests) * 100, 2))%" -ForegroundColor White

if ($testResults.CriticalIssues.Count -gt 0) {
    Write-Host "`nCRITICAL ISSUES:" -ForegroundColor Red
    foreach ($issue in $testResults.CriticalIssues) {
        Write-Host "  ❌ $issue" -ForegroundColor Red
    }
} else {
    Write-Host "`n✅ NO CRITICAL ISSUES FOUND" -ForegroundColor Green
}

Write-Host "`nOVERALL ASSESSMENT:" -ForegroundColor Cyan
if ($testResults.CriticalIssues.Count -eq 0 -and $testResults.PassedTests / $testResults.TotalTests -ge 0.9) {
    Write-Host "  🎉 SYSTEM IS HEALTHY AND READY FOR PRODUCTION!" -ForegroundColor Green
} elseif ($testResults.CriticalIssues.Count -eq 0) {
    Write-Host "  ✅ SYSTEM IS FUNCTIONAL WITH MINOR ISSUES" -ForegroundColor Yellow
} else {
    Write-Host "  ❌ SYSTEM HAS CRITICAL ISSUES THAT NEED ATTENTION" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  MANUAL VERIFICATION COMPLETED" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
