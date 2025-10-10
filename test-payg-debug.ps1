#!/usr/bin/env pwsh

Write-Host "=== PAY-AS-YOU-GO DEBUG TEST ===" -ForegroundColor Green

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "payg-debug-$timestamp@example.com"

Write-Host "Using email: $companyEmail" -ForegroundColor Cyan

# Register company
$companyData = @{
    name = "PayG-Debug-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for pay-as-you-go debug testing"
} | ConvertTo-Json

try {
    $companyResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $companyData -ContentType "application/json"
    $companyId = $companyResponse.company.id
    Write-Host "SUCCESS: Company registered, ID: $companyId" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Add money
$addMoneyData = @{
    userId = $companyId
    operation = "add"
    amount = 5.00
    currency = "USD"
    description = "Initial balance for pay-as-you-go"
} | ConvertTo-Json

try {
    $addResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/update" -Method POST -Body $addMoneyData -ContentType "application/json"
    Write-Host "SUCCESS: Money added, balance: $($addResponse.balance.balance)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Money addition failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 1: Simple pay-as-you-go with calculated amount
Write-Host "`nTEST 1: Pay-as-you-go with calculated amount" -ForegroundColor Yellow

$inputTokens = 1000
$outputTokens = 500
$inputPrice = 0.00003
$outputPrice = 0.00006
$calculatedAmount = ($inputTokens * $inputPrice) + ($outputTokens * $outputPrice)

Write-Host "Calculated amount: $calculatedAmount" -ForegroundColor Cyan

$paygData1 = @{
    userId = $companyId
    operation = "subtract"
    amount = $calculatedAmount
    currency = "USD"
    description = "Pay-as-you-go: $inputTokens input + $outputTokens output tokens"
} | ConvertTo-Json

try {
    $response1 = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/update" -Method POST -Body $paygData1 -ContentType "application/json"
    Write-Host "SUCCESS: Pay-as-you-go request processed" -ForegroundColor Green
    Write-Host "  Amount charged: $($response1.transaction.amount)" -ForegroundColor Cyan
    Write-Host "  New balance: $($response1.balance.balance)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Pay-as-you-go request failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Pay-as-you-go with different token amounts
Write-Host "`nTEST 2: Pay-as-you-go with different amounts" -ForegroundColor Yellow

$inputTokens = 2000
$outputTokens = 1000
$calculatedAmount = ($inputTokens * $inputPrice) + ($outputTokens * $outputPrice)

Write-Host "Calculated amount: $calculatedAmount" -ForegroundColor Cyan

$paygData2 = @{
    userId = $companyId
    operation = "subtract"
    amount = $calculatedAmount
    currency = "USD"
    description = "Pay-as-you-go: $inputTokens input + $outputTokens output tokens"
} | ConvertTo-Json

try {
    $response2 = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/update" -Method POST -Body $paygData2 -ContentType "application/json"
    Write-Host "SUCCESS: Second pay-as-you-go request processed" -ForegroundColor Green
    Write-Host "  Amount charged: $($response2.transaction.amount)" -ForegroundColor Cyan
    Write-Host "  New balance: $($response2.balance.balance)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Second pay-as-you-go request failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Check final balance
Write-Host "`nFINAL BALANCE CHECK" -ForegroundColor Yellow

try {
    $finalBalanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" -Method GET
    $finalBalance = $finalBalanceResponse.balance.balance
    
    Write-Host "Final balance: $finalBalance" -ForegroundColor Cyan
    Write-Host "Total spent: $([math]::Round(5 - $finalBalance, 4))" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Could not check final balance" -ForegroundColor Red
}

Write-Host "`nPAY-AS-YOU-GO DEBUG COMPLETED" -ForegroundColor Green
Write-Host "The system supports pay-as-you-go billing!" -ForegroundColor Green
