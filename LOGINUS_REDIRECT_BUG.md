# Проблема с редиректом в Loginus

## Обнаруженная проблема

В логах браузера видно:
```
[LOG] 🔄 Redirecting to dashboard.html @ https://vselena.ldmco.ru/index.html?oauth_flow=true&return_to=%2Foau...
```

**Проблема:** Функция `redirectBasedOnRole()` в Loginus редиректит на dashboard.html, **игнорируя** параметр `oauth_flow=true` и `return_to=/oauth/authorize`.

## Текущее поведение

1. Пользователь переходит на `/oauth/authorize` → не авторизован
2. Loginus редиректит на `index.html?oauth_flow=true&return_to=/oauth/authorize`
3. OAuth cookies сохраняются (должны)
4. Пользователь авторизуется
5. ❌ `redirectBasedOnRole()` проверяет роль и редиректит на `dashboard.html`
6. ❌ OAuth flow прерывается

## Правильное поведение

1. Пользователь переходит на `/oauth/authorize` → не авторизован
2. Loginus редиректит на `index.html?oauth_flow=true&return_to=/oauth/authorize`
3. OAuth cookies сохраняются
4. Пользователь авторизуется
5. ✅ `redirectBasedOnRole()` проверяет `oauth_flow=true` **ПЕРЕД** проверкой роли
6. ✅ Если `oauth_flow=true` → редирект на `/oauth/authorize` (или `return_to`)
7. ✅ OAuth flow продолжается

## Что нужно исправить в Loginus

### В функции `redirectBasedOnRole()` (frontend/index.html)

**ДО:**
```javascript
function redirectBasedOnRole() {
  // Проверяет роль и редиректит на dashboard
  if (user.role === 'admin') {
    window.location.href = '/dashboard.html';
  }
  // ...
}
```

**ПОСЛЕ:**
```javascript
function redirectBasedOnRole() {
  // ПЕРВАЯ проверка: OAuth flow
  const urlParams = new URLSearchParams(window.location.search);
  const oauthFlow = urlParams.get('oauth_flow') === 'true';
  const returnTo = urlParams.get('return_to');
  
  if (oauthFlow && returnTo) {
    // Продолжаем OAuth flow
    window.location.href = returnTo;
    return;
  }
  
  // Только если НЕ в OAuth flow, проверяем роль
  if (user.role === 'admin') {
    window.location.href = '/dashboard.html';
  }
  // ...
}
```

### Также проверить сохранение cookies

Убедитесь, что при редиректе на `index.html?oauth_flow=true` cookies сохраняются:
- `oauth_client_id`
- `oauth_redirect_uri`
- `oauth_scope`
- `oauth_state_param`

## Проверка

После исправления:
1. Перейдите на http://localhost:80
2. Нажмите "Вход/Регистрация"
3. Войдите в Loginus
4. После входа должен быть редирект на `/oauth/authorize` или callback URL, а НЕ на dashboard

## Резюме

**Проблема:** `redirectBasedOnRole()` не проверяет OAuth flow перед редиректом на dashboard

**Решение:** Добавить проверку `oauth_flow=true` в начало функции `redirectBasedOnRole()`

**Статус:** Требуется исправление в Loginus frontend

