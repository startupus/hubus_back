# Test Company Functionality
# Simple version without special characters

Write-Host "=== Testing Company Functionality ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$authServiceUrl = "http://localhost:3001"
$billingServiceUrl = "http://localhost:3004"
$companyEmail = "test-company-$(Get-Date -Format 'HHmmss')@example.com"
$companyPassword = "SecurePassword123!"
$companyName = "Test Company $(Get-Date -Format 'HHmmss')"

# 1. Register Company
Write-Host "1. Register Company..." -ForegroundColor Yellow
$registerBody = @{
    name = $companyName
    email = $companyEmail
    password = $companyPassword
    description = "Test company for functionality testing"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$authServiceUrl/companies/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "[OK] Company registered successfully" -ForegroundColor Green
    Write-Host "Company ID: $($registerResponse.company.id)" -ForegroundColor Gray
    Write-Host "Access Token: $($registerResponse.accessToken.Substring(0, 20))..." -ForegroundColor Gray
    
    $companyId = $registerResponse.company.id
    $accessToken = $registerResponse.accessToken
} catch {
    Write-Host "[ERROR] Failed to register company: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Login Company
Write-Host "2. Login Company..." -ForegroundColor Yellow
$loginBody = @{
    email = $companyEmail
    password = $companyPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$authServiceUrl/companies/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "[OK] Company logged in successfully" -ForegroundColor Green
    Write-Host "New Access Token: $($loginResponse.accessToken.Substring(0, 20))..." -ForegroundColor Gray
    
    $accessToken = $loginResponse.accessToken
} catch {
    Write-Host "[ERROR] Failed to login company: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. Create API Key
Write-Host "3. Create API Key..." -ForegroundColor Yellow
$apiKeyBody = @{
    name = "Test API Key"
    description = "API key for testing"
    permissions = @("chat:read", "chat:write")
} | ConvertTo-Json

try {
    $apiKeyResponse = Invoke-RestMethod -Uri "$authServiceUrl/companies/$companyId/api-keys" -Method POST -Body $apiKeyBody -ContentType "application/json" -Headers @{Authorization = "Bearer $accessToken"}
    Write-Host "[OK] API key created successfully" -ForegroundColor Green
    Write-Host "API Key: $($apiKeyResponse.key.Substring(0, 30))..." -ForegroundColor Gray
    
    $apiKey = $apiKeyResponse.key
} catch {
    Write-Host "[ERROR] Failed to create API key: $_" -ForegroundColor Red
}

Write-Host ""

# 4. Get API Keys
Write-Host "4. Get API Keys List..." -ForegroundColor Yellow
try {
    $apiKeysResponse = Invoke-RestMethod -Uri "$authServiceUrl/companies/$companyId/api-keys" -Method GET -Headers @{Authorization = "Bearer $accessToken"}
    Write-Host "[OK] API keys retrieved" -ForegroundColor Green
    Write-Host "Count: $($apiKeysResponse.length)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Failed to get API keys: $_" -ForegroundColor Red
}

Write-Host ""

# 5. Create Employee
Write-Host "5. Create Employee..." -ForegroundColor Yellow
$userBody = @{
    email = "employee-$(Get-Date -Format 'HHmmss')@example.com"
    password = "EmployeePass123!"
    firstName = "John"
    lastName = "Doe"
    position = "Developer"
    department = "Engineering"
} | ConvertTo-Json

try {
    $userResponse = Invoke-RestMethod -Uri "$authServiceUrl/companies/$companyId/users" -Method POST -Body $userBody -ContentType "application/json" -Headers @{Authorization = "Bearer $accessToken"}
    Write-Host "[OK] Employee created successfully" -ForegroundColor Green
    Write-Host "User ID: $($userResponse.id)" -ForegroundColor Gray
    Write-Host "Email: $($userResponse.email)" -ForegroundColor Gray
    
    $userId = $userResponse.id
} catch {
    Write-Host "[ERROR] Failed to create employee: $_" -ForegroundColor Red
}

Write-Host ""

# 6. Get Employees List
Write-Host "6. Get Employees List..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "$authServiceUrl/companies/$companyId/users" -Method GET -Headers @{Authorization = "Bearer $accessToken"}
    Write-Host "[OK] Employees list retrieved" -ForegroundColor Green
    Write-Host "Count: $($usersResponse.length)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Failed to get employees: $_" -ForegroundColor Red
}

Write-Host ""

# 7. AI Request (Expected to fail due to region restrictions)
Write-Host "7. AI Request..." -ForegroundColor Yellow
$chatBody = @{
    model = "gpt-4o-mini"
    messages = @(
        @{
            role = "user"
            content = "Hello from company!"
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $chatResponse = Invoke-RestMethod -Uri "$baseUrl/v1/chat/completions?provider=openai" -Method POST -Body $chatBody -ContentType "application/json" -Headers @{Authorization = "Bearer $accessToken"}
    Write-Host "[OK] AI request successful" -ForegroundColor Green
    Write-Host "Response: $($chatResponse.choices[0].message.content.Substring(0, [Math]::Min(100, $chatResponse.choices[0].message.content.Length)))..." -ForegroundColor Gray
    Write-Host "Tokens: $($chatResponse.usage.total_tokens)" -ForegroundColor Gray
} catch {
    Write-Host "[EXPECTED] AI service unavailable (region restriction): $_" -ForegroundColor Yellow
}

Write-Host ""

# 8. Check Company Balance
Write-Host "8. Check Company Balance..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "$billingServiceUrl/billing/company/$companyId/balance" -Method GET
    Write-Host "[OK] Balance retrieved" -ForegroundColor Green
    Write-Host "Balance: $($balanceResponse.balance.balance) $($balanceResponse.balance.currency)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Failed to get balance: $_" -ForegroundColor Red
}

Write-Host ""

# 9. Get Transactions
Write-Host "9. Get Transactions..." -ForegroundColor Yellow
try {
    $transactionsResponse = Invoke-RestMethod -Uri "$billingServiceUrl/billing/company/$companyId/transactions?limit=10" -Method GET
    Write-Host "[OK] Transactions retrieved" -ForegroundColor Green
    Write-Host "Count: $($transactionsResponse.transactions.length)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Failed to get transactions: $_" -ForegroundColor Red
}

Write-Host ""

# 10. Get User Statistics
Write-Host "10. Get User Statistics..." -ForegroundColor Yellow
try {
    $statisticsResponse = Invoke-RestMethod -Uri "$billingServiceUrl/billing/company/$companyId/users/statistics" -Method GET
    Write-Host "[OK] Statistics retrieved" -ForegroundColor Green
    Write-Host "Total Users: $($statisticsResponse.statistics.totals.totalUsers)" -ForegroundColor Gray
    Write-Host "Total Requests: $($statisticsResponse.statistics.totals.totalRequests)" -ForegroundColor Gray
    Write-Host "Total Cost: $($statisticsResponse.statistics.totals.totalCost)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Failed to get statistics: $_" -ForegroundColor Red
}

Write-Host ""

# 11. Get Billing Report
Write-Host "11. Get Billing Report..." -ForegroundColor Yellow
try {
    $reportResponse = Invoke-RestMethod -Uri "$billingServiceUrl/billing/company/$companyId/report" -Method GET
    Write-Host "[OK] Report retrieved" -ForegroundColor Green
    Write-Host "Period: $($reportResponse.report.period.start) - $($reportResponse.report.period.end)" -ForegroundColor Gray
    Write-Host "Total Usage: $($reportResponse.report.totalUsage)" -ForegroundColor Gray
    Write-Host "Total Cost: $($reportResponse.report.totalCost)" -ForegroundColor Gray
} catch {
    Write-Host "[ERROR] Failed to get report: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Test Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Summary:" -ForegroundColor White
Write-Host "Company ID: $companyId" -ForegroundColor Gray
Write-Host "Company Email: $companyEmail" -ForegroundColor Gray
Write-Host "Access Token: $($accessToken.Substring(0, 30))..." -ForegroundColor Gray
if ($userId) {
    Write-Host "Employee User ID: $userId" -ForegroundColor Gray
}

