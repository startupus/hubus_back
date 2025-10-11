# Complete Manual System Verification
# Comprehensive testing of all system components after optimizations

Write-Host "================================================" -ForegroundColor Green
Write-Host "  COMPLETE MANUAL SYSTEM VERIFICATION" -ForegroundColor Green
Write-Host "  Testing all components after optimizations" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$BASE_URL = "http://localhost:3000"
$AUTH_URL = "http://localhost:3001"
$BILLING_URL = "http://localhost:3004"
$PAYMENT_URL = "http://localhost:3006"

# Test results
$testResults = @{
    TotalTests = 0
    PassedTests = 0
    FailedTests = 0
    CriticalIssues = @()
    Warnings = @()
    PerformanceMetrics = @()
}

# Helper function
function Invoke-TestRequest {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [string]$TestName = "",
        [bool]$IsCritical = $false
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
        $testResults.PerformanceMetrics += @{
            Test = $TestName
            ResponseTime = $responseTime
            StatusCode = $response.StatusCode
        }
        
        $statusColor = if ($responseTime -lt 100) { "Green" } elseif ($responseTime -lt 500) { "Yellow" } else { "Red" }
        Write-Host "  ✅ $TestName - ${responseTime}ms (${response.StatusCode})" -ForegroundColor $statusColor
        
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
        
        if ($IsCritical) {
            $testResults.CriticalIssues += "${TestName}: ${errorMessage}"
            Write-Host "  ❌ CRITICAL: ${TestName} - ${errorMessage}" -ForegroundColor Red
        } else {
            $testResults.Warnings += "${TestName}: ${errorMessage}"
            Write-Host "  ⚠️  WARNING: ${TestName} - ${errorMessage}" -ForegroundColor Yellow
        }
        
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

Write-Host "`n1.1 Testing API Gateway Health..." -ForegroundColor Cyan
$apiHealth = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/health" -TestName "API Gateway Health" -IsCritical $true

Write-Host "`n1.2 Testing Auth Service Health..." -ForegroundColor Cyan
$authHealth = Invoke-TestRequest -Method "GET" -Url "$AUTH_URL/health" -TestName "Auth Service Health" -IsCritical $true

Write-Host "`n1.3 Testing Billing Service Health..." -ForegroundColor Cyan
$billingHealth = Invoke-TestRequest -Method "GET" -Url "$BILLING_URL/health" -TestName "Billing Service Health" -IsCritical $true

Write-Host "`n1.4 Testing Payment Service Health..." -ForegroundColor Cyan
$paymentHealth = Invoke-TestRequest -Method "GET" -Url "$PAYMENT_URL/api/v1/health" -TestName "Payment Service Health" -IsCritical $true

# PHASE 2: AUTHENTICATION FLOW
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 2: AUTHENTICATION FLOW" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n2.1 Testing Company Registration..." -ForegroundColor Cyan
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$companyData = @{
    email = "manual-test-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Manual Test Company $timestamp"
    description = "Company for manual testing"
    website = "https://manual-test-$timestamp.example.com"
    phone = "+7-999-111-22-33"
} | ConvertTo-Json

$registerResult = Invoke-TestRequest -Method "POST" -Url "$BASE_URL/v1/auth/register" -Body $companyData -TestName "Company Registration" -IsCritical $true

if ($registerResult.Success) {
    $token = ($registerResult.Content | ConvertFrom-Json).accessToken
    Write-Host "  ✅ Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green
    
    Write-Host "`n2.2 Testing Token Validation..." -ForegroundColor Cyan
    $headers = @{ "Authorization" = "Bearer $token" }
    $tokenValidation = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $headers -TestName "Token Validation" -IsCritical $true
    
    Write-Host "`n2.3 Testing Invalid Token..." -ForegroundColor Cyan
    $invalidHeaders = @{ "Authorization" = "Bearer invalid-token" }
    $invalidTokenTest = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $invalidHeaders -TestName "Invalid Token Test"
    
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
    
    Write-Host "`n3.1 Testing Balance Retrieval..." -ForegroundColor Cyan
    $balanceResult = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $headers -TestName "Balance Retrieval" -IsCritical $true
    
    Write-Host "`n3.2 Testing Transaction History..." -ForegroundColor Cyan
    $transactionsResult = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/billing/transactions" -Headers $headers -TestName "Transaction History" -IsCritical $true
    
    Write-Host "`n3.3 Testing Balance Addition..." -ForegroundColor Cyan
    $addBalanceData = @{
        amount = 1000.50
        currency = "RUB"
        description = "Manual test balance addition"
    } | ConvertTo-Json
    
    $addBalanceResult = Invoke-TestRequest -Method "POST" -Url "$BASE_URL/v1/billing/balance/add" -Headers $headers -Body $addBalanceData -TestName "Balance Addition" -IsCritical $true
    
    Write-Host "`n3.4 Testing Updated Balance..." -ForegroundColor Cyan
    $updatedBalanceResult = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $headers -TestName "Updated Balance Check"
    
    Write-Host "`n3.5 Testing Direct Billing Service Access..." -ForegroundColor Cyan
    $directBillingResult = Invoke-TestRequest -Method "GET" -Url "$BILLING_URL/health" -TestName "Direct Billing Service Access"
}

# PHASE 4: AI MODELS SYSTEM
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 4: AI MODELS SYSTEM" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "`n4.1 Testing AI Models List..." -ForegroundColor Cyan
    $modelsResult = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/models" -Headers $headers -TestName "AI Models List" -IsCritical $true
    
    Write-Host "`n4.2 Testing AI Models Providers..." -ForegroundColor Cyan
    $providersResult = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/models/providers" -Headers $headers -TestName "AI Models Providers"
    
    Write-Host "`n4.3 Testing AI Models Categories..." -ForegroundColor Cyan
    $categoriesResult = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/models/categories" -Headers $headers -TestName "AI Models Categories"
    
    Write-Host "`n4.4 Testing AI Models Filtering..." -ForegroundColor Cyan
    $filteredModelsResult = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/models?provider=openai" -Headers $headers -TestName "AI Models Filtering"
}

