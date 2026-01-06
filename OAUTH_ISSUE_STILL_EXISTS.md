# Проблема все еще существует

## Проверка через браузер

После клика на "Вход/Регистрация":
1. ✅ Редирект на Loginus работает
2. ✅ URL: `index.html?oauth_flow=true&return_to=/oauth/authorize&client_id=...`
3. ❌ Пользователь уже авторизован
4. ❌ Логи показывают: `[LOG] 🔄 Redirecting to dashboard.html`
5. ❌ Редирект на dashboard вместо `/api/oauth/authorize`

## Проблема

В логах видно:
```
[LOG] 🔍 Current page: /index.html
[LOG] 🔄 Redirecting to dashboard.html
```

**Функция `redirectBasedOnRole()` все еще редиректит на dashboard**, даже когда:
- URL содержит `oauth_flow=true`
- URL содержит `return_to=/oauth/authorize`

## Что нужно проверить в Loginus

### 1. Проверка в `redirectBasedOnRole()`

Убедитесь, что проверка OAuth flow происходит **ДО** проверки роли:

```javascript
function redirectBasedOnRole() {
  // ПЕРВАЯ проверка: OAuth flow
  const urlParams = new URLSearchParams(window.location.search);
  const oauthFlow = urlParams.get('oauth_flow') === 'true';
  const returnTo = urlParams.get('return_to');
  
  if (oauthFlow && returnTo) {
    // Важно: редиректить на /api/oauth/authorize (с /api/)
    const apiReturnTo = returnTo.startsWith('/api/') ? returnTo : `/api${returnTo}`;
    window.location.href = apiReturnTo;
    return; // ВАЖНО: не продолжать выполнение!
  }
  
  // Только если НЕ в OAuth flow, проверяем роль
  // ... остальная логика ...
}
```

### 2. Проверка пути страницы

Убедитесь, что проверка происходит на правильной странице:
- Если `window.location.pathname === '/index.html'` и есть `oauth_flow=true` → редирект на `/api/oauth/authorize`
- НЕ редиректить на dashboard!

### 3. Проверка cookies

Убедитесь, что OAuth cookies сохраняются:
- При редиректе на `index.html?oauth_flow=true` должны сохраняться cookies
- При редиректе на `/api/oauth/authorize` должны читаться cookies

## Тестирование

Проверьте напрямую:
1. Откройте: `https://vselena.ldmco.ru/api/oauth/authorize?client_id=ai-aggregator-1dfc0546e55a761187a9e64d034c982c&redirect_uri=http://localhost:80/v1/auth/callback&response_type=code&scope=openid%20email%20profile&state=test123`
2. Если авторизованы → должен быть редирект на `http://localhost:80/v1/auth/callback?code=...&state=test123`
3. НЕ должен быть редирект на dashboard

## Резюме

**Проблема:** `redirectBasedOnRole()` все еще редиректит на dashboard вместо проверки OAuth flow

**Решение:** Убедиться, что проверка `oauth_flow=true` происходит **ПЕРВОЙ** в функции `redirectBasedOnRole()` и **останавливает** выполнение (return)

**Статус:** Требуется дополнительная проверка/исправление в Loginus frontend

