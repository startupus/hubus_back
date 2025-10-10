#!/usr/bin/env pwsh

Write-Host "=== MINIMAL PRICING PLAN TEST ===" -ForegroundColor Green

# Test with minimal required fields only
$minimalPlanData = @{
    name = "Minimal Plan"
    type = "TOKEN_BASED"
} | ConvertTo-Json

Write-Host "Testing minimal plan creation..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3004/pricing/plans" -Method POST -Body $minimalPlanData -ContentType "application/json"
    Write-Host "SUCCESS: Minimal plan created" -ForegroundColor Green
    Write-Host "Plan ID: $($response.id)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test with all fields but different values
$fullPlanData = @{
    name = "Full Plan"
    description = "Full plan description"
    type = "TOKEN_BASED"
    inputTokens = 1000
    outputTokens = 2000
    inputTokenPrice = 0.0001
    outputTokenPrice = 0.0002
    discountPercent = 5.0
    currency = "USD"
    billingCycle = "MONTHLY"
    isActive = $true
} | ConvertTo-Json

Write-Host "`nTesting full plan creation..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3004/pricing/plans" -Method POST -Body $fullPlanData -ContentType "application/json"
    Write-Host "SUCCESS: Full plan created" -ForegroundColor Green
    Write-Host "Plan ID: $($response.id)" -ForegroundColor Cyan
    Write-Host "Price: $($response.price)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
}
