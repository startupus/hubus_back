# Test subscription system directly
Write-Host "Testing subscription system directly..."

# Get fresh token
$body = '{"email":"referral@example.com","password":"password123"}'
$response = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -ContentType "application/json" -Body $body
$token = $response.accessToken
Write-Host "Token obtained: $($token.Substring(0,20))..."

$headers = @{"Authorization" = "Bearer $token"}

# Test 1: Check if pricing plans exist in database
Write-Host "1. Checking pricing plans in database..."
$pricingPlans = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT COUNT(*) FROM pricing_plans;"
Write-Host "Pricing plans count: $pricingPlans"

# Test 2: Check if subscriptions exist in database
Write-Host "2. Checking subscriptions in database..."
$subscriptions = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT COUNT(*) FROM subscriptions;"
Write-Host "Subscriptions count: $subscriptions"

# Test 3: Check if we can create a subscription plan
Write-Host "3. Creating a test subscription plan..."
$createPlan = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "INSERT INTO pricing_plans (id, name, description, price, currency, billing_cycle, features, is_active, created_at, updated_at) VALUES ('test-plan-1', 'Test Plan', 'Test subscription plan', 29.99, 'USD', 'monthly', '{}', true, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;"
Write-Host "Create plan result: $createPlan"

# Test 4: Check if we can create a subscription
Write-Host "4. Creating a test subscription..."
$createSubscription = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "INSERT INTO subscriptions (id, company_id, plan_id, status, start_date, end_date, tokens_included, tokens_used, created_at, updated_at) VALUES ('test-sub-1', 'fb20fa7b-8f0f-448d-ba17-bd82cadcd04a', 'test-plan-1', 'ACTIVE', NOW(), NOW() + INTERVAL '1 month', 10000, 0, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;"
Write-Host "Create subscription result: $createSubscription"

# Test 5: Check current subscription
Write-Host "5. Checking current subscription..."
$currentSubscription = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT * FROM subscriptions WHERE company_id = 'fb20fa7b-8f0f-448d-ba17-bd82cadcd04a';"
Write-Host "Current subscription: $currentSubscription"

Write-Host "Subscription system test completed."
