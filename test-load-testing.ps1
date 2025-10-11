# Load Testing Script for AI Aggregator System
# Comprehensive performance testing of all system components

Write-Host "================================================" -ForegroundColor Green
Write-Host "  LOAD TESTING - AI AGGREGATOR SYSTEM" -ForegroundColor Green
Write-Host "  Comprehensive performance testing" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Configuration
$BASE_URL = "http://localhost:3000"
$PAYMENT_URL = "http://localhost:3006"
$CONCURRENT_USERS = 10
$REQUESTS_PER_USER = 20
$TEST_DURATION_SECONDS = 60

# Test results storage
$testResults = @{
    TotalRequests = 0
    SuccessfulRequests = 0
    FailedRequests = 0
    AverageResponseTime = 0
    MinResponseTime = [double]::MaxValue
    MaxResponseTime = 0
    ResponseTimes = @()
    Errors = @()
    StartTime = Get-Date
}

# Function for HTTP requests with timing
function Invoke-LoadTestRequest {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [string]$TestName = ""
    )
    
    $startTime = Get-Date
    $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
    
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
        
        $response = Invoke-WebRequest @requestParams
        $stopwatch.Stop()
        
        $responseTime = $stopwatch.ElapsedMilliseconds
        $testResults.TotalRequests++
        $testResults.SuccessfulRequests++
        $testResults.ResponseTimes += $responseTime
        
        if ($responseTime -lt $testResults.MinResponseTime) {
            $testResults.MinResponseTime = $responseTime
        }
        if ($responseTime -gt $testResults.MaxResponseTime) {
            $testResults.MaxResponseTime = $responseTime
        }
        
        return @{
            Success = $true
            ResponseTime = $responseTime
            StatusCode = $response.StatusCode
            TestName = $TestName
        }
    }
    catch {
        $stopwatch.Stop()
        $responseTime = $stopwatch.ElapsedMilliseconds
        $testResults.TotalRequests++
        $testResults.FailedRequests++
        $testResults.ResponseTimes += $responseTime
        $testResults.Errors += $_.Exception.Message
        
        return @{
            Success = $false
            ResponseTime = $responseTime
            Error = $_.Exception.Message
            TestName = $TestName
        }
    }
}

# Function to register a test company
function Register-TestCompany {
    param([int]$CompanyNumber)
    
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    $registrationData = @{
        email = "load-test-$CompanyNumber-$timestamp@example.com"
        password = "TestPassword123!"
        name = "Load Test Company $CompanyNumber"
        description = "Company for load testing"
    } | ConvertTo-Json
    
    $result = Invoke-LoadTestRequest `
        -Method "POST" `
        -Url "$BASE_URL/v1/auth/register" `
        -Body $registrationData `
        -TestName "Company Registration $CompanyNumber"
    
    if ($result.Success) {
        try {
            $response = $result | ConvertTo-Json | ConvertFrom-Json
            return $response.accessToken
        } catch {
            return $null
        }
    }
    return $null
}

# Function to simulate user workload
function Start-UserWorkload {
    param(
        [int]$UserId,
        [int]$RequestsCount
    )
    
    Write-Host "Starting workload for User $UserId ($RequestsCount requests)" -ForegroundColor Cyan
    
    # Register company for this user
    $token = Register-TestCompany -CompanyNumber $UserId
    if (-not $token) {
        Write-Host "Failed to register company for User $UserId" -ForegroundColor Red
        return
    }
    
    $headers = @{
        "Authorization" = "Bearer $token"
    }
    
    # Simulate different types of requests
    for ($i = 1; $i -le $RequestsCount; $i++) {
        $requestType = $i % 5
        
        switch ($requestType) {
            0 {
                # Health check
                Invoke-LoadTestRequest `
                    -Method "GET" `
                    -Url "$BASE_URL/health" `
                    -TestName "Health Check - User $UserId"
            }
            1 {
                # Balance check
                Invoke-LoadTestRequest `
                    -Method "GET" `
                    -Url "$BASE_URL/v1/billing/balance" `
                    -Headers $headers `
                    -TestName "Balance Check - User $UserId"
            }
            2 {
                # Transaction history
                Invoke-LoadTestRequest `
                    -Method "GET" `
                    -Url "$BASE_URL/v1/billing/transactions" `
                    -Headers $headers `
                    -TestName "Transaction History - User $UserId"
            }
            3 {
                # AI Models list
                Invoke-LoadTestRequest `
                    -Method "GET" `
                    -Url "$BASE_URL/v1/models" `
                    -Headers $headers `
                    -TestName "AI Models - User $UserId"
            }
            4 {
                # Payment creation
                $paymentData = @{
                    amount = (Get-Random -Minimum 100 -Maximum 5000)
                    currency = "RUB"
                    description = "Load test payment $i"
                } | ConvertTo-Json
                
                Invoke-LoadTestRequest `
                    -Method "POST" `
                    -Url "$PAYMENT_URL/api/v1/payments" `
                    -Headers $headers `
                    -Body $paymentData `
                    -TestName "Payment Creation - User $UserId"
            }
        }
        
        # Small delay between requests
        Start-Sleep -Milliseconds (Get-Random -Minimum 100 -Maximum 500)
    }
    
    Write-Host "Completed workload for User $UserId" -ForegroundColor Green
}

