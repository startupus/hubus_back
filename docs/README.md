# AI Aggregator - Микросервисная архитектура

## 🎯 Обзор

AI Aggregator - это масштабируемая микросервисная платформа для агрегации и маршрутизации запросов к различным AI провайдерам (OpenAI, OpenRouter, Yandex и др.).

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  Auth Service   │    │ Billing Service │
│   (Port: 3000)  │    │  (Port: 3001)   │    │  (Port: 3004)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │              ┌─────────────────┐               │
         └──────────────│Provider Orchestrator│───────────┘
                        │   (Port: 3002)   │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │  Proxy Service  │
                        │  (Port: 3003)   │
                        └─────────────────┘
                                 │
                        ┌─────────────────┐
                        │Analytics Service │
                        │  (Port: 3005)    │
                        └─────────────────┘
```

## 🚀 Быстрый старт

### Предварительные требования
- Docker & Docker Compose
- Node.js 18+
- PostgreSQL
- Redis
- RabbitMQ

### Запуск системы
```bash
# Клонирование репозитория
git clone https://github.com/teramisuslik/MVP.git
cd MVP

# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps
```

## 📚 Документация сервисов

- [API Gateway](services/api-gateway/README.md) - Единая точка входа
- [Auth Service](services/auth-service/README.md) - Аутентификация и авторизация
- [Billing Service](services/billing-service/README.md) - Биллинг и тарификация
- [Provider Orchestrator](services/provider-orchestrator/README.md) - Маршрутизация запросов
- [Proxy Service](services/proxy-service/README.md) - Проксирование к AI провайдерам
- [Analytics Service](services/analytics-service/README.md) - Аналитика и мониторинг

## 🔧 API Endpoints

### Основные endpoints
- `POST /v1/auth/register` - Регистрация пользователя
- `POST /v1/auth/login` - Вход в систему
- `POST /v1/chat/completions` - AI запросы
- `GET /v1/billing/balance` - Баланс пользователя
- `GET /v1/analytics/dashboard` - Аналитическая панель

## 🛠️ Разработка

### Структура проекта
```
services/
├── api-gateway/          # Единая точка входа
├── auth-service/         # Аутентификация
├── billing-service/      # Биллинг
├── provider-orchestrator/ # Маршрутизация
├── proxy-service/        # Проксирование
├── analytics-service/    # Аналитика
└── shared/              # Общие библиотеки
```

### Технологический стек
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL, Redis
- **Message Queue**: RabbitMQ
- **Containerization**: Docker
- **Monitoring**: Prometheus, Grafana

## 📊 Мониторинг

- **Health Checks**: `/health` на каждом сервисе
- **Metrics**: Prometheus endpoints
- **Logs**: Централизованное логирование
- **Tracing**: Распределенная трассировка

## 🔒 Безопасность

- JWT токены для аутентификации
- API ключи для внешних интеграций
- Валидация всех входящих данных
- Rate limiting и защита от DDoS

## 📈 Масштабирование

- Горизонтальное масштабирование сервисов
- Load balancing через API Gateway
- Кэширование в Redis
- Асинхронная обработка через RabbitMQ

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения
4. Создайте Pull Request

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE) файл для деталей.
