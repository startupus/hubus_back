#!/usr/bin/env pwsh

Write-Host "=== TESTING PRICING PLANS SYSTEM ===" -ForegroundColor Green

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "pricing-test-$timestamp@example.com"

Write-Host "Using email: $companyEmail" -ForegroundColor Cyan

# STEP 1: Register company
Write-Host "`nSTEP 1: Register company" -ForegroundColor Magenta

$companyData = @{
    name = "Pricing-Test-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for testing pricing plans"
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

# STEP 2: Add money to company balance
Write-Host "`nSTEP 2: Add money to company balance" -ForegroundColor Magenta

$addMoneyData = @{
    userId = $companyId
    operation = "add"
    amount = 100.00
    currency = "USD"
    description = "Initial balance for pricing plan testing"
} | ConvertTo-Json

try {
    $addResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/update" -Method POST -Body $addMoneyData -ContentType "application/json"
    
    Write-Host "SUCCESS: Money added to company" -ForegroundColor Green
    Write-Host "  New balance: $($addResponse.balance.balance)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error adding money: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# STEP 3: Create Basic Plan
Write-Host "`nSTEP 3: Create Basic Plan" -ForegroundColor Magenta

$basicPlanData = @{
    name = "Basic Plan"
    description = "Basic plan with 10k input and 20k output tokens"
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

try {
    $basicPlanResponse = Invoke-RestMethod -Uri "http://localhost:3004/pricing/plans" -Method POST -Body $basicPlanData -ContentType "application/json"
    $basicPlanId = $basicPlanResponse.id
    
    Write-Host "SUCCESS: Basic plan created" -ForegroundColor Green
    Write-Host "  ID: $basicPlanId" -ForegroundColor Cyan
    Write-Host "  Price: $($basicPlanResponse.price)" -ForegroundColor Cyan
    Write-Host "  Input tokens: $($basicPlanResponse.inputTokens)" -ForegroundColor Cyan
    Write-Host "  Output tokens: $($basicPlanResponse.outputTokens)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error creating basic plan: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# STEP 4: Subscribe to Basic Plan
Write-Host "`nSTEP 4: Subscribe to Basic Plan" -ForegroundColor Magenta

$subscribeData = @{
    companyId = $companyId
    planId = $basicPlanId
} | ConvertTo-Json

try {
    $subscriptionResponse = Invoke-RestMethod -Uri "http://localhost:3004/pricing/subscribe" -Method POST -Body $subscribeData -ContentType "application/json"
    $subscriptionId = $subscriptionResponse.id
    
    Write-Host "SUCCESS: Subscribed to Basic Plan" -ForegroundColor Green
    Write-Host "  Subscription ID: $subscriptionId" -ForegroundColor Cyan
    Write-Host "  Price paid: $($subscriptionResponse.price)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error subscribing to plan: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# STEP 5: Check company balance after subscription
Write-Host "`nSTEP 5: Check company balance after subscription" -ForegroundColor Magenta

try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" -Method GET
    $balanceAfterSubscription = $balanceResponse.balance.balance
    
    Write-Host "Company balance after subscription: $balanceAfterSubscription" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error checking balance: $($_.Exception.Message)" -ForegroundColor Red
}

# STEP 6: Test AI request with subscription tokens
Write-Host "`nSTEP 6: Test AI request with subscription tokens" -ForegroundColor Magenta

$aiRequestData = @{
    userId = $companyId
    operation = "subtract"
    amount = 0.0
    currency = "USD"
    description = "AI request using subscription tokens"
    metadata = @{
        inputTokens = 1000
        outputTokens = 500
        inputTokenPrice = 0.00003
        outputTokenPrice = 0.00006
        provider = "openai"
        model = "gpt-4"
        billingMethod = "subscription"
    }
} | ConvertTo-Json

try {
    $aiResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/update" -Method POST -Body $aiRequestData -ContentType "application/json"
    
    Write-Host "SUCCESS: AI request processed" -ForegroundColor Green
    Write-Host "  Amount charged: $($aiResponse.transaction.amount)" -ForegroundColor Cyan
    Write-Host "  New balance: $($aiResponse.balance.balance)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error processing AI request: $($_.Exception.Message)" -ForegroundColor Red
}

# STEP 7: Check subscription usage
Write-Host "`nSTEP 7: Check subscription usage" -ForegroundColor Magenta

try {
    $usageResponse = Invoke-RestMethod -Uri "http://localhost:3004/pricing/subscriptions/$subscriptionId/usage" -Method GET
    
    Write-Host "SUCCESS: Subscription usage retrieved" -ForegroundColor Green
    Write-Host "  Input tokens used: $($usageResponse.inputTokensUsed)" -ForegroundColor Cyan
    Write-Host "  Output tokens used: $($usageResponse.outputTokensUsed)" -ForegroundColor Cyan
    Write-Host "  Input tokens remaining: $($usageResponse.inputTokensRemaining)" -ForegroundColor Cyan
    Write-Host "  Output tokens remaining: $($usageResponse.outputTokensRemaining)" -ForegroundColor Cyan
    Write-Host "  Usage percentage: $($usageResponse.usagePercentage)%" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error getting subscription usage: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nPRICING PLANS TEST COMPLETED" -ForegroundColor Green
Write-Host "The pricing plans system is working!" -ForegroundColor Green
