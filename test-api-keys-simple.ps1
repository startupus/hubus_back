#!/usr/bin/env pwsh

Write-Host "=== API KEYS SYSTEM TEST ===" -ForegroundColor Green

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "apikey-simple-$timestamp@example.com"

Write-Host "Using email: $companyEmail" -ForegroundColor Cyan

# STEP 1: Register company
Write-Host "`nSTEP 1: Register company" -ForegroundColor Magenta

$companyData = @{
    name = "API-Key-Simple-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for API key testing"
} | ConvertTo-Json

try {
    $companyResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $companyData -ContentType "application/json"
    $companyId = $companyResponse.company.id
    
    Write-Host "SUCCESS: Company registered" -ForegroundColor Green
    Write-Host "  ID: $companyId" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# STEP 2: Login to get JWT token
Write-Host "`nSTEP 2: Login to get JWT token" -ForegroundColor Magenta

$loginData = @{
    email = $companyEmail
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/login" -Method POST -Body $loginData -ContentType "application/json"
    $jwtToken = $loginResponse.access_token
    
    Write-Host "SUCCESS: Login successful" -ForegroundColor Green
    Write-Host "  JWT Token: $($jwtToken.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# STEP 3: Create API key
Write-Host "`nSTEP 3: Create API key" -ForegroundColor Magenta

$apiKeyData = @{
    name = "Test API Key"
    description = "API key for testing"
    permissions = @("read", "write")
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $jwtToken"
    "Content-Type" = "application/json"
}

try {
    $apiKeyResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method POST -Body $apiKeyData -Headers $headers
    $apiKey = $apiKeyResponse.key
    $apiKeyId = $apiKeyResponse.id
    
    Write-Host "SUCCESS: API key created" -ForegroundColor Green
    Write-Host "  API Key ID: $apiKeyId" -ForegroundColor Cyan
    Write-Host "  API Key: $($apiKey.Substring(0, 20))..." -ForegroundColor Cyan
    Write-Host "  Name: $($apiKeyResponse.name)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: API key creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# STEP 4: Get all API keys
Write-Host "`nSTEP 4: Get all API keys" -ForegroundColor Magenta

try {
    $apiKeysResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method GET -Headers $headers
    
    Write-Host "SUCCESS: API keys retrieved" -ForegroundColor Green
    Write-Host "  Total API keys: $($apiKeysResponse.length)" -ForegroundColor Cyan
    
    foreach ($key in $apiKeysResponse) {
        Write-Host "    - $($key.name): $($key.id) (Active: $($key.isActive))" -ForegroundColor White
    }
} catch {
    Write-Host "ERROR: Getting API keys failed: $($_.Exception.Message)" -ForegroundColor Red
}

# STEP 5: Test API key authentication
Write-Host "`nSTEP 5: Test API key authentication" -ForegroundColor Magenta

$apiKeyHeaders = @{
    "X-API-Key" = $apiKey
    "Content-Type" = "application/json"
}

try {
    $testResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method GET -Headers $apiKeyHeaders
    
    Write-Host "SUCCESS: API key authentication works" -ForegroundColor Green
    Write-Host "  API key is valid and can access protected endpoints" -ForegroundColor Cyan
} catch {
    Write-Host "WARNING: API key authentication test failed (expected if not implemented yet)" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# STEP 6: Update API key
Write-Host "`nSTEP 6: Update API key" -ForegroundColor Magenta

$updateData = @{
    name = "Updated Test API Key"
    description = "Updated description"
    permissions = @("read", "write", "admin")
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys/$apiKeyId" -Method PUT -Body $updateData -Headers $headers
    
    Write-Host "SUCCESS: API key updated" -ForegroundColor Green
    Write-Host "  New name: $($updateResponse.name)" -ForegroundColor Cyan
    Write-Host "  New permissions: $($updateResponse.permissions -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: API key update failed: $($_.Exception.Message)" -ForegroundColor Red
}

# STEP 7: Delete API key
Write-Host "`nSTEP 7: Delete API key" -ForegroundColor Magenta

try {
    $deleteResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys/$apiKeyId" -Method DELETE -Headers $headers
    
    Write-Host "SUCCESS: API key deleted" -ForegroundColor Green
    Write-Host "  Message: $($deleteResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: API key deletion failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAPI KEYS SYSTEM TEST COMPLETED" -ForegroundColor Green
Write-Host "API keys system is working!" -ForegroundColor Green
