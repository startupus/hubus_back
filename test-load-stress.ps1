# Load Stress Testing Script
Write-Host "================================================" -ForegroundColor Green
Write-Host "  LOAD STRESS TESTING" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$BASE_URL = "http://localhost:3000"
$AUTH_URL = "http://localhost:3001"
$BILLING_URL = "http://localhost:3004"
$PAYMENT_URL = "http://localhost:3006"

$testResults = @{
    TotalRequests = 0
    SuccessfulRequests = 0
    FailedRequests = 0
    ResponseTimes = @()
    Errors = @()
    StartTime = Get-Date
}

function Invoke-LoadTest {
    param(
        [string]$Name,
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ConcurrentUsers = 10,
        [int]$RequestsPerUser = 10
    )
    
    Write-Host "`n================================================" -ForegroundColor Yellow
    Write-Host " LOAD TEST: $Name" -ForegroundColor Yellow
    Write-Host "================================================" -ForegroundColor Yellow
    Write-Host "Concurrent Users: $ConcurrentUsers" -ForegroundColor Cyan
    Write-Host "Requests per User: $RequestsPerUser" -ForegroundColor Cyan
    Write-Host "Total Requests: $($ConcurrentUsers * $RequestsPerUser)" -ForegroundColor Cyan
    
    $userTasks = @()
    $userResults = @()
    
    # Create tasks for each user
    for ($user = 1; $user -le $ConcurrentUsers; $user++) {
        $task = Start-Job -ScriptBlock {
            param($Method, $Url, $Headers, $Body, $RequestsPerUser, $UserNumber)
            
            $userResults = @()
            
            for ($req = 1; $req -le $RequestsPerUser; $req++) {
                try {
                    $startTime = Get-Date
                    
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
                    $endTime = Get-Date
                    $responseTime = ($endTime - $startTime).TotalMilliseconds
                    
                    $userResults += @{
                        Success = $true
                        ResponseTime = $responseTime
                        StatusCode = $response.StatusCode
                        UserNumber = $UserNumber
                        RequestNumber = $req
                        Error = $null
                    }
                }
                catch {
                    $endTime = Get-Date
                    $responseTime = ($endTime - $startTime).TotalMilliseconds
                    
                    $userResults += @{
                        Success = $false
                        ResponseTime = $responseTime
                        StatusCode = $_.Exception.Response.StatusCode
                        UserNumber = $UserNumber
                        RequestNumber = $req
                        Error = $_.Exception.Message
                    }
                }
                
                # Small delay between requests
                Start-Sleep -Milliseconds 100
            }
            
            return $userResults
        } -ArgumentList $Method, $Url, $Headers, $Body, $RequestsPerUser, $user
        
        $userTasks += $task
    }
    
    # Wait for all tasks to complete
    Write-Host "`nExecuting load test..." -ForegroundColor Cyan
    $userTasks | Wait-Job | Out-Null
    
    # Collect results
    foreach ($task in $userTasks) {
        $taskResults = Receive-Job -Job $task
        $userResults += $taskResults
        Remove-Job -Job $task
    }
    
    # Analyze results
    $successful = $userResults | Where-Object { $_.Success -eq $true }
    $failed = $userResults | Where-Object { $_.Success -eq $false }
    
    $totalRequests = $userResults.Count
    $successfulRequests = $successful.Count
    $failedRequests = $failed.Count
    $successRate = if ($totalRequests -gt 0) { [math]::Round(($successfulRequests / $totalRequests) * 100, 2) } else { 0 }
    
    $responseTimes = $successful | ForEach-Object { $_.ResponseTime }
    $avgResponseTime = if ($responseTimes.Count -gt 0) { [math]::Round(($responseTimes | Measure-Object -Average).Average, 2) } else { 0 }
    $minResponseTime = if ($responseTimes.Count -gt 0) { [math]::Round(($responseTimes | Measure-Object -Minimum).Minimum, 2) } else { 0 }
    $maxResponseTime = if ($responseTimes.Count -gt 0) { [math]::Round(($responseTimes | Measure-Object -Maximum).Maximum, 2) } else { 0 }
    
    # Update global results
    $script:testResults.TotalRequests += $totalRequests
    $script:testResults.SuccessfulRequests += $successfulRequests
    $script:testResults.FailedRequests += $failedRequests
    $script:testResults.ResponseTimes += $responseTimes
    $script:testResults.Errors += $failed | ForEach-Object { $_.Error }
    
    # Display results
    Write-Host "`nRESULTS:" -ForegroundColor Green
    Write-Host "  Total Requests: $totalRequests" -ForegroundColor White
    Write-Host "  Successful: $successfulRequests" -ForegroundColor Green
    Write-Host "  Failed: $failedRequests" -ForegroundColor Red
    Write-Host "  Success Rate: ${successRate}%" -ForegroundColor White
    Write-Host "  Average Response Time: ${avgResponseTime}ms" -ForegroundColor White
    Write-Host "  Min Response Time: ${minResponseTime}ms" -ForegroundColor White
    Write-Host "  Max Response Time: ${maxResponseTime}ms" -ForegroundColor White
    
    if ($failed.Count -gt 0) {
        Write-Host "`nERRORS:" -ForegroundColor Red
        $failed | Group-Object Error | ForEach-Object {
            Write-Host "  $($_.Name): $($_.Count) times" -ForegroundColor Red
        }
    }
    
    return @{
        TotalRequests = $totalRequests
        SuccessfulRequests = $successfulRequests
        FailedRequests = $failedRequests
        SuccessRate = $successRate
        AvgResponseTime = $avgResponseTime
        MinResponseTime = $minResponseTime
        MaxResponseTime = $maxResponseTime
    }
}

