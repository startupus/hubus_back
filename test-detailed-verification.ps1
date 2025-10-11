# Detailed System Verification
# Comprehensive testing of all components

Write-Host "================================================" -ForegroundColor Green
Write-Host "  DETAILED SYSTEM VERIFICATION" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$BASE_URL = "http://localhost:3000"
$AUTH_URL = "http://localhost:3001"
$BILLING_URL = "http://localhost:3004"
$PAYMENT_URL = "http://localhost:3006"

$testResults = @{
    TotalTests = 0
    PassedTests = 0
    FailedTests = 0
    PerformanceMetrics = @()
    Issues = @()
}

function Test-DetailedEndpoint {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
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
            Test = $Name
            ResponseTime = $responseTime
            StatusCode = $response.StatusCode
        }
        
        $statusColor = if ($responseTime -lt 100) { "Green" } elseif ($responseTime -lt 500) { "Yellow" } else { "Red" }
        Write-Host "  ✅ $Name - ${responseTime}ms (${response.StatusCode})" -ForegroundColor $statusColor
        
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
            Write-Host "  ❌ CRITICAL: $Name - $errorMessage" -ForegroundColor Red
            $testResults.Issues += "CRITICAL: $Name - $errorMessage"
        } else {
            Write-Host "  ⚠️  WARNING: $Name - $errorMessage" -ForegroundColor Yellow
            $testResults.Issues += "WARNING: $Name - $errorMessage"
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

Write-Host "`n1.1 API Gateway Health..." -ForegroundColor Cyan
$apiHealth = Test-DetailedEndpoint "API Gateway Health" "GET" "$BASE_URL/health" @{} $null $true

Write-Host "`n1.2 Auth Service Health..." -ForegroundColor Cyan
$authHealth = Test-DetailedEndpoint "Auth Service Health" "GET" "$AUTH_URL/health" @{} $null $true

Write-Host "`n1.3 Billing Service Health..." -ForegroundColor Cyan
$billingHealth = Test-DetailedEndpoint "Billing Service Health" "GET" "$BILLING_URL/health" @{} $null $true

Write-Host "`n1.4 Payment Service Health..." -ForegroundColor Cyan
$paymentHealth = Test-DetailedEndpoint "Payment Service Health" "GET" "$PAYMENT_URL/api/v1/health" @{} $null $true

# PHASE 2: AUTHENTICATION FLOW
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 2: AUTHENTICATION FLOW" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n2.1 Company Registration..." -ForegroundColor Cyan
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$companyData = @{
    email = "detailed-test-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Detailed Test Company $timestamp"
    description = "Company for detailed testing"
    website = "https://detailed-test-$timestamp.example.com"
    phone = "+7-999-111-22-33"
} | ConvertTo-Json

$registerResult = Test-DetailedEndpoint "Company Registration" "POST" "$BASE_URL/v1/auth/register" @{} $companyData $true

if ($registerResult.Success) {
    $token = ($registerResult.Content | ConvertFrom-Json).accessToken
    Write-Host "  ✅ Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green
    
    Write-Host "`n2.2 Token Validation..." -ForegroundColor Cyan
    $headers = @{ "Authorization" = "Bearer $token" }
    $tokenValidation = Test-DetailedEndpoint "Token Validation" "GET" "$BASE_URL/v1/billing/balance" $headers $null $true
    
    Write-Host "`n2.3 Security Test - Invalid Token..." -ForegroundColor Cyan
    $invalidHeaders = @{ "Authorization" = "Bearer invalid-token" }
    $invalidTokenTest = Test-DetailedEndpoint "Invalid Token Test" "GET" "$BASE_URL/v1/billing/balance" $invalidHeaders
    
    if (-not $invalidTokenTest.Success) {
        Write-Host "  ✅ Security: Invalid token properly rejected" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Security: Invalid token was accepted!" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ Registration failed - cannot continue with auth tests" -ForegroundColor Red
}

# PHASE 3: BILLING SYSTEM
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 3: BILLING SYSTEM" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "`n3.1 Balance Retrieval..." -ForegroundColor Cyan
    $balanceResult = Test-DetailedEndpoint "Balance Retrieval" "GET" "$BASE_URL/v1/billing/balance" $headers $null $true
    
    Write-Host "`n3.2 Transaction History..." -ForegroundColor Cyan
    $transactionsResult = Test-DetailedEndpoint "Transaction History" "GET" "$BASE_URL/v1/billing/transactions" $headers $null $true
    
    Write-Host "`n3.3 Direct Billing Service Access..." -ForegroundColor Cyan
    $directBillingResult = Test-DetailedEndpoint "Direct Billing Service Access" "GET" "$BILLING_URL/health" @{} $null
    
    Write-Host "`n3.4 Billing Service Balance (Direct)..." -ForegroundColor Cyan
    $companyId = ($registerResult.Content | ConvertFrom-Json).company.id
    $directBalanceResult = Test-DetailedEndpoint "Direct Balance Check" "GET" "$BILLING_URL/billing/company/$companyId/balance" @{} $null
}

# PHASE 4: AI MODELS SYSTEM
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 4: AI MODELS SYSTEM" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "`n4.1 AI Models List..." -ForegroundColor Cyan
    $modelsResult = Test-DetailedEndpoint "AI Models List" "GET" "$BASE_URL/v1/models" $headers $null $true
    
    Write-Host "`n4.2 AI Models Providers..." -ForegroundColor Cyan
    $providersResult = Test-DetailedEndpoint "AI Models Providers" "GET" "$BASE_URL/v1/models/providers" $headers $null
    
    Write-Host "`n4.3 AI Models Categories..." -ForegroundColor Cyan
    $categoriesResult = Test-DetailedEndpoint "AI Models Categories" "GET" "$BASE_URL/v1/models/categories" $headers $null
    
    Write-Host "`n4.4 AI Models Filtering (OpenAI)..." -ForegroundColor Cyan
    $filteredModelsResult = Test-DetailedEndpoint "AI Models Filtering (OpenAI)" "GET" "$BASE_URL/v1/models?provider=openai" $headers $null
    
    Write-Host "`n4.5 AI Models Filtering (Anthropic)..." -ForegroundColor Cyan
    $filteredModelsResult2 = Test-DetailedEndpoint "AI Models Filtering (Anthropic)" "GET" "$BASE_URL/v1/models?provider=anthropic" $headers $null
    
    Write-Host "`n4.6 AI Models Filtering (Chat Category)..." -ForegroundColor Cyan
    $filteredModelsResult3 = Test-DetailedEndpoint "AI Models Filtering (Chat)" "GET" "$BASE_URL/v1/models?category=chat" $headers $null
}

