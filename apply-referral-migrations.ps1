# Apply referral system migrations
Write-Host "Applying referral system migrations..." -ForegroundColor Green

# Apply auth-service migration
Write-Host "Applying auth-service migration..." -ForegroundColor Yellow
$authResult = docker exec auth-db psql -U postgres -d auth -f /migrations/003_add_referral_system_auth.sql
if ($LASTEXITCODE -eq 0) {
    Write-Host "Auth-service migration applied successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to apply auth-service migration" -ForegroundColor Red
    Write-Host $authResult
}

# Apply billing-service migration
Write-Host "Applying billing-service migration..." -ForegroundColor Yellow
$billingResult = docker exec billing-db psql -U postgres -d billing_db -f /migrations/004_add_referral_system_billing.sql
if ($LASTEXITCODE -eq 0) {
    Write-Host "Billing-service migration applied successfully" -ForegroundColor Green
} else {
    Write-Host "Failed to apply billing-service migration" -ForegroundColor Red
    Write-Host $billingResult
}

Write-Host "Referral system migrations completed!" -ForegroundColor Green
