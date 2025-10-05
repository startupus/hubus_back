-- Инициализация pricing rules
INSERT INTO pricing_rules (id, name, service, resource, type, price, currency, limits, discounts, is_active, priority, created_at, updated_at) VALUES
('rule_1', 'AI Chat - GPT-4', 'ai-chat', 'gpt-4', 'PER_TOKEN', 0.00003, 'USD', '{"min": 1, "max": 1000}', '[]', true, 1, NOW(), NOW()),
('rule_2', 'AI Chat - GPT-3.5 Turbo', 'ai-chat', 'gpt-3.5-turbo', 'PER_TOKEN', 0.000002, 'USD', '{"min": 1, "max": 10000}', '[]', true, 2, NOW(), NOW()),
('rule_3', 'AI Image - DALL-E 3', 'ai-image', 'dall-e-3', 'PER_UNIT', 0.04, 'USD', '{"min": 1, "max": 100}', '[]', true, 1, NOW(), NOW()),
('rule_4', 'AI Text - Claude 3', 'ai-chat', 'claude-3-sonnet', 'PER_TOKEN', 0.000015, 'USD', '{"min": 1, "max": 5000}', '[]', true, 3, NOW(), NOW());

-- Инициализация discount rules
INSERT INTO discount_rules (id, name, code, type, value, currency, is_global, is_active, valid_from, valid_to, usage_limit, created_at, updated_at) VALUES
('discount_1', 'New User Welcome Discount', 'WELCOME10', 'PERCENTAGE', 10, 'USD', true, true, NOW(), NOW() + INTERVAL '30 days', 1, NOW(), NOW()),
('discount_2', 'Volume Discount - High Usage', NULL, 'PERCENTAGE', 15, 'USD', false, true, NULL, NULL, NULL, NOW(), NOW()),
('discount_3', 'Loyalty Discount', NULL, 'FIXED_AMOUNT', 5, 'USD', true, true, NULL, NULL, NULL, NOW(), NOW());

-- Инициализация currency rates
INSERT INTO currency_rates (id, from_currency, to_currency, rate, timestamp) VALUES
('rate_1', 'USD', 'EUR', 0.85, NOW()),
('rate_2', 'USD', 'RUB', 95.0, NOW()),
('rate_3', 'EUR', 'USD', 1.18, NOW()),
('rate_4', 'RUB', 'USD', 0.011, NOW());