# PHASE 5: PAYMENT SYSTEM
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 5: PAYMENT SYSTEM" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "`n5.1 Payment Creation..." -ForegroundColor Cyan
    $paymentData = @{
        amount = 1500.00
        currency = "RUB"
        description = "Detailed test payment"
    } | ConvertTo-Json
    
    $paymentResult = Test-DetailedEndpoint "Payment Creation" "POST" "$PAYMENT_URL/api/v1/payments" $headers $paymentData $true
    
    if ($paymentResult.Success) {
        $paymentId = ($paymentResult.Content | ConvertFrom-Json).paymentId
        Write-Host "  ✅ Payment created: $paymentId" -ForegroundColor Green
        
        Write-Host "`n5.2 Payment Status Check..." -ForegroundColor Cyan
        $paymentStatusResult = Test-DetailedEndpoint "Payment Status Check" "GET" "$PAYMENT_URL/api/v1/payments/$paymentId" $headers $null
        
        Write-Host "`n5.3 Payment History..." -ForegroundColor Cyan
        $paymentHistoryResult = Test-DetailedEndpoint "Payment History" "GET" "$PAYMENT_URL/api/v1/payments" $headers $null
        
        Write-Host "`n5.4 Payment Webhook Simulation..." -ForegroundColor Cyan
        $webhookData = @{
            paymentId = $paymentId
            status = "succeeded"
            amount = 1500.00
            currency = "RUB"
        } | ConvertTo-Json
        
        $webhookResult = Test-DetailedEndpoint "Payment Webhook" "POST" "$PAYMENT_URL/api/v1/payments/webhook" $headers $webhookData
    }
}

# PHASE 6: INFRASTRUCTURE TESTING
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 6: INFRASTRUCTURE TESTING" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n6.1 Database Containers..." -ForegroundColor Cyan
$dbContainers = @("project-auth-db-1", "project-billing-db-1", "project-orchestrator-db-1", "project-payment-db-1", "project-api-gateway-db-1")
foreach ($db in $dbContainers) {
    try {
        $container = docker ps --filter "name=$db" --format "table {{.Names}}\t{{.Status}}"
        if ($container -match "Up") {
            Write-Host "  ✅ ${db}: Running" -ForegroundColor Green
            $testResults.PassedTests++
        } else {
            Write-Host "  ❌ ${db}: Not running" -ForegroundColor Red
            $testResults.FailedTests++
            $testResults.Issues += "Database: ${db} is not running"
        }
    } catch {
        Write-Host "  ❌ ${db}: Error checking status" -ForegroundColor Red
        $testResults.FailedTests++
        $testResults.Issues += "Database: Error checking ${db} status"
    }
    $testResults.TotalTests++
}

Write-Host "`n6.2 Redis Connectivity..." -ForegroundColor Cyan
try {
    $redisResult = docker exec project-redis-1 redis-cli ping
    if ($redisResult -match "PONG") {
        Write-Host "  ✅ Redis: Connected and responding" -ForegroundColor Green
        $testResults.PassedTests++
    } else {
        Write-Host "  ❌ Redis: Not responding properly" -ForegroundColor Red
        $testResults.FailedTests++
        $testResults.Issues += "Redis: Not responding to ping"
    }
} catch {
    Write-Host "  ❌ Redis: Connection failed" -ForegroundColor Red
    $testResults.FailedTests++
    $testResults.Issues += "Redis: Connection failed"
}
$testResults.TotalTests++

