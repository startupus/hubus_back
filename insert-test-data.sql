-- Создание тестовых планов подписок
INSERT INTO "SubscriptionPlan" (id, name, description, price, currency, "billingCycle", features, "isActive", "createdAt", "updatedAt")
VALUES 
  ('basic', 'Basic Plan', 'Базовый план для небольших компаний', 29.99, 'USD', 'MONTHLY', '{"maxRequests": 1000, "maxUsers": 5, "support": "email"}', true, NOW(), NOW()),
  ('pro', 'Pro Plan', 'Профессиональный план для растущих компаний', 99.99, 'USD', 'MONTHLY', '{"maxRequests": 10000, "maxUsers": 25, "support": "priority"}', true, NOW(), NOW()),
  ('enterprise', 'Enterprise Plan', 'Корпоративный план для крупных организаций', 299.99, 'USD', 'MONTHLY', '{"maxRequests": 100000, "maxUsers": 100, "support": "dedicated"}', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Создание тестовой компании для рефералов
INSERT INTO "Company" (id, name, email, "isActive", "isVerified", role, "referralCode", "createdAt", "updatedAt")
VALUES ('test-company-1', 'Test Company 1', 'test1@example.com', true, true, 'company', 'TEST001', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
