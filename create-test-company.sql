INSERT INTO companies (id, email, name, is_active, billing_mode, created_at, updated_at) 
VALUES ('test-user-123', 'test@example.com', 'Test Company', true, 'SELF_PAID', NOW(), NOW()) 
ON CONFLICT (id) DO NOTHING;
