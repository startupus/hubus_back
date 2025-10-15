-- Инициализация планов подписок
-- Удаляем существующие планы
DELETE FROM pricing_plans;

-- Создаем планы подписок
INSERT INTO pricing_plans (
    id, 
    name, 
    description, 
    type, 
    price, 
    currency, 
    "billingCycle", 
    is_active, 
    limits, 
    features, 
    input_tokens, 
    output_tokens, 
    input_token_price, 
    output_token_price, 
    discount_percent,
    created_at,
    updated_at
) VALUES 
(
    'basic-plan',
    'Basic',
    'Базовый план для небольших команд',
    'SUBSCRIPTION',
    29.99,
    'USD',
    'MONTHLY',
    true,
    '{"requests": 1000, "models": ["gpt-3.5-turbo", "claude-3-haiku"]}',
    '{"support": "email", "api": "basic", "analytics": false}',
    100000, -- 100K входных токенов
    50000,  -- 50K выходных токенов
    0.00003, -- $0.03 за 1K токенов
    0.00006, -- $0.06 за 1K токенов
    0,
    NOW(),
    NOW()
),
(
    'professional-plan',
    'Professional',
    'Профессиональный план для растущих команд',
    'SUBSCRIPTION',
    99.99,
    'USD',
    'MONTHLY',
    true,
    '{"requests": 10000, "models": ["gpt-3.5-turbo", "gpt-4", "claude-3-sonnet", "claude-3-haiku"]}',
    '{"support": "priority", "api": "advanced", "analytics": true}',
    1000000, -- 1M входных токенов
    500000,  -- 500K выходных токенов
    0.00003,
    0.00006,
    10, -- 10% скидка
    NOW(),
    NOW()
),
(
    'enterprise-plan',
    'Enterprise',
    'Корпоративный план для больших организаций',
    'SUBSCRIPTION',
    299.99,
    'USD',
    'MONTHLY',
    true,
    '{"requests": -1, "models": ["all"]}', -- -1 означает неограниченно
    '{"support": "24/7", "api": "full", "analytics": true, "integrations": true, "sla": true}',
    -1, -- Неограниченно
    -1, -- Неограниченно
    0.00003,
    0.00006,
    20, -- 20% скидка
    NOW(),
    NOW()
);
