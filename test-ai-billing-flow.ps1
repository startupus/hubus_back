# Test AI requests and billing deduction
Write-Host "=== Testing AI Requests and Billing Deduction ===" -ForegroundColor Cyan

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

# 3. Check initial balance
Write-Host "`n3. Checking initial balance..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
        -Method GET
    
    Write-Host "SUCCESS: Initial balance: $($balanceResponse.balance.balance) USD" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Top up balance
Write-Host "`n4. Topping up balance by 50 USD..." -ForegroundColor Yellow
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
    
    Write-Host "SUCCESS: Balance topped up" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to top up - $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Check balance after top-up
Write-Host "`n5. Checking balance after top-up..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
        -Method GET
    
    Write-Host "SUCCESS: Balance after top-up: $($balanceResponse.balance.balance) USD" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Test AI request through chat endpoint
Write-Host "`n6. Testing AI request through chat endpoint..." -ForegroundColor Yellow
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

# 7. Check balance after AI request
Write-Host "`n7. Checking balance after AI request..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
        -Method GET
    
    Write-Host "SUCCESS: Balance after AI request: $($balanceResponse.balance.balance) USD" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Test direct proxy service call
Write-Host "`n8. Testing direct proxy service call..." -ForegroundColor Yellow
try {
    $proxyResponse = Invoke-RestMethod -Uri "http://localhost:3003/openai/chat/completions" `
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
                    content = "Test message for proxy service"
                }
            )
            max_tokens = 20
        } | ConvertTo-Json -Depth 10)
    
    Write-Host "SUCCESS: Proxy service call completed" -ForegroundColor Green
    Write-Host "  Response: $($proxyResponse.choices[0].message.content)" -ForegroundColor Gray
} catch {
    Write-Host "WARNING: Proxy service call failed: $($_.Exception.Message)" -ForegroundColor Yellow
}

# 9. Check balance after proxy call
Write-Host "`n9. Checking balance after proxy call..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
        -Method GET
    
    Write-Host "SUCCESS: Balance after proxy call: $($balanceResponse.balance.balance) USD" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 10. Get transaction history
Write-Host "`n10. Getting transaction history..." -ForegroundColor Yellow
try {
    $transactionsResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/transactions" `
        -Method GET
    
    Write-Host "SUCCESS: Transaction history retrieved" -ForegroundColor Green
    Write-Host "  Total transactions: $($transactionsResponse.transactions.Count)" -ForegroundColor Gray
    
    foreach ($tx in $transactionsResponse.transactions) {
        $txType = if ($tx.type -eq "CREDIT") { "+" } else { "-" }
        Write-Host "    $txType $($tx.amount) USD - $($tx.description) ($($tx.status))" -ForegroundColor Gray
    }
} catch {
    Write-Host "ERROR: Failed to get transaction history - $($_.Exception.Message)" -ForegroundColor Red
}

# 11. Test usage tracking
Write-Host "`n11. Testing usage tracking..." -ForegroundColor Yellow
try {
    $usageResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/usage/track" `
        -Method POST `
        -ContentType "application/json" `
        -Body (@{
            userId = $companyId
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

# 12. Check balance after usage tracking
Write-Host "`n12. Checking balance after usage tracking..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
        -Method GET
    
    Write-Host "SUCCESS: Final balance: $($balanceResponse.balance.balance) USD" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

# 13. Test manual billing deduction
Write-Host "`n13. Testing manual billing deduction..." -ForegroundColor Yellow
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

# 14. Final balance check
Write-Host "`n14. Final balance check..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/company/$companyId/balance" `
        -Method GET
    
    Write-Host "SUCCESS: Final balance: $($balanceResponse.balance.balance) USD" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to get balance - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== AI and Billing Testing Complete ===" -ForegroundColor Cyan
Write-Host "`nCompany ID: $companyId" -ForegroundColor White
Write-Host "Access Token: $($accessToken.Substring(0, 30))..." -ForegroundColor White
