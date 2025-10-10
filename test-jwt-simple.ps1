#!/usr/bin/env pwsh

Write-Host "=== JWT SIMPLE TEST ===" -ForegroundColor Green

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "jwt-simple-$timestamp@example.com"

# Register company
$companyData = @{
    name = "JWT-Simple-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for JWT simple testing"
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
    Write-Host "JWT Token: $($jwtToken.Substring(0, 30))..." -ForegroundColor Cyan
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test JWT guard with a simple endpoint
$headers = @{
    "Authorization" = "Bearer $jwtToken"
    "Content-Type" = "application/json"
}

Write-Host "`nTesting JWT guard with API keys endpoint..." -ForegroundColor Magenta

try {
    $testResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method GET -Headers $headers
    Write-Host "SUCCESS: JWT guard works!" -ForegroundColor Green
    Write-Host "Retrieved $($testResponse.length) API keys" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: JWT guard failed" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Message: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nJWT SIMPLE TEST COMPLETED" -ForegroundColor Green
