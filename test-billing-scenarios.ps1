# Testing billing scenarios
# 1. Employee makes request - money deducted from boss
# 2. Referral makes request - percentage returned to referral owner
# 3. Subscription - tokens deducted from subscription, then pay-as-you-go

Write-Host "=== Testing Billing Scenarios ===" -ForegroundColor Green

# 1. Create main company (boss)
Write-Host "`n1. Creating main company (boss)..." -ForegroundColor Yellow
$bossCompany = @{
    name = "Boss Company"
    email = "boss@company.com"
    password = "password123"
    firstName = "Boss"
    lastName = "Manager"
} | ConvertTo-Json

$bossResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/register" -Method POST -Body $bossCompany -ContentType "application/json"
$bossToken = $bossResponse.accessToken
$bossCompanyId = $bossResponse.user.id

Write-Host "Main company created: $($bossResponse.user.email) (ID: $bossCompanyId)" -ForegroundColor Green

# 2. Top up boss company balance
Write-Host "`n2. Topping up boss company balance..." -ForegroundColor Yellow
$topUpData = @{
    amount = 100
    currency = "USD"
} | ConvertTo-Json

$topUpResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/top-up" -Method POST -Body $topUpData -ContentType "application/json" -Headers @{Authorization="Bearer $bossToken"}
Write-Host "Balance topped up: $($topUpResponse.balance.balance) $($topUpResponse.balance.currency)" -ForegroundColor Green

# 3. Create employee (child company)
Write-Host "`n3. Creating employee (child company)..." -ForegroundColor Yellow
$employeeData = @{
    email = "employee@company.com"
    firstName = "Employee"
    lastName = "Worker"
    position = "Developer"
    department = "IT"
} | ConvertTo-Json

$employeeResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/employee" -Method POST -Body $employeeData -ContentType "application/json" -Headers @{Authorization="Bearer $bossToken"}
Write-Host "Employee created: $($employeeResponse.employee.email)" -ForegroundColor Green

# 4. Register employee as separate company
Write-Host "`n4. Registering employee as separate company..." -ForegroundColor Yellow
$employeeCompany = @{
    name = "Employee Company"
    email = "employee2@company.com"
    password = "password123"
    firstName = "Employee"
    lastName = "Worker"
} | ConvertTo-Json

$employeeCompanyResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/register" -Method POST -Body $employeeCompany -ContentType "application/json"
$employeeToken = $employeeCompanyResponse.accessToken
$employeeCompanyId = $employeeCompanyResponse.user.id

Write-Host "Employee company created: $($employeeCompanyResponse.user.email) (ID: $employeeCompanyId)" -ForegroundColor Green

# 5. Set parent-child relationship in database
Write-Host "`n5. Setting parent-child relationship..." -ForegroundColor Yellow
$updateEmployeeQuery = @"
UPDATE companies 
SET parent_company_id = '$bossCompanyId', 
    billing_mode = 'PARENT_PAID'
WHERE id = '$employeeCompanyId';
"@

docker exec project-billing-db-1 psql -U user -d billing -c $updateEmployeeQuery
Write-Host "Parent-child relationship set" -ForegroundColor Green

# 6. Create referral company
Write-Host "`n6. Creating referral company..." -ForegroundColor Yellow
$referralCompany = @{
    name = "Referral Company"
    email = "referral@company.com"
    password = "password123"
    firstName = "Referral"
    lastName = "User"
} | ConvertTo-Json

$referralResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/register" -Method POST -Body $referralCompany -ContentType "application/json"
$referralToken = $referralResponse.accessToken
$referralCompanyId = $referralResponse.user.id

Write-Host "Referral company created: $($referralResponse.user.email) (ID: $referralCompanyId)" -ForegroundColor Green

# 7. Set referral relationship
Write-Host "`n7. Setting referral relationship..." -ForegroundColor Yellow
$updateReferralQuery = @"
UPDATE companies 
SET referred_by = '$bossCompanyId'
WHERE id = '$referralCompanyId';
"@

docker exec project-billing-db-1 psql -U user -d billing -c $updateReferralQuery
Write-Host "Referral relationship set" -ForegroundColor Green

# 8. Top up referral company balance
Write-Host "`n8. Topping up referral company balance..." -ForegroundColor Yellow
$referralTopUpData = @{
    amount = 50
    currency = "USD"
} | ConvertTo-Json

$referralTopUpResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/top-up" -Method POST -Body $referralTopUpData -ContentType "application/json" -Headers @{Authorization="Bearer $referralToken"}
Write-Host "Referral company balance topped up: $($referralTopUpResponse.balance.balance) $($referralTopUpResponse.balance.currency)" -ForegroundColor Green

# 9. Check initial balances
Write-Host "`n9. Checking initial balances..." -ForegroundColor Yellow

$bossBalance = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers @{Authorization="Bearer $bossToken"}
Write-Host "Boss balance: $($bossBalance.balance.balance) $($bossBalance.balance.currency)" -ForegroundColor Cyan

$employeeBalance = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers @{Authorization="Bearer $employeeToken"}
Write-Host "Employee balance: $($employeeBalance.balance.balance) $($employeeBalance.balance.currency)" -ForegroundColor Cyan

$referralBalance = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers @{Authorization="Bearer $referralToken"}
Write-Host "Referral balance: $($referralBalance.balance.balance) $($referralBalance.balance.currency)" -ForegroundColor Cyan

Write-Host "`n=== Initial data ready ===" -ForegroundColor Green
Write-Host "Now you can test scenarios through the interface!" -ForegroundColor Green