const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://user:pass@billing-db:5432/billing'
    }
  }
});

async function createTestData() {
  try {
    console.log('Создание тестовых данных...');

    // Создаем планы подписок
    const basicPlan = await prisma.subscriptionPlan.upsert({
      where: { id: 'basic' },
      update: {},
      create: {
        id: 'basic',
        name: 'Basic Plan',
        description: 'Базовый план для небольших компаний',
        price: 29.99,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        features: {
          maxRequests: 1000,
          maxUsers: 5,
          support: 'email'
        },
        isActive: true
      }
    });

    const proPlan = await prisma.subscriptionPlan.upsert({
      where: { id: 'pro' },
      update: {},
      create: {
        id: 'pro',
        name: 'Pro Plan',
        description: 'Профессиональный план для растущих компаний',
        price: 99.99,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        features: {
          maxRequests: 10000,
          maxUsers: 25,
          support: 'priority'
        },
        isActive: true
      }
    });

    const enterprisePlan = await prisma.subscriptionPlan.upsert({
      where: { id: 'enterprise' },
      update: {},
      create: {
        id: 'enterprise',
        name: 'Enterprise Plan',
        description: 'Корпоративный план для крупных организаций',
        price: 299.99,
        currency: 'USD',
        billingCycle: 'MONTHLY',
        features: {
          maxRequests: 100000,
          maxUsers: 100,
          support: 'dedicated'
        },
        isActive: true
      }
    });

    console.log('Планы подписок созданы:', { basicPlan, proPlan, enterprisePlan });

    // Создаем тестовую компанию для рефералов
    const testCompany = await prisma.company.upsert({
      where: { id: 'test-company-1' },
      update: {},
      create: {
        id: 'test-company-1',
        name: 'Test Company 1',
        email: 'test1@example.com',
        isActive: true,
        isVerified: true,
        role: 'company',
        referralCode: 'TEST001'
      }
    });

    console.log('Тестовая компания создана:', testCompany);

    console.log('Тестовые данные успешно созданы!');
  } catch (error) {
    console.error('Ошибка при создании тестовых данных:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();