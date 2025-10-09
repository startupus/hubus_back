# Test company hierarchy and billing
Write-Host "=== Testing Company Hierarchy and Billing ===" -ForegroundColor Cyan

# 1. Register parent company
Write-Host "`n1. Registering parent company..." -ForegroundColor Yellow
$parentEmail = "parent-company-$(Get-Random)@example.com"
$parentPassword = "TestPassword123!"

try {
    $parentResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            name = "Parent Company"
            email = $parentEmail
            password = $parentPassword
            description = "Parent company for hierarchy testing"
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Parent company registered" -ForegroundColor Green
    Write-Host "  Parent ID: $($parentResponse.company.id)" -ForegroundColor Gray
    
    $parentId = $parentResponse.company.id
    $parentToken = $parentResponse.accessToken
} catch {
    Write-Host "ERROR: Failed to register parent - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Top up parent balance
Write-Host "`n2. Topping up parent balance by 1000 USD..." -ForegroundColor Yellow
try {
    $topupResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/transactions" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            userId = $parentId
            amount = 1000
            type = "CREDIT"
            currency = "USD"
            description = "Initial balance for parent"
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Parent balance topped up" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to top up - $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Check parent balance
Write-Host "`n3. Checking parent balance..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$parentId/balance" `
        -Method GET
    
    Write-Host "SUCCESS: Parent balance: $($balanceResponse.balance.balance) USD" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Register child company with SELF_PAID mode
Write-Host "`n4. Registering child company (SELF_PAID mode)..." -ForegroundColor Yellow
$childEmail = "child-company-$(Get-Random)@example.com"
$childPassword = "TestPassword123!"

try {
    $childResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            name = "Child Company (SELF_PAID)"
            email = $childEmail
            password = $childPassword
            description = "Child company for hierarchy testing"
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Child company registered" -ForegroundColor Green
    Write-Host "  Child ID: $($childResponse.company.id)" -ForegroundColor Gray
    
    $childId = $childResponse.company.id
    $childToken = $childResponse.accessToken
} catch {
    Write-Host "ERROR: Failed to register child - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 5. Set parent for child company
Write-Host "`n5. Setting parent company..." -ForegroundColor Yellow
try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/$childId/parent" `
        -Method PUT `
        -ContentType "application/json" `
        -Body (@{
            parentCompanyId = $parentId
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Parent set for child company" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to set parent - $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Top up child balance
Write-Host "`n6. Topping up child balance by 100 USD..." -ForegroundColor Yellow
try {
    $topupResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/transactions" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            userId = $childId
            amount = 100
            type = "CREDIT"
            currency = "USD"
            description = "Initial balance for child"
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Child balance topped up" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to top up - $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Check child balance
Write-Host "`n7. Checking child balance..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$childId/balance" `
        -Method GET
    
    Write-Host "SUCCESS: Child balance: $($balanceResponse.balance.balance) USD" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Change child billing mode to PARENT_PAID
Write-Host "`n8. Changing child billing mode to PARENT_PAID..." -ForegroundColor Yellow
try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/$childId/billing-mode" `
        -Method PUT `
        -ContentType "application/json" `
        -Body (@{
            billingMode = "PARENT_PAID"
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Billing mode changed to PARENT_PAID" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to change billing mode - $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Simulate AI request from child (should charge parent)
Write-Host "`n9. Simulating AI request from child company..." -ForegroundColor Yellow
Write-Host "  This should charge the parent company's balance" -ForegroundColor Gray

try {
    # Create a usage event
    $usageResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/usage/track" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            userId = $childId
            provider = "openai"
            model = "gpt-3.5-turbo"
            promptTokens = 100
            completionTokens = 50
            totalTokens = 150
            cost = 0.0025
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Usage tracked" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to track usage - $($_.Exception.Message)" -ForegroundColor Red
}

# 10. Check balances after usage
Write-Host "`n10. Checking balances after AI request..." -ForegroundColor Yellow

try {
    $parentBalanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$parentId/balance" `
        -Method GET
    
    Write-Host "Parent balance: $($parentBalanceResponse.balance.balance) USD" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Failed to get parent balance - $($_.Exception.Message)" -ForegroundColor Red
}

try {
    $childBalanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$childId/balance" `
        -Method GET
    
    Write-Host "Child balance: $($childBalanceResponse.balance.balance) USD" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Failed to get child balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 11. Get transaction history for both companies
Write-Host "`n11. Getting transaction history..." -ForegroundColor Yellow

Write-Host "Parent transactions:" -ForegroundColor Cyan
try {
    $parentTxResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$parentId/transactions" `
        -Method GET
    
    foreach ($tx in $parentTxResponse.transactions) {
        Write-Host "  - $($tx.type): $($tx.amount) USD - $($tx.description)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: Failed to get parent transactions - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nChild transactions:" -ForegroundColor Cyan
try {
    $childTxResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$childId/transactions" `
        -Method GET
    
    foreach ($tx in $childTxResponse.transactions) {
        Write-Host "  - $($tx.type): $($tx.amount) USD - $($tx.description)" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: Failed to get child transactions - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Cyan
Write-Host "`nParent Company ID: $parentId" -ForegroundColor White
Write-Host "Child Company ID: $childId" -ForegroundColor White

