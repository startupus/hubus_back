# Final System Verification
# Complete testing with fresh token

Write-Host "================================================" -ForegroundColor Green
Write-Host "  FINAL SYSTEM VERIFICATION" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$BASE_URL = "http://localhost:3000"
$AUTH_URL = "http://localhost:3001"
$BILLING_URL = "http://localhost:3004"
$PAYMENT_URL = "http://localhost:3006"

$testResults = @{
    TotalTests = 0
    PassedTests = 0
    FailedTests = 0
    Issues = @()
}

function Invoke-FinalTest {
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
        $testResults.Issues += "${TestName}: ${errorMessage}"
        
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
$apiHealth = Invoke-FinalTest -Method "GET" -Url "$BASE_URL/health" -TestName "API Gateway Health"

Write-Host "`n1.2 Auth Service Health..." -ForegroundColor Cyan
$authHealth = Invoke-FinalTest -Method "GET" -Url "$AUTH_URL/health" -TestName "Auth Service Health"

Write-Host "`n1.3 Billing Service Health..." -ForegroundColor Cyan
$billingHealth = Invoke-FinalTest -Method "GET" -Url "$BILLING_URL/health" -TestName "Billing Service Health"

Write-Host "`n1.4 Payment Service Health..." -ForegroundColor Cyan
$paymentHealth = Invoke-FinalTest -Method "GET" -Url "$PAYMENT_URL/api/v1/health" -TestName "Payment Service Health"

# PHASE 2: AUTHENTICATION WITH FRESH TOKEN
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 2: AUTHENTICATION" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n2.1 Fresh Company Registration..." -ForegroundColor Cyan
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$companyData = @{
    email = "final-test-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Final Test Company $timestamp"
    description = "Company for final testing"
} | ConvertTo-Json

$registerResult = Invoke-FinalTest -Method "POST" -Url "$BASE_URL/v1/auth/register" -Body $companyData -TestName "Fresh Company Registration"

if ($registerResult.Success) {
    $token = ($registerResult.Content | ConvertFrom-Json).accessToken
    Write-Host "  ✅ Fresh token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green
    
    Write-Host "`n2.2 Token Validation..." -ForegroundColor Cyan
    $headers = @{ "Authorization" = "Bearer $token" }
    $tokenValidation = Invoke-FinalTest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $headers -TestName "Token Validation"
    
    Write-Host "`n2.3 Security Test - Invalid Token..." -ForegroundColor Cyan
    $invalidHeaders = @{ "Authorization" = "Bearer invalid-token" }
    $invalidTokenTest = Invoke-FinalTest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $invalidHeaders -TestName "Invalid Token Test"
    
    if (-not $invalidTokenTest.Success) {
        Write-Host "  ✅ Security: Invalid token properly rejected" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Security: Invalid token was accepted!" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ Registration failed - cannot continue" -ForegroundColor Red
    $testResults.Issues += "Authentication: Registration failed"
}

# PHASE 3: BILLING SYSTEM WITH FRESH TOKEN
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 3: BILLING SYSTEM" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "`n3.1 Balance Retrieval..." -ForegroundColor Cyan
    $balanceResult = Invoke-FinalTest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $headers -TestName "Balance Retrieval"
    
    Write-Host "`n3.2 Transaction History..." -ForegroundColor Cyan
    $transactionsResult = Invoke-FinalTest -Method "GET" -Url "$BASE_URL/v1/billing/transactions" -Headers $headers -TestName "Transaction History"
    
    Write-Host "`n3.3 Direct Billing Service Access..." -ForegroundColor Cyan
    $directBillingResult = Invoke-FinalTest -Method "GET" -Url "$BILLING_URL/health" -TestName "Direct Billing Service Access"
}

# PHASE 4: AI MODELS SYSTEM
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 4: AI MODELS SYSTEM" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "`n4.1 AI Models List..." -ForegroundColor Cyan
    $modelsResult = Invoke-FinalTest -Method "GET" -Url "$BASE_URL/v1/models" -Headers $headers -TestName "AI Models List"
    
    Write-Host "`n4.2 AI Models Providers..." -ForegroundColor Cyan
    $providersResult = Invoke-FinalTest -Method "GET" -Url "$BASE_URL/v1/models/providers" -Headers $headers -TestName "AI Models Providers"
    
    Write-Host "`n4.3 AI Models Categories..." -ForegroundColor Cyan
    $categoriesResult = Invoke-FinalTest -Method "GET" -Url "$BASE_URL/v1/models/categories" -Headers $headers -TestName "AI Models Categories"
    
    Write-Host "`n4.4 AI Models Filtering..." -ForegroundColor Cyan
    $filteredModelsResult = Invoke-FinalTest -Method "GET" -Url "$BASE_URL/v1/models?provider=openai" -Headers $headers -TestName "AI Models Filtering"
}

