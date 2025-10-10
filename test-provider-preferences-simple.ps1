#!/usr/bin/env pwsh

Write-Host "=== PROVIDER PREFERENCES SIMPLE TEST ===" -ForegroundColor Green

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "provider-prefs-$timestamp@example.com"

Write-Host "`n=== STEP 1: Company Registration ===" -ForegroundColor Yellow
$companyData = @{
    name = "Provider-Preferences-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for provider preferences demo"
} | ConvertTo-Json

try {
    $companyResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $companyData -ContentType "application/json"
    $companyId = $companyResponse.company.id
    Write-Host "SUCCESS: Company registered: $companyId" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== STEP 2: Company Login ===" -ForegroundColor Yellow
$loginData = @{
    email = $companyEmail
    password = "password123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/companies/login" -Method POST -Body $loginData -ContentType "application/json"
    $jwtToken = $loginResponse.accessToken
    Write-Host "SUCCESS: Login successful" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Login failed: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $jwtToken"
    "Content-Type" = "application/json"
}

Write-Host "`n=== STEP 3: Check Available Providers ===" -ForegroundColor Yellow
try {
    $gpt4Providers = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences/available-providers/gpt-4" -Method GET -Headers $headers
    Write-Host "SUCCESS: GPT-4 providers: $($gpt4Providers.availableProviders -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to get GPT-4 providers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== STEP 4: Set Provider Preference ===" -ForegroundColor Yellow
$gpt4Preference = @{
    model = "gpt-4"
    preferredProvider = "openrouter"
    fallbackProviders = @("openai")
    costLimit = 0.00005
    maxTokens = 4096
} | ConvertTo-Json

try {
    $gpt4Response = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences" -Method POST -Body $gpt4Preference -Headers $headers
    Write-Host "SUCCESS: GPT-4 preference set: $($gpt4Response.preferredProvider)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to set GPT-4 preference: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== STEP 5: Get All Preferences ===" -ForegroundColor Yellow
try {
    $allPreferences = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences" -Method GET -Headers $headers
    Write-Host "SUCCESS: Retrieved $($allPreferences.length) preferences" -ForegroundColor Green
    foreach ($pref in $allPreferences) {
        Write-Host "  Model: $($pref.model) -> Provider: $($pref.preferredProvider)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "ERROR: Failed to get preferences: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== STEP 6: Get Recommended Provider ===" -ForegroundColor Yellow
try {
    $recommended = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences/recommended/gpt-4" -Method GET -Headers $headers
    Write-Host "SUCCESS: GPT-4 recommended provider: $($recommended.provider)" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Failed to get recommendation: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`nPROVIDER PREFERENCES TEST COMPLETED!" -ForegroundColor Green
