# MVP - Микросервисная платформа для ИИ-провайдеров

## Описание проекта

Это MVP версия микросервисной платформы для управления и проксирования запросов к различным ИИ-провайдерам (OpenAI, OpenRouter и др.).

## Архитектура

Проект построен на микросервисной архитектуре с использованием NestJS, TypeScript, PostgreSQL, RabbitMQ и gRPC.

### Сервисы

- **api-gateway** - Единая точка входа для всех запросов
- **auth-service** - Аутентификация и управление пользователями
- **provider-orchestrator** - Управление провайдерами и маршрутизация
- **proxy-service** - Проксирование запросов к внешним ИИ-провайдерам
- **billing-service** - Биллинг и управление балансами
- **analytics-service** - Аналитика и мониторинг
- **shared** - Общие библиотеки и типы

## Технологический стек

- **Backend**: NestJS, TypeScript
- **База данных**: PostgreSQL (отдельная БД на сервис)
- **Кэширование**: Redis
- **Очереди**: RabbitMQ
- **Коммуникация**: gRPC, HTTP
- **Контейнеризация**: Docker, Docker Compose

## Быстрый старт

1. Клонируйте репозиторий:
```bash
git clone https://github.com/teramisuslik/MVP.git
cd MVP
```

2. Настройте переменные окружения:
```bash
cp env.example .env
# Отредактируйте .env файл с вашими настройками
```

3. Запустите все сервисы:
```bash
docker-compose up -d
```

4. API будет доступно по адресу: http://localhost:3000

## API Endpoints

### Аутентификация
- `POST /v1/auth/register` - Регистрация пользователя
- `POST /v1/auth/login` - Вход в систему
- `POST /v1/auth/api-keys` - Управление API ключами

### ИИ Прокси
- `POST /v1/chat/completions` - Отправка запросов к ИИ-провайдерам
- `GET /v1/models` - Получение списка доступных моделей

### Биллинг
- `GET /v1/billing/balance` - Получение баланса пользователя
- `GET /v1/billing/history` - История транзакций

## Разработка

Каждый сервис находится в отдельной папке в директории `services/` и может быть разработан независимо.

### Структура проекта

```
services/
├── api-gateway/           # API Gateway
├── auth-service/          # Сервис аутентификации
├── provider-orchestrator/ # Оркестратор провайдеров
├── proxy-service/         # Прокси сервис
├── billing-service/       # Биллинг сервис
├── analytics-service/     # Аналитика
└── shared/               # Общие библиотеки
```

## Лицензия

MIT License

