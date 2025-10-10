#!/usr/bin/env pwsh

Write-Host "=== DEBUGGING PRICING PLANS ===" -ForegroundColor Green

# Test creating a simple pricing plan
$planData = @{
    name = "Test Plan"
    description = "Test plan"
    type = "TOKEN_BASED"
    inputTokens = 10000
    outputTokens = 20000
    inputTokenPrice = 0.00003
    outputTokenPrice = 0.00006
    discountPercent = 10.0
    currency = "USD"
    billingCycle = "MONTHLY"
    isActive = $true
} | ConvertTo-Json

Write-Host "Sending request:" -ForegroundColor Yellow
Write-Host $planData -ForegroundColor Cyan

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3004/pricing/plans" -Method POST -Body $planData -ContentType "application/json"
    Write-Host "SUCCESS: Plan created" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}
