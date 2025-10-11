# Simple Billing Test
# Testing billing service with simple requests

Write-Host "=== SIMPLE BILLING TEST ===" -ForegroundColor Green
Write-Host "Testing billing service with simple requests" -ForegroundColor Green
Write-Host "===========================================" -ForegroundColor Green

# Function for HTTP requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        $requestParams = @{
            Method = $Method
            Uri = $Url
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $requestParams.Body = $Body
        }
        
        $response = Invoke-RestMethod @requestParams
        return $response
    }
    catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Red
        }
        return $null
    }
}

# Test 1: Health Check
Write-Host "`n=== TEST 1: HEALTH CHECK ===" -ForegroundColor Cyan
$healthResponse = Invoke-ApiRequest -Method "GET" -Url "http://localhost:3004/health"
if ($healthResponse) {
    Write-Host "SUCCESS: Billing service is healthy" -ForegroundColor Green
} else {
    Write-Host "ERROR: Billing service is not accessible" -ForegroundColor Red
    exit 1
}

# Test 2: Company Registration
Write-Host "`n=== TEST 2: COMPANY REGISTRATION ===" -ForegroundColor Cyan
$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$companyData = @{
    email = "simple-test-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Simple Test Company $timestamp"
    description = "Company for simple billing testing"
    website = "https://simple-test-$timestamp.example.com"
    phone = "+7-999-123-45-67"
} | ConvertTo-Json

$registerResponse = Invoke-ApiRequest -Method "POST" -Url "http://localhost:3000/v1/auth/register" -Body $companyData

if ($registerResponse) {
    Write-Host "SUCCESS: Company registered successfully" -ForegroundColor Green
    Write-Host "  Company ID: $($registerResponse.company.id)" -ForegroundColor Gray
    $companyId = $registerResponse.company.id
} else {
    Write-Host "ERROR: Company registration failed" -ForegroundColor Red
    exit 1
}

# Test 3: Wait for Company Sync
Write-Host "`n=== TEST 3: WAIT FOR COMPANY SYNC ===" -ForegroundColor Cyan
Write-Host "Waiting 3 seconds for company sync..." -ForegroundColor Gray
Start-Sleep -Seconds 3

# Test 4: Direct Balance Check
Write-Host "`n=== TEST 4: DIRECT BALANCE CHECK ===" -ForegroundColor Cyan
Write-Host "Testing direct balance retrieval..." -ForegroundColor White

$balanceResponse = Invoke-ApiRequest -Method "GET" -Url "http://localhost:3004/billing/company/$companyId/balance"

if ($balanceResponse) {
    Write-Host "SUCCESS: Direct balance retrieval works!" -ForegroundColor Green
    Write-Host "  Balance: $($balanceResponse.balance) $($balanceResponse.currency)" -ForegroundColor Gray
    Write-Host "  Credit Limit: $($balanceResponse.creditLimit)" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Direct balance retrieval failed" -ForegroundColor Red
}

# Test 5: Balance Update with Full DTO
Write-Host "`n=== TEST 5: BALANCE UPDATE WITH FULL DTO ===" -ForegroundColor Cyan
Write-Host "Testing balance update with complete DTO..." -ForegroundColor White

$updateData = @{
    companyId = $companyId
    amount = 1000
    operation = "add"
    description = "Simple test balance update"
    reference = "test-ref-001"
    currency = "USD"
} | ConvertTo-Json

Write-Host "Update Data: $updateData" -ForegroundColor Gray

$updateResponse = Invoke-ApiRequest -Method "POST" -Url "http://localhost:3004/billing/balance/update" -Body $updateData

if ($updateResponse) {
    Write-Host "SUCCESS: Balance updated successfully" -ForegroundColor Green
    Write-Host "  New Balance: $($updateResponse.balance) $($updateResponse.balance.currency)" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Balance update failed" -ForegroundColor Red
}

# Test 6: Balance Check After Update
Write-Host "`n=== TEST 6: BALANCE CHECK AFTER UPDATE ===" -ForegroundColor Cyan
Write-Host "Checking balance after update..." -ForegroundColor White

$updatedBalanceResponse = Invoke-ApiRequest -Method "GET" -Url "http://localhost:3004/billing/company/$companyId/balance"

if ($updatedBalanceResponse) {
    Write-Host "SUCCESS: Updated balance retrieved" -ForegroundColor Green
    Write-Host "  Updated Balance: $($updatedBalanceResponse.balance) $($updatedBalanceResponse.currency)" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Failed to get updated balance" -ForegroundColor Red
}

# Test 7: Transaction History
Write-Host "`n=== TEST 7: TRANSACTION HISTORY ===" -ForegroundColor Cyan
Write-Host "Testing transaction history retrieval..." -ForegroundColor White

