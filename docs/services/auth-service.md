# Auth Service

## 🎯 Назначение

Auth Service отвечает за аутентификацию, авторизацию и управление пользователями. Обеспечивает безопасность всей системы через JWT токены и API ключи.

## 🏗️ Архитектура

```
Client → Auth Service → Database
  ↓           ↓            ↓
Login    Validate     Store User
Register  Generate    Manage Keys
```

## 🚀 Запуск

```bash
# Запуск сервиса
docker-compose up -d auth-service

# Проверка статуса
curl http://localhost:3001/health
```

## 📡 API Endpoints

### Пользователи
- `POST /auth/register` - Регистрация пользователя
- `POST /auth/login` - Вход в систему
- `GET /auth/profile` - Профиль пользователя
- `PUT /auth/profile` - Обновление профиля

### Токены
- `POST /auth/refresh` - Обновление токена
- `POST /auth/logout` - Выход из системы
- `POST /auth/validate` - Валидация токена

### API Ключи
- `GET /auth/api-keys` - Список API ключей
- `POST /auth/api-keys` - Создание API ключа
- `DELETE /auth/api-keys/:id` - Удаление API ключа

## 🔧 Конфигурация

### Environment Variables
```env
PORT=3001
DATABASE_URL=postgresql://user:password@auth-db:5432/auth_db
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=12
```

### База данных
```sql
-- Пользователи
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API ключи
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  key_hash VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔐 Безопасность

### Хеширование паролей
```typescript
import * as bcrypt from 'bcrypt';

const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);
```

### JWT Токены
```typescript
interface JwtPayload {
  sub: string;        // User ID
  email: string;      // User email
  iat: number;        // Issued at
  exp: number;        // Expires at
  type: 'access' | 'refresh';
}
```

### API Ключи
- Генерация криптографически стойких ключей
- Хеширование для хранения
- Проверка срока действия
- Отзыв ключей

## 🛡️ Аутентификация

### Регистрация
```typescript
POST /auth/register
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "John",
  "lastName": "Doe"
}
```

### Вход
```typescript
POST /auth/login
{
  "email": "user@example.com",
  "password": "securePassword123"
}

// Ответ
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Валидация токена
```typescript
POST /auth/validate
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}

// Ответ
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com"
  }
}
```

## 🔑 API Ключи

### Создание ключа
```typescript
POST /auth/api-keys
{
  "name": "My API Key",
  "expiresAt": "2025-12-31T23:59:59Z"
}

// Ответ
{
  "id": "uuid",
  "key": "ak_live_1234567890abcdef...",
  "name": "My API Key",
  "expiresAt": "2025-12-31T23:59:59Z",
  "createdAt": "2025-10-05T22:30:00Z"
}
```

### Использование ключа
```typescript
// В заголовке запроса
Authorization: Bearer ak_live_1234567890abcdef...

// Или в query параметре
?api_key=ak_live_1234567890abcdef...
```

## 🔄 Интеграция

### gRPC Endpoints
- `ValidateToken` - валидация JWT токенов
- `ValidateApiKey` - валидация API ключей
- `GetUser` - получение информации о пользователе

### HTTP Endpoints
- Все REST API endpoints
- Swagger документация на `/api`

## 📊 Мониторинг

### Метрики
- Количество регистраций
- Количество входов
- Активные пользователи
- Использование API ключей

### Логирование
```json
{
  "timestamp": "2025-10-05T22:30:00.000Z",
  "level": "INFO",
  "service": "auth-service",
  "action": "user_login",
  "userId": "uuid",
  "ip": "192.168.1.1",
  "userAgent": "Mozilla/5.0..."
}
```

## 🚨 Обработка ошибок

### Типы ошибок
- `400 Bad Request` - неверные данные
- `401 Unauthorized` - неверные учетные данные
- `403 Forbidden` - недостаточно прав
- `409 Conflict` - пользователь уже существует
- `429 Too Many Requests` - превышен лимит попыток

### Безопасность
- Rate limiting для попыток входа
- Блокировка после множественных неудачных попыток
- Логирование всех попыток аутентификации

## 🔧 Разработка

### Структура проекта
```
src/
├── auth/           # Аутентификация
├── users/          # Управление пользователями
├── api-keys/       # API ключи
├── guards/         # Guards для защиты
├── decorators/     # Декораторы
└── common/         # Общие утилиты
```

### Тестирование
```bash
# Unit тесты
npm run test

# E2E тесты
npm run test:e2e

# Тестирование безопасности
npm run test:security
```

## 📈 Производительность

### Оптимизации
- Индексы в базе данных
- Кэширование пользователей
- Connection pooling
- Асинхронная обработка

### Масштабирование
- Горизонтальное масштабирование
- Load balancing
- Database sharding
