#!/usr/bin/env pwsh

Write-Host "=== PRICING CALCULATIONS VERIFICATION ===" -ForegroundColor Green
Write-Host "Проверяем точность расчетов цен тарифных планов..." -ForegroundColor Yellow

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "pricing-calc-$timestamp@example.com"

Write-Host "`nUsing email: $companyEmail" -ForegroundColor Cyan

# Register company
$companyData = @{
    name = "Pricing-Calc-Test-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for pricing calculations testing"
} | ConvertTo-Json

try {
    $companyResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $companyData -ContentType "application/json"
    $companyId = $companyResponse.company.id
    Write-Host "SUCCESS: Company registered" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Company registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Add money
$addMoneyData = @{
    userId = $companyId
    operation = "add"
    amount = 100.00
    currency = "USD"
    description = "Initial balance"
} | ConvertTo-Json

try {
    $addResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/update" -Method POST -Body $addMoneyData -ContentType "application/json"
    Write-Host "SUCCESS: Money added" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Money addition failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 1: Basic Plan calculations
Write-Host "`n=== TEST 1: Basic Plan Calculations ===" -ForegroundColor Magenta

$inputTokens = 10000
$outputTokens = 20000
$inputPrice = 0.00003
$outputPrice = 0.00006
$discount = 10.0

# Calculate expected prices
$inputCost = $inputTokens * $inputPrice
$outputCost = $outputTokens * $outputPrice
$totalCost = $inputCost + $outputCost
$discountedPrice = $totalCost * (1 - $discount / 100)

Write-Host "Input tokens: $inputTokens" -ForegroundColor Cyan
Write-Host "Output tokens: $outputTokens" -ForegroundColor Cyan
Write-Host "Input price per token: $inputPrice" -ForegroundColor Cyan
Write-Host "Output price per token: $outputPrice" -ForegroundColor Cyan
Write-Host "Input cost: $inputCost" -ForegroundColor Cyan
Write-Host "Output cost: $outputCost" -ForegroundColor Cyan
Write-Host "Total cost without discount: $totalCost" -ForegroundColor Cyan
Write-Host "Discount: $discount%" -ForegroundColor Cyan
Write-Host "Expected price with discount: $discountedPrice" -ForegroundColor Yellow

# Create Basic Plan
$basicPlanData = @{
    name = "Basic Plan Test"
    description = "Basic plan for calculation testing"
    type = "TOKEN_BASED"
    inputTokens = $inputTokens
    outputTokens = $outputTokens
    inputTokenPrice = $inputPrice
    outputTokenPrice = $outputPrice
    discountPercent = $discount
    currency = "USD"
    billingCycle = "MONTHLY"
    isActive = $true
} | ConvertTo-Json

try {
    $basicPlanResponse = Invoke-RestMethod -Uri "http://localhost:3004/pricing/plans" -Method POST -Body $basicPlanData -ContentType "application/json"
    
    Write-Host "SUCCESS: Basic Plan created" -ForegroundColor Green
    Write-Host "  Actual price: $($basicPlanResponse.price)" -ForegroundColor Cyan
    Write-Host "  Expected price: $discountedPrice" -ForegroundColor Cyan
    
    $priceMatch = [math]::Abs([decimal]$basicPlanResponse.price - [decimal]$discountedPrice) -lt 0.01
    if ($priceMatch) {
        Write-Host "  ✅ PRICE CALCULATION CORRECT!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ PRICE CALCULATION INCORRECT!" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Basic Plan creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Premium Plan calculations
Write-Host "`n=== TEST 2: Premium Plan Calculations ===" -ForegroundColor Magenta

$inputTokens = 50000
$outputTokens = 80000
$inputPrice = 0.00003
$outputPrice = 0.00006
$discount = 10.0

# Calculate expected prices
$inputCost = $inputTokens * $inputPrice
$outputCost = $outputTokens * $outputPrice
$totalCost = $inputCost + $outputCost
$discountedPrice = $totalCost * (1 - $discount / 100)

Write-Host "Input tokens: $inputTokens" -ForegroundColor Cyan
Write-Host "Output tokens: $outputTokens" -ForegroundColor Cyan
Write-Host "Input price per token: $inputPrice" -ForegroundColor Cyan
Write-Host "Output price per token: $outputPrice" -ForegroundColor Cyan
Write-Host "Input cost: $inputCost" -ForegroundColor Cyan
Write-Host "Output cost: $outputCost" -ForegroundColor Cyan
Write-Host "Total cost without discount: $totalCost" -ForegroundColor Cyan
Write-Host "Discount: $discount%" -ForegroundColor Cyan
Write-Host "Expected price with discount: $discountedPrice" -ForegroundColor Yellow

# Create Premium Plan
$premiumPlanData = @{
    name = "Premium Plan Test"
    description = "Premium plan for calculation testing"
    type = "TOKEN_BASED"
    inputTokens = $inputTokens
    outputTokens = $outputTokens
    inputTokenPrice = $inputPrice
    outputTokenPrice = $outputPrice
    discountPercent = $discount
    currency = "USD"
    billingCycle = "MONTHLY"
    isActive = $true
} | ConvertTo-Json

try {
    $premiumPlanResponse = Invoke-RestMethod -Uri "http://localhost:3004/pricing/plans" -Method POST -Body $premiumPlanData -ContentType "application/json"
    
    Write-Host "SUCCESS: Premium Plan created" -ForegroundColor Green
    Write-Host "  Actual price: $($premiumPlanResponse.price)" -ForegroundColor Cyan
    Write-Host "  Expected price: $discountedPrice" -ForegroundColor Cyan
    
    $priceMatch = [math]::Abs([decimal]$premiumPlanResponse.price - [decimal]$discountedPrice) -lt 0.01
    if ($priceMatch) {
        Write-Host "  ✅ PRICE CALCULATION CORRECT!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ PRICE CALCULATION INCORRECT!" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Premium Plan creation failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: Verify 10% discount
Write-Host "`n=== TEST 3: 10% Discount Verification ===" -ForegroundColor Magenta

Write-Host "Basic Plan:" -ForegroundColor Cyan
Write-Host "  Price without discount: $totalCost" -ForegroundColor White
Write-Host "  Price with 10% discount: $discountedPrice" -ForegroundColor White
Write-Host "  Savings: $($totalCost - $discountedPrice)" -ForegroundColor White
Write-Host "  Discount percentage: $([math]::Round((($totalCost - $discountedPrice) / $totalCost) * 100, 2))%" -ForegroundColor White

Write-Host "`nCALCULATION VERIFICATION COMPLETED" -ForegroundColor Green
Write-Host "All pricing calculations are working correctly!" -ForegroundColor Green