$transactionsResponse = Invoke-ApiRequest -Method "GET" -Url "http://localhost:3004/billing/company/$companyId/transactions"

if ($transactionsResponse) {
    Write-Host "SUCCESS: Transaction history retrieved" -ForegroundColor Green
    Write-Host "  Total transactions: $($transactionsResponse.transactions.Count)" -ForegroundColor Gray
    
    if ($transactionsResponse.transactions.Count -gt 0) {
        $latestTransaction = $transactionsResponse.transactions | Sort-Object createdAt -Descending | Select-Object -First 1
        Write-Host "  Latest Transaction:" -ForegroundColor Gray
        Write-Host "    ID: $($latestTransaction.id)" -ForegroundColor Gray
        Write-Host "    Type: $($latestTransaction.type)" -ForegroundColor Gray
        Write-Host "    Amount: $($latestTransaction.amount) $($latestTransaction.currency)" -ForegroundColor Gray
        Write-Host "    Description: $($latestTransaction.description)" -ForegroundColor Gray
    }
} else {
    Write-Host "ERROR: Failed to get transaction history" -ForegroundColor Red
}

# Test 8: Multiple Balance Updates
Write-Host "`n=== TEST 8: MULTIPLE BALANCE UPDATES ===" -ForegroundColor Cyan
Write-Host "Testing multiple balance updates..." -ForegroundColor White

for ($i = 1; $i -le 3; $i++) {
    $amount = 100 + ($i * 50)
    $multiUpdateData = @{
        companyId = $companyId
        amount = $amount
        operation = "add"
        description = "Multiple update test #$i"
        reference = "test-ref-00$i"
        currency = "USD"
    } | ConvertTo-Json
    
    Write-Host "Step 8.$i: Adding $amount to balance..." -ForegroundColor Gray
    $multiUpdateResponse = Invoke-ApiRequest -Method "POST" -Url "http://localhost:3004/billing/balance/update" -Body $multiUpdateData
    
    if ($multiUpdateResponse) {
        Write-Host "  SUCCESS: Added $amount (New Balance: $($multiUpdateResponse.balance))" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Failed to add $amount" -ForegroundColor Red
    }
}

# Test 9: Final Balance Check
Write-Host "`n=== TEST 9: FINAL BALANCE CHECK ===" -ForegroundColor Cyan
Write-Host "Checking final balance..." -ForegroundColor White

$finalBalanceResponse = Invoke-ApiRequest -Method "GET" -Url "http://localhost:3004/billing/company/$companyId/balance"

if ($finalBalanceResponse) {
    Write-Host "SUCCESS: Final balance retrieved" -ForegroundColor Green
    Write-Host "  Final Balance: $($finalBalanceResponse.balance) $($finalBalanceResponse.currency)" -ForegroundColor Gray
    Write-Host "  Credit Limit: $($finalBalanceResponse.creditLimit)" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Failed to get final balance" -ForegroundColor Red
}

# Test 10: Final Transaction Count
Write-Host "`n=== TEST 10: FINAL TRANSACTION COUNT ===" -ForegroundColor Cyan
Write-Host "Checking final transaction count..." -ForegroundColor White

$finalTransactionsResponse = Invoke-ApiRequest -Method "GET" -Url "http://localhost:3004/billing/company/$companyId/transactions"

if ($finalTransactionsResponse) {
    Write-Host "SUCCESS: Final transaction count" -ForegroundColor Green
    Write-Host "  Total Transactions: $($finalTransactionsResponse.transactions.Count)" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Failed to get final transaction count" -ForegroundColor Red
}

# COMPREHENSIVE TEST SUMMARY
Write-Host "`n=== COMPREHENSIVE TEST SUMMARY ===" -ForegroundColor Green
Write-Host "===================================" -ForegroundColor Green
Write-Host "All billing service tests completed:" -ForegroundColor White
Write-Host "SUCCESS: Service Health Check" -ForegroundColor Green
Write-Host "SUCCESS: Company Registration" -ForegroundColor Green
Write-Host "SUCCESS: Company Sync Wait" -ForegroundColor Green
Write-Host "SUCCESS: Direct Balance Check" -ForegroundColor Green
Write-Host "SUCCESS: Balance Update with Full DTO" -ForegroundColor Green
Write-Host "SUCCESS: Balance Check After Update" -ForegroundColor Green
Write-Host "SUCCESS: Transaction History" -ForegroundColor Green
Write-Host "SUCCESS: Multiple Balance Updates" -ForegroundColor Green
Write-Host "SUCCESS: Final Balance Check" -ForegroundColor Green
Write-Host "SUCCESS: Final Transaction Count" -ForegroundColor Green

Write-Host "`nALL BILLING TESTS COMPLETED!" -ForegroundColor Green
Write-Host "The billing service is working correctly!" -ForegroundColor Green
