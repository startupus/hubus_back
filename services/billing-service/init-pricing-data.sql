-- Инициализация pricing rules для OpenRouter моделей
INSERT INTO pricing_rules (id, name, service, resource, type, price, currency, limits, discounts, is_active, priority, created_at, updated_at) VALUES
-- OpenAI модели через OpenRouter
('rule_1', 'OpenRouter - GPT-4o', 'ai-chat', 'openai/gpt-4o', 'PER_TOKEN', 0.0000025, 'USD', '{"min": 1, "max": 128000}', '[]', true, 1, NOW(), NOW()),
('rule_2', 'OpenRouter - GPT-4o Mini', 'ai-chat', 'openai/gpt-4o-mini', 'PER_TOKEN', 0.00000015, 'USD', '{"min": 1, "max": 128000}', '[]', true, 2, NOW(), NOW()),
-- Anthropic модели через OpenRouter
('rule_3', 'OpenRouter - Claude 3.5 Sonnet', 'ai-chat', 'anthropic/claude-3-5-sonnet-20241022', 'PER_TOKEN', 0.000003, 'USD', '{"min": 1, "max": 200000}', '[]', true, 3, NOW(), NOW()),
('rule_4', 'OpenRouter - Claude 3.5 Haiku', 'ai-chat', 'anthropic/claude-3-5-haiku-20241022', 'PER_TOKEN', 0.0000008, 'USD', '{"min": 1, "max": 200000}', '[]', true, 4, NOW(), NOW()),
-- Google модели через OpenRouter
('rule_5', 'OpenRouter - Gemini Pro 1.5', 'ai-chat', 'google/gemini-pro-1.5', 'PER_TOKEN', 0.00000125, 'USD', '{"min": 1, "max": 2000000}', '[]', true, 5, NOW(), NOW()),
-- Meta модели через OpenRouter
('rule_6', 'OpenRouter - Llama 3.1 8B', 'ai-chat', 'meta-llama/llama-3.1-8b-instruct', 'PER_TOKEN', 0.0000002, 'USD', '{"min": 1, "max": 128000}', '[]', true, 6, NOW(), NOW()),
-- Устаревшие правила для совместимости
('rule_7', 'AI Chat - GPT-4 (Legacy)', 'ai-chat', 'gpt-4', 'PER_TOKEN', 0.00003, 'USD', '{"min": 1, "max": 1000}', '[]', false, 7, NOW(), NOW()),
('rule_8', 'AI Chat - GPT-3.5 Turbo (Legacy)', 'ai-chat', 'gpt-3.5-turbo', 'PER_TOKEN', 0.000002, 'USD', '{"min": 1, "max": 10000}', '[]', false, 8, NOW(), NOW()),
('rule_9', 'AI Image - DALL-E 3', 'ai-image', 'dall-e-3', 'PER_UNIT', 0.04, 'USD', '{"min": 1, "max": 100}', '[]', true, 9, NOW(), NOW());

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
