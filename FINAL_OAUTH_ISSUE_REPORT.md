# Финальный отчет: Проблема с OAuth Flow

## ✅ Что работает

1. **Frontend обнаруживает OAuth flow:**
   ```
   [LOG] 🔄 OAuth flow detected, redirecting to /api/oauth/authorize
   ```

2. **Frontend пропускает API endpoints:**
   ```
   [LOG] ⚠️ On API endpoint, skipping frontend processing: /oauth/authorize
   ```

3. **Редирект на Loginus работает** - пользователь попадает на страницу входа

## ❌ Проблема

**Backend сохраняет неправильный `return_to` при редиректе на логин.**

### Что происходит

1. Запрос на `/api/oauth/authorize?client_id=...&redirect_uri=...&state=...`
2. Backend редиректит на: `index.html?oauth_flow=true&return_to=/oauth/authorize`
3. ❌ **Проблема:** `return_to=/oauth/authorize` (без `/api/`)
4. Frontend редиректит на `/oauth/authorize` (без `/api/`)
5. ❌ Показывается форма входа вместо обработки backend

### Что должно происходить

1. Запрос на `/api/oauth/authorize?client_id=...&redirect_uri=...&state=...`
2. Backend редиректит на: `index.html?oauth_flow=true&return_to=/api/oauth/authorize`
3. ✅ `return_to=/api/oauth/authorize` (с `/api/`)
4. Frontend редиректит на `/api/oauth/authorize` (с `/api/`)
5. ✅ Backend обрабатывает запрос и создает authorization code

## Причина

**В логах видно:**
```
[LOG] 🔄 OAuth params: {oauthFlow: true, returnTo: /oauth/authorize}
```

**Проблема:** Backend сохраняет `return_to=/oauth/authorize` вместо `return_to=/api/oauth/authorize`

## Решение

### Backend: Исправить сохранение `return_to`

В backend при редиректе на логин нужно сохранять полный путь с `/api/`:

```typescript
// В backend: oauth.controller.ts
@Get('authorize')
async authorize(
  @Query('client_id') clientId: string,
  @Query('redirect_uri') redirectUri: string,
  @Query('state') state: string,
  @Req() req: Request,
  @Res() res: Response
) {
  // Проверяем, авторизован ли пользователь
  const user = req.user;
  
  if (!user) {
    // Сохраняем параметры в cookies
    res.cookie('oauth_client_id', clientId, { ... });
    res.cookie('oauth_redirect_uri', redirectUri, { ... });
    res.cookie('oauth_state', state, { ... });
    
    // ✅ ВАЖНО: сохраняем полный путь с /api/
    const returnTo = '/api/oauth/authorize'; // НЕ '/oauth/authorize'
    
    // Редиректим на логин
    return res.redirect(`/index.html?oauth_flow=true&return_to=${encodeURIComponent(returnTo)}&client_id=${clientId}`);
  }
  
  // Пользователь авторизован → создаем authorization code
  // ...
}
```

### Альтернатива: Frontend добавляет `/api/` при редиректе

Если нельзя изменить backend, можно исправить frontend:

```javascript
// В frontend: index.html
if (oauthFlow && returnTo) {
  // Добавляем /api/ если его нет
  const apiReturnTo = returnTo.startsWith('/api/') ? returnTo : `/api${returnTo}`;
  window.location.href = apiReturnTo;
  return;
}
```

## Проверка

После исправления:
1. Запрос на `/api/oauth/authorize?client_id=...`
2. Backend редиректит на `index.html?oauth_flow=true&return_to=/api/oauth/authorize`
3. Frontend редиректит на `/api/oauth/authorize`
4. Backend обрабатывает запрос (пользователь авторизован)
5. Backend создает authorization code
6. Редирект на `http://localhost:80/v1/auth/callback?code=...&state=...`

## Резюме

**Проблема:** Backend сохраняет `return_to=/oauth/authorize` вместо `return_to=/api/oauth/authorize`

**Решение:** 
- **Вариант 1 (предпочтительно):** Исправить backend - сохранять `/api/oauth/authorize` в `return_to`
- **Вариант 2:** Исправить frontend - добавлять `/api/` при редиректе, если его нет

**Статус:** Требуется исправление в Loginus (backend или frontend)

