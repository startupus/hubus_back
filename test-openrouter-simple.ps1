# Simple OpenRouter Test Script
# Tests Russian requests with and without anonymization

Write-Host "=== OpenRouter System Test ===" -ForegroundColor Green

# Configuration
$PROXY_SERVICE_URL = "http://localhost:3003"
$API_GATEWAY_URL = "http://localhost:3000"
$TEST_USER_ID = "test-user-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "Test User ID: $TEST_USER_ID" -ForegroundColor Cyan

# Test 1: Clean Russian request (no PII)
Write-Host "`n=== Test 1: Clean Russian Request ===" -ForegroundColor Yellow

$cleanRequest = @{
    model = "openai/gpt-4o-mini"
    messages = @(
        @{
            role = "user"
            content = "Привет! Расскажи мне о погоде в Москве."
        }
    )
    temperature = 0.7
    max_tokens = 200
    userId = $TEST_USER_ID
} | ConvertTo-Json -Depth 3

Write-Host "Sending clean request..." -ForegroundColor White

try {
    $cleanResponse = Invoke-RestMethod -Uri "$PROXY_SERVICE_URL/proxy/openrouter/chat/completions" -Method POST -Body $cleanRequest -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "SUCCESS - Clean Request:" -ForegroundColor Green
    Write-Host "Response: $($cleanResponse.responseText)" -ForegroundColor White
    Write-Host "Input Tokens: $($cleanResponse.inputTokens)" -ForegroundColor Magenta
    Write-Host "Output Tokens: $($cleanResponse.outputTokens)" -ForegroundColor Magenta
    Write-Host "Total Tokens: $($cleanResponse.totalTokens)" -ForegroundColor Magenta
    Write-Host "Cost: $($cleanResponse.cost) $($cleanResponse.currency)" -ForegroundColor Magenta
    Write-Host "Provider: $($cleanResponse.provider)" -ForegroundColor Magenta
    Write-Host "Model: $($cleanResponse.model)" -ForegroundColor Magenta
    
    $CLEAN_COST = $cleanResponse.cost
    $CLEAN_TOKENS = $cleanResponse.totalTokens
} catch {
    Write-Host "ERROR - Clean Request: $($_.Exception.Message)" -ForegroundColor Red
    $CLEAN_COST = 0
    $CLEAN_TOKENS = 0
}

# Test 2: Russian request with PII (will be anonymized)
Write-Host "`n=== Test 2: Russian Request with PII ===" -ForegroundColor Yellow

$piiRequest = @{
    model = "openai/gpt-4o-mini"
    messages = @(
        @{
            role = "user"
            content = "Меня зовут Иван Петров, мой телефон +7 (495) 123-45-67, email: ivan.petrov@mail.ru. Расскажи мне о погоде в Москве."
        }
    )
    temperature = 0.7
    max_tokens = 200
    userId = $TEST_USER_ID
} | ConvertTo-Json -Depth 3

Write-Host "Sending PII request..." -ForegroundColor White

try {
    $piiResponse = Invoke-RestMethod -Uri "$PROXY_SERVICE_URL/proxy/openrouter/chat/completions" -Method POST -Body $piiRequest -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "SUCCESS - PII Request:" -ForegroundColor Green
    Write-Host "Response: $($piiResponse.responseText)" -ForegroundColor White
    Write-Host "Input Tokens: $($piiResponse.inputTokens)" -ForegroundColor Magenta
    Write-Host "Output Tokens: $($piiResponse.outputTokens)" -ForegroundColor Magenta
    Write-Host "Total Tokens: $($piiResponse.totalTokens)" -ForegroundColor Magenta
    Write-Host "Cost: $($piiResponse.cost) $($piiResponse.currency)" -ForegroundColor Magenta
    Write-Host "Provider: $($piiResponse.provider)" -ForegroundColor Magenta
    Write-Host "Model: $($piiResponse.model)" -ForegroundColor Magenta
    
    $PII_COST = $piiResponse.cost
    $PII_TOKENS = $piiResponse.totalTokens
} catch {
    Write-Host "ERROR - PII Request: $($_.Exception.Message)" -ForegroundColor Red
    $PII_COST = 0
    $PII_TOKENS = 0
}

# Comparison
Write-Host "`n=== Comparison Results ===" -ForegroundColor Yellow

if ($CLEAN_COST -gt 0 -and $PII_COST -gt 0) {
    Write-Host "Token Comparison:" -ForegroundColor Cyan
    Write-Host "  Clean: $CLEAN_TOKENS tokens" -ForegroundColor White
    Write-Host "  PII:   $PII_TOKENS tokens" -ForegroundColor White
    $tokenDiff = $PII_TOKENS - $CLEAN_TOKENS
    $tokenDiffPercent = if ($CLEAN_TOKENS -gt 0) { [math]::Round(($tokenDiff / $CLEAN_TOKENS) * 100, 2) } else { 0 }
    Write-Host "  Diff:  $tokenDiff tokens ($tokenDiffPercent%)" -ForegroundColor $(if ($tokenDiff -gt 0) { "Yellow" } else { "Green" })
    
    Write-Host "`nCost Comparison:" -ForegroundColor Cyan
    Write-Host "  Clean: $CLEAN_COST USD" -ForegroundColor White
    Write-Host "  PII:   $PII_COST USD" -ForegroundColor White
    $costDiff = $PII_COST - $CLEAN_COST
    $costDiffPercent = if ($CLEAN_COST -gt 0) { [math]::Round(($costDiff / $CLEAN_COST) * 100, 2) } else { 0 }
    Write-Host "  Diff:  $costDiff USD ($costDiffPercent%)" -ForegroundColor $(if ($costDiff -gt 0) { "Yellow" } else { "Green" })
    
    Write-Host "`nAnalysis:" -ForegroundColor Cyan
    if ($tokenDiff -gt 0) {
        Write-Host "  Anonymization increased tokens by $tokenDiff" -ForegroundColor Yellow
    } else {
        Write-Host "  Anonymization did not affect token count" -ForegroundColor Green
    }
    
    if ($costDiff -gt 0) {
        Write-Host "  Anonymization increased cost by $costDiff USD" -ForegroundColor Yellow
    } else {
        Write-Host "  Anonymization did not affect cost" -ForegroundColor Green
    }
} else {
    Write-Host "Cannot compare results due to errors" -ForegroundColor Red
}

# Test 3: Check billing
Write-Host "`n=== Test 3: Billing Check ===" -ForegroundColor Yellow

try {
    $billingResponse = Invoke-RestMethod -Uri "$API_GATEWAY_URL/v1/billing/transactions/$TEST_USER_ID" -Method GET -TimeoutSec 30
    Write-Host "SUCCESS - Billing History:" -ForegroundColor Green
    Write-Host "Transaction Count: $($billingResponse.transactions.Count)" -ForegroundColor White
    
    if ($billingResponse.transactions.Count -gt 0) {
        $totalSpent = ($billingResponse.transactions | Where-Object { $_.type -eq "debit" } | Measure-Object -Property amount -Sum).Sum
        Write-Host "Total Spent: $totalSpent USD" -ForegroundColor Magenta
        
        Write-Host "`nTransaction Details:" -ForegroundColor Cyan
        $billingResponse.transactions | ForEach-Object {
            Write-Host "  $($_.type): $($_.amount) $($_.currency) - $($_.description)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "ERROR - Billing Check: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Test Complete ===" -ForegroundColor Green
Write-Host "Test User: $TEST_USER_ID" -ForegroundColor Cyan