# Function to run concurrent load test
function Start-ConcurrentLoadTest {
    param(
        [int]$ConcurrentUsers,
        [int]$RequestsPerUser
    )
    
    Write-Host "`n================================================" -ForegroundColor Yellow
    Write-Host " STARTING CONCURRENT LOAD TEST" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host "Concurrent Users: $ConcurrentUsers" -ForegroundColor Cyan
    Write-Host "Requests per User: $RequestsPerUser" -ForegroundColor Cyan
    Write-Host "Total Expected Requests: $($ConcurrentUsers * $RequestsPerUser)" -ForegroundColor Cyan
    
    $jobs = @()
    
    # Start concurrent user sessions
    for ($i = 1; $i -le $ConcurrentUsers; $i++) {
        $job = Start-Job -ScriptBlock {
            param($UserId, $RequestsCount, $BaseUrl, $PaymentUrl)
            
            # Import the functions (simplified version for job context)
            function Invoke-LoadTestRequest {
                param($Method, $Url, $Headers = @{}, $Body = $null, $TestName = "")
                
                $startTime = Get-Date
                $stopwatch = [System.Diagnostics.Stopwatch]::StartNew()
                
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
                    
                    $response = Invoke-WebRequest @requestParams
                    $stopwatch.Stop()
                    
                    return @{
                        Success = $true
                        ResponseTime = $stopwatch.ElapsedMilliseconds
                        StatusCode = $response.StatusCode
                        TestName = $TestName
                    }
                }
                catch {
                    $stopwatch.Stop()
                    return @{
                        Success = $false
                        ResponseTime = $stopwatch.ElapsedMilliseconds
                        Error = $_.Exception.Message
                        TestName = $TestName
                    }
                }
            }
            
            # Register company
            $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
            $registrationData = @{
                email = "load-test-$UserId-$timestamp@example.com"
                password = "TestPassword123!"
                name = "Load Test Company $UserId"
                description = "Company for load testing"
            } | ConvertTo-Json
            
            $registerResult = Invoke-LoadTestRequest `
                -Method "POST" `
                -Url "$BaseUrl/v1/auth/register" `
                -Body $registrationData `
                -TestName "Company Registration $UserId"
            
            if (-not $registerResult.Success) {
                return @{ Error = "Failed to register company for User $UserId" }
            }
            
            $token = ($registerResult | ConvertTo-Json | ConvertFrom-Json).accessToken
            $headers = @{ "Authorization" = "Bearer $token" }
            
            $results = @()
            
            # Run requests
            for ($j = 1; $j -le $RequestsCount; $j++) {
                $requestType = $j % 5
                
                switch ($requestType) {
                    0 {
                        $result = Invoke-LoadTestRequest `
                            -Method "GET" `
                            -Url "$BaseUrl/health" `
                            -TestName "Health Check - User $UserId"
                    }
                    1 {
                        $result = Invoke-LoadTestRequest `
                            -Method "GET" `
                            -Url "$BaseUrl/v1/billing/balance" `
                            -Headers $headers `
                            -TestName "Balance Check - User $UserId"
                    }
                    2 {
                        $result = Invoke-LoadTestRequest `
                            -Method "GET" `
                            -Url "$BaseUrl/v1/billing/transactions" `
                            -Headers $headers `
                            -TestName "Transaction History - User $UserId"
                    }
                    3 {
                        $result = Invoke-LoadTestRequest `
                            -Method "GET" `
                            -Url "$BaseUrl/v1/models" `
                            -Headers $headers `
                            -TestName "AI Models - User $UserId"
                    }
                    4 {
                        $paymentData = @{
                            amount = (Get-Random -Minimum 100 -Maximum 5000)
                            currency = "RUB"
                            description = "Load test payment $j"
                        } | ConvertTo-Json
                        
                        $result = Invoke-LoadTestRequest `
                            -Method "POST" `
                            -Url "$PaymentUrl/api/v1/payments" `
                            -Headers $headers `
                            -Body $paymentData `
                            -TestName "Payment Creation - User $UserId"
                    }
                }
                
                $results += $result
                Start-Sleep -Milliseconds (Get-Random -Minimum 100 -Maximum 500)
            }
            
            return $results
        } -ArgumentList $i, $RequestsPerUser, $BASE_URL, $PAYMENT_URL
        
        $jobs += $job
    }
    
    # Wait for all jobs to complete
    Write-Host "`nWaiting for all user sessions to complete..." -ForegroundColor Yellow
    $jobs | Wait-Job | Out-Null
    
    # Collect results
    $allResults = @()
    foreach ($job in $jobs) {
        $jobResults = Receive-Job -Job $job
        $allResults += $jobResults
        Remove-Job -Job $job
    }
    
    return $allResults
}

