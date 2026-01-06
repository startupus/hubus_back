# Объяснение OAuth Credentials (LOGINUS_CLIENT_ID и LOGINUS_CLIENT_SECRET)

## Зачем они нужны?

Это **стандартная практика OAuth 2.0** - эти credentials нужны не для пользователей, а для **идентификации вашего приложения (AI Aggregator) в Loginus**.

### Как работает OAuth 2.0 Flow:

```
1. Пользователь → Нажимает "Вход/Регистрация"
   ↓
2. AI Aggregator → Редиректит на Loginus с client_id
   (Loginus знает: "Это запрос от приложения AI Aggregator")
   ↓
3. Пользователь → Авторизуется/регистрируется в Loginus
   ↓
4. Loginus → Редиректит обратно с authorization code
   ↓
5. AI Aggregator → Обменивает code на access_token
   (ЗДЕСЬ нужен client_secret - для безопасности!)
   ↓
6. AI Aggregator → Получает userinfo по access_token
```

### Почему нужен client_secret?

**Безопасность!** Client secret доказывает, что это действительно ваше приложение, а не злоумышленник, который перехватил authorization code.

## Где взять эти credentials?

### Вариант 1: Зарегистрировать приложение в Loginus (правильный способ)

1. Обратитесь к администратору Loginus
2. Скажите, что нужно зарегистрировать OAuth клиента для AI Aggregator
3. Укажите `redirect_uri`: `http://localhost:80/auth/callback` (для dev)
4. Получите:
   - `client_id` (публичный, виден в URL)
   - `client_secret` (секретный, только на сервере!)

### Вариант 2: Временное решение для тестирования

Если вы администрируете Loginus, можно:
1. Создать тестового клиента в Loginus
2. Использовать тестовые credentials
3. Или временно отключить проверку client_secret (не рекомендуется для production)

## Что делать сейчас?

Для тестирования можно:

1. **Временно использовать тестовые значения** (если Loginus разрешает)
2. **Или зарегистрировать приложение в Loginus**
3. **Или я могу сделать код более гибким** - проверять credentials только при обмене token, но не блокировать редирект

## Рекомендация

Обратитесь к администратору Loginus (или создайте сами, если вы админ) и зарегистрируйте приложение. Это займет 5 минут.

**Что нужно указать при регистрации:**
- Название: "AI Aggregator"
- Redirect URI: `http://localhost:80/auth/callback` (для dev)
- Redirect URI: `https://yourdomain.com/auth/callback` (для production)
- Scopes: `openid email profile`

После регистрации вы получите `client_id` и `client_secret`.

