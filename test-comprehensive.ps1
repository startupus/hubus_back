# Comprehensive System Test
Write-Host "================================================" -ForegroundColor Green
Write-Host "  COMPREHENSIVE SYSTEM TEST" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$BASE_URL = "http://localhost:3000"
$AUTH_URL = "http://localhost:3001"
$BILLING_URL = "http://localhost:3004"
$PAYMENT_URL = "http://localhost:3006"

$passed = 0
$failed = 0
$performanceData = @()

function Test-Endpoint {
    param([string]$Name, [string]$Method, [string]$Url, [hashtable]$Headers = @{}, [string]$Body = $null)
    
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
        
        $script:passed++
        $script:performanceData += @{
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
        $script:failed++
        Write-Host "  ❌ $Name - $($_.Exception.Message)" -ForegroundColor Red
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# PHASE 1: HEALTH CHECKS
Write-Host "`n1. HEALTH CHECKS" -ForegroundColor Yellow
Test-Endpoint "API Gateway Health" "GET" "$BASE_URL/health"
Test-Endpoint "Auth Service Health" "GET" "$AUTH_URL/health"
Test-Endpoint "Billing Service Health" "GET" "$BILLING_URL/health"
Test-Endpoint "Payment Service Health" "GET" "$PAYMENT_URL/api/v1/health"

# PHASE 2: AUTHENTICATION
Write-Host "`n2. AUTHENTICATION" -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$companyData = @{
    email = "comprehensive-test-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Comprehensive Test Company $timestamp"
    description = "Company for comprehensive testing"
    website = "https://comprehensive-test-$timestamp.example.com"
    phone = "+7-999-111-22-33"
} | ConvertTo-Json

$registerResult = Test-Endpoint "Company Registration" "POST" "$BASE_URL/v1/auth/register" @{} $companyData

if ($registerResult.Success) {
    $token = ($registerResult.Content | ConvertFrom-Json).accessToken
    Write-Host "  ✅ Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green
    
    $headers = @{ "Authorization" = "Bearer $token" }
    
    # Test authenticated endpoints
    Test-Endpoint "Token Validation" "GET" "$BASE_URL/v1/billing/balance" $headers
    Test-Endpoint "Company Info" "GET" "$BASE_URL/v1/auth/me" $headers
    
    # Security tests
    $invalidHeaders = @{ "Authorization" = "Bearer invalid-token" }
    $invalidTest = Test-Endpoint "Invalid Token Test" "GET" "$BASE_URL/v1/billing/balance" $invalidHeaders
    
    if (-not $invalidTest.Success) {
        Write-Host "  ✅ Security: Invalid token properly rejected" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Security: Invalid token was accepted!" -ForegroundColor Red
    }
} else {
    Write-Host "  ❌ Registration failed - cannot continue" -ForegroundColor Red
}

# PHASE 3: BILLING SYSTEM
Write-Host "`n3. BILLING SYSTEM" -ForegroundColor Yellow
if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Test-Endpoint "Balance Retrieval" "GET" "$BASE_URL/v1/billing/balance" $headers
    Test-Endpoint "Transaction History" "GET" "$BASE_URL/v1/billing/transactions" $headers
    Test-Endpoint "Direct Billing Service Access" "GET" "$BILLING_URL/health" @{}
    
    # Test direct billing endpoints
    if ($registerResult.Success) {
        $companyId = ($registerResult.Content | ConvertFrom-Json).company.id
        Test-Endpoint "Direct Balance Check" "GET" "$BILLING_URL/billing/company/$companyId/balance" @{}
        Test-Endpoint "Direct Transactions Check" "GET" "$BILLING_URL/billing/company/$companyId/transactions" @{}
    }
}

# PHASE 4: AI MODELS SYSTEM
Write-Host "`n4. AI MODELS SYSTEM" -ForegroundColor Yellow
if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Test-Endpoint "AI Models List" "GET" "$BASE_URL/v1/models" $headers
    Test-Endpoint "AI Models Providers" "GET" "$BASE_URL/v1/models/providers" $headers
    Test-Endpoint "AI Models Categories" "GET" "$BASE_URL/v1/models/categories" $headers
    Test-Endpoint "AI Models Filtering (OpenAI)" "GET" "$BASE_URL/v1/models?provider=openai" $headers
    Test-Endpoint "AI Models Filtering (Anthropic)" "GET" "$BASE_URL/v1/models?provider=anthropic" $headers
    Test-Endpoint "AI Models Filtering (Chat)" "GET" "$BASE_URL/v1/models?category=chat" $headers
}