# Function to run stress test
function Start-StressTest {
    param([int]$DurationSeconds)
    
    Write-Host "`n================================================" -ForegroundColor Yellow
    Write-Host " STARTING STRESS TEST" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host "Duration: $DurationSeconds seconds" -ForegroundColor Cyan
    
    $endTime = (Get-Date).AddSeconds($DurationSeconds)
    $requestCount = 0
    
    while ((Get-Date) -lt $endTime) {
        # Random request type
        $requestType = Get-Random -Minimum 0 -Maximum 4
        
        switch ($requestType) {
            0 {
                Invoke-LoadTestRequest `
                    -Method "GET" `
                    -Url "$BASE_URL/health" `
                    -TestName "Stress Health Check"
            }
            1 {
                Invoke-LoadTestRequest `
                    -Method "GET" `
                    -Url "$BASE_URL/v1/models" `
                    -TestName "Stress AI Models"
            }
            2 {
                Invoke-LoadTestRequest `
                    -Method "GET" `
                    -Url "$BASE_URL/v1/billing/balance" `
                    -TestName "Stress Balance Check"
            }
            3 {
                Invoke-LoadTestRequest `
                    -Method "GET" `
                    -Url "$PAYMENT_URL/api/v1/health" `
                    -TestName "Stress Payment Health"
            }
        }
        
        $requestCount++
        
        # Short delay
        Start-Sleep -Milliseconds 100
    }
    
    Write-Host "Stress test completed: $requestCount requests in $DurationSeconds seconds" -ForegroundColor Green
}

