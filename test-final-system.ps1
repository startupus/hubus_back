# Final System Test
Write-Host "FINAL SYSTEM TEST" -ForegroundColor Green

$BASE_URL = "http://localhost:3000"
$passed = 0
$failed = 0

# Test 1: Health Checks
Write-Host "`n1. HEALTH CHECKS" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/health" -Method GET -UseBasicParsing
    Write-Host "  ✅ API Gateway Health - $($response.StatusCode)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ❌ API Gateway Health - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -UseBasicParsing
    Write-Host "  ✅ Auth Service Health - $($response.StatusCode)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ❌ Auth Service Health - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3004/health" -Method GET -UseBasicParsing
    Write-Host "  ✅ Billing Service Health - $($response.StatusCode)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ❌ Billing Service Health - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3006/api/v1/health" -Method GET -UseBasicParsing
    Write-Host "  ✅ Payment Service Health - $($response.StatusCode)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ❌ Payment Service Health - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 2: Registration and Authentication
Write-Host "`n2. AUTHENTICATION" -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$companyData = @{
    email = "final-test-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Final Test Company $timestamp"
    description = "Company for final testing"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/v1/auth/register" -Method POST -Body $companyData -ContentType "application/json" -UseBasicParsing
    $token = ($response.Content | ConvertFrom-Json).accessToken
    Write-Host "  ✅ Company Registration - Token obtained" -ForegroundColor Green
    $passed++
    
    # Test authenticated endpoints
    $headers = @{ "Authorization" = "Bearer $token" }
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/v1/billing/balance" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "  ✅ Balance Check - $($response.StatusCode)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ❌ Balance Check - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/v1/billing/transactions" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "  ✅ Transaction History - $($response.StatusCode)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ❌ Transaction History - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/v1/models" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "  ✅ AI Models List - $($response.StatusCode)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ❌ AI Models List - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/v1/models/providers" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "  ✅ AI Models Providers - $($response.StatusCode)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ❌ AI Models Providers - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/v1/models/categories" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "  ✅ AI Models Categories - $($response.StatusCode)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ❌ AI Models Categories - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    # Test payment creation
    $paymentData = @{
        amount = 1000.00
        currency = "RUB"
        description = "Final test payment"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3006/api/v1/payments" -Method POST -Headers $headers -Body $paymentData -ContentType "application/json" -UseBasicParsing
        $paymentId = ($response.Content | ConvertFrom-Json).paymentId
        Write-Host "  ✅ Payment Creation - Payment ID: $paymentId" -ForegroundColor Green
        $passed++
        
        # Test payment status
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3006/api/v1/payments/$paymentId" -Method GET -Headers $headers -UseBasicParsing
            Write-Host "  ✅ Payment Status Check - $($response.StatusCode)" -ForegroundColor Green
            $passed++
        } catch {
            Write-Host "  ❌ Payment Status Check - $($_.Exception.Message)" -ForegroundColor Red
            $failed++
        }
    } catch {
        Write-Host "  ❌ Payment Creation - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
} catch {
    Write-Host "  ❌ Company Registration - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 3: Security
Write-Host "`n3. SECURITY TESTS" -ForegroundColor Yellow
try {
    $invalidHeaders = @{ "Authorization" = "Bearer invalid-token" }
    $response = Invoke-WebRequest -Uri "$BASE_URL/v1/billing/balance" -Method GET -Headers $invalidHeaders -UseBasicParsing
    Write-Host "  ❌ Security: Invalid token was accepted!" -ForegroundColor Red
    $failed++
} catch {
    Write-Host "  ✅ Security: Invalid token properly rejected" -ForegroundColor Green
    $passed++
}

# Test 4: Error Handling
Write-Host "`n4. ERROR HANDLING" -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/v1/non-existent-endpoint" -Method GET -UseBasicParsing
    Write-Host "  ❌ Error Handling: 404 not returned" -ForegroundColor Red
    $failed++
} catch {
    if ($_.Exception.Response.StatusCode -eq 404) {
        Write-Host "  ✅ Error Handling: 404 properly returned" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ❌ Error Handling: Wrong status code" -ForegroundColor Red
        $failed++
    }
}

# Test 5: Infrastructure
Write-Host "`n5. INFRASTRUCTURE" -ForegroundColor Yellow

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

# Test 6: Performance
Write-Host "`n6. PERFORMANCE TEST" -ForegroundColor Yellow
$loadTestResults = @()
for ($i = 1; $i -le 5; $i++) {
    try {
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri "$BASE_URL/health" -Method GET -UseBasicParsing
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        $loadTestResults += $responseTime
        Write-Host "  ✅ Load Test #$i - ${responseTime}ms" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ❌ Load Test #$i - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
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

# Results
$total = $passed + $failed
$successRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "FINAL TEST RESULTS" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
Write-Host "Total Tests: $total" -ForegroundColor White
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red
Write-Host "Success Rate: ${successRate}%" -ForegroundColor White

if ($successRate -ge 95) {
    Write-Host "`n🎉 SYSTEM IS HEALTHY AND READY FOR PRODUCTION!" -ForegroundColor Green
} elseif ($successRate -ge 85) {
    Write-Host "`n✅ SYSTEM IS FUNCTIONAL AND STABLE" -ForegroundColor Green
} elseif ($successRate -ge 70) {
    Write-Host "`n⚠️  SYSTEM HAS MINOR ISSUES BUT IS FUNCTIONAL" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ SYSTEM HAS SIGNIFICANT ISSUES" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "FINAL TEST COMPLETED" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
