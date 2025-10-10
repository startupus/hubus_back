#!/usr/bin/env pwsh

Write-Host "=== TESTING SIMPLE BILLING ===" -ForegroundColor Green

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "billing-test-$timestamp@example.com"

Write-Host "`nUsing email: $companyEmail" -ForegroundColor Cyan

# ========================================
# STEP 1: Register company
# ========================================
Write-Host "`nSTEP 1: Register company" -ForegroundColor Magenta

$companyData = @{
    name = "Billing-Test-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for billing test"
} | ConvertTo-Json

try {
    $companyResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $companyData -ContentType "application/json"
    $companyId = $companyResponse.company.id
    
    Write-Host "SUCCESS: Company registered: $($companyResponse.company.name)" -ForegroundColor Green
    Write-Host "  ID: $companyId" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error registering company: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# STEP 2: Check initial balance
# ========================================
Write-Host "`nSTEP 2: Check initial balance" -ForegroundColor Magenta

try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" -Method GET
    $initialBalance = $balanceResponse.balance.balance
    Write-Host "Initial balance: $initialBalance" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error checking balance: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# STEP 3: Add money to balance
# ========================================
Write-Host "`nSTEP 3: Add money to balance" -ForegroundColor Magenta

$addMoneyData = @{
    userId = $companyId
    operation = "add"
    amount = 10.00
    currency = "USD"
    description = "Test credit"
} | ConvertTo-Json

try {
    $addResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/update" -Method POST -Body $addMoneyData -ContentType "application/json"
    
    Write-Host "SUCCESS: Money added" -ForegroundColor Green
    Write-Host "  New balance: $($addResponse.balance.balance)" -ForegroundColor Cyan
    Write-Host "  Transaction ID: $($addResponse.transaction.id)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error adding money: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

# ========================================
# STEP 4: Check balance after adding
# ========================================
Write-Host "`nSTEP 4: Check balance after adding" -ForegroundColor Magenta

try {
    $balanceAfterResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" -Method GET
    $balanceAfter = $balanceAfterResponse.balance.balance
    Write-Host "Balance after adding: $balanceAfter" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error checking balance after: $($_.Exception.Message)" -ForegroundColor Red
}

# ========================================
# STEP 5: Try to spend money
# ========================================
Write-Host "`nSTEP 5: Try to spend money" -ForegroundColor Magenta

$spendData = @{
    userId = $companyId
    operation = "subtract"
    amount = 2.50
    currency = "USD"
    description = "Test debit"
    metadata = @{
        inputTokens = 1000
        outputTokens = 500
        inputTokenPrice = 0.00003
        outputTokenPrice = 0.00006
    }
} | ConvertTo-Json

try {
    $spendResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/update" -Method POST -Body $spendData -ContentType "application/json"
    
    Write-Host "SUCCESS: Money spent" -ForegroundColor Green
    Write-Host "  New balance: $($spendResponse.balance.balance)" -ForegroundColor Cyan
    Write-Host "  Transaction ID: $($spendResponse.transaction.id)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error spending money: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "`nBILLING TEST COMPLETED" -ForegroundColor Green
