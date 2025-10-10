#!/usr/bin/env pwsh

Write-Host "=== JWT TOKEN DEBUG TEST ===" -ForegroundColor Green

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "jwt-debug-$timestamp@example.com"

# Register company
$companyData = @{
    name = "JWT-Debug-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for JWT debug testing"
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
    $jwtToken = $loginResponse.accessToken
    
    Write-Host "Login successful" -ForegroundColor Green
    Write-Host "JWT Token length: $($jwtToken.Length)" -ForegroundColor Cyan
    Write-Host "JWT Token first 50 chars: $($jwtToken.Substring(0, [Math]::Min(50, $jwtToken.Length)))" -ForegroundColor Cyan
    Write-Host "JWT Token last 50 chars: $($jwtToken.Substring([Math]::Max(0, $jwtToken.Length - 50)))" -ForegroundColor Cyan
    
    # Test header formation
    $testHeader = "Bearer $jwtToken"
    Write-Host "Test header: $($testHeader.Substring(0, [Math]::Min(50, $testHeader.Length)))..." -ForegroundColor Yellow
    
    # Test split
    $parts = $testHeader.Split(' ')
    Write-Host "Split parts count: $($parts.Length)" -ForegroundColor Yellow
    Write-Host "Part 0: '$($parts[0])'" -ForegroundColor Yellow
    Write-Host "Part 1: '$($parts[1])'" -ForegroundColor Yellow
    
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`nJWT TOKEN DEBUG TEST COMPLETED" -ForegroundColor Green
