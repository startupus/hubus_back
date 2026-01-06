# Как обновить Redirect URI в Loginus

## Способ 1: Через SQL (самый простой и быстрый)

### Шаг 1: Подключитесь к базе данных Loginus

```bash
# Если база данных в Docker
docker exec -it loginus-db psql -U postgres -d loginus_db

# Или если база данных локальная
psql -U postgres -d loginus_db
```

### Шаг 2: Выполните SQL запрос

```sql
-- Сначала проверьте текущие redirect URIs
SELECT "clientId", name, "redirectUris" 
FROM oauth_clients 
WHERE "clientId" = 'ai-aggregator-1dfc0546e55a761187a9e64d034c982c';

-- Обновите redirect URIs, добавив новый
UPDATE oauth_clients
SET "redirectUris" = ARRAY[
  'http://localhost:80/auth/callback',           -- старый (оставляем для совместимости)
  'http://localhost:80/v1/auth/callback',       -- новый (добавляем)
  'https://yourdomain.com/auth/callback',        -- production (если есть)
  'https://yourdomain.com/v1/auth/callback'     -- production новый (если есть)
],
"updatedAt" = NOW()
WHERE "clientId" = 'ai-aggregator-1dfc0546e55a761187a9e64d034c982c';

-- Проверьте результат
SELECT "clientId", name, "redirectUris" 
FROM oauth_clients 
WHERE "clientId" = 'ai-aggregator-1dfc0546e55a761187a9e64d034c982c';
```

### Если нужно только добавить, не удаляя старые:

```sql
UPDATE oauth_clients
SET "redirectUris" = "redirectUris" || ARRAY['http://localhost:80/v1/auth/callback'],
    "updatedAt" = NOW()
WHERE "clientId" = 'ai-aggregator-1dfc0546e55a761187a9e64d034c982c'
  AND NOT ('http://localhost:80/v1/auth/callback' = ANY("redirectUris"));
```

---

## Способ 2: Через API endpoint (если есть endpoint для обновления)

### Проверьте, есть ли endpoint для обновления клиента

```bash
# Проверьте Swagger документацию
# Откройте: https://vselena.ldmco.ru/api/docs

# Или проверьте через curl
curl -X GET "https://vselena.ldmco.ru/api/oauth/clients" \
  -H "Authorization: Bearer {admin_jwt_token}"
```

Если есть endpoint `PUT /oauth/clients/{clientId}` или `PATCH /oauth/clients/{clientId}`, используйте его:

```bash
curl -X PUT "https://vselena.ldmco.ru/api/oauth/clients/ai-aggregator-1dfc0546e55a761187a9e64d034c982c" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {admin_jwt_token}" \
  -d '{
    "redirect_uris": [
      "http://localhost:80/auth/callback",
      "http://localhost:80/v1/auth/callback",
      "https://yourdomain.com/auth/callback",
      "https://yourdomain.com/v1/auth/callback"
    ]
  }'
```

---

## Способ 3: Через админ-панель Loginus (если доступна)

1. Откройте админ-панель Loginus
2. Найдите раздел "OAuth Clients" или "Клиенты OAuth"
3. Найдите клиент `ai-aggregator-1dfc0546e55a761187a9e64d034c982c`
4. Нажмите "Редактировать" или "Edit"
5. В поле "Redirect URIs" добавьте: `http://localhost:80/v1/auth/callback`
6. Сохраните изменения

---

## Рекомендуемый способ

**Используйте Способ 1 (SQL)** - это самый быстрый и надежный способ.

### Быстрый SQL скрипт для копирования:

```sql
UPDATE oauth_clients
SET "redirectUris" = "redirectUris" || ARRAY['http://localhost:80/v1/auth/callback'],
    "updatedAt" = NOW()
WHERE "clientId" = 'ai-aggregator-1dfc0546e55a761187a9e64d034c982c'
  AND NOT ('http://localhost:80/v1/auth/callback' = ANY("redirectUris"));
```

Этот скрипт:
- ✅ Добавит новый redirect URI
- ✅ Не удалит существующие
- ✅ Не добавит дубликат, если уже есть
- ✅ Обновит время изменения

---

## Проверка после обновления

После обновления проверьте:

1. **Проверьте в базе данных:**
   ```sql
   SELECT "clientId", name, "redirectUris" 
   FROM oauth_clients 
   WHERE "clientId" = 'ai-aggregator-1dfc0546e55a761187a9e64d034c982c';
   ```

2. **Проверьте OAuth flow:**
   - Откройте http://localhost:80
   - Нажмите "Вход/Регистрация"
   - Войдите в Loginus
   - Должен произойти редирект обратно на AI Aggregator

---

## Если возникли проблемы

### Проблема: "invalid_redirect_uri"
**Решение:** Убедитесь, что URI точно совпадает (включая протокол, порт, путь)

### Проблема: "No rows affected"
**Решение:** Проверьте, что `clientId` правильный:
```sql
SELECT "clientId", name FROM oauth_clients WHERE "clientId" LIKE '%ai-aggregator%';
```

### Проблема: Редирект все еще не работает
**Решение:** 
1. Проверьте логи API Gateway: `docker logs project-api-gateway-1 --tail=50`
2. Убедитесь, что пересобрали контейнер с новым redirect URI
3. Проверьте, что контейнер Loginus перезапущен (если нужно)

