#!/usr/bin/env pwsh

Write-Host "=== JWT DEBUG TEST ===" -ForegroundColor Green

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
    $jwtToken = $loginResponse.access_token
    
    Write-Host "Login successful" -ForegroundColor Green
    Write-Host "JWT Token: $($jwtToken.Substring(0, 50))..." -ForegroundColor Cyan
    
    # Decode JWT token (basic decode without verification)
    $tokenParts = $jwtToken.Split('.')
    if ($tokenParts.Length -eq 3) {
        $payload = $tokenParts[1]
        # Add padding if needed
        while ($payload.Length % 4) {
            $payload += "="
        }
        $decodedPayload = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($payload))
        Write-Host "JWT Payload: $decodedPayload" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test API key creation with detailed error
$apiKeyData = @{
    name = "Test API Key"
    description = "API key for testing"
    permissions = @("read", "write")
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $jwtToken"
    "Content-Type" = "application/json"
}

Write-Host "`nTesting API key creation..." -ForegroundColor Magenta
Write-Host "Headers:" -ForegroundColor Cyan
Write-Host "  Authorization: Bearer $($jwtToken.Substring(0, 20))..." -ForegroundColor White
Write-Host "  Content-Type: application/json" -ForegroundColor White

try {
    $apiKeyResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method POST -Body $apiKeyData -Headers $headers
    Write-Host "SUCCESS: API key created!" -ForegroundColor Green
    Write-Host "API Key: $($apiKeyResponse.key.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: API key creation failed" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error Message: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to get more details from response
    if ($_.Exception.Response) {
        $stream = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($stream)
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response Body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`nJWT DEBUG TEST COMPLETED" -ForegroundColor Green
