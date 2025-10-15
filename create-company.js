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
