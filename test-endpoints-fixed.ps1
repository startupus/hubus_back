#!/usr/bin/env pwsh

# Fixed endpoint testing script
$baseUrl = "http://localhost"
$results = @()

# Test function
function Test-Endpoint {
    param(
        [string]$Service,
        [string]$Method,
        [string]$Url,
        [string]$Body = $null,
        [hashtable]$Headers = @{},
        [string]$ExpectedStatus = "200"
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
        }
        
        if ($Body) {
            $params.ContentType = "application/json"
            $params.Body = $Body
        }
        
        $response = Invoke-WebRequest @params -ErrorAction Stop
        
        $result = @{
            Service = $Service
            Method = $Method
            Url = $Url
            Status = "PASS"
            StatusCode = $response.StatusCode
            ResponseTime = $response.Headers["X-Response-Time"]
            Error = $null
        }
        
        if ($response.StatusCode -ne $ExpectedStatus) {
            $result.Status = "FAIL"
            $result.Error = "Expected status $ExpectedStatus, got $($response.StatusCode)"
        }
        
    } catch {
        $result = @{
            Service = $Service
            Method = $Method
            Url = $Url
            Status = "FAIL"
            StatusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.value__ } else { 0 }
            ResponseTime = $null
            Error = $_.Exception.Message
        }
    }
    
    $results += $result
    Write-Host "[$($result.Status)] $Service - $Method $Url - Status: $($result.StatusCode)" -ForegroundColor $(if ($result.Status -eq "PASS") { "Green" } else { "Red" })
    
    return $result
}

Write-Host "=== Comprehensive Endpoint Testing ===" -ForegroundColor Cyan
Write-Host "Testing all microservices endpoints..." -ForegroundColor Yellow

# Get auth token first
Write-Host "`n=== Getting Auth Token ===" -ForegroundColor Cyan
try {
    $loginBody = '{"email":"test@example.com","password":"password123"}'
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl:3000/v1/auth/login" -Method POST -ContentType "application/json" -Body $loginBody
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $authToken = $loginData.accessToken
    $authHeaders = @{ "Authorization" = "Bearer $authToken" }
    Write-Host "Auth token obtained successfully" -ForegroundColor Green
} catch {
    Write-Host "Failed to get auth token: $($_.Exception.Message)" -ForegroundColor Red
    $authHeaders = @{}
}

# API Gateway (Port 3000)
Write-Host "`n=== API Gateway (Port 3000) ===" -ForegroundColor Cyan

Test-Endpoint "API-Gateway" "GET" "$baseUrl:3000/health"
Test-Endpoint "API-Gateway" "GET" "$baseUrl:3000/v1/models" -Headers $authHeaders
Test-Endpoint "API-Gateway" "GET" "$baseUrl:3000/v1/models/providers" -Headers $authHeaders
Test-Endpoint "API-Gateway" "GET" "$baseUrl:3000/v1/models/categories" -Headers $authHeaders
Test-Endpoint "API-Gateway" "GET" "$baseUrl:3000/v1/billing/balance" -Headers $authHeaders
Test-Endpoint "API-Gateway" "GET" "$baseUrl:3000/v1/billing/transactions" -Headers $authHeaders
Test-Endpoint "API-Gateway" "GET" "$baseUrl:3000/v1/analytics/metrics" -Headers $authHeaders
Test-Endpoint "API-Gateway" "GET" "$baseUrl:3000/v1/analytics/dashboard" -Headers $authHeaders

# Auth Service (Port 3001)
Write-Host "`n=== Auth Service (Port 3001) ===" -ForegroundColor Cyan

Test-Endpoint "Auth-Service" "GET" "$baseUrl:3001/health"
Test-Endpoint "Auth-Service" "GET" "$baseUrl:3001/auth/profile" -Headers $authHeaders
Test-Endpoint "Auth-Service" "GET" "$baseUrl:3001/api-keys" -Headers $authHeaders
Test-Endpoint "Auth-Service" "GET" "$baseUrl:3001/companies" -Headers $authHeaders

# Provider Orchestrator (Port 3002)
Write-Host "`n=== Provider Orchestrator (Port 3002) ===" -ForegroundColor Cyan

