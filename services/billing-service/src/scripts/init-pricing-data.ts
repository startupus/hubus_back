import { PrismaClient } from '@prisma/client';
import { LoggerUtil } from '@ai-aggregator/shared';

const prisma = new PrismaClient();

async function initPricingData() {
  try {
    LoggerUtil.info('billing-service', 'Initializing pricing data');

    // Создаем базовые pricing rules
    const pricingRules = [
      {
        name: 'AI Chat - GPT-4',
        service: 'ai-chat',
        resource: 'gpt-4',
        type: 'PER_TOKEN',
        price: 0.00003,
        currency: 'USD',
        limits: { min: 1, max: 1000 },
        discounts: [],
        priority: 1,
        isActive: true
      },
      {
        name: 'AI Chat - GPT-3.5 Turbo',
        service: 'ai-chat',
        resource: 'gpt-3.5-turbo',
        type: 'PER_TOKEN',
        price: 0.000002,
        currency: 'USD',
        limits: { min: 1, max: 10000 },
        discounts: [],
        priority: 2,
        isActive: true
      },
      {
        name: 'AI Image - DALL-E 3',
        service: 'ai-image',
        resource: 'dall-e-3',
        type: 'PER_UNIT',
        price: 0.04,
        currency: 'USD',
        limits: { min: 1, max: 100 },
        discounts: [],
        priority: 1,
        isActive: true
      },
      {
        name: 'AI Text - Claude 3',
        service: 'ai-chat',
        resource: 'claude-3-sonnet',
        type: 'PER_TOKEN',
        price: 0.000015,
        currency: 'USD',
        limits: { min: 1, max: 5000 },
        discounts: [],
        priority: 3,
        isActive: true
      }
    ];

    // Создаем скидки
    const discountRules = [
      {
        name: 'New User Welcome Discount',
        code: 'WELCOME10',
        type: 'PERCENTAGE',
        value: 10,
        currency: 'USD',
        isGlobal: true,
        isActive: true,
        validFrom: new Date(),
        validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 дней
        usageLimit: 1
      },
      {
        name: 'Volume Discount - High Usage',
        type: 'PERCENTAGE',
        value: 15,
        currency: 'USD',
        minAmount: 100,
        userTier: 'premium',
        isGlobal: false,
        isActive: true
      },
      {
        name: 'Loyalty Discount',
        type: 'FIXED_AMOUNT',
        value: 5,
        currency: 'USD',
        minAmount: 50,
        isGlobal: true,
        isActive: true
      }
    ];

    // Создаем валютные курсы
    const currencyRates = [
      {
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        rate: 0.85,
        timestamp: new Date()
      },
      {
        fromCurrency: 'USD',
        toCurrency: 'RUB',
        rate: 95.0,
        timestamp: new Date()
      },
      {
        fromCurrency: 'EUR',
        toCurrency: 'USD',
        rate: 1.18,
        timestamp: new Date()
      },
      {
        fromCurrency: 'RUB',
        toCurrency: 'USD',
        rate: 0.011,
        timestamp: new Date()
      }
    ];

    // Очищаем существующие данные
    await prisma.currencyRate.deleteMany();
    await prisma.discountRule.deleteMany();
    await prisma.pricingRule.deleteMany();

    // Создаем pricing rules
    for (const rule of pricingRules) {
      await prisma.pricingRule.create({
        data: rule
      });
      LoggerUtil.info('billing-service', 'Created pricing rule', { name: rule.name, service: rule.service });
    }

    // Создаем discount rules
    for (const discount of discountRules) {
      await prisma.discountRule.create({
        data: discount
      });
      LoggerUtil.info('billing-service', 'Created discount rule', { name: discount.name, type: discount.type });
    }

    // Создаем currency rates
    for (const rate of currencyRates) {
      await prisma.currencyRate.create({
        data: rate
      });
      LoggerUtil.info('billing-service', 'Created currency rate', { 
        from: rate.fromCurrency, 
        to: rate.toCurrency, 
        rate: rate.rate 
      });
    }

    LoggerUtil.info('billing-service', 'Pricing data initialization completed successfully');

  } catch (error) {
    LoggerUtil.error('billing-service', 'Failed to initialize pricing data', error as Error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Запускаем инициализацию
initPricingData()
  .then(() => {
    console.log('✅ Pricing data initialized successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Failed to initialize pricing data:', error);
    process.exit(1);
  });
