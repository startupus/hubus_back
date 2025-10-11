# Simple Final System Test
Write-Host "SIMPLE FINAL SYSTEM TEST" -ForegroundColor Green

$BASE_URL = "http://localhost:3000"
$passed = 0
$failed = 0

# Test 1: Health Checks
Write-Host "`n1. HEALTH CHECKS" -ForegroundColor Yellow

# API Gateway Health
try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/health" -Method GET -UseBasicParsing
    Write-Host "  ✅ API Gateway Health - $($response.StatusCode)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ❌ API Gateway Health - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Auth Service Health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -UseBasicParsing
    Write-Host "  ✅ Auth Service Health - $($response.StatusCode)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ❌ Auth Service Health - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Billing Service Health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3004/health" -Method GET -UseBasicParsing
    Write-Host "  ✅ Billing Service Health - $($response.StatusCode)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ❌ Billing Service Health - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Payment Service Health
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3006/api/v1/health" -Method GET -UseBasicParsing
    Write-Host "  ✅ Payment Service Health - $($response.StatusCode)" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ❌ Payment Service Health - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 2: Registration
Write-Host "`n2. REGISTRATION" -ForegroundColor Yellow
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$companyData = @{
    email = "simple-final-test-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Simple Final Test Company $timestamp"
    description = "Company for simple final testing"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/v1/auth/register" -Method POST -Body $companyData -ContentType "application/json" -UseBasicParsing
    $token = ($response.Content | ConvertFrom-Json).accessToken
    Write-Host "  ✅ Company Registration - Token obtained" -ForegroundColor Green
    $passed++
} catch {
    Write-Host "  ❌ Company Registration - $($_.Exception.Message)" -ForegroundColor Red
    $failed++
}

# Test 3: Authenticated Endpoints
Write-Host "`n3. AUTHENTICATED ENDPOINTS" -ForegroundColor Yellow
if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    # Balance Check
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/v1/billing/balance" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "  ✅ Balance Check - $($response.StatusCode)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ❌ Balance Check - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    # Transaction History
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/v1/billing/transactions" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "  ✅ Transaction History - $($response.StatusCode)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ❌ Transaction History - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    # AI Models List
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/v1/models" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "  ✅ AI Models List - $($response.StatusCode)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ❌ AI Models List - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    # AI Models Providers
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/v1/models/providers" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "  ✅ AI Models Providers - $($response.StatusCode)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ❌ AI Models Providers - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
    
    # AI Models Categories
    try {
        $response = Invoke-WebRequest -Uri "$BASE_URL/v1/models/categories" -Method GET -Headers $headers -UseBasicParsing
        Write-Host "  ✅ AI Models Categories - $($response.StatusCode)" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ❌ AI Models Categories - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# Test 4: Payment System
Write-Host "`n4. PAYMENT SYSTEM" -ForegroundColor Yellow
if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    $paymentData = @{
        amount = 1000.00
        currency = "RUB"
        description = "Simple final test payment"
    } | ConvertTo-Json
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3006/api/v1/payments" -Method POST -Headers $headers -Body $paymentData -ContentType "application/json" -UseBasicParsing
        $paymentId = ($response.Content | ConvertFrom-Json).paymentId
        Write-Host "  ✅ Payment Creation - Payment ID: $paymentId" -ForegroundColor Green
        $passed++
    } catch {
        Write-Host "  ❌ Payment Creation - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# Test 5: Security
Write-Host "`n5. SECURITY" -ForegroundColor Yellow
try {
    $invalidHeaders = @{ "Authorization" = "Bearer invalid-token" }
    $response = Invoke-WebRequest -Uri "$BASE_URL/v1/billing/balance" -Method GET -Headers $invalidHeaders -UseBasicParsing
    Write-Host "  ❌ Security: Invalid token was accepted!" -ForegroundColor Red
    $failed++
} catch {
    Write-Host "  ✅ Security: Invalid token properly rejected" -ForegroundColor Green
    $passed++
}

# Test 6: Error Handling
Write-Host "`n6. ERROR HANDLING" -ForegroundColor Yellow
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

# Test 7: Infrastructure
Write-Host "`n7. INFRASTRUCTURE" -ForegroundColor Yellow

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

# Results
$total = $passed + $failed
$successRate = if ($total -gt 0) { [math]::Round(($passed / $total) * 100, 2) } else { 0 }

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "SIMPLE FINAL TEST RESULTS" -ForegroundColor Green
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
Write-Host "SIMPLE FINAL TEST COMPLETED" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