# TEST 1: Health Check Load Test
Write-Host "`n================================================" -ForegroundColor Magenta
Write-Host " TEST 1: HEALTH CHECK LOAD TEST" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta

$healthResults = Invoke-LoadTest -Name "Health Check" -Method "GET" -Url "$BASE_URL/health" -ConcurrentUsers 20 -RequestsPerUser 5

# TEST 2: Registration Load Test
Write-Host "`n================================================" -ForegroundColor Magenta
Write-Host " TEST 2: REGISTRATION LOAD TEST" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta

$registrationResults = @()
for ($i = 1; $i -le 10; $i++) {
    $timestamp = Get-Date -Format 'yyyyMMddHHmmss'
    $companyData = @{
        email = "load-test-$timestamp-$i@example.com"
        password = "TestPassword123!"
        name = "Load Test Company $timestamp-$i"
        description = "Company for load testing"
    } | ConvertTo-Json
    
    try {
        $startTime = Get-Date
        $response = Invoke-WebRequest -Uri "$BASE_URL/v1/auth/register" -Method POST -Body $companyData -ContentType "application/json" -UseBasicParsing
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        $registrationResults += @{
            Success = $true
            ResponseTime = $responseTime
            StatusCode = $response.StatusCode
        }
        
        Write-Host "  ✅ Registration $i - ${responseTime}ms" -ForegroundColor Green
    }
    catch {
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        $registrationResults += @{
            Success = $false
            ResponseTime = $responseTime
            StatusCode = $_.Exception.Response.StatusCode
            Error = $_.Exception.Message
        }
        
        Write-Host "  ❌ Registration $i - $($_.Exception.Message)" -ForegroundColor Red
    }
}

$successfulRegistrations = $registrationResults | Where-Object { $_.Success -eq $true }
$avgRegResponseTime = if ($successfulRegistrations.Count -gt 0) { 
    [math]::Round(($successfulRegistrations | Measure-Object -Property ResponseTime -Average).Average, 2) 
} else { 0 }

Write-Host "`nRegistration Results:" -ForegroundColor Green
Write-Host "  Total: $($registrationResults.Count)" -ForegroundColor White
Write-Host "  Successful: $($successfulRegistrations.Count)" -ForegroundColor Green
Write-Host "  Failed: $($registrationResults.Count - $successfulRegistrations.Count)" -ForegroundColor Red
Write-Host "  Average Response Time: ${avgRegResponseTime}ms" -ForegroundColor White

# TEST 3: Authenticated Endpoints Load Test
Write-Host "`n================================================" -ForegroundColor Magenta
Write-Host " TEST 3: AUTHENTICATED ENDPOINTS LOAD TEST" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta

if ($successfulRegistrations.Count -gt 0) {
    # Get token from first successful registration
    $token = ($successfulRegistrations[0].Content | ConvertFrom-Json).accessToken
    $headers = @{ "Authorization" = "Bearer $token" }
    
    Write-Host "Using token from first successful registration..." -ForegroundColor Cyan
    
    # Test balance endpoint
    $balanceResults = Invoke-LoadTest -Name "Balance Check" -Method "GET" -Url "$BASE_URL/v1/billing/balance" -Headers $headers -ConcurrentUsers 15 -RequestsPerUser 5
    
    # Test AI models endpoint
    $modelsResults = Invoke-LoadTest -Name "AI Models" -Method "GET" -Url "$BASE_URL/v1/models" -Headers $headers -ConcurrentUsers 10 -RequestsPerUser 3
    
    # Test transaction history endpoint
    $transactionsResults = Invoke-LoadTest -Name "Transaction History" -Method "GET" -Url "$BASE_URL/v1/billing/transactions" -Headers $headers -ConcurrentUsers 10 -RequestsPerUser 3
} else {
    Write-Host "  ⚠️  No successful registrations - skipping authenticated tests" -ForegroundColor Yellow
}

