# Direct database test

Write-Host "=== DIRECT DATABASE TEST ===" -ForegroundColor Cyan
Write-Host ""

# Test direct database connection
Write-Host "1. Testing direct database connection..." -ForegroundColor Yellow

try {
    # Get balance from billing service directly
    $response = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/9ef2c7b8-d80e-4877-af80-c100b6392bfb" -Method GET
    Write-Host "Direct billing service response:" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 5
} catch {
    Write-Host "Error: Direct billing service call failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== TEST COMPLETED ===" -ForegroundColor Cyan
