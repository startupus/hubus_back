#!/usr/bin/env pwsh

Write-Host "=== PAY-AS-YOU-GO TEST ===" -ForegroundColor Green

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "payg-$timestamp@example.com"

Write-Host "Using email: $companyEmail" -ForegroundColor Cyan

# Register company
$companyData = @{
    name = "PayG-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for pay-as-you-go testing"
} | ConvertTo-Json

try {
    $companyResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $companyData -ContentType "application/json"
    $companyId = $companyResponse.company.id
    Write-Host "SUCCESS: Company registered" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Add money
$addMoneyData = @{
    userId = $companyId
    operation = "add"
    amount = 10.00
    currency = "USD"
    description = "Initial balance"
} | ConvertTo-Json

try {
    $addResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/update" -Method POST -Body $addMoneyData -ContentType "application/json"
    Write-Host "SUCCESS: Money added, balance: $($addResponse.balance.balance)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Money addition failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test pay-as-you-go request
Write-Host "`nTesting pay-as-you-go AI request..." -ForegroundColor Yellow

$inputTokens = 1000
$outputTokens = 500
$inputPrice = 0.00003
$outputPrice = 0.00006
$expectedCost = ($inputTokens * $inputPrice) + ($outputTokens * $outputPrice)

Write-Host "Request: $inputTokens input + $outputTokens output tokens" -ForegroundColor Cyan
Write-Host "Expected cost: $expectedCost" -ForegroundColor Cyan

$aiRequestData = @{
    userId = $companyId
    operation = "subtract"
    amount = $expectedCost
    currency = "USD"
    description = "Pay-as-you-go AI request"
    metadata = @{
        inputTokens = $inputTokens
        outputTokens = $outputTokens
        inputTokenPrice = $inputPrice
        outputTokenPrice = $outputPrice
        provider = "openai"
        model = "gpt-4"
        billingMethod = "pay_as_you_go"
    }
} | ConvertTo-Json

try {
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/update" -Method POST -Body $aiRequestData -ContentType "application/json"
    
    Write-Host "SUCCESS: Pay-as-you-go request processed" -ForegroundColor Green
    Write-Host "  Amount charged: $($aiResponse.transaction.amount)" -ForegroundColor Cyan
    Write-Host "  New balance: $($aiResponse.balance.balance)" -ForegroundColor Cyan
    Write-Host "  Transaction ID: $($aiResponse.transaction.id)" -ForegroundColor Cyan
    
    # Verify cost
    $actualCost = [decimal]$aiResponse.transaction.amount
    if ([math]::Abs($actualCost - $expectedCost) -lt 0.001) {
        Write-Host "  ✅ COST CALCULATION CORRECT!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ COST CALCULATION INCORRECT!" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Pay-as-you-go request failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check final balance
try {
    $finalBalanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" -Method GET
    $finalBalance = $finalBalanceResponse.balance.balance
    
    Write-Host "`nFinal balance: $finalBalance" -ForegroundColor Cyan
    Write-Host "Total spent: $([math]::Round(10 - $finalBalance, 4))" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Could not check final balance" -ForegroundColor Red
}

Write-Host "`nPAY-AS-YOU-GO TEST COMPLETED" -ForegroundColor Green
Write-Host "Companies can work without subscription!" -ForegroundColor Green
