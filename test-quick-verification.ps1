# Quick System Verification
# Simple and reliable testing

Write-Host "================================================" -ForegroundColor Green
Write-Host "  QUICK SYSTEM VERIFICATION" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$BASE_URL = "http://localhost:3000"
$AUTH_URL = "http://localhost:3001"
$BILLING_URL = "http://localhost:3004"
$PAYMENT_URL = "http://localhost:3006"

$passed = 0
$failed = 0

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
        Write-Host "  ✅ $Name - ${responseTime}ms (${response.StatusCode})" -ForegroundColor Green
        return $true
    }
    catch {
        $script:failed++
        Write-Host "  ❌ $Name - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# HEALTH CHECKS
Write-Host "`n1. HEALTH CHECKS" -ForegroundColor Yellow
Test-Endpoint "API Gateway Health" "GET" "$BASE_URL/health"
Test-Endpoint "Auth Service Health" "GET" "$AUTH_URL/health"
Test-Endpoint "Billing Service Health" "GET" "$BILLING_URL/health"
Test-Endpoint "Payment Service Health" "GET" "$PAYMENT_URL/api/v1/health"

# AUTHENTICATION
Write-Host "`n2. AUTHENTICATION" -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$companyData = @{
    email = "quick-test-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Quick Test Company $timestamp"
    description = "Company for quick testing"
} | ConvertTo-Json

$registerSuccess = Test-Endpoint "Company Registration" "POST" "$BASE_URL/v1/auth/register" @{} $companyData

if ($registerSuccess) {
    # Get token from registration
    try {
        $registerResponse = Invoke-WebRequest -Uri "$BASE_URL/v1/auth/register" -Method POST -Body $companyData -ContentType "application/json" -UseBasicParsing
        $token = ($registerResponse.Content | ConvertFrom-Json).accessToken
        Write-Host "  ✅ Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green
        
        $headers = @{ "Authorization" = "Bearer $token" }
        
        # Test authenticated endpoints
        Test-Endpoint "Token Validation" "GET" "$BASE_URL/v1/billing/balance" $headers
        Test-Endpoint "AI Models List" "GET" "$BASE_URL/v1/models" $headers
        Test-Endpoint "AI Models Providers" "GET" "$BASE_URL/v1/models/providers" $headers
        Test-Endpoint "AI Models Categories" "GET" "$BASE_URL/v1/models/categories" $headers
        
        # Test payment creation
        $paymentData = @{
            amount = 500.00
            currency = "RUB"
            description = "Quick test payment"
        } | ConvertTo-Json
        
        $paymentSuccess = Test-Endpoint "Payment Creation" "POST" "$PAYMENT_URL/api/v1/payments" $headers $paymentData
        
        if ($paymentSuccess) {
            try {
                $paymentResponse = Invoke-WebRequest -Uri "$PAYMENT_URL/api/v1/payments" -Method POST -Headers $headers -Body $paymentData -ContentType "application/json" -UseBasicParsing
                $paymentId = ($paymentResponse.Content | ConvertFrom-Json).paymentId
                Write-Host "  ✅ Payment created: $paymentId" -ForegroundColor Green
                
                Test-Endpoint "Payment Status Check" "GET" "$PAYMENT_URL/api/v1/payments/$paymentId" $headers
            } catch {
                Write-Host "  ⚠️  Payment creation succeeded but couldn't get payment ID" -ForegroundColor Yellow
            }
        }
        
    } catch {
        Write-Host "  ❌ Could not get token from registration" -ForegroundColor Red
        $script:failed++
    }
}

# SECURITY TESTS
Write-Host "`n3. SECURITY TESTS" -ForegroundColor Yellow
$invalidHeaders = @{ "Authorization" = "Bearer invalid-token" }
$invalidTest = Test-Endpoint "Invalid Token Test" "GET" "$BASE_URL/v1/billing/balance" $invalidHeaders

if (-not $invalidTest) {
    Write-Host "  ✅ Security: Invalid token properly rejected" -ForegroundColor Green
} else {
    Write-Host "  ❌ Security: Invalid token was accepted!" -ForegroundColor Red
}

Test-Endpoint "404 Error Test" "GET" "$BASE_URL/v1/non-existent-endpoint"
Test-Endpoint "401 Error Test" "GET" "$BASE_URL/v1/billing/balance"

# INFRASTRUCTURE
Write-Host "`n4. INFRASTRUCTURE" -ForegroundColor Yellow

# Check database containers
$dbContainers = @("project-auth-db-1", "project-billing-db-1", "project-orchestrator-db-1", "project-payment-db-1", "project-api-gateway-db-1")
foreach ($db in $dbContainers) {
    try {
        $container = docker ps --filter "name=$db" --format "table {{.Names}}\t{{.Status}}"
        if ($container -match "Up") {
            Write-Host "  ✅ ${db}: Running" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "  ❌ ${db}: Not running" -ForegroundColor Red
            $script:failed++
        }
    } catch {
        Write-Host "  ❌ ${db}: Error checking status" -ForegroundColor Red
        $script:failed++
    }
}

# Check Redis
try {
    $redisResult = docker exec project-redis-1 redis-cli ping
    if ($redisResult -match "PONG") {
        Write-Host "  ✅ Redis: Connected and responding" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  ❌ Redis: Not responding properly" -ForegroundColor Red
        $script:failed++
    }
} catch {
    Write-Host "  ❌ Redis: Connection failed" -ForegroundColor Red
    $script:failed++
}

# Check RabbitMQ
try {
    $rabbitmqResult = docker exec project-rabbitmq-1 rabbitmq-diagnostics ping
    if ($rabbitmqResult -match "pong") {
        Write-Host "  ✅ RabbitMQ: Connected and responding" -ForegroundColor Green
        $script:passed++
    } else {
        Write-Host "  ❌ RabbitMQ: Not responding properly" -ForegroundColor Red
        $script:failed++
    }
} catch {
    Write-Host "  ❌ RabbitMQ: Connection failed" -ForegroundColor Red
    $script:failed++
}

# PERFORMANCE TEST
Write-Host "`n5. PERFORMANCE TEST" -ForegroundColor Yellow
$loadTestResults = @()
for ($i = 1; $i -le 5; $i++) {
    try {
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri "$BASE_URL/health" -Method GET -UseBasicParsing
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        $loadTestResults += $responseTime
        Write-Host "  ✅ Load Test #$i - ${responseTime}ms" -ForegroundColor Green
        $script:passed++
    } catch {
        Write-Host "  ❌ Load Test #$i - $($_.Exception.Message)" -ForegroundColor Red
        $script:failed++
    }
}

if ($loadTestResults.Count -gt 0) {
    $avgLoadTime = ($loadTestResults | Measure-Object -Average).Average
    $minLoadTime = ($loadTestResults | Measure-Object -Minimum).Minimum
    $maxLoadTime = ($loadTestResults | Measure-Object -Maximum).Maximum
    
    Write-Host "  📊 Performance Summary:" -ForegroundColor Cyan
    Write-Host "    Average: $([math]::Round($avgLoadTime, 2))ms" -ForegroundColor White
    Write-Host "    Minimum: $([math]::Round($minLoadTime, 2))ms" -ForegroundColor White
    Write-Host "    Maximum: $([math]::Round($maxLoadTime, 2))ms" -ForegroundColor White
}

# FINAL RESULTS
Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  VERIFICATION RESULTS" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$total = $passed + $failed
$successRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }

Write-Host "`nSUMMARY:" -ForegroundColor Cyan
Write-Host "  Total Tests: $total" -ForegroundColor White
Write-Host "  Passed: $passed" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor Red
Write-Host "  Success Rate: ${successRate}%" -ForegroundColor White

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
Write-Host "  VERIFICATION COMPLETED" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
