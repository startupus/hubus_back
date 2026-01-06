# Проверка проблем на стороне Loginus

## Что нужно проверить в Loginus

### 1. Redirect URI зарегистрирован
**Текущий redirect URI:** `http://localhost:80/auth/callback`

**Проверьте:**
- [ ] Этот URL зарегистрирован в Loginus для клиента `ai-aggregator-1dfc0546e55a761187a9e64d034c982c`
- [ ] Если используется production, зарегистрирован ли production URL
- [ ] Redirect URI должен точно совпадать (включая протокол http/https, порт, путь)

### 2. Client ID и Secret
**Текущие значения:**
- Client ID: `ai-aggregator-1dfc0546e55a761187a9e64d034c982c`
- Client Secret: `cd024fc585ac2008b767e3c46f41123bd618fd0ab1af7a10158549b405ae9d37`

**Проверьте:**
- [ ] Эти значения соответствуют реальным в Loginus
- [ ] Client Secret не был изменен
- [ ] Client ID правильный

### 3. OAuth Endpoints доступны
**Проверьте доступность endpoints:**

```bash
# Проверка authorize endpoint
curl -I "https://vselena.ldmco.ru/oauth/authorize?client_id=test&redirect_uri=http://localhost:80/auth/callback&response_type=code"

# Проверка token endpoint (должен вернуть 400/401 без правильных параметров, но не 404)
curl -X POST "https://vselena.ldmco.ru/oauth/token" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=test&redirect_uri=http://localhost:80/auth/callback&client_id=test&client_secret=test"

# Проверка userinfo endpoint
curl -I "https://vselena.ldmco.ru/oauth/userinfo" \
  -H "Authorization: Bearer test"
```

**Ожидаемые ответы:**
- `/oauth/authorize` - должен редиректить (302) или возвращать страницу логина, но не 404
- `/oauth/token` - должен возвращать 400/401 при неверных данных, но не 404
- `/oauth/userinfo` - должен возвращать 401 без токена, но не 404

### 4. Структура ответа userinfo
**Проверьте, что `/oauth/userinfo` возвращает правильную структуру:**

```json
{
  "id": "user-id",
  "email": "user@example.com" | null,
  "firstName": "Имя",
  "lastName": "Фамилия",
  "messengerMetadata": {
    "telegram": {
      "userId": "...",
      "username": "..."
    }
  },
  "oauthMetadata": {
    "github": {
      "username": "...",
      "id": "..."
    }
  }
}
```

### 5. Автоматический редирект неавторизованных
**Согласно документации:**
- Если пользователь не авторизован, `/oauth/authorize` должен автоматически редиректить на страницу логина
- После логина/регистрации должен автоматически продолжать OAuth flow

**Проверьте:**
- [ ] Неавторизованный пользователь редиректится на страницу логина
- [ ] После успешного логина продолжается OAuth flow
- [ ] Поддерживаются все способы входа (Email, GitHub, Telegram)

## Возможные проблемы и решения

### Проблема: 404 на /oauth/authorize
**Причина:** Endpoint не существует или неправильный URL
**Решение:** Проверьте, что URL правильный (`https://vselena.ldmco.ru/oauth/authorize`, без `/api`)

### Проблема: "Invalid redirect_uri"
**Причина:** Redirect URI не зарегистрирован в Loginus
**Решение:** Зарегистрируйте `http://localhost:80/auth/callback` в настройках клиента

### Проблема: "Invalid client_id" или "Invalid client_secret"
**Причина:** Неправильные credentials
**Решение:** Проверьте и обновите `LOGINUS_CLIENT_ID` и `LOGINUS_CLIENT_SECRET` в docker-compose.yml

### Проблема: "No access token received"
**Причина:** Loginus не возвращает токен или неправильный формат ответа
**Решение:** Проверьте логи API Gateway и формат ответа от `/oauth/token`

### Проблема: "User not found" после получения userinfo
**Причина:** Неправильная структура ответа от `/oauth/userinfo`
**Решение:** Проверьте структуру ответа и обновите код синхронизации пользователя

## Логи для отладки

После пересборки контейнеров проверьте логи:

```bash
docker logs project-api-gateway-1 --tail=100 | grep -i "loginus\|oauth"
```

Ищите:
- "Initiating OAuth flow" - начало OAuth flow
- "Exchanging authorization code" - обмен кода на токен
- "User info received" - получение информации о пользователе
- "User synchronized" - успешная синхронизация
- Ошибки с деталями

