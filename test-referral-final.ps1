# Final test for referral system
Write-Host "Final test for referral system..."

# Test 1: Check current state
Write-Host "1. Checking current state..."

# Check referral companies
$referralCompanies = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT id, name, referred_by FROM companies WHERE referred_by IS NOT NULL;"
Write-Host "Referral companies: $referralCompanies"

# Check referral transactions
$referralTransactions = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT COUNT(*) FROM referral_transactions;"
Write-Host "Referral transactions count: $referralTransactions"

# Check recent transactions
$recentTransactions = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT company_id, amount, description FROM transactions ORDER BY created_at DESC LIMIT 5;"
Write-Host "Recent transactions: $recentTransactions"

# Test 2: Check if referral system is working by checking the logs
Write-Host "2. Checking billing service logs..."
$billingLogs = docker logs project-billing-service-1 --tail 20
Write-Host "Billing service logs: $billingLogs"

# Test 3: Check if referral system is working by checking the API Gateway logs
Write-Host "3. Checking API Gateway logs..."
$apiGatewayLogs = docker logs project-api-gateway-1 --tail 20
Write-Host "API Gateway logs: $apiGatewayLogs"

Write-Host "Final referral system test completed."