Write-Host "`n6.3 RabbitMQ Connectivity..." -ForegroundColor Cyan
try {
    $rabbitmqResult = docker exec project-rabbitmq-1 rabbitmq-diagnostics ping
    if ($rabbitmqResult -match "pong") {
        Write-Host "  ✅ RabbitMQ: Connected and responding" -ForegroundColor Green
        $testResults.PassedTests++
    } else {
        Write-Host "  ❌ RabbitMQ: Not responding properly" -ForegroundColor Red
        $testResults.FailedTests++
        $testResults.Issues += "RabbitMQ: Not responding to ping"
    }
} catch {
    Write-Host "  ❌ RabbitMQ: Connection failed" -ForegroundColor Red
    $testResults.FailedTests++
    $testResults.Issues += "RabbitMQ: Connection failed"
}
$testResults.TotalTests++

# PHASE 7: PERFORMANCE TESTING
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 7: PERFORMANCE TESTING" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n7.1 Load Test on Health Endpoints..." -ForegroundColor Cyan
$loadTestResults = @()
for ($i = 1; $i -le 10; $i++) {
    $result = Test-DetailedEndpoint "Load Test #$i" "GET" "$BASE_URL/health" @{} $null
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

Write-Host "`n7.2 Concurrent Test..." -ForegroundColor Cyan
$concurrentTasks = @()
for ($i = 1; $i -le 5; $i++) {
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
    } -ArgumentList "$BASE_URL/health", "Concurrent Test #$i"
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

Write-Host "  📊 Concurrent test results:" -ForegroundColor Green
Write-Host "    Successful: $($successfulConcurrent.Count)/$($concurrentResults.Count)" -ForegroundColor Green
Write-Host "    Average response time: $([math]::Round($avgConcurrentTime, 2))ms" -ForegroundColor Green

# PHASE 8: ERROR HANDLING
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 8: ERROR HANDLING" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

Write-Host "`n8.1 404 Error Test..." -ForegroundColor Cyan
$notFoundResult = Test-DetailedEndpoint "404 Error Test" "GET" "$BASE_URL/v1/non-existent-endpoint" @{} $null

Write-Host "`n8.2 401 Error Test..." -ForegroundColor Cyan
$unauthorizedResult = Test-DetailedEndpoint "401 Error Test" "GET" "$BASE_URL/v1/billing/balance" @{} $null

Write-Host "`n8.3 Invalid JSON Test..." -ForegroundColor Cyan
$invalidJsonResult = Test-DetailedEndpoint "Invalid JSON Test" "POST" "$BASE_URL/v1/auth/register" @{} "invalid json"

Write-Host "`n8.4 Rate Limiting Test..." -ForegroundColor Cyan
$rateLimitResults = @()
for ($i = 1; $i -le 5; $i++) {
    $result = Test-DetailedEndpoint "Rate Limit Test #$i" "GET" "$BASE_URL/health" @{} $null
    $rateLimitResults += $result
    Start-Sleep -Milliseconds 100
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

Write-Host "`nPERFORMANCE SUMMARY:" -ForegroundColor Cyan
$avgResponseTime = if ($testResults.PerformanceMetrics.Count -gt 0) {
    ($testResults.PerformanceMetrics | Measure-Object -Property ResponseTime -Average).Average
} else { 0 }

$maxResponseTime = if ($testResults.PerformanceMetrics.Count -gt 0) {
    ($testResults.PerformanceMetrics | Measure-Object -Property ResponseTime -Maximum).Maximum
} else { 0 }

Write-Host "  Average Response Time: $([math]::Round($avgResponseTime, 2))ms" -ForegroundColor White
Write-Host "  Maximum Response Time: $([math]::Round($maxResponseTime, 2))ms" -ForegroundColor White

Write-Host "`nOVERALL ASSESSMENT:" -ForegroundColor Cyan
if ($testResults.Issues.Count -eq 0 -and $testResults.PassedTests / $testResults.TotalTests -ge 0.95) {
    Write-Host "  🎉 SYSTEM IS HEALTHY AND READY FOR PRODUCTION!" -ForegroundColor Green
} elseif ($testResults.Issues.Count -eq 0) {
    Write-Host "  ✅ SYSTEM IS FUNCTIONAL AND STABLE" -ForegroundColor Green
} elseif ($testResults.PassedTests / $testResults.TotalTests -ge 0.8) {
    Write-Host "  ⚠️  SYSTEM HAS MINOR ISSUES BUT IS FUNCTIONAL" -ForegroundColor Yellow
} else {
    Write-Host "  ❌ SYSTEM HAS SIGNIFICANT ISSUES" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  DETAILED VERIFICATION COMPLETED" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