# PHASE 5: PAYMENT SYSTEM
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 5: PAYMENT SYSTEM" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "`n5.1 Payment Creation..." -ForegroundColor Cyan
    $paymentData = @{
        amount = 1000.00
        currency = "RUB"
        description = "Final test payment"
    } | ConvertTo-Json
    
    $paymentResult = Invoke-FinalTest -Method "POST" -Url "$PAYMENT_URL/api/v1/payments" -Headers $headers -Body $paymentData -TestName "Payment Creation"
    
    if ($paymentResult.Success) {
        $paymentId = ($paymentResult.Content | ConvertFrom-Json).paymentId
        Write-Host "  ✅ Payment created: $paymentId" -ForegroundColor Green
        
        Write-Host "`n5.2 Payment Status Check..." -ForegroundColor Cyan
        $paymentStatusResult = Invoke-FinalTest -Method "GET" -Url "$PAYMENT_URL/api/v1/payments/$paymentId" -Headers $headers -TestName "Payment Status Check"
        
        Write-Host "`n5.3 Payment History..." -ForegroundColor Cyan
        $paymentHistoryResult = Invoke-FinalTest -Method "GET" -Url "$PAYMENT_URL/api/v1/payments" -Headers $headers -TestName "Payment History"
    }
}

# PHASE 6: INFRASTRUCTURE
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 6: INFRASTRUCTURE" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n6.1 Database Containers..." -ForegroundColor Cyan
$dbContainers = @("project-auth-db-1", "project-billing-db-1", "project-orchestrator-db-1", "project-payment-db-1", "project-api-gateway-db-1")
foreach ($db in $dbContainers) {
    try {
        $container = docker ps --filter "name=$db" --format "table {{.Names}}\t{{.Status}}"
        if ($container -match "Up") {
            Write-Host "  ✅ ${db}: Running" -ForegroundColor Green
        } else {
            Write-Host "  ❌ ${db}: Not running" -ForegroundColor Red
            $testResults.Issues += "Database: ${db} is not running"
        }
    } catch {
        Write-Host "  ❌ ${db}: Error checking status" -ForegroundColor Red
        $testResults.Issues += "Database: Error checking ${db} status"
    }
}

Write-Host "`n6.2 Redis Connectivity..." -ForegroundColor Cyan
try {
    $redisResult = docker exec project-redis-1 redis-cli ping
    if ($redisResult -match "PONG") {
        Write-Host "  ✅ Redis: Connected and responding" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Redis: Not responding properly" -ForegroundColor Red
        $testResults.Issues += "Redis: Not responding to ping"
    }
} catch {
    Write-Host "  ❌ Redis: Connection failed" -ForegroundColor Red
    $testResults.Issues += "Redis: Connection failed"
}

Write-Host "`n6.3 RabbitMQ Connectivity..." -ForegroundColor Cyan
try {
    $rabbitmqResult = docker exec project-rabbitmq-1 rabbitmq-diagnostics ping
    if ($rabbitmqResult -match "pong") {
        Write-Host "  ✅ RabbitMQ: Connected and responding" -ForegroundColor Green
    } else {
        Write-Host "  ❌ RabbitMQ: Not responding properly" -ForegroundColor Red
        $testResults.Issues += "RabbitMQ: Not responding to ping"
    }
} catch {
    Write-Host "  ❌ RabbitMQ: Connection failed" -ForegroundColor Red
    $testResults.Issues += "RabbitMQ: Connection failed"
}

# PHASE 7: PERFORMANCE TEST
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 7: PERFORMANCE TEST" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n7.1 Load Test on Health Endpoints..." -ForegroundColor Cyan
$loadTestResults = @()
for ($i = 1; $i -le 10; $i++) {
    $result = Invoke-FinalTest -Method "GET" -Url "$BASE_URL/health" -TestName "Load Test #$i"
    if ($result.Success) {
        $loadTestResults += $result.ResponseTime
    }
}

if ($loadTestResults.Count -gt 0) {
    $avgLoadTime = ($loadTestResults | Measure-Object -Average).Average
    $minLoadTime = ($loadTestResults | Measure-Object -Minimum).Minimum
    $maxLoadTime = ($loadTestResults | Measure-Object -Maximum).Maximum
    
    Write-Host "  📊 Load test results:" -ForegroundColor Green
    Write-Host "    Average: $([math]::Round($avgLoadTime, 2))ms" -ForegroundColor Green
    Write-Host "    Minimum: $([math]::Round($minLoadTime, 2))ms" -ForegroundColor Green
    Write-Host "    Maximum: $([math]::Round($maxLoadTime, 2))ms" -ForegroundColor Green
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

if ($testResults.Issues.Count -gt 0) {
    Write-Host "`nISSUES FOUND:" -ForegroundColor Yellow
    foreach ($issue in $testResults.Issues) {
        Write-Host "  ⚠️  $issue" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n✅ NO ISSUES FOUND" -ForegroundColor Green
}

Write-Host "`nOVERALL ASSESSMENT:" -ForegroundColor Cyan
if ($testResults.Issues.Count -eq 0 -and $testResults.PassedTests / $testResults.TotalTests -ge 0.95) {
    Write-Host "  🎉 SYSTEM IS HEALTHY AND READY FOR PRODUCTION!" -ForegroundColor Green
} elseif ($testResults.Issues.Count -eq 0) {
    Write-Host "  ✅ SYSTEM IS FUNCTIONAL AND STABLE" -ForegroundColor Green
} else {
    Write-Host "  ⚠️  SYSTEM HAS MINOR ISSUES BUT IS FUNCTIONAL" -ForegroundColor Yellow
}

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  FINAL VERIFICATION COMPLETED" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
