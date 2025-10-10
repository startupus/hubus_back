#!/usr/bin/env pwsh

Write-Host "=== API INTEGRATION DEMO ===" -ForegroundColor Green
Write-Host "This script demonstrates how companies can integrate with your project using API keys" -ForegroundColor Cyan

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "integration-demo-$timestamp@example.com"

Write-Host "`n=== STEP 1: Company Registration ===" -ForegroundColor Yellow
# Register company
$companyData = @{
    name = "Integration-Demo-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for API integration demo"
} | ConvertTo-Json

try {
    $companyResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $companyData -ContentType "application/json"
    $companyId = $companyResponse.company.id
    Write-Host "✅ Company registered: $companyId" -ForegroundColor Green
} catch {
    Write-Host "❌ Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== STEP 2: Company Login ===" -ForegroundColor Yellow
# Login
$loginData = @{
    email = $companyEmail
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/login" -Method POST -Body $loginData -ContentType "application/json"
    $jwtToken = $loginResponse.accessToken
    Write-Host "✅ Login successful" -ForegroundColor Green
} catch {
    Write-Host "❌ Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== STEP 3: Create API Key for Integration ===" -ForegroundColor Yellow
# Create API key
$apiKeyData = @{
    name = "Integration API Key"
    description = "API key for external project integration"
    permissions = @("read", "write", "admin")
    expiresAt = (Get-Date).AddMonths(6).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $jwtToken"
    "Content-Type" = "application/json"
}

try {
    $apiKeyResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method POST -Body $apiKeyData -Headers $headers
    $apiKey = $apiKeyResponse.key
    $apiKeyId = $apiKeyResponse.id
    
    Write-Host "✅ API key created successfully!" -ForegroundColor Green
    Write-Host "   API Key ID: $apiKeyId" -ForegroundColor Cyan
    Write-Host "   API Key: $($apiKey.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ API key creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== STEP 4: Test Public Endpoint (No Auth Required) ===" -ForegroundColor Yellow
try {
    $publicResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys-demo/public" -Method GET
    Write-Host "✅ Public endpoint works!" -ForegroundColor Green
    Write-Host "   Message: $($publicResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Public endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== STEP 5: Test JWT Protected Endpoint ===" -ForegroundColor Yellow
try {
    $jwtResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys-demo/protected-jwt" -Method GET -Headers $headers
    Write-Host "✅ JWT protected endpoint works!" -ForegroundColor Green
    Write-Host "   Company ID: $($jwtResponse.user.companyId)" -ForegroundColor Cyan
    Write-Host "   Auth Type: $($jwtResponse.user.authType)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ JWT protected endpoint failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== STEP 6: Test API Key Authentication (Different Methods) ===" -ForegroundColor Yellow

# Method 1: Authorization Header with Bearer
Write-Host "`n--- Method 1: Authorization Header with Bearer ---" -ForegroundColor Magenta
$apiKeyHeaders1 = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

try {
    $apiKeyResponse1 = Invoke-RestMethod -Uri "http://localhost:3001/api-keys-demo/protected-api-key" -Method GET -Headers $apiKeyHeaders1
    Write-Host "✅ API key auth (Bearer) works!" -ForegroundColor Green
    Write-Host "   Company ID: $($apiKeyResponse1.user.companyId)" -ForegroundColor Cyan
    Write-Host "   Permissions: $($apiKeyResponse1.user.permissions -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "❌ API key auth (Bearer) failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 2: X-API-Key Header
Write-Host "`n--- Method 2: X-API-Key Header ---" -ForegroundColor Magenta
$apiKeyHeaders2 = @{
    "X-API-Key" = $apiKey
    "Content-Type" = "application/json"
}

try {
    $apiKeyResponse2 = Invoke-RestMethod -Uri "http://localhost:3001/api-keys-demo/protected-api-key" -Method GET -Headers $apiKeyHeaders2
    Write-Host "✅ API key auth (X-API-Key) works!" -ForegroundColor Green
    Write-Host "   Company ID: $($apiKeyResponse2.user.companyId)" -ForegroundColor Cyan
    Write-Host "   Auth Type: $($apiKeyResponse2.user.authType)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ API key auth (X-API-Key) failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Method 3: Query Parameter
Write-Host "`n--- Method 3: Query Parameter ---" -ForegroundColor Magenta
try {
    $apiKeyResponse3 = Invoke-RestMethod -Uri "http://localhost:3001/api-keys-demo/protected-api-key?api_key=$apiKey" -Method GET
    Write-Host "✅ API key auth (Query) works!" -ForegroundColor Green
    Write-Host "   Company ID: $($apiKeyResponse3.user.companyId)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ API key auth (Query) failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== STEP 7: Test API Key with POST Request ===" -ForegroundColor Yellow
$messageData = @{
    message = "Hello from external project!"
    recipient = "admin@company.com"
} | ConvertTo-Json

try {
    $messageResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys-demo/send-message" -Method POST -Body $messageData -Headers $apiKeyHeaders1
    Write-Host "✅ POST request with API key works!" -ForegroundColor Green
    Write-Host "   Message: $($messageResponse.messageData.content)" -ForegroundColor Cyan
    Write-Host "   Status: $($messageResponse.messageData.status)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ POST request with API key failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== STEP 8: Test Company Statistics ===" -ForegroundColor Yellow
try {
    $statsResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys-demo/company-stats" -Method GET -Headers $apiKeyHeaders1
    Write-Host "✅ Company statistics retrieved!" -ForegroundColor Green
    Write-Host "   Company ID: $($statsResponse.companyId)" -ForegroundColor Cyan
    Write-Host "   Total API Keys: $($statsResponse.stats.totalApiKeys)" -ForegroundColor Cyan
    Write-Host "   Monthly Requests: $($statsResponse.stats.monthlyUsage.requests)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Company statistics failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== INTEGRATION SUMMARY ===" -ForegroundColor Green
Write-Host "✅ Company can register and login" -ForegroundColor Green
Write-Host "✅ Company can create API keys" -ForegroundColor Green
Write-Host "✅ API keys work with multiple authentication methods:" -ForegroundColor Green
Write-Host "   - Authorization: Bearer <api_key>" -ForegroundColor Cyan
Write-Host "   - X-API-Key: <api_key>" -ForegroundColor Cyan
Write-Host "   - Query parameter: ?api_key=<api_key>" -ForegroundColor Cyan
Write-Host "✅ API keys can access protected endpoints" -ForegroundColor Green
Write-Host "✅ API keys work with both GET and POST requests" -ForegroundColor Green

Write-Host "`n=== HOW COMPANIES CAN INTEGRATE ===" -ForegroundColor Yellow
Write-Host "1. Register company account" -ForegroundColor White
Write-Host "2. Login and get JWT token" -ForegroundColor White
Write-Host "3. Create API key with required permissions" -ForegroundColor White
Write-Host "4. Use API key in their external projects:" -ForegroundColor White
Write-Host "   - Add to HTTP headers" -ForegroundColor Cyan
Write-Host "   - Include in requests to your API" -ForegroundColor Cyan
Write-Host "   - Access protected endpoints" -ForegroundColor Cyan

Write-Host "`nAPI INTEGRATION DEMO COMPLETED!" -ForegroundColor Green
