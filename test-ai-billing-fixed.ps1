# Test AI requests and billing deduction with company sync
Write-Host "=== Testing AI Requests and Billing Deduction (Fixed) ===" -ForegroundColor Cyan

# 1. Register and login company
Write-Host "`n1. Registering company for AI testing..." -ForegroundColor Yellow
$companyEmail = "ai-test-company-$(Get-Random)@example.com"
$companyPassword = "TestPassword123!"

try {
    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            name = "AI Test Company"
            email = $companyEmail
            password = $companyPassword
            description = "Company for AI testing"
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Company registered" -ForegroundColor Green
    Write-Host "  Company ID: $($registerResponse.company.id)" -ForegroundColor Gray
    
    $companyId = $registerResponse.company.id
    $accessToken = $registerResponse.accessToken
} catch {
    Write-Host "ERROR: Registration failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Login to get fresh token
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
    $accessToken = $loginResponse.accessToken
} catch {
    Write-Host "ERROR: Login failed - $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Create company in billing service manually
Write-Host "`n3. Creating company in billing service..." -ForegroundColor Yellow
Write-Host "  This is a workaround since there's no sync endpoint" -ForegroundColor Gray

# We'll use the transaction endpoint which should create the company
try {
    $syncResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/transactions" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            userId = $companyId
            amount = 0
            type = "CREDIT"
            currency = "USD"
            description = "Company sync - initial balance"
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Company synced to billing service" -ForegroundColor Green
} catch {
    Write-Host "WARNING: Company sync failed - $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "  This is expected if company doesn't exist in billing DB" -ForegroundColor Gray
}

# 4. Check initial balance
Write-Host "`n4. Checking initial balance..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
        -Method GET
    
    if ($balanceResponse.success) {
        Write-Host "SUCCESS: Initial balance: $($balanceResponse.balance.balance) USD" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Balance check failed - $($balanceResponse.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Try to create balance manually by creating a transaction
Write-Host "`n5. Creating initial balance through transaction..." -ForegroundColor Yellow
try {
    $topupResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/transactions" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            userId = $companyId
            amount = 50
            type = "CREDIT"
            currency = "USD"
            description = "Initial balance for AI testing"
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Balance created through transaction" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to create balance - $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  This indicates the company doesn't exist in billing service" -ForegroundColor Gray
}

# 6. Check balance after transaction
Write-Host "`n6. Checking balance after transaction..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
        -Method GET
    
    if ($balanceResponse.success) {
        Write-Host "SUCCESS: Balance after transaction: $($balanceResponse.balance.balance) USD" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Balance check failed - $($balanceResponse.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Test manual billing deduction
Write-Host "`n7. Testing manual billing deduction..." -ForegroundColor Yellow
try {
    $deductionResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/transactions" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            userId = $companyId
            amount = 0.01
            type = "DEBIT"
            currency = "USD"
            description = "Manual test deduction"
        } | ConvertTo-Json)
    
    Write-Host "SUCCESS: Manual deduction completed" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to deduct - $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Check balance after deduction
Write-Host "`n8. Checking balance after deduction..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
        -Method GET
    
    if ($balanceResponse.success) {
        Write-Host "SUCCESS: Balance after deduction: $($balanceResponse.balance.balance) USD" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Balance check failed - $($balanceResponse.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Get transaction history
Write-Host "`n9. Getting transaction history..." -ForegroundColor Yellow
try {
    $transactionsResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/transactions" `
        -Method GET
    
    if ($transactionsResponse.success) {
        Write-Host "SUCCESS: Transaction history retrieved" -ForegroundColor Green
        Write-Host "  Total transactions: $($transactionsResponse.transactions.Count)" -ForegroundColor Gray
        
        foreach ($tx in $transactionsResponse.transactions) {
            $txType = if ($tx.type -eq "CREDIT") { "+" } else { "-" }
            Write-Host "    $txType $($tx.amount) USD - $($tx.description) ($($tx.status))" -ForegroundColor Gray
        }
    } else {
        Write-Host "WARNING: Transaction history failed - $($transactionsResponse.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: Failed to get transaction history - $($_.Exception.Message)" -ForegroundColor Red
}

# 10. Test AI request through chat endpoint
Write-Host "`n10. Testing AI request through chat endpoint..." -ForegroundColor Yellow
Write-Host "  This should deduct money from balance" -ForegroundColor Gray

try {
    $chatResponse = Invoke-RestMethod -Uri "http://localhost:3000/chat/completions" `
        -Method POST `
        -ContentType "application/json" `
        -Headers @{
            "Authorization" = "Bearer $accessToken"
        } `
        -Body (@{
            model = "gpt-3.5-turbo"
            messages = @(
                @{
                    role = "user"
                    content = "Hello, this is a test message. Please respond briefly."
                }
            )
            max_tokens = 50
            temperature = 0.7
        } | ConvertTo-Json -Depth 10)
    
    Write-Host "SUCCESS: AI request completed" -ForegroundColor Green
    Write-Host "  Response: $($chatResponse.choices[0].message.content)" -ForegroundColor Gray
} catch {
    Write-Host "WARNING: AI request failed (expected due to region/API issues): $($_.Exception.Message)" -ForegroundColor Yellow
}

# 11. Check balance after AI request
Write-Host "`n11. Checking balance after AI request..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
        -Method GET
    
    if ($balanceResponse.success) {
        Write-Host "SUCCESS: Balance after AI request: $($balanceResponse.balance.balance) USD" -ForegroundColor Green
    } else {
        Write-Host "WARNING: Balance check failed - $($balanceResponse.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== AI and Billing Testing Complete ===" -ForegroundColor Cyan
Write-Host "`nCompany ID: $companyId" -ForegroundColor White
Write-Host "Access Token: $($accessToken.Substring(0, 30))..." -ForegroundColor White

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
Write-Host "1. Company registration and login: WORKING" -ForegroundColor Green
Write-Host "2. Billing service integration: NEEDS SYNC" -ForegroundColor Yellow
Write-Host "3. AI requests: EXPECTED TO FAIL (region issues)" -ForegroundColor Yellow
Write-Host "4. Manual transactions: DEPENDS ON SYNC" -ForegroundColor Yellow
