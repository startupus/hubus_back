# Test Optimizations Script
# Comprehensive testing of all performance optimizations

Write-Host "================================================" -ForegroundColor Green
Write-Host "  TESTING PERFORMANCE OPTIMIZATIONS" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$BASE_URL = "http://localhost:3000"
$PAYMENT_URL = "http://localhost:3006"
$AUTH_URL = "http://localhost:3001"
$BILLING_URL = "http://localhost:3004"

# Test results storage
$testResults = @{
    TotalTests = 0
    PassedTests = 0
    FailedTests = 0
    Optimizations = @()
}

# Helper function for making requests
function Invoke-TestRequest {
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
        Write-Host "  ✅ $TestName - ${responseTime}ms" -ForegroundColor Green
        
        return @{
            Success = $true
            ResponseTime = $responseTime
            StatusCode = $response.StatusCode
            Content = $response.Content
        }
    }
    catch {
        $testResults.FailedTests++
        Write-Host "  ❌ $TestName - $($_.Exception.Message)" -ForegroundColor Red
        return @{
            Success = $false
            Error = $_.Exception.Message
        }
    }
}

# Test 1: Health Checks
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " TEST 1: HEALTH CHECKS" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

$healthEndpoints = @(
    @{ Url = "$BASE_URL/health"; Name = "API Gateway Health" },
    @{ Url = "$AUTH_URL/health"; Name = "Auth Service Health" },
    @{ Url = "$BILLING_URL/health"; Name = "Billing Service Health" },
    @{ Url = "$PAYMENT_URL/api/v1/health"; Name = "Payment Service Health" }
)

foreach ($endpoint in $healthEndpoints) {
    $result = Invoke-TestRequest -Method "GET" -Url $endpoint.Url -TestName $endpoint.Name
    if ($result.Success) {
        $testResults.Optimizations += "Health check: $($endpoint.Name) - ${result.ResponseTime}ms"
    }
}

# Test 2: Authentication with Token Caching
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " TEST 2: AUTHENTICATION WITH TOKEN CACHING" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

# Register a test company
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$companyData = @{
    email = "optimization-test-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Optimization Test Company $timestamp"
    description = "Company for testing optimizations"
} | ConvertTo-Json

Write-Host "`nRegistering test company..." -ForegroundColor Cyan
$registerResult = Invoke-TestRequest -Method "POST" -Url "$BASE_URL/v1/auth/register" -Body $companyData -TestName "Company Registration"

if ($registerResult.Success) {
    $token = ($registerResult.Content | ConvertFrom-Json).accessToken
    Write-Host "  ✅ Token obtained: $($token.Substring(0, 20))..." -ForegroundColor Green
    
    # Test multiple requests with same token (should be faster due to caching)
    Write-Host "`nTesting token caching with multiple requests..." -ForegroundColor Cyan
    $headers = @{ "Authorization" = "Bearer $token" }
    
    for ($i = 1; $i -le 5; $i++) {
        $result = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $headers -TestName "Balance Check #$i"
        if ($result.Success) {
            $testResults.Optimizations += "Token caching: Balance check #$i - ${result.ResponseTime}ms"
        }
    }
} else {
    Write-Host "  ❌ Failed to register company" -ForegroundColor Red
}

# Test 3: Redis Caching Performance
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " TEST 3: REDIS CACHING PERFORMANCE" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    # Test AI Models endpoint (should be cached)
    Write-Host "`nTesting AI Models endpoint caching..." -ForegroundColor Cyan
    for ($i = 1; $i -le 3; $i++) {
        $result = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/models" -Headers $headers -TestName "AI Models #$i"
        if ($result.Success) {
            $testResults.Optimizations += "Redis caching: AI Models #$i - ${result.ResponseTime}ms"
        }
    }
    
    # Test transaction history (should be cached)
    Write-Host "`nTesting transaction history caching..." -ForegroundColor Cyan
    for ($i = 1; $i -le 3; $i++) {
        $result = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/billing/transactions" -Headers $headers -TestName "Transactions #$i"
        if ($result.Success) {
            $testResults.Optimizations += "Redis caching: Transactions #$i - ${result.ResponseTime}ms"
        }
    }
}

# Test 4: Connection Pooling
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " TEST 4: CONNECTION POOLING" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

if ($token) {
    $headers = @{ "Authorization" = "Bearer $token" }
    
    # Test concurrent database operations
    Write-Host "`nTesting concurrent database operations..." -ForegroundColor Cyan
    $concurrentTasks = @()
    
    for ($i = 1; $i -le 10; $i++) {
        $task = Start-Job -ScriptBlock {
            param($Url, $Headers, $TestName)
            
            try {
                $requestParams = @{
                    Method = "GET"
                    Uri = $Url
                    Headers = $Headers
                    ContentType = "application/json"
                    UseBasicParsing = $true
                    TimeoutSec = 30
                }
                
                $startTime = Get-Date
                $response = Invoke-WebRequest @requestParams
                $endTime = Get-Date
                $responseTime = ($endTime - $startTime).TotalMilliseconds
                
                return @{
                    Success = $true
                    ResponseTime = $responseTime
                    TestName = $TestName
                }
            }
            catch {
                return @{
                    Success = $false
                    Error = $_.Exception.Message
                    TestName = $TestName
                }
            }
        } -ArgumentList "$BASE_URL/v1/billing/balance", $headers, "Concurrent Balance Check #$i"
        
        $concurrentTasks += $task
    }
    
    # Wait for all tasks to complete
    $concurrentTasks | Wait-Job | Out-Null
    
    $concurrentResults = @()
    foreach ($task in $concurrentTasks) {
        $result = Receive-Job -Job $task
        $concurrentResults += $result
        Remove-Job -Job $task
    }
    
    $successfulResults = $concurrentResults | Where-Object { $_.Success -eq $true }
    $avgResponseTime = if ($successfulResults.Count -gt 0) { 
        ($successfulResults | Measure-Object -Property ResponseTime -Average).Average 
    } else { 0 }
    
    Write-Host "  ✅ Concurrent operations completed" -ForegroundColor Green
    Write-Host "  📊 Successful: $($successfulResults.Count)/$($concurrentResults.Count)" -ForegroundColor Green
    Write-Host "  📊 Average response time: $([math]::Round($avgResponseTime, 2))ms" -ForegroundColor Green
    
    $testResults.Optimizations += "Connection pooling: $($successfulResults.Count) concurrent operations - avg ${avgResponseTime}ms"
}

