#!/usr/bin/env pwsh

# Complete System Testing Script
Write-Host "=== Complete System Testing ===" -ForegroundColor Cyan
Write-Host "Testing all microservices endpoints after rebuild" -ForegroundColor Yellow
Write-Host ""

$testResults = @()
$failedTests = @()

function Test-Endpoint {
    param(
        [string]$ServiceName,
        [string]$TestName,
        [string]$Url,
        [string]$Method = "GET",
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [int]$ExpectedStatus = 200
    )
    
    Write-Host "[$ServiceName] Testing: $TestName..." -NoNewline
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ErrorAction = "Stop"
        }
        
        if ($Body) {
            $params.ContentType = "application/json"
            $params.Body = $Body
        }
        
        $response = Invoke-WebRequest @params
        
        if ($response.StatusCode -eq $ExpectedStatus) {
            Write-Host " ✅ PASS (Status: $($response.StatusCode))" -ForegroundColor Green
            $script:testResults += @{
                Service = $ServiceName
                Test = $TestName
                Status = "PASS"
                StatusCode = $response.StatusCode
                Url = $Url
            }
            return $true
        } else {
            Write-Host " ❌ FAIL (Expected: $ExpectedStatus, Got: $($response.StatusCode))" -ForegroundColor Red
            $script:failedTests += "$ServiceName - $TestName"
            return $false
        }
    } catch {
        $errorMsg = $_.Exception.Message
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host " ❌ FAIL (Status: $statusCode, Error: $errorMsg)" -ForegroundColor Red
        } else {
            Write-Host " ❌ FAIL (Error: $errorMsg)" -ForegroundColor Red
        }
        $script:failedTests += "$ServiceName - $TestName"
        return $false
    }
}

# Wait for services to be ready
Write-Host "Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "`n=== 1. Health Checks ===" -ForegroundColor Cyan

Test-Endpoint -ServiceName "API Gateway" -TestName "Health Check" -Url "http://localhost:3000/health"
Test-Endpoint -ServiceName "Auth Service" -TestName "Health Check" -Url "http://localhost:3001/health"
Test-Endpoint -ServiceName "Provider Orchestrator" -TestName "Health Check" -Url "http://localhost:3002/health"
Test-Endpoint -ServiceName "Proxy Service" -TestName "Health Check" -Url "http://localhost:3003/health"
Test-Endpoint -ServiceName "Billing Service" -TestName "Health Check" -Url "http://localhost:3004/health"
Test-Endpoint -ServiceName "Analytics Service" -TestName "Health Check" -Url "http://localhost:3005/health"
Test-Endpoint -ServiceName "Payment Service" -TestName "Health Check" -Url "http://localhost:3006/api/v1/health"
Test-Endpoint -ServiceName "AI Certification" -TestName "Health Check" -Url "http://localhost:3007/health"
# Test-Endpoint -ServiceName "Anonymization" -TestName "Health Check" -Url "http://localhost:3008/health" # Сервис временно отключен
Test-Endpoint -ServiceName "Redis Service" -TestName "Health Check" -Url "http://localhost:3009/api/redis/health"

Write-Host "`n=== 2. Models Endpoints (No Auth Required) ===" -ForegroundColor Cyan

Test-Endpoint -ServiceName "API Gateway" -TestName "Get All Models" -Url "http://localhost:3000/v1/models"
Test-Endpoint -ServiceName "API Gateway" -TestName "Get Providers" -Url "http://localhost:3000/v1/models/providers"
Test-Endpoint -ServiceName "API Gateway" -TestName "Get Categories" -Url "http://localhost:3000/v1/models/categories"

Write-Host "`n=== 3. Authentication & JWT ===" -ForegroundColor Cyan

$loginBody = '{"email":"test@example.com","password":"password123"}'
$loginSuccess = Test-Endpoint -ServiceName "API Gateway" -TestName "Login" -Url "http://localhost:3000/v1/auth/login" -Method "POST" -Body $loginBody -ExpectedStatus 201

if ($loginSuccess) {
    Write-Host "  → Extracting JWT token..." -ForegroundColor Yellow
    try {
        $loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/v1/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
        $loginData = $loginResponse.Content | ConvertFrom-Json
        $authToken = $loginData.accessToken
        $authHeaders = @{ "Authorization" = "Bearer $authToken" }
        Write-Host "  → JWT token obtained successfully" -ForegroundColor Green
        
        Write-Host "`n=== 4. Authenticated Endpoints ===" -ForegroundColor Cyan
        
        Test-Endpoint -ServiceName "API Gateway" -TestName "Get Balance" -Url "http://localhost:3000/v1/billing/balance" -Headers $authHeaders
        Test-Endpoint -ServiceName "API Gateway" -TestName "Get Transactions" -Url "http://localhost:3000/v1/billing/transactions" -Headers $authHeaders
        Test-Endpoint -ServiceName "Auth Service" -TestName "Get Profile" -Url "http://localhost:3001/auth/profile" -Headers $authHeaders
        Test-Endpoint -ServiceName "Auth Service" -TestName "List API Keys" -Url "http://localhost:3001/api-keys" -Headers $authHeaders
        
        Write-Host "`n=== 5. API Key Generation ===" -ForegroundColor Cyan
        
        $apiKeyBody = '{"name":"Test API Key","description":"Automated test key"}'
        Test-Endpoint -ServiceName "Auth Service" -TestName "Create API Key" -Url "http://localhost:3001/api-keys" -Method "POST" -Body $apiKeyBody -Headers $authHeaders -ExpectedStatus 201
        
    } catch {
        Write-Host "  → Failed to extract JWT token: $($_.Exception.Message)" -ForegroundColor Red
    }
} else {
    Write-Host "  → Skipping authenticated tests (login failed)" -ForegroundColor Yellow
}