# TEST 4: Payment System Load Test
Write-Host "`n================================================" -ForegroundColor Magenta
Write-Host " TEST 4: PAYMENT SYSTEM LOAD TEST" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta

if ($successfulRegistrations.Count -gt 0) {
    $headers = @{ "Authorization" = "Bearer $token" }
    $paymentData = @{
        amount = 1000.00
        currency = "RUB"
        description = "Load test payment"
    } | ConvertTo-Json
    
    $paymentResults = Invoke-LoadTest -Name "Payment Creation" -Method "POST" -Url "$PAYMENT_URL/api/v1/payments" -Headers $headers -Body $paymentData -ConcurrentUsers 5 -RequestsPerUser 2
} else {
    Write-Host "  ⚠️  No successful registrations - skipping payment tests" -ForegroundColor Yellow
}

# TEST 5: Stress Test - High Load
Write-Host "`n================================================" -ForegroundColor Magenta
Write-Host " TEST 5: STRESS TEST - HIGH LOAD" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta

$stressResults = Invoke-LoadTest -Name "Health Check Stress" -Method "GET" -Url "$BASE_URL/health" -ConcurrentUsers 50 -RequestsPerUser 10

# TEST 6: Error Handling Load Test
Write-Host "`n================================================" -ForegroundColor Magenta
Write-Host " TEST 6: ERROR HANDLING LOAD TEST" -ForegroundColor Magenta
Write-Host "================================================" -ForegroundColor Magenta

$errorResults = Invoke-LoadTest -Name "404 Error Test" -Method "GET" -Url "$BASE_URL/v1/non-existent-endpoint" -ConcurrentUsers 10 -RequestsPerUser 5

# FINAL RESULTS
Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  FINAL LOAD TEST RESULTS" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

$endTime = Get-Date
$totalDuration = ($endTime - $testResults.StartTime).TotalSeconds

Write-Host "`nOVERALL STATISTICS:" -ForegroundColor Cyan
Write-Host "  Total Requests: $($testResults.TotalRequests)" -ForegroundColor White
Write-Host "  Successful Requests: $($testResults.SuccessfulRequests)" -ForegroundColor Green
Write-Host "  Failed Requests: $($testResults.FailedRequests)" -ForegroundColor Red
Write-Host "  Overall Success Rate: $([math]::Round(($testResults.SuccessfulRequests / $testResults.TotalRequests) * 100, 2))%" -ForegroundColor White
Write-Host "  Total Duration: $([math]::Round($totalDuration, 2)) seconds" -ForegroundColor White
Write-Host "  Requests per Second: $([math]::Round($testResults.TotalRequests / $totalDuration, 2))" -ForegroundColor White

if ($testResults.ResponseTimes.Count -gt 0) {
    $overallAvgResponseTime = [math]::Round(($testResults.ResponseTimes | Measure-Object -Average).Average, 2)
    $overallMinResponseTime = [math]::Round(($testResults.ResponseTimes | Measure-Object -Minimum).Minimum, 2)
    $overallMaxResponseTime = [math]::Round(($testResults.ResponseTimes | Measure-Object -Maximum).Maximum, 2)
    
    Write-Host "`nRESPONSE TIME STATISTICS:" -ForegroundColor Cyan
    Write-Host "  Average Response Time: ${overallAvgResponseTime}ms" -ForegroundColor White
    Write-Host "  Minimum Response Time: ${overallMinResponseTime}ms" -ForegroundColor White
    Write-Host "  Maximum Response Time: ${overallMaxResponseTime}ms" -ForegroundColor White
}

if ($testResults.Errors.Count -gt 0) {
    Write-Host "`nERROR ANALYSIS:" -ForegroundColor Cyan
    $testResults.Errors | Group-Object | Sort-Object Count -Descending | ForEach-Object {
        Write-Host "  $($_.Name): $($_.Count) occurrences" -ForegroundColor Red
    }
}

Write-Host "`nPERFORMANCE ASSESSMENT:" -ForegroundColor Cyan
$overallSuccessRate = [math]::Round(($testResults.SuccessfulRequests / $testResults.TotalRequests) * 100, 2)

if ($overallSuccessRate -ge 95 -and $overallAvgResponseTime -lt 500) {
    Write-Host "  🎉 EXCELLENT: System handles load very well!" -ForegroundColor Green
} elseif ($overallSuccessRate -ge 90 -and $overallAvgResponseTime -lt 1000) {
    Write-Host "  ✅ GOOD: System handles load well!" -ForegroundColor Green
} elseif ($overallSuccessRate -ge 80 -and $overallAvgResponseTime -lt 2000) {
    Write-Host "  ⚠️  ACCEPTABLE: System handles load but needs optimization" -ForegroundColor Yellow
} else {
    Write-Host "  ❌ POOR: System struggles under load - needs optimization" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  LOAD TESTING COMPLETED" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
