# Создание компании в billing-service через Prisma
Write-Host "=== CREATING COMPANY IN BILLING SERVICE ===" -ForegroundColor Cyan

try {
    # Создаем компанию через Prisma
    $createCompanyScript = @"
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function createCompany() {
  try {
    const company = await prisma.company.create({
      data: {
        id: 'd8de2f09-48f9-4a7e-8a2d-d4ccd3c7b706',
        name: 'Test Company',
        email: 'test2@example.com',
        isActive: true,
        billingMode: 'SELF_PAID'
      }
    });
    console.log('Company created:', company.id);
    
    const balance = await prisma.companyBalance.create({
      data: {
        companyId: 'd8de2f09-48f9-4a7e-8a2d-d4ccd3c7b706',
        balance: 100.0,
        currency: 'USD',
        creditLimit: 0
      }
    });
    console.log('Balance created:', balance.companyId);
    
    await prisma.$disconnect();
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createCompany();
"@
    
    $createCompanyScript | docker exec -i project-billing-service-1 node -e "$(Get-Content -Raw)"
    Write-Host "Success: Company and balance created" -ForegroundColor Green
    
} catch {
    Write-Host "Error: Failed to create company: $_" -ForegroundColor Red
}

Write-Host "=== COMPLETED ===" -ForegroundColor Cyan