# PHASE 5: PAYMENT SYSTEM
Write-Host "`n5. PAYMENT SYSTEM" -ForegroundColor Yellow
if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    $paymentData = @{
        amount = 2000.00
        currency = "RUB"
        description = "Comprehensive test payment"
    } | ConvertTo-Json
    
    $paymentResult = Test-Endpoint "Payment Creation" "POST" "$PAYMENT_URL/api/v1/payments" $headers $paymentData
    
    if ($paymentResult.Success) {
        $paymentId = ($paymentResult.Content | ConvertFrom-Json).paymentId
        Write-Host "  ✅ Payment created: $paymentId" -ForegroundColor Green
        
        Test-Endpoint "Payment Status Check" "GET" "$PAYMENT_URL/api/v1/payments/$paymentId" $headers
        Test-Endpoint "Payment History" "GET" "$PAYMENT_URL/api/v1/payments" $headers
        
        # Test webhook
        $webhookData = @{
            paymentId = $paymentId
            status = "succeeded"
            amount = 2000.00
            currency = "RUB"
        } | ConvertTo-Json
        
        Test-Endpoint "Payment Webhook" "POST" "$PAYMENT_URL/api/v1/payments/webhook" $headers $webhookData
    }
}

# PHASE 6: INFRASTRUCTURE
Write-Host "`n6. INFRASTRUCTURE" -ForegroundColor Yellow

# Check database containers
$dbContainers = @("project-auth-db-1", "project-billing-db-1", "project-orchestrator-db-1", "project-payment-db-1", "project-api-gateway-db-1")
foreach ($db in $dbContainers) {
    try {
        $container = docker ps --filter "name=$db" --format "table {{.Names}}\t{{.Status}}"
        if ($container -match "Up") {
            Write-Host "  ✅ ${db}: Running" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ❌ ${db}: Not running" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  ❌ ${db}: Error checking status" -ForegroundColor Red
        $failed++
    }
}

# Check Redis
try {
    $redisResult = docker exec project-redis-1 redis-cli ping
    if ($redisResult -match "PONG") {
        Write-Host "  ✅ Redis: Connected and responding" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ Redis: Not responding properly" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "  ❌ Redis: Connection failed" -ForegroundColor Red
    $failed++
}

# Check RabbitMQ
try {
    $rabbitmqResult = docker exec project-rabbitmq-1 rabbitmq-diagnostics ping
    if ($rabbitmqResult -match "pong") {
        Write-Host "  ✅ RabbitMQ: Connected and responding" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ RabbitMQ: Not responding properly" -ForegroundColor Red
        $failed++
    }
} catch {
    Write-Host "  ❌ RabbitMQ: Connection failed" -ForegroundColor Red
    $failed++
}

# PHASE 7: PERFORMANCE TEST
Write-Host "`n7. PERFORMANCE TEST" -ForegroundColor Yellow
$loadTestResults = @()
for ($i = 1; $i -le 10; $i++) {
    $result = Test-Endpoint "Load Test #$i" "GET" "$BASE_URL/health" @{} $null
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

# PHASE 8: ERROR HANDLING
Write-Host "`n8. ERROR HANDLING" -ForegroundColor Yellow
Test-Endpoint "404 Error Test" "GET" "$BASE_URL/v1/non-existent-endpoint" @{} $null
Test-Endpoint "401 Error Test" "GET" "$BASE_URL/v1/billing/balance" @{} $null
Test-Endpoint "Invalid JSON Test" "POST" "$BASE_URL/v1/auth/register" @{} "invalid json"

# PHASE 9: CONCURRENT TESTING
Write-Host "`n9. CONCURRENT TESTING" -ForegroundColor Yellow
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

# FINAL RESULTS
Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  COMPREHENSIVE TEST RESULTS" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$total = $passed + $failed
$successRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }

Write-Host "`nSUMMARY:" -ForegroundColor Cyan
Write-Host "  Total Tests: $total" -ForegroundColor White
Write-Host "  Passed: $passed" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor Red
Write-Host "  Success Rate: ${successRate}%" -ForegroundColor White

Write-Host "`nPERFORMANCE SUMMARY:" -ForegroundColor Cyan
if ($performanceData.Count -gt 0) {
    $avgResponseTime = ($performanceData | Measure-Object -Property ResponseTime -Average).Average
    $maxResponseTime = ($performanceData | Measure-Object -Property ResponseTime -Maximum).Maximum
    $minResponseTime = ($performanceData | Measure-Object -Property ResponseTime -Minimum).Minimum
    
    Write-Host "  Average Response Time: $([math]::Round($avgResponseTime, 2))ms" -ForegroundColor White
    Write-Host "  Maximum Response Time: $([math]::Round($maxResponseTime, 2))ms" -ForegroundColor White
    Write-Host "  Minimum Response Time: $([math]::Round($minResponseTime, 2))ms" -ForegroundColor White
}

Write-Host "`nOVERALL ASSESSMENT:" -ForegroundColor Cyan
if ($successRate -ge 95) {
    Write-Host "  🎉 SYSTEM IS HEALTHY AND READY FOR PRODUCTION!" -ForegroundColor Green
} elseif ($successRate -ge 85) {
    Write-Host "  ✅ SYSTEM IS FUNCTIONAL AND STABLE" -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host "  ⚠️  SYSTEM HAS MINOR ISSUES BUT IS FUNCTIONAL" -ForegroundColor Yellow
} else {
    Write-Host "  ❌ SYSTEM HAS SIGNIFICANT ISSUES" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  COMPREHENSIVE TEST COMPLETED" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
