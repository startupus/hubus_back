# Loginus OAuth Integration - Завершено ✅

## Что было сделано

### 1. Backend (API Gateway)

#### ✅ Конфигурация
- Добавлена конфигурация Loginus OAuth в `services/api-gateway/src/config/configuration.ts`
- Переменные окружения:
  - `LOGINUS_OAUTH_URL` - URL сервиса Loginus
  - `LOGINUS_CLIENT_ID` - ID клиента
  - `LOGINUS_CLIENT_SECRET` - Секретный ключ
  - `LOGINUS_REDIRECT_URI` - URI для редиректа после авторизации
  - `LOGINUS_SCOPE` - Запрашиваемые разрешения

#### ✅ OAuth Controller
- Создан `services/api-gateway/src/auth/oauth.controller.ts`
- Endpoints:
  - `GET /v1/auth/loginus` - инициация OAuth flow (редирект на Loginus)
  - `GET /v1/auth/callback` - обработка callback от Loginus

#### ✅ Auth Service
- Добавлен метод `syncUserFromLoginus()` в `services/api-gateway/src/auth/auth.service.ts`
- Автоматическая синхронизация пользователей:
  - Проверка существования пользователя по email
  - Создание нового пользователя, если не найден
  - Генерация JWT токена для AI Aggregator

#### ✅ Middleware
- Установлен `cookie-parser` для работы с cookies
- Добавлен в `services/api-gateway/src/main.ts`

### 2. Frontend

#### ✅ Обновлен App.js
- Заменена локальная форма авторизации на редирект на Loginus
- Добавлена обработка callback с токеном из URL
- Автоматическое сохранение токена и авторизация пользователя
- Обработка ошибок OAuth flow

### 3. Docker

#### ✅ docker-compose.yml
- Добавлены переменные окружения для Loginus OAuth
- Поддержка переменных из `.env` файла

#### ✅ env.example
- Добавлены примеры переменных для Loginus OAuth

## Как использовать

### 1. Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```env
LOGINUS_OAUTH_URL=https://vselena.ldmco.ru
LOGINUS_CLIENT_ID=your_client_id_from_loginus
LOGINUS_CLIENT_SECRET=your_client_secret_from_loginus
LOGINUS_REDIRECT_URI=http://localhost:80/auth/callback
LOGINUS_SCOPE=openid email profile
```

### 2. Запуск проекта

```bash
docker-compose up -d
```

### 3. Использование

1. Пользователь нажимает "Вход/Регистрация" в frontend
2. Происходит редирект на Loginus OAuth
3. Пользователь авторизуется в Loginus (Email, Telegram, GitHub и т.д.)
4. Loginus редиректит обратно на `/auth/callback`
5. API Gateway синхронизирует пользователя и генерирует JWT токен
6. Пользователь возвращается на frontend и авторизован

## Flow интеграции

```
[Frontend] 
  ↓ (нажатие "Вход/Регистрация")
[API Gateway /v1/auth/loginus]
  ↓ (редирект с state)
[Loginus OAuth]
  ↓ (авторизация пользователя)
[Loginus callback]
  ↓ (code + state)
[API Gateway /v1/auth/callback]
  ↓ (обмен code на access_token)
[Loginus /oauth/token]
  ↓ (access_token)
[API Gateway /oauth/userinfo]
  ↓ (информация о пользователе)
[API Gateway syncUserFromLoginus]
  ↓ (синхронизация/создание пользователя)
[Auth Service]
  ↓ (JWT токен)
[Frontend]
  ↓ (сохранение токена)
[Пользователь авторизован]
```

## Безопасность

- ✅ State параметр для защиты от CSRF
- ✅ HttpOnly cookies для хранения state
- ✅ Client secret хранится только на сервере
- ✅ Валидация redirect_uri на стороне Loginus
- ✅ HTTPS для production

## Важные замечания

1. **Пользователь должен быть авторизован в Loginus** перед вызовом `/oauth/authorize`
2. **Redirect URI должен быть зарегистрирован** в Loginus для вашего client_id
3. **Client Secret** никогда не должен попадать в клиентский код
4. Для production измените `LOGINUS_REDIRECT_URI` на ваш домен

## Тестирование

1. Убедитесь, что переменные окружения настроены
2. Запустите проект: `docker-compose up -d`
3. Откройте frontend: http://localhost:80
4. Нажмите "Вход/Регистрация"
5. Вы должны быть перенаправлены на Loginus
6. После авторизации вернетесь на frontend авторизованным

## Поддержка

Если возникли проблемы:
1. Проверьте логи API Gateway: `docker-compose logs api-gateway`
2. Убедитесь, что переменные окружения установлены
3. Проверьте, что redirect_uri зарегистрирован в Loginus
4. Убедитесь, что пользователь авторизован в Loginus перед OAuth flow

