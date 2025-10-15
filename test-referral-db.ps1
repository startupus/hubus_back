# Test referral system through database
Write-Host "Testing referral system through database..."

# Test 1: Check referral companies
Write-Host "1. Checking referral companies..."
$referralCompanies = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT id, name, referred_by FROM companies WHERE referred_by IS NOT NULL;"
Write-Host "Referral companies: $referralCompanies"

# Test 2: Check referral owner
Write-Host "2. Checking referral owner..."
$referralOwner = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT id, name FROM companies WHERE id = '284ddd76-39bc-472d-b07c-e52d73651d23';"
Write-Host "Referral owner: $referralOwner"

# Test 3: Check current balances
Write-Host "3. Checking current balances..."
$referralBalance1 = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT balance FROM company_balances WHERE company_id = '648d62be-32b7-44be-b5c3-1ceec6fbd80d';"
$referralBalance2 = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT balance FROM company_balances WHERE company_id = 'fb20fa7b-8f0f-448d-ba17-bd82cadcd04a';"
$ownerBalance = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT balance FROM company_balances WHERE company_id = '284ddd76-39bc-472d-b07c-e52d73651d23';"
Write-Host "Referral balance 1: $referralBalance1"
Write-Host "Referral balance 2: $referralBalance2"
Write-Host "Owner balance: $ownerBalance"

# Test 4: Check if referral transactions exist
Write-Host "4. Checking referral transactions..."
$referralTransactions = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT COUNT(*) FROM referral_transactions;"
Write-Host "Referral transactions count: $referralTransactions"

# Test 5: Check recent transactions
Write-Host "5. Checking recent transactions..."
$recentTransactions = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT company_id, amount, description FROM transactions ORDER BY created_at DESC LIMIT 5;"
Write-Host "Recent transactions: $recentTransactions"

Write-Host "Referral system test completed."
