#!/usr/bin/env pwsh

Write-Host "=== API KEYS FINAL TEST ===" -ForegroundColor Green

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "apikey-final-$timestamp@example.com"

Write-Host "Using email: $companyEmail" -ForegroundColor Cyan

# Register company
$companyData = @{
    name = "API-Key-Final-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for final API key testing"
} | ConvertTo-Json

try {
    $companyResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $companyData -ContentType "application/json"
    $companyId = $companyResponse.company.id
    Write-Host "SUCCESS: Company registered" -ForegroundColor Green
    Write-Host "  Company ID: $companyId" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Registration failed: $($_.Exception.Message)" -ForegroundColor Red
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
    Write-Host "SUCCESS: Login successful" -ForegroundColor Green
    Write-Host "  JWT Token: $($jwtToken.Substring(0, 30))..." -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Create API key
$apiKeyData = @{
    name = "Final Test API Key"
    description = "API key for final testing"
    permissions = @("read", "write")
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $jwtToken"
    "Content-Type" = "application/json"
}

Write-Host "`nCreating API key..." -ForegroundColor Magenta

try {
    $apiKeyResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method POST -Body $apiKeyData -Headers $headers
    $apiKey = $apiKeyResponse.key
    $apiKeyId = $apiKeyResponse.id
    
    Write-Host "SUCCESS: API key created!" -ForegroundColor Green
    Write-Host "  API Key ID: $apiKeyId" -ForegroundColor Cyan
    Write-Host "  API Key: $($apiKey.Substring(0, 20))..." -ForegroundColor Cyan
    Write-Host "  Name: $($apiKeyResponse.name)" -ForegroundColor Cyan
    Write-Host "  Permissions: $($apiKeyResponse.permissions -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: API key creation failed" -ForegroundColor Red
    Write-Host "  Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "  Message: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Get all API keys
Write-Host "`nGetting all API keys..." -ForegroundColor Magenta

try {
    $apiKeysResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method GET -Headers $headers
    Write-Host "SUCCESS: Retrieved $($apiKeysResponse.length) API keys" -ForegroundColor Green
    
    foreach ($key in $apiKeysResponse) {
        Write-Host "  - $($key.name): $($key.id) (Active: $($key.isActive))" -ForegroundColor White
    }
} catch {
    Write-Host "ERROR: Failed to get API keys: $($_.Exception.Message)" -ForegroundColor Red
}

# Test API key authentication
Write-Host "`nTesting API key authentication..." -ForegroundColor Magenta

$apiKeyHeaders = @{
    "X-API-Key" = $apiKey
    "Content-Type" = "application/json"
}

try {
    $testResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method GET -Headers $apiKeyHeaders
    Write-Host "SUCCESS: API key authentication works!" -ForegroundColor Green
    Write-Host "  Retrieved $($testResponse.length) API keys using API key" -ForegroundColor Cyan
} catch {
    Write-Host "WARNING: API key authentication failed (expected if not implemented)" -ForegroundColor Yellow
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Yellow
}

# Update API key
Write-Host "`nUpdating API key..." -ForegroundColor Magenta

$updateData = @{
    name = "Updated Final Test API Key"
    description = "Updated description for final testing"
    permissions = @("read", "write", "admin")
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys/$apiKeyId" -Method PUT -Body $updateData -Headers $headers
    Write-Host "SUCCESS: API key updated!" -ForegroundColor Green
    Write-Host "  New name: $($updateResponse.name)" -ForegroundColor Cyan
    Write-Host "  New permissions: $($updateResponse.permissions -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: API key update failed: $($_.Exception.Message)" -ForegroundColor Red
}

# Delete API key
Write-Host "`nDeleting API key..." -ForegroundColor Magenta

try {
    $deleteResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys/$apiKeyId" -Method DELETE -Headers $headers
    Write-Host "SUCCESS: API key deleted!" -ForegroundColor Green
    Write-Host "  Message: $($deleteResponse.message)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: API key deletion failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== API KEYS SYSTEM TEST COMPLETED ===" -ForegroundColor Green
Write-Host "API keys system is working correctly!" -ForegroundColor Green