Test-Endpoint "Provider-Orchestrator" "GET" "$baseUrl:3002/health"
Test-Endpoint "Provider-Orchestrator" "GET" "$baseUrl:3002/orchestrator/models"
Test-Endpoint "Provider-Orchestrator" "POST" "$baseUrl:3002/orchestrator/route-request" -Body '{"model":"gpt-3.5-turbo","messages":[{"role":"user","content":"Hello"}]}'

# Proxy Service (Port 3003)
Write-Host "`n=== Proxy Service (Port 3003) ===" -ForegroundColor Cyan

Test-Endpoint "Proxy-Service" "GET" "$baseUrl:3003/health"
Test-Endpoint "Proxy-Service" "GET" "$baseUrl:3003/proxy/health"

# Billing Service (Port 3004)
Write-Host "`n=== Billing Service (Port 3004) ===" -ForegroundColor Cyan

Test-Endpoint "Billing-Service" "GET" "$baseUrl:3004/health"
Test-Endpoint "Billing-Service" "GET" "$baseUrl:3004/billing/balance" -Headers $authHeaders
Test-Endpoint "Billing-Service" "GET" "$baseUrl:3004/billing/transactions" -Headers $authHeaders
Test-Endpoint "Billing-Service" "GET" "$baseUrl:3004/pricing/models"

# Analytics Service (Port 3005)
Write-Host "`n=== Analytics Service (Port 3005) ===" -ForegroundColor Cyan

Test-Endpoint "Analytics-Service" "GET" "$baseUrl:3005/health"
Test-Endpoint "Analytics-Service" "GET" "$baseUrl:3005/analytics/metrics"
Test-Endpoint "Analytics-Service" "GET" "$baseUrl:3005/analytics/dashboard"

# Payment Service (Port 3006)
Write-Host "`n=== Payment Service (Port 3006) ===" -ForegroundColor Cyan

Test-Endpoint "Payment-Service" "GET" "$baseUrl:3006/health"
Test-Endpoint "Payment-Service" "GET" "$baseUrl:3006/payments/status"

# AI Certification Service (Port 3007)
Write-Host "`n=== AI Certification Service (Port 3007) ===" -ForegroundColor Cyan

Test-Endpoint "AI-Certification-Service" "GET" "$baseUrl:3007/health"
Test-Endpoint "AI-Certification-Service" "GET" "$baseUrl:3007/certification/status"

# Anonymization Service (Port 3008)
Write-Host "`n=== Anonymization Service (Port 3008) ===" -ForegroundColor Cyan

Test-Endpoint "Anonymization-Service" "GET" "$baseUrl:3008/health"
Test-Endpoint "Anonymization-Service" "POST" "$baseUrl:3008/anonymization/anonymize" -Body '{"text":"Test text"}'

# Redis Service (Port 3009)
Write-Host "`n=== Redis Service (Port 3009) ===" -ForegroundColor Cyan

Test-Endpoint "Redis-Service" "GET" "$baseUrl:3009/api/redis/health"
Test-Endpoint "Redis-Service" "GET" "$baseUrl:3009/api/redis/status"

# Summary
Write-Host "`n=== Test Summary ===" -ForegroundColor Cyan
$totalTests = $results.Count
$passedTests = ($results | Where-Object { $_.Status -eq "PASS" }).Count
$failedTests = ($results | Where-Object { $_.Status -eq "FAIL" }).Count

Write-Host "Total Tests: $totalTests" -ForegroundColor White
Write-Host "Passed: $passedTests" -ForegroundColor Green
Write-Host "Failed: $failedTests" -ForegroundColor Red

if ($failedTests -gt 0) {
    Write-Host "`n=== Failed Tests Details ===" -ForegroundColor Red
    $results | Where-Object { $_.Status -eq "FAIL" } | ForEach-Object {
        Write-Host "FAIL: $($_.Service) - $($_.Method) $($_.Url)" -ForegroundColor Red
        Write-Host "  Error: $($_.Error)" -ForegroundColor Yellow
    }
}

# Save results to file
$results | ConvertTo-Json -Depth 3 | Out-File -FilePath "endpoint-test-results.json" -Encoding UTF8
Write-Host "`nResults saved to endpoint-test-results.json" -ForegroundColor Green
