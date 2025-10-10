#!/usr/bin/env pwsh

Write-Host "=== JWT DEBUG DETAILED TEST ===" -ForegroundColor Green

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "jwt-debug-detailed-$timestamp@example.com"

# Register company
$companyData = @{
    name = "JWT-Debug-Detailed-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for detailed JWT debug testing"
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
    Write-Host "JWT Token: $($jwtToken.Substring(0, 50))..." -ForegroundColor Cyan
    
    # Decode JWT token to see payload
    $tokenParts = $jwtToken.Split('.')
    if ($tokenParts.Length -eq 3) {
        $payload = $tokenParts[1]
        # Add padding if needed
        while ($payload.Length % 4) {
            $payload += "="
        }
        try {
            $decodedPayload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($payload))
            Write-Host "JWT Payload: $decodedPayload" -ForegroundColor Yellow
        } catch {
            Write-Host "Could not decode JWT payload" -ForegroundColor Red
        }
    }
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test with different header formats
$headers1 = @{
    "Authorization" = "Bearer $jwtToken"
    "Content-Type" = "application/json"
}

$headers2 = @{
    "Authorization" = $jwtToken
    "Content-Type" = "application/json"
}

$headers3 = @{
    "X-API-Key" = $jwtToken
    "Content-Type" = "application/json"
}

Write-Host "`nTesting different header formats..." -ForegroundColor Magenta

# Test 1: Bearer token
Write-Host "`nTest 1: Bearer token" -ForegroundColor Yellow
try {
    $testResponse1 = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method GET -Headers $headers1
    Write-Host "SUCCESS: Bearer token works!" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Bearer token - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 2: Direct token
Write-Host "`nTest 2: Direct token" -ForegroundColor Yellow
try {
    $testResponse2 = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method GET -Headers $headers2
    Write-Host "SUCCESS: Direct token works!" -ForegroundColor Green
} catch {
    Write-Host "FAILED: Direct token - $($_.Exception.Message)" -ForegroundColor Red
}

# Test 3: X-API-Key header
Write-Host "`nTest 3: X-API-Key header" -ForegroundColor Yellow
try {
    $testResponse3 = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method GET -Headers $headers3
    Write-Host "SUCCESS: X-API-Key works!" -ForegroundColor Green
} catch {
    Write-Host "FAILED: X-API-Key - $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nJWT DEBUG DETAILED TEST COMPLETED" -ForegroundColor Green
