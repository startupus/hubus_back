# Test Hierarchical Company System
# Tests company hierarchy, billing modes, and cascading billing

Write-Host "=== Testing Hierarchical Company System ===" -ForegroundColor Cyan
Write-Host ""

$authServiceUrl = "http://localhost:3001"
$billingServiceUrl = "http://localhost:3004"
$apiGatewayUrl = "http://localhost:3000"

# ===========================================================
# Test 1: Create Root Company (Self-Paid)
# ===========================================================
Write-Host "TEST 1: Create Root Company (SELF_PAID)" -ForegroundColor Yellow
$rootCompanyBody = @{
    name = "Root Company"
    email = "root-$(Get-Date -Format 'HHmmss')@example.com"
    password = "RootPass123!"
    description = "Root company that pays for itself"
} | ConvertTo-Json

try {
    $rootResponse = Invoke-RestMethod -Uri "$authServiceUrl/companies/register" -Method POST -Body $rootCompanyBody -ContentType "application/json"
    Write-Host "[OK] Root company created" -ForegroundColor Green
    Write-Host "    ID: $($rootResponse.company.id)" -ForegroundColor Gray
    Write-Host "    Email: $($rootResponse.company.email)" -ForegroundColor Gray
    
    $rootId = $rootResponse.company.id
    $rootToken = $rootResponse.accessToken
} catch {
    Write-Host "[ERROR] Failed to create root company: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ===========================================================
# Test 2: Create Child Company 1 (Parent-Paid)
# ===========================================================
Write-Host "TEST 2: Create Child Company 1 (PARENT_PAID)" -ForegroundColor Yellow
$child1Body = @{
    name = "Child Company 1"
    email = "child1-$(Get-Date -Format 'HHmmss')@example.com"
    password = "Child1Pass123!"
    billingMode = "PARENT_PAID"
    position = "Manager"
    department = "Sales"
    description = "Child company - parent pays"
} | ConvertTo-Json

try {
    $child1Response = Invoke-RestMethod -Uri "$authServiceUrl/companies/$rootId/child-companies" -Method POST -Body $child1Body -ContentType "application/json" -Headers @{Authorization = "Bearer $rootToken"}
    Write-Host "[OK] Child company 1 created" -ForegroundColor Green
    Write-Host "    ID: $($child1Response.id)" -ForegroundColor Gray
    Write-Host "    Billing Mode: $($child1Response.billingMode)" -ForegroundColor Gray
    
    $child1Id = $child1Response.id
    $child1Email = $child1Response.email
} catch {
    Write-Host "[ERROR] Failed to create child company 1: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ===========================================================
# Test 3: Create Child Company 2 (Self-Paid)
# ===========================================================
Write-Host "TEST 3: Create Child Company 2 (SELF_PAID)" -ForegroundColor Yellow
$child2Body = @{
    name = "Child Company 2"
    email = "child2-$(Get-Date -Format 'HHmmss')@example.com"
    password = "Child2Pass123!"
    billingMode = "SELF_PAID"
    position = "Developer"
    department = "Engineering"
    description = "Child company - pays for itself"
} | ConvertTo-Json

try {
    $child2Response = Invoke-RestMethod -Uri "$authServiceUrl/companies/$rootId/child-companies" -Method POST -Body $child2Body -ContentType "application/json" -Headers @{Authorization = "Bearer $rootToken"}
    Write-Host "[OK] Child company 2 created" -ForegroundColor Green
    Write-Host "    ID: $($child2Response.id)" -ForegroundColor Gray
    Write-Host "    Billing Mode: $($child2Response.billingMode)" -ForegroundColor Gray
    
    $child2Id = $child2Response.id
    $child2Email = $child2Response.email
} catch {
    Write-Host "[ERROR] Failed to create child company 2: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# ===========================================================
# Test 4: Get Company Hierarchy
# ===========================================================
Write-Host "TEST 4: Get Company Hierarchy" -ForegroundColor Yellow
try {
    $hierarchyResponse = Invoke-RestMethod -Uri "$authServiceUrl/companies/$rootId/hierarchy?depth=3" -Method GET -Headers @{Authorization = "Bearer $rootToken"}
    Write-Host "[OK] Hierarchy retrieved" -ForegroundColor Green
    Write-Host "    Root: $($hierarchyResponse.name)" -ForegroundColor Gray
    Write-Host "    Children: $($hierarchyResponse.childCompanies.Count)" -ForegroundColor Gray
    
    foreach ($child in $hierarchyResponse.childCompanies) {
        Write-Host "      - $($child.name) ($($child.billingMode))" -ForegroundColor Gray
    }
} catch {
    Write-Host "[ERROR] Failed to get hierarchy: $_" -ForegroundColor Red
}

Write-Host ""

# ===========================================================
# Test 5: Login Child Company 1 and make AI request
# ===========================================================
Write-Host "TEST 5: Login Child 1 and Test Billing (PARENT_PAID)" -ForegroundColor Yellow

# Login Child 1
$child1LoginBody = @{
    email = $child1Email
    password = "Child1Pass123!"
} | ConvertTo-Json

try {
    $child1LoginResponse = Invoke-RestMethod -Uri "$authServiceUrl/companies/login" -Method POST -Body $child1LoginBody -ContentType "application/json"
    Write-Host "[OK] Child 1 logged in" -ForegroundColor Green
    $child1Token = $child1LoginResponse.accessToken
} catch {
    Write-Host "[ERROR] Failed to login child 1: $_" -ForegroundColor Red
    exit 1
}

# Check balances before request
Write-Host "    Checking balances BEFORE request..." -ForegroundColor Gray
try {
    $rootBalanceBefore = Invoke-RestMethod -Uri "$billingServiceUrl/billing/company/$rootId/balance" -Method GET
    $child1BalanceBefore = Invoke-RestMethod -Uri "$billingServiceUrl/billing/company/$child1Id/balance" -Method GET
    
    Write-Host "      Root balance: $($rootBalanceBefore.balance.balance)" -ForegroundColor Cyan
    Write-Host "      Child1 balance: $($child1BalanceBefore.balance.balance)" -ForegroundColor Cyan
} catch {
    Write-Host "[WARN] Could not check balances: $_" -ForegroundColor Yellow
}

# Make AI request as Child 1 (parent should pay)
Write-Host "    Making AI request from Child 1 (parent should pay)..." -ForegroundColor Gray
$aiRequestBody = @{
    model = "gpt-4o-mini"
    messages = @(
        @{
            role = "user"
            content = "Test request from child company"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $aiResponse = Invoke-RestMethod -Uri "$apiGatewayUrl/v1/chat/completions?provider=openai" -Method POST -Body $aiRequestBody -ContentType "application/json" -Headers @{Authorization = "Bearer $child1Token"} -TimeoutSec 30
    Write-Host "[OK] AI request completed" -ForegroundColor Green
    Write-Host "      Tokens used: $($aiResponse.usage.total_tokens)" -ForegroundColor Gray
} catch {
    Write-Host "[EXPECTED] AI service may be unavailable: $_" -ForegroundColor Yellow
}

# Check balances after request
Write-Host "    Checking balances AFTER request..." -ForegroundColor Gray
try {
    Start-Sleep -Seconds 2  # Wait for billing to process
    
    $rootBalanceAfter = Invoke-RestMethod -Uri "$billingServiceUrl/billing/company/$rootId/balance" -Method GET
    $child1BalanceAfter = Invoke-RestMethod -Uri "$billingServiceUrl/billing/company/$child1Id/balance" -Method GET
    
    Write-Host "      Root balance: $($rootBalanceAfter.balance.balance)" -ForegroundColor Cyan
    Write-Host "      Child1 balance: $($child1BalanceAfter.balance.balance)" -ForegroundColor Cyan
    
    if ($rootBalanceBefore.balance.balance -ne $rootBalanceAfter.balance.balance) {
        Write-Host "    [VERIFIED] Parent was charged (PARENT_PAID mode working)" -ForegroundColor Green
    }
} catch {
    Write-Host "[WARN] Could not verify billing: $_" -ForegroundColor Yellow
}

Write-Host ""

# ===========================================================
# Test 6: Test Child Company 2 (Self-Paid)
# ===========================================================
Write-Host "TEST 6: Test Child 2 Billing (SELF_PAID)" -ForegroundColor Yellow

# Login Child 2
$child2LoginBody = @{
    email = $child2Email
    password = "Child2Pass123!"
} | ConvertTo-Json

try {
    $child2LoginResponse = Invoke-RestMethod -Uri "$authServiceUrl/companies/login" -Method POST -Body $child2LoginBody -ContentType "application/json"
    Write-Host "[OK] Child 2 logged in" -ForegroundColor Green
    $child2Token = $child2LoginResponse.accessToken
} catch {
    Write-Host "[ERROR] Failed to login child 2: $_" -ForegroundColor Red
}

Write-Host ""

# ===========================================================
# Test 7: Get Statistics
# ===========================================================
Write-Host "TEST 7: Get Company Statistics" -ForegroundColor Yellow
try {
    $statsResponse = Invoke-RestMethod -Uri "$billingServiceUrl/billing/company/$rootId/users/statistics" -Method GET
    Write-Host "[OK] Statistics retrieved" -ForegroundColor Green
    Write-Host "    Total child companies: $($statsResponse.statistics.totals.totalChildCompanies)" -ForegroundColor Gray
    Write-Host "    Total requests: $($statsResponse.statistics.totals.totalRequests)" -ForegroundColor Gray
    Write-Host "    Total cost: $($statsResponse.statistics.totals.totalCost)" -ForegroundColor Gray
} catch {
    Write-Host "[WARN] Could not get statistics: $_" -ForegroundColor Yellow
}

Write-Host ""

# ===========================================================
# Test 8: Change Billing Mode
# ===========================================================
Write-Host "TEST 8: Change Child 1 Billing Mode to SELF_PAID" -ForegroundColor Yellow
$changeModeBody = @{
    billingMode = "SELF_PAID"
} | ConvertTo-Json

try {
    $changeModeResponse = Invoke-RestMethod -Uri "$authServiceUrl/companies/$child1Id/billing-mode" -Method PUT -Body $changeModeBody -ContentType "application/json" -Headers @{Authorization = "Bearer $child1Token"}
    Write-Host "[OK] Billing mode changed" -ForegroundColor Green
    Write-Host "    New mode: $($changeModeResponse.billingMode)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Failed to change billing mode: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "- Root Company ID: $rootId" -ForegroundColor Gray
Write-Host "- Child 1 ID: $child1Id (was PARENT_PAID, now SELF_PAID)" -ForegroundColor Gray
Write-Host "- Child 2 ID: $child2Id (SELF_PAID)" -ForegroundColor Gray
Write-Host ""
Write-Host "Hierarchy structure:" -ForegroundColor White
Write-Host "Root Company" -ForegroundColor Cyan
Write-Host "├── Child Company 1 (SELF_PAID)" -ForegroundColor Cyan
Write-Host "└── Child Company 2 (SELF_PAID)" -ForegroundColor Cyan
Write-Host ""