Write-Host "`n=== 6. Provider Orchestrator ===" -ForegroundColor Cyan

Test-Endpoint -ServiceName "Provider Orchestrator" -TestName "Get Models" -Url "http://localhost:3002/orchestrator/models"

Write-Host "`n=== 7. Billing Service Direct ===" -ForegroundColor Cyan

Test-Endpoint -ServiceName "Billing Service" -TestName "Get Balance" -Url "http://localhost:3004/billing/balance/test-company"
# Test-Endpoint -ServiceName "Billing Service" -TestName "Get Pricing" -Url "http://localhost:3004/pricing/models" # Endpoint не реализован

Write-Host "`n=== 8. Redis Service ===" -ForegroundColor Cyan

Test-Endpoint -ServiceName "Redis Service" -TestName "Get Status" -Url "http://localhost:3009/api/redis/status"

Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$totalTests = $testResults.Count
$passedTests = ($testResults | Where-Object { $_.Status -eq "PASS" }).Count
$failedCount = $failedTests.Count

Write-Host ""
Write-Host "Total Tests:  " -NoNewline; Write-Host "$totalTests" -ForegroundColor White
Write-Host "Passed:       " -NoNewline; Write-Host "$passedTests" -ForegroundColor Green
Write-Host "Failed:       " -NoNewline; Write-Host "$failedCount" -ForegroundColor $(if ($failedCount -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failedCount -gt 0) {
    Write-Host "=== Failed Tests ===" -ForegroundColor Red
    $failedTests | ForEach-Object {
        Write-Host "  ❌ $_" -ForegroundColor Red
    }
    Write-Host ""
}

# Success percentage
$successRate = [math]::Round(($passedTests / $totalTests) * 100, 2)
Write-Host "Success Rate: " -NoNewline
if ($successRate -eq 100) {
    Write-Host "$successRate% ✨ Perfect!" -ForegroundColor Green
} elseif ($successRate -ge 90) {
    Write-Host "$successRate% ✅ Excellent" -ForegroundColor Green
} elseif ($successRate -ge 75) {
    Write-Host "$successRate% ⚠️ Good" -ForegroundColor Yellow
} else {
    Write-Host "$successRate% ❌ Needs Attention" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Service Status Summary ===" -ForegroundColor Cyan

$services = @(
    @{Name="API Gateway"; Port=3000; Status=""},
    @{Name="Auth Service"; Port=3001; Status=""},
    @{Name="Provider Orchestrator"; Port=3002; Status=""},
    @{Name="Proxy Service"; Port=3003; Status=""},
    @{Name="Billing Service"; Port=3004; Status=""},
    @{Name="Analytics Service"; Port=3005; Status=""},
    @{Name="Payment Service"; Port=3006; Status=""},
    @{Name="AI Certification"; Port=3007; Status=""},
    @{Name="Anonymization"; Port=3008; Status=""},
    @{Name="Redis Service"; Port=3009; Status=""}
)

foreach ($service in $services) {
    $servicePassed = ($testResults | Where-Object { $_.Service -eq $service.Name -and $_.Status -eq "PASS" }).Count
    $serviceFailed = ($failedTests | Where-Object { $_ -like "$($service.Name)*" }).Count
    
    if ($serviceFailed -eq 0 -and $servicePassed -gt 0) {
        Write-Host "✅ $($service.Name.PadRight(25)) (Port: $($service.Port))" -ForegroundColor Green
    } elseif ($servicePassed -gt 0) {
        Write-Host "⚠️  $($service.Name.PadRight(25)) (Port: $($service.Port))" -ForegroundColor Yellow
    } else {
        Write-Host "❌ $($service.Name.PadRight(25)) (Port: $($service.Port))" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "Testing complete! Check the results above." -ForegroundColor Cyan

# Save detailed results
$reportPath = "test-results-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
$testResults | ConvertTo-Json -Depth 3 | Out-File -FilePath $reportPath -Encoding UTF8
Write-Host "Detailed results saved to: $reportPath" -ForegroundColor Gray
