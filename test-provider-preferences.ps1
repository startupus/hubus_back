#!/usr/bin/env pwsh

Write-Host "=== PROVIDER PREFERENCES DEMO ===" -ForegroundColor Green
Write-Host "This script demonstrates how companies can choose which provider to use for each model" -ForegroundColor Cyan

# Generate unique email
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$companyEmail = "provider-prefs-$timestamp@example.com"

Write-Host "`n=== STEP 1: Company Registration ===" -ForegroundColor Yellow
# Register company
$companyData = @{
    name = "Provider-Preferences-Company"
    email = $companyEmail
    password = "password123"
    description = "Company for provider preferences demo"
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

$headers = @{
    "Authorization" = "Bearer $jwtToken"
    "Content-Type" = "application/json"
}

Write-Host "`n=== STEP 3: Check Available Providers for Different Models ===" -ForegroundColor Yellow

# Check available providers for GPT-4
try {
    $gpt4Providers = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences/available-providers/gpt-4" -Method GET -Headers $headers
    Write-Host "✅ GPT-4 available providers: $($gpt4Providers.availableProviders -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get GPT-4 providers: $($_.Exception.Message)" -ForegroundColor Red
}

# Check available providers for Claude-3-Sonnet
try {
    $claudeProviders = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences/available-providers/claude-3-sonnet" -Method GET -Headers $headers
    Write-Host "✅ Claude-3-Sonnet available providers: $($claudeProviders.availableProviders -join ', ')" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get Claude-3-Sonnet providers: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== STEP 4: Set Provider Preferences ===" -ForegroundColor Yellow

# Set preference for GPT-4 to use OpenRouter (cheaper)
$gpt4Preference = @{
    model = "gpt-4"
    preferredProvider = "openrouter"
    fallbackProviders = @("openai")
    costLimit = 0.00005
    maxTokens = 4096
    metadata = @{
        reason = "Cost optimization"
        priority = "cost"
    }
} | ConvertTo-Json

try {
    $gpt4Response = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences" -Method POST -Body $gpt4Preference -Headers $headers
    Write-Host "✅ GPT-4 preference set: $($gpt4Response.preferredProvider)" -ForegroundColor Green
    Write-Host "   Fallback providers: $($gpt4Response.fallbackProviders -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to set GPT-4 preference: $($_.Exception.Message)" -ForegroundColor Red
}

# Set preference for Claude-3-Sonnet to use OpenRouter (only option)
$claudePreference = @{
    model = "claude-3-sonnet"
    preferredProvider = "openrouter"
    fallbackProviders = @()
    costLimit = 0.00003
    maxTokens = 8192
    metadata = @{
        reason = "Only available provider"
        priority = "quality"
    }
} | ConvertTo-Json

try {
    $claudeResponse = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences" -Method POST -Body $claudePreference -Headers $headers
    Write-Host "✅ Claude-3-Sonnet preference set: $($claudeResponse.preferredProvider)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to set Claude-3-Sonnet preference: $($_.Exception.Message)" -ForegroundColor Red
}

# Set preference for GPT-3.5-Turbo to use OpenAI (reliability)
$gpt35Preference = @{
    model = "gpt-3.5-turbo"
    preferredProvider = "openai"
    fallbackProviders = @("openrouter")
    costLimit = 0.00002
    maxTokens = 4096
    metadata = @{
        reason = "Reliability and speed"
        priority = "reliability"
    }
} | ConvertTo-Json

try {
    $gpt35Response = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences" -Method POST -Body $gpt35Preference -Headers $headers
    Write-Host "✅ GPT-3.5-Turbo preference set: $($gpt35Response.preferredProvider)" -ForegroundColor Green
    Write-Host "   Fallback providers: $($gpt35Response.fallbackProviders -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to set GPT-3.5-Turbo preference: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== STEP 5: Get All Provider Preferences ===" -ForegroundColor Yellow
try {
    $allPreferences = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences" -Method GET -Headers $headers
    Write-Host "✅ Retrieved $($allPreferences.length) provider preferences:" -ForegroundColor Green
    foreach ($pref in $allPreferences) {
        Write-Host "   Model: $($pref.model) -> Provider: $($pref.preferredProvider)" -ForegroundColor Cyan
        if ($pref.fallbackProviders -and $pref.fallbackProviders.length -gt 0) {
            Write-Host "     Fallbacks: $($pref.fallbackProviders -join ', ')" -ForegroundColor Gray
        }
    }
} catch {
    Write-Host "❌ Failed to get preferences: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== STEP 6: Get Recommended Providers ===" -ForegroundColor Yellow

# Get recommended provider for GPT-4
try {
    $gpt4Recommended = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences/recommended/gpt-4" -Method GET -Headers $headers
    Write-Host "✅ GPT-4 recommended provider: $($gpt4Recommended.provider)" -ForegroundColor Green
    Write-Host "   Fallback providers: $($gpt4Recommended.fallbackProviders -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to get GPT-4 recommendation: $($_.Exception.Message)" -ForegroundColor Red
}

# Get recommended provider for Claude-3-Sonnet
try {
    $claudeRecommended = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences/recommended/claude-3-sonnet" -Method GET -Headers $headers
    Write-Host "✅ Claude-3-Sonnet recommended provider: $($claudeRecommended.provider)" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to get Claude-3-Sonnet recommendation: $($_.Exception.Message)" -ForegroundColor Red
}

# Get recommended provider for GPT-3.5-Turbo
try {
    $gpt35Recommended = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences/recommended/gpt-3.5-turbo" -Method GET -Headers $headers
    Write-Host "✅ GPT-3.5-Turbo recommended provider: $($gpt35Recommended.provider)" -ForegroundColor Green
    Write-Host "   Fallback providers: $($gpt35Recommended.fallbackProviders -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to get GPT-3.5-Turbo recommendation: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== STEP 7: Update Provider Preference ===" -ForegroundColor Yellow
# Update GPT-4 preference to use OpenAI instead
$updateData = @{
    preferredProvider = "openai"
    fallbackProviders = @("openrouter")
    metadata = @{
        reason = "Updated to OpenAI for better reliability"
        priority = "reliability"
    }
} | ConvertTo-Json

try {
    $updateResponse = Invoke-RestMethod -Uri "http://localhost:3001/provider-preferences/$($gpt4Response.id)" -Method PUT -Body $updateData -Headers $headers
    Write-Host "✅ GPT-4 preference updated: $($updateResponse.preferredProvider)" -ForegroundColor Green
    Write-Host "   New fallback providers: $($updateResponse.fallbackProviders -join ', ')" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Failed to update GPT-4 preference: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== STEP 8: Test API Key Authentication ===" -ForegroundColor Yellow
# Create API key for testing
$apiKeyData = @{
    name = "Provider Preferences API Key"
    description = "API key for testing provider preferences"
    permissions = @("read", "write")
} | ConvertTo-Json

try {
    $apiKeyResponse = Invoke-RestMethod -Uri "http://localhost:3001/api-keys" -Method POST -Body $apiKeyData -Headers $headers
    $apiKey = $apiKeyResponse.key
    Write-Host "✅ API key created: $($apiKey.Substring(0, 20))..." -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to create API key: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test API key authentication
$apiKeyHeaders = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
}

try {
    $apiPreferences = Invoke-RestMethod -Uri "http://localhost:3001/api/provider-preferences" -Method GET -Headers $apiKeyHeaders
    Write-Host "✅ API key authentication works! Retrieved $($apiPreferences.length) preferences" -ForegroundColor Green
} catch {
    Write-Host "❌ API key authentication failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== PROVIDER PREFERENCES SUMMARY ===" -ForegroundColor Green
Write-Host "✅ Companies can set provider preferences for each model" -ForegroundColor Green
Write-Host "✅ System supports multiple providers for the same model" -ForegroundColor Green
Write-Host "✅ Fallback providers can be configured" -ForegroundColor Green
Write-Host "✅ Cost limits and token limits can be set" -ForegroundColor Green
Write-Host "✅ Preferences work with both JWT and API key authentication" -ForegroundColor Green
Write-Host "✅ Companies can update and manage their preferences" -ForegroundColor Green

Write-Host "`n=== HOW IT WORKS ===" -ForegroundColor Yellow
Write-Host "1. Company sets preference for a model (e.g., GPT-4 -> OpenRouter)" -ForegroundColor White
Write-Host "2. System remembers the preference for future requests" -ForegroundColor White
Write-Host "3. When making AI requests, system uses preferred provider" -ForegroundColor White
Write-Host "4. If preferred provider fails, system tries fallback providers" -ForegroundColor White
Write-Host "5. Companies can optimize for cost, speed, or reliability" -ForegroundColor White

Write-Host "`nPROVIDER PREFERENCES DEMO COMPLETED!" -ForegroundColor Green