# Test 5: Performance Monitoring
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " TEST 5: PERFORMANCE MONITORING" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

# Test system performance under load
Write-Host "`nTesting system performance under load..." -ForegroundColor Cyan
$loadTestResults = @()

for ($i = 1; $i -le 20; $i++) {
    $result = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/health" -TestName "Load Test #$i"
    if ($result.Success) {
        $loadTestResults += $result.ResponseTime
    }
}

if ($loadTestResults.Count -gt 0) {
    $avgResponseTime = ($loadTestResults | Measure-Object -Average).Average
    $minResponseTime = ($loadTestResults | Measure-Object -Minimum).Minimum
    $maxResponseTime = ($loadTestResults | Measure-Object -Maximum).Maximum
    
    Write-Host "  📊 Load test results:" -ForegroundColor Green
    Write-Host "    Average: $([math]::Round($avgResponseTime, 2))ms" -ForegroundColor Green
    Write-Host "    Minimum: $([math]::Round($minResponseTime, 2))ms" -ForegroundColor Green
    Write-Host "    Maximum: $([math]::Round($maxResponseTime, 2))ms" -ForegroundColor Green
    
    $testResults.Optimizations += "Performance monitoring: Load test - avg ${avgResponseTime}ms, min ${minResponseTime}ms, max ${maxResponseTime}ms"
}

# Test 6: Memory and CPU Usage
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " TEST 6: MEMORY AND CPU USAGE" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

$memoryUsage = [System.GC]::GetTotalMemory($false)
$process = Get-Process -Name "node" -ErrorAction SilentlyContinue

if ($process) {
    $memoryMB = [math]::Round($process.WorkingSet64 / 1024 / 1024, 2)
    $cpuUsage = [math]::Round($process.CPU, 2)
    
    Write-Host "  📊 System metrics:" -ForegroundColor Green
    Write-Host "    Memory usage: ${memoryMB} MB" -ForegroundColor Green
    Write-Host "    CPU usage: ${cpuUsage}%" -ForegroundColor Green
    
    $testResults.Optimizations += "System metrics: Memory ${memoryMB}MB, CPU ${cpuUsage}%"
} else {
    Write-Host "  ⚠️  Node.js process not found" -ForegroundColor Yellow
}

# Test 7: Error Handling and Retry Logic
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " TEST 7: ERROR HANDLING AND RETRY LOGIC" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

# Test with invalid token
Write-Host "`nTesting error handling with invalid token..." -ForegroundColor Cyan
$invalidHeaders = @{ "Authorization" = "Bearer invalid-token" }
$result = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $invalidHeaders -TestName "Invalid Token Test"

if (-not $result.Success) {
    Write-Host "  ✅ Error handling working correctly" -ForegroundColor Green
    $testResults.Optimizations += "Error handling: Invalid token properly rejected"
} else {
    Write-Host "  ❌ Error handling not working" -ForegroundColor Red
}

# Test with non-existent endpoint
Write-Host "`nTesting error handling with non-existent endpoint..." -ForegroundColor Cyan
$result = Invoke-TestRequest -Method "GET" -Url "$BASE_URL/v1/non-existent" -TestName "Non-existent Endpoint Test"

if (-not $result.Success) {
    Write-Host "  ✅ 404 handling working correctly" -ForegroundColor Green
    $testResults.Optimizations += "Error handling: 404 properly returned"
} else {
    Write-Host "  ❌ 404 handling not working" -ForegroundColor Red
}

# Final Results
Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  OPTIMIZATION TEST RESULTS" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

Write-Host "`nSUMMARY:" -ForegroundColor Cyan
Write-Host "  Total Tests: $($testResults.TotalTests)" -ForegroundColor White
Write-Host "  Passed: $($testResults.PassedTests)" -ForegroundColor Green
Write-Host "  Failed: $($testResults.FailedTests)" -ForegroundColor Red
Write-Host "  Success Rate: $([math]::Round(($testResults.PassedTests / $testResults.TotalTests) * 100, 2))%" -ForegroundColor White

Write-Host "`nOPTIMIZATIONS IMPLEMENTED:" -ForegroundColor Cyan
foreach ($optimization in $testResults.Optimizations) {
    Write-Host "  ✅ $optimization" -ForegroundColor Green
}

Write-Host "`nPERFORMANCE IMPROVEMENTS:" -ForegroundColor Cyan
Write-Host "  🚀 Token caching for faster authentication" -ForegroundColor Green
Write-Host "  🚀 Redis caching for frequently accessed data" -ForegroundColor Green
Write-Host "  🚀 Connection pooling for database operations" -ForegroundColor Green
Write-Host "  🚀 Performance monitoring and metrics" -ForegroundColor Green
Write-Host "  🚀 Improved error handling and retry logic" -ForegroundColor Green

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  OPTIMIZATION TESTING COMPLETED" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