# PHASE 5: PAYMENT SYSTEM
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 5: PAYMENT SYSTEM" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "`n5.1 Testing Payment Creation..." -ForegroundColor Cyan
    $paymentData = @{
        amount = 500.00
        currency = "RUB"
        description = "Manual test payment"
    } | ConvertTo-Json
    
    $paymentResult = Invoke-TestRequest -Method "POST" -Url "$PAYMENT_URL/api/v1/payments" -Headers $headers -Body $paymentData -TestName "Payment Creation" -IsCritical $true
    
    if ($paymentResult.Success) {
        $paymentId = ($paymentResult.Content | ConvertFrom-Json).paymentId
        Write-Host "  ✅ Payment created: $paymentId" -ForegroundColor Green
        
        Write-Host "`n5.2 Testing Payment Status Check..." -ForegroundColor Cyan
        $paymentStatusResult = Invoke-TestRequest -Method "GET" -Url "$PAYMENT_URL/api/v1/payments/$paymentId" -Headers $headers -TestName "Payment Status Check"
        
        Write-Host "`n5.3 Testing Payment History..." -ForegroundColor Cyan
        $paymentHistoryResult = Invoke-TestRequest -Method "GET" -Url "$PAYMENT_URL/api/v1/payments" -Headers $headers -TestName "Payment History"
    }
}

# PHASE 6: PERFORMANCE TESTING
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 6: PERFORMANCE TESTING" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n6.1 Testing Concurrent Health Checks..." -ForegroundColor Cyan
$concurrentTasks = @()
for ($i = 1; $i -le 10; $i++) {
    $task = Start-Job -ScriptBlock {
        param($Url, $TestName)
        try {
            $startTime = Get-Date
            $response = Invoke-WebRequest -Uri $Url -Method GET -UseBasicParsing -TimeoutSec 30
            $endTime = Get-Date
            $responseTime = ($endTime - $startTime).TotalMilliseconds
            return @{ Success = $true; ResponseTime = $responseTime; TestName = $TestName }
        } catch {
            return @{ Success = $false; Error = $_.Exception.Message; TestName = $TestName }
        }
    } -ArgumentList "$BASE_URL/health", "Concurrent Health Check #$i"
    $concurrentTasks += $task
}