# Function to calculate and display statistics
function Show-LoadTestResults {
    param($Results)
    
    Write-Host "`n================================================" -ForegroundColor Green
    Write-Host "  LOAD TEST RESULTS" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    
    if ($Results.Count -eq 0) {
        Write-Host "No results to display" -ForegroundColor Red
        return
    }
    
    $successfulResults = $Results | Where-Object { $_.Success -eq $true }
    $failedResults = $Results | Where-Object { $_.Success -eq $false }
    
    $totalRequests = $Results.Count
    $successfulRequests = $successfulResults.Count
    $failedRequests = $failedResults.Count
    $successRate = if ($totalRequests -gt 0) { ($successfulRequests / $totalRequests) * 100 } else { 0 }
    
    $responseTimes = $successfulResults | ForEach-Object { $_.ResponseTime }
    $avgResponseTime = if ($responseTimes.Count -gt 0) { ($responseTimes | Measure-Object -Average).Average } else { 0 }
    $minResponseTime = if ($responseTimes.Count -gt 0) { ($responseTimes | Measure-Object -Minimum).Minimum } else { 0 }
    $maxResponseTime = if ($responseTimes.Count -gt 0) { ($responseTimes | Measure-Object -Maximum).Maximum } else { 0 }
    
    $endTime = Get-Date
    $totalDuration = ($endTime - $testResults.StartTime).TotalSeconds
    $requestsPerSecond = if ($totalDuration -gt 0) { $totalRequests / $totalDuration } else { 0 }
    
    Write-Host "`nSUMMARY STATISTICS:" -ForegroundColor Cyan
    Write-Host "  Total Requests: $totalRequests" -ForegroundColor White
    Write-Host "  Successful Requests: $successfulRequests" -ForegroundColor Green
    Write-Host "  Failed Requests: $failedRequests" -ForegroundColor Red
    Write-Host "  Success Rate: $([math]::Round($successRate, 2))%" -ForegroundColor $(if ($successRate -ge 95) { "Green" } elseif ($successRate -ge 80) { "Yellow" } else { "Red" })
    Write-Host "  Requests per Second: $([math]::Round($requestsPerSecond, 2))" -ForegroundColor White
    Write-Host "  Test Duration: $([math]::Round($totalDuration, 2)) seconds" -ForegroundColor White
    
    Write-Host "`nRESPONSE TIME STATISTICS:" -ForegroundColor Cyan
    Write-Host "  Average Response Time: $([math]::Round($avgResponseTime, 2)) ms" -ForegroundColor White
    Write-Host "  Minimum Response Time: $([math]::Round($minResponseTime, 2)) ms" -ForegroundColor Green
    Write-Host "  Maximum Response Time: $([math]::Round($maxResponseTime, 2)) ms" -ForegroundColor $(if ($maxResponseTime -lt 5000) { "Green" } elseif ($maxResponseTime -lt 10000) { "Yellow" } else { "Red" })
    
    if ($failedResults.Count -gt 0) {
        Write-Host "`nERROR SUMMARY:" -ForegroundColor Red
        $errorGroups = $failedResults | Group-Object Error | Sort-Object Count -Descending
        foreach ($errorGroup in $errorGroups) {
            Write-Host "  $($errorGroup.Name): $($errorGroup.Count) occurrences" -ForegroundColor Red
        }
    }
    
    # Performance assessment
    Write-Host "`nPERFORMANCE ASSESSMENT:" -ForegroundColor Cyan
    if ($successRate -ge 95 -and $avgResponseTime -lt 2000) {
        Write-Host "  ✅ EXCELLENT: System handles load very well" -ForegroundColor Green
    } elseif ($successRate -ge 90 -and $avgResponseTime -lt 5000) {
        Write-Host "  ✅ GOOD: System handles load well" -ForegroundColor Green
    } elseif ($successRate -ge 80 -and $avgResponseTime -lt 10000) {
        Write-Host "  ⚠️  ACCEPTABLE: System handles load but needs optimization" -ForegroundColor Yellow
    } else {
        Write-Host "  ❌ POOR: System struggles under load" -ForegroundColor Red
    }
}

# Main execution
try {
    Write-Host "`nStarting Load Testing..." -ForegroundColor Green
    
    # Test 1: Concurrent Load Test
    Write-Host "`n================================================" -ForegroundColor Yellow
    Write-Host " TEST 1: CONCURRENT LOAD TEST" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    
    $concurrentResults = Start-ConcurrentLoadTest -ConcurrentUsers $CONCURRENT_USERS -RequestsPerUser $REQUESTS_PER_USER
    Show-LoadTestResults -Results $concurrentResults
    
    # Test 2: Stress Test
    Write-Host "`n================================================" -ForegroundColor Yellow
    Write-Host " TEST 2: STRESS TEST" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    
    Start-StressTest -DurationSeconds 30
    
    # Test 3: Health Check Load Test
    Write-Host "`n================================================" -ForegroundColor Yellow
    Write-Host " TEST 3: HEALTH CHECK LOAD TEST" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    
    $healthResults = @()
    for ($i = 1; $i -le 50; $i++) {
        $result = Invoke-LoadTestRequest `
            -Method "GET" `
            -Url "$BASE_URL/health" `
            -TestName "Health Check Load Test $i"
        $healthResults += $result
        Start-Sleep -Milliseconds 100
    }
    
    Write-Host "Health Check Load Test Results:" -ForegroundColor Cyan
    $healthSuccessful = ($healthResults | Where-Object { $_.Success -eq $true }).Count
    $healthFailed = ($healthResults | Where-Object { $_.Success -eq $false }).Count
    Write-Host "  Successful: $healthSuccessful" -ForegroundColor Green
    Write-Host "  Failed: $healthFailed" -ForegroundColor Red
    
    Write-Host "`n================================================" -ForegroundColor Green
    Write-Host "  LOAD TESTING COMPLETED" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    
} catch {
    Write-Host "`nError during load testing: $($_.Exception.Message)" -ForegroundColor Red
} finally {
    Write-Host "`nLoad testing finished at $(Get-Date)" -ForegroundColor Gray
}
