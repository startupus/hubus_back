# Simple test for referral system
Write-Host "Simple test for referral system..."

# Test 1: Check if referral system is working by checking the database
Write-Host "1. Checking referral system in database..."

# Check if referral transactions exist
$referralTransactions = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT COUNT(*) FROM referral_transactions;"
Write-Host "Referral transactions count: $referralTransactions"

# Check if referral companies exist
$referralCompanies = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT id, name, referred_by FROM companies WHERE referred_by IS NOT NULL;"
Write-Host "Referral companies: $referralCompanies"

# Test 2: Check if we can create a referral transaction manually
Write-Host "2. Manually creating a referral transaction..."

# Create a referral transaction manually
$createReferralTransaction = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "INSERT INTO referral_transactions (id, referral_owner_id, referral_earner_id, original_transaction_id, amount, currency, input_tokens, output_tokens, input_token_rate, output_token_rate, status, description, metadata, created_at, updated_at) VALUES ('test-ref-123', '284ddd76-39bc-472d-b07c-e52d73651d23', '648d62be-32b7-44be-b5c3-1ceec6fbd80d', 'test-tx-123', 0.05, 'USD', 100, 50, 0.00003, 0.00006, 'PENDING', 'Test referral transaction', '{}', NOW(), NOW());"
Write-Host "Create referral transaction result: $createReferralTransaction"

# Check if referral transaction was created
$referralTransactions = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT COUNT(*) FROM referral_transactions;"
Write-Host "Referral transactions count after creation: $referralTransactions"

# Check the created referral transaction
$referralTransaction = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT * FROM referral_transactions WHERE id = 'test-ref-123';"
Write-Host "Created referral transaction: $referralTransaction"

Write-Host "Simple referral system test completed."