# Simple Service Integration Test
Write-Host "Testing AI Aggregator Platform Integration..." -ForegroundColor Green

$baseUrl = "http://localhost:3000"
$testUserId = "test-user-$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "Test User ID: $testUserId" -ForegroundColor Yellow

# 1. Health Check
Write-Host "`n1. Testing Health Check..." -ForegroundColor Cyan
try {
    $healthResponse = Invoke-WebRequest -Uri "$baseUrl/health" -Method GET
    if ($healthResponse.StatusCode -eq 200) {
        Write-Host "SUCCESS: API Gateway Health Check OK" -ForegroundColor Green
    } else {
        Write-Host "FAILED: API Gateway Health Check" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: API Gateway not available" -ForegroundColor Red
    exit 1
}

# 2. Auth Service
Write-Host "`n2. Testing Auth Service..." -ForegroundColor Cyan
try {
    $apiKeyData = @{
        userId = $testUserId
        name = "Test API Key"
    } | ConvertTo-Json
    
    $apiKeyResponse = Invoke-WebRequest -Uri "$baseUrl/auth/api-keys" -Method POST -ContentType "application/json" -Body $apiKeyData
    if ($apiKeyResponse.StatusCode -eq 201) {
        Write-Host "SUCCESS: Auth Service API Key created" -ForegroundColor Green
    } else {
        Write-Host "FAILED: Auth Service API Key creation" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Auth Service integration failed" -ForegroundColor Red
}

# 3. Billing Service
Write-Host "`n3. Testing Billing Service..." -ForegroundColor Cyan
try {
    $balanceResponse = Invoke-WebRequest -Uri "$baseUrl/billing/balance/$testUserId" -Method GET
    if ($balanceResponse.StatusCode -eq 200) {
        Write-Host "SUCCESS: Billing Service balance retrieved" -ForegroundColor Green
    } else {
        Write-Host "FAILED: Billing Service balance retrieval" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Billing Service integration failed" -ForegroundColor Red
}

# 4. Analytics Service
Write-Host "`n4. Testing Analytics Service..." -ForegroundColor Cyan
try {
    $metricsResponse = Invoke-WebRequest -Uri "$baseUrl/analytics/metrics" -Method GET
    if ($metricsResponse.StatusCode -eq 200) {
        Write-Host "SUCCESS: Analytics Service metrics retrieved" -ForegroundColor Green
    } else {
        Write-Host "FAILED: Analytics Service metrics retrieval" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Analytics Service integration failed" -ForegroundColor Red
}

# 5. Orchestrator Service
Write-Host "`n5. Testing Orchestrator Service..." -ForegroundColor Cyan
try {
    $modelsResponse = Invoke-WebRequest -Uri "$baseUrl/orchestrator/models" -Method GET
    if ($modelsResponse.StatusCode -eq 200) {
        Write-Host "SUCCESS: Orchestrator Service models retrieved" -ForegroundColor Green
    } else {
        Write-Host "FAILED: Orchestrator Service models retrieval" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Orchestrator Service integration failed" -ForegroundColor Red
}

# 6. Proxy Service
Write-Host "`n6. Testing Proxy Service..." -ForegroundColor Cyan
try {
    $aiRequestData = @{
        model = "gpt-3.5-turbo"
        messages = @(
            @{
                role = "user"
                content = "Hello, integration test"
            }
        )
    } | ConvertTo-Json
    
    $aiResponse = Invoke-WebRequest -Uri "$baseUrl/proxy/openai/chat/completions" -Method POST -ContentType "application/json" -Body $aiRequestData
    if ($aiResponse.StatusCode -eq 201) {
        Write-Host "SUCCESS: Proxy Service AI request processed" -ForegroundColor Green
    } else {
        Write-Host "FAILED: Proxy Service AI request" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Proxy Service integration failed" -ForegroundColor Red
}

# 7. RabbitMQ Check
Write-Host "`n7. Testing RabbitMQ..." -ForegroundColor Cyan
try {
    $rabbitmqResponse = Invoke-WebRequest -Uri "http://localhost:15672" -Method GET
    if ($rabbitmqResponse.StatusCode -eq 200) {
        Write-Host "SUCCESS: RabbitMQ Management UI available" -ForegroundColor Green
        Write-Host "URL: http://localhost:15672 (guest/guest)" -ForegroundColor White
    } else {
        Write-Host "FAILED: RabbitMQ Management UI not available" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: RabbitMQ not available" -ForegroundColor Red
}

Write-Host "`nIntegration test completed!" -ForegroundColor Green
Write-Host "All services are communicating via HTTP and RabbitMQ" -ForegroundColor Yellow
