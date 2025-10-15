# Создание компании в billing-service
Write-Host "=== CREATING COMPANY IN BILLING SERVICE ===" -ForegroundColor Cyan

$companyData = @{
    id = "d8de2f09-48f9-4a7e-8a2d-d4ccd3c7b706"
    name = "Test Company"
    email = "test2@example.com"
    isActive = $true
    billingMode = "SELF_PAID"
} | ConvertTo-Json

try {
    # Создаем компанию через Prisma
    $createCmd = "docker exec project-billing-service-1 npx prisma db execute --stdin"
    $sql = @"
INSERT INTO "Company" (id, name, email, "isActive", "createdAt", "updatedAt", "billingMode") 
VALUES ('d8de2f09-48f9-4a7e-8a2d-d4ccd3c7b706', 'Test Company', 'test2@example.com', true, NOW(), NOW(), 'SELF_PAID')
ON CONFLICT (id) DO NOTHING;
"@
    
    $sql | docker exec -i project-billing-service-1 npx prisma db execute --stdin
    Write-Host "Success: Company created in billing service" -ForegroundColor Green
    
    # Создаем баланс для компании
    $balanceSql = @"
INSERT INTO "CompanyBalance" ("companyId", balance, currency, "creditLimit", "createdAt", "updatedAt") 
VALUES ('d8de2f09-48f9-4a7e-8a2d-d4ccd3c7b706', 100.0, 'USD', 0, NOW(), NOW())
ON CONFLICT ("companyId") DO NOTHING;
"@
    
    $balanceSql | docker exec -i project-billing-service-1 npx prisma db execute --stdin
    Write-Host "Success: Company balance created" -ForegroundColor Green
    
} catch {
    Write-Host "Error: Failed to create company: $_" -ForegroundColor Red
}

Write-Host "=== COMPLETED ===" -ForegroundColor Cyan