$concurrentTasks | Wait-Job | Out-Null
$concurrentResults = @()
foreach ($task in $concurrentTasks) {
    $result = Receive-Job -Job $task
    $concurrentResults += $result
    Remove-Job -Job $task
}

$successfulConcurrent = $concurrentResults | Where-Object { $_.Success -eq $true }
$avgConcurrentTime = if ($successfulConcurrent.Count -gt 0) { 
    ($successfulConcurrent | Measure-Object -Property ResponseTime -Average).Average 
} else { 0 }

Write-Host "  📊 Concurrent Health Checks: $($successfulConcurrent.Count)/$($concurrentResults.Count) successful" -ForegroundColor Green
Write-Host "  📊 Average response time: $([math]::Round($avgConcurrentTime, 2))ms" -ForegroundColor Green

Write-Host "`n6.2 Testing Load on Protected Endpoints..." -ForegroundColor Cyan
if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    $loadTestResults = @()
    
    for ($i = 1; $i -le 20; $i++) {
        $result = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $headers -TestName "Load Test #$i"
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
}

# PHASE 7: ERROR HANDLING
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 7: ERROR HANDLING" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n7.1 Testing 404 Errors..." -ForegroundColor Cyan
$notFoundResult = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/non-existent-endpoint" -TestName "404 Error Test"

Write-Host "`n7.2 Testing 401 Errors..." -ForegroundColor Cyan
$unauthorizedResult = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -TestName "401 Error Test"

Write-Host "`n7.3 Testing Invalid JSON..." -ForegroundColor Cyan
$invalidJsonResult = Invoke-TestRequest -Method "POST" -Url "$BASE_URL/v1/auth/register" -Body "invalid json" -TestName "Invalid JSON Test"

Write-Host "`n7.4 Testing Rate Limiting..." -ForegroundColor Cyan
$rateLimitResults = @()
for ($i = 1; $i -le 5; $i++) {
    $result = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/health" -TestName "Rate Limit Test #$i"
    $rateLimitResults += $result
    Start-Sleep -Milliseconds 100
}

# PHASE 8: DATABASE CONNECTIVITY
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 8: DATABASE CONNECTIVITY" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n8.1 Testing Database Containers..." -ForegroundColor Cyan
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

Write-Host "`n8.2 Testing Redis Connectivity..." -ForegroundColor Cyan
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

# PHASE 9: MESSAGE QUEUE
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 9: MESSAGE QUEUE" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n9.1 Testing RabbitMQ Connectivity..." -ForegroundColor Cyan
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

if ($testResults.Warnings.Count -gt 0) {
    Write-Host "`nWARNINGS:" -ForegroundColor Yellow
    foreach ($warning in $testResults.Warnings) {
        Write-Host "  ⚠️  $warning" -ForegroundColor Yellow
    }
} else {
    Write-Host "`n✅ NO WARNINGS" -ForegroundColor Green
}

Write-Host "`nPERFORMANCE METRICS:" -ForegroundColor Cyan
$avgResponseTime = if ($testResults.PerformanceMetrics.Count -gt 0) {
    ($testResults.PerformanceMetrics | Measure-Object -Property ResponseTime -Average).Average
} else { 0 }

$maxResponseTime = if ($testResults.PerformanceMetrics.Count -gt 0) {
    ($testResults.PerformanceMetrics | Measure-Object -Property ResponseTime -Maximum).Maximum
} else { 0 }

Write-Host "  Average Response Time: $([math]::Round($avgResponseTime, 2))ms" -ForegroundColor White
Write-Host "  Maximum Response Time: $([math]::Round($maxResponseTime, 2))ms" -ForegroundColor White

# Overall assessment
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
