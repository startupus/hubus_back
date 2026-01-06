-- Обновление redirect URI для AI Aggregator OAuth клиента
-- Добавляет новый redirect URI: http://localhost:80/v1/auth/callback
-- Не удаляет существующие redirect URIs

-- Проверка текущих redirect URIs
SELECT "clientId", name, "redirectUris" 
FROM oauth_clients 
WHERE "clientId" = 'ai-aggregator-1dfc0546e55a761187a9e64d034c982c';

-- Обновление: добавляем новый redirect URI, если его еще нет
UPDATE oauth_clients
SET "redirectUris" = "redirectUris" || ARRAY['http://localhost:80/v1/auth/callback'],
    "updatedAt" = NOW()
WHERE "clientId" = 'ai-aggregator-1dfc0546e55a761187a9e64d034c982c'
  AND NOT ('http://localhost:80/v1/auth/callback' = ANY("redirectUris"));

-- Проверка результата
SELECT "clientId", name, "redirectUris", "updatedAt"
FROM oauth_clients 
WHERE "clientId" = 'ai-aggregator-1dfc0546e55a761187a9e64d034c982c';

