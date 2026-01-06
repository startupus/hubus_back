# Критическая проблема: /oauth/authorize редиректит на dashboard вместо создания authorization code

## Проблема обнаружена

В логах браузера видно:
```
[LOG] 🔍 Current page: /oauth/authorize @ https://vselena.ldmco.ru/oauth/authorize:3205
[LOG] 🔄 Redirecting to dashboard.html @ https://vselena.ldmco.ru/oauth/authorize:3229
```

**Проблема:** Когда пользователь уже авторизован и приходит на `/oauth/authorize`, Loginus редиректит на dashboard вместо создания authorization code и редиректа на callback URL.

## Текущее поведение (неправильное)

1. Пользователь авторизован в Loginus
2. Переходит на `/oauth/authorize?client_id=...&redirect_uri=...&state=...`
3. ❌ Loginus проверяет роль и редиректит на dashboard
4. ❌ Authorization code не создается
5. ❌ Редирект на callback URL не происходит

## Правильное поведение

1. Пользователь авторизован в Loginus
2. Переходит на `/oauth/authorize?client_id=...&redirect_uri=...&state=...`
3. ✅ Backend проверяет OAuth параметры (client_id, redirect_uri, state)
4. ✅ Backend создает authorization code
5. ✅ Backend редиректит на `redirect_uri?code=...&state=...`

## Что нужно исправить в Loginus

### Backend: `/oauth/authorize` endpoint

**Текущая логика (неправильная):**
```javascript
// Если пользователь авторизован → редирект на dashboard
if (user.isAuthenticated) {
  redirectToDashboard(user.role);
}
```

**Правильная логика:**
```javascript
// Если пользователь авторизован → создаем authorization code
if (user.isAuthenticated) {
  // Проверяем OAuth параметры
  const { client_id, redirect_uri, state, scope } = req.query;
  
  // Валидируем client_id и redirect_uri
  const client = await validateClient(client_id, redirect_uri);
  
  // Создаем authorization code
  const code = await createAuthorizationCode({
    userId: user.id,
    clientId: client_id,
    redirectUri: redirect_uri,
    scope: scope,
    state: state
  });
  
  // Редиректим на callback URL с кодом
  return res.redirect(`${redirect_uri}?code=${code}&state=${state}`);
}
```

### Frontend: Не должно быть редиректа на dashboard из `/oauth/authorize`

Если страница `/oauth/authorize` открывается в браузере, она должна обрабатываться backend'ом, а не frontend'ом. Frontend не должен редиректить на dashboard.

## Проверка

После исправления:
1. Пользователь авторизован в Loginus
2. Переходит на `/oauth/authorize?client_id=...&redirect_uri=...&state=...`
3. Backend создает authorization code
4. Редирект на `redirect_uri?code=...&state=...`
5. AI Aggregator получает code и обменивает на токен

## Статус

**Проблема:** Backend endpoint `/oauth/authorize` не обрабатывает уже авторизованных пользователей правильно

**Решение:** Исправить логику в `/oauth/authorize` - при авторизованном пользователе создавать authorization code и редиректить на callback, а не на dashboard

**Статус:** Требуется исправление в Loginus backend

