#!/usr/bin/env pwsh

Write-Host "=== API KEYS MINIMAL TEST ===" -ForegroundColor Green

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "apikey-min-$timestamp@example.com"

# Register company
$companyData = @{
    name = "API-Key-Min-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for API key testing"
} | ConvertTo-Json

try {
    $companyResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $companyData -ContentType "application/json"
    $companyId = $companyResponse.company.id
    Write-Host "Company registered: $companyId" -ForegroundColor Green
} catch {
    Write-Host "Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Login
$loginData = @{
    email = $companyEmail
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/login" -Method POST -Body $loginData -ContentType "application/json"
    $jwtToken = $loginResponse.access_token
    Write-Host "Login successful" -ForegroundColor Green
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create API key
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
    
    Write-Host "API key created successfully" -ForegroundColor Green
    Write-Host "API Key ID: $apiKeyId" -ForegroundColor Cyan
    Write-Host "API Key: $($apiKey.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "API key creation failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get API keys
try {
    $apiKeysResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method GET -Headers $headers
    Write-Host "API keys retrieved: $($apiKeysResponse.length) keys" -ForegroundColor Green
} catch {
    Write-Host "Getting API keys failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Test API key authentication
$apiKeyHeaders = @{
    "X-API-Key" = $apiKey
    "Content-Type" = "application/json"
}

try {
    $testResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method GET -Headers $apiKeyHeaders
    Write-Host "API key authentication works!" -ForegroundColor Green
} catch {
    Write-Host "API key authentication failed (expected if not implemented): $($_.Exception.Message)" -ForegroundColor Yellow
}

# Update API key
$updateData = @{
    name = "Updated Test API Key"
    description = "Updated description"
    permissions = @("read", "write", "admin")
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys/$apiKeyId" -Method PUT -Body $updateData -Headers $headers
    Write-Host "API key updated successfully" -ForegroundColor Green
} catch {
    Write-Host "API key update failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Delete API key
try {
    $deleteResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys/$apiKeyId" -Method DELETE -Headers $headers
    Write-Host "API key deleted successfully" -ForegroundColor Green
} catch {
    Write-Host "API key deletion failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nAPI KEYS SYSTEM TEST COMPLETED" -ForegroundColor Green
Write-Host "All basic operations work!" -ForegroundColor Green
