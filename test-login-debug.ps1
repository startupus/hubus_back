#!/usr/bin/env pwsh

Write-Host "=== LOGIN DEBUG TEST ===" -ForegroundColor Green

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "login-debug-$timestamp@example.com"

Write-Host "Using email: $companyEmail" -ForegroundColor Cyan

# STEP 1: Register company
Write-Host "`nSTEP 1: Register company" -ForegroundColor Magenta

$companyData = @{
    name = "Login-Debug-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for login debug testing"
} | ConvertTo-Json

try {
    $companyResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $companyData -ContentType "application/json"
    $companyId = $companyResponse.company.id
    
    Write-Host "SUCCESS: Company registered" -ForegroundColor Green
    Write-Host "  ID: $companyId" -ForegroundColor Cyan
    Write-Host "  Email: $($companyResponse.company.email)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Error registering company: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# STEP 2: Try login with correct password
Write-Host "`nSTEP 2: Try login with correct password" -ForegroundColor Magenta

$loginData = @{
    email = $companyEmail
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $jwtToken = $loginResponse.access_token
    
    Write-Host "SUCCESS: Login successful" -ForegroundColor Green
    Write-Host "  JWT Token: $($jwtToken.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: Login failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "  Response: $($_.Exception.Response)" -ForegroundColor Red
}

# STEP 3: Try login with wrong password
Write-Host "`nSTEP 3: Try login with wrong password" -ForegroundColor Magenta

$wrongLoginData = @{
    email = $companyEmail
    password = "wrongpassword"
} | ConvertTo-Json

try {
    $wrongLoginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $wrongLoginData -ContentType "application/json"
    Write-Host "ERROR: Login should have failed but succeeded" -ForegroundColor Red
} catch {
    Write-Host "SUCCESS: Login correctly failed with wrong password" -ForegroundColor Green
    Write-Host "  Error: $($_.Exception.Message)" -ForegroundColor Cyan
}

Write-Host "`nLOGIN DEBUG TEST COMPLETED" -ForegroundColor Green
