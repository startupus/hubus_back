# Create subscription test data
Write-Host "Creating subscription test data..."

# Test 1: Create a pricing plan
Write-Host "1. Creating a pricing plan..."
$createPlan = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "INSERT INTO pricing_plans (id, name, description, price, currency, features, is_active, created_at, updated_at) VALUES ('test-plan-1', 'Test Plan', 'Test subscription plan', 29.99, 'USD', '{}', true, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;"
Write-Host "Create plan result: $createPlan"

# Test 2: Create a subscription
Write-Host "2. Creating a subscription..."
$createSubscription = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "INSERT INTO subscriptions (id, company_id, plan_id, status, current_period_start, current_period_end, price, currency, input_tokens_used, output_tokens_used, input_tokens_limit, output_tokens_limit, created_at, updated_at) VALUES ('test-sub-1', 'fb20fa7b-8f0f-448d-ba17-bd82cadcd04a', 'test-plan-1', 'ACTIVE', NOW(), NOW() + INTERVAL '1 month', 29.99, 'USD', 0, 0, 10000, 5000, NOW(), NOW()) ON CONFLICT (id) DO NOTHING;"
Write-Host "Create subscription result: $createSubscription"

# Test 3: Check created data
Write-Host "3. Checking created data..."
$pricingPlans = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT * FROM pricing_plans;"
Write-Host "Pricing plans: $pricingPlans"

$subscriptions = docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT * FROM subscriptions;"
Write-Host "Subscriptions: $subscriptions"

Write-Host "Subscription test data created."
