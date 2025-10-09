# Test full company flow
Write-Host "=== Testing Company Flow ===" -ForegroundColor Cyan

# 1. Register new company
Write-Host "`n1. Registering new company..." -ForegroundColor Yellow
$companyEmail = "flow-test-company-$(Get-Random)@example.com"
$companyPassword = "TestPassword123!"

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            name = "Flow Test Company"
            email = $companyEmail
            password = $companyPassword
            description = "Test company for flow testing"
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Company registered" -ForegroundColor Green
    Write-Host "  Company ID: $($registerResponse.company.id)" -ForegroundColor Gray
    Write-Host "  Email: $($registerResponse.company.email)" -ForegroundColor Gray
    
    $companyId = $registerResponse.company.id
    $accessToken = $registerResponse.accessToken
} catch {
    Write-Host "ERROR: Registration failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Login company
Write-Host "`n2. Logging in..." -ForegroundColor Yellow
try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/login" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            email = $companyEmail
            password = $companyPassword
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Login successful" -ForegroundColor Green
    Write-Host "  Access Token: $($loginResponse.accessToken.Substring(0, 20))..." -ForegroundColor Gray
    
    $accessToken = $loginResponse.accessToken
} catch {
    Write-Host "ERROR: Login failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Check initial balance
Write-Host "`n3. Checking initial balance..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
        -Method GET
    
    Write-Host "SUCCESS: Balance retrieved" -ForegroundColor Green
    Write-Host "  Balance: $($balanceResponse.balance.balance) USD" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Top up balance
Write-Host "`n4. Topping up balance by 100 USD..." -ForegroundColor Yellow
try {
    $topupResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/transactions" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            userId = $companyId
            amount = 100
            type = "CREDIT"
            currency = "USD"
            description = "Test top-up"
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Balance topped up" -ForegroundColor Green
    Write-Host "  Transaction ID: $($topupResponse.transaction.id)" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to top up - $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Check balance after top-up
Write-Host "`n5. Checking balance after top-up..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
        -Method GET
    
    Write-Host "SUCCESS: Balance retrieved" -ForegroundColor Green
    Write-Host "  Balance: $($balanceResponse.balance.balance) USD" -ForegroundColor Gray
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Get transaction history
Write-Host "`n6. Getting transaction history..." -ForegroundColor Yellow
try {
    $transactionsResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/transactions" `
        -Method GET
    
    Write-Host "SUCCESS: Transaction history retrieved" -ForegroundColor Green
    Write-Host "  Total transactions: $($transactionsResponse.transactions.Count)" -ForegroundColor Gray
    
    foreach ($tx in $transactionsResponse.transactions) {
        Write-Host "    - $($tx.type): $($tx.amount) USD ($($tx.description))" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: Failed to get history - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Testing Complete ===" -ForegroundColor Cyan
Write-Host "`nCompany ID: $companyId" -ForegroundColor White
Write-Host "Access Token: $($accessToken.Substring(0, 30))..." -ForegroundColor White
