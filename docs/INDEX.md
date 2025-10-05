# AI Aggregator Documentation Index

## 📚 Полная документация системы

### 🎯 Основные документы
- [README](README.md) - Обзор системы и быстрый старт
- [API Documentation](API.md) - Полная документация API
- [Deployment Guide](DEPLOYMENT.md) - Руководство по развертыванию

### 🏗️ Архитектура сервисов
- [API Gateway](services/api-gateway.md) - Единая точка входа
- [Auth Service](services/auth-service.md) - Аутентификация и авторизация
- [Billing Service](services/billing-service.md) - Биллинг и тарификация
- [Provider Orchestrator](services/provider-orchestrator.md) - Маршрутизация запросов
- [Proxy Service](services/proxy-service.md) - Проксирование к AI провайдерам
- [Analytics Service](services/analytics-service.md) - Аналитика и мониторинг

## 🚀 Быстрый старт

### 1. Клонирование и запуск
```bash
git clone https://github.com/teramisuslik/MVP.git
cd MVP
docker-compose up -d
```

### 2. Проверка статуса
```bash
docker-compose ps
curl http://localhost:3000/health
```

### 3. Тестирование API
```bash
# Регистрация пользователя
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123","firstName":"John","lastName":"Doe"}'

# AI запрос
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"model":"gpt-4","messages":[{"role":"user","content":"Hello!"}]}'
```

## 🏗️ Архитектура системы

### Микросервисы
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

### Технологический стек
- **Backend**: NestJS, TypeScript
- **Database**: PostgreSQL, Redis
- **Message Queue**: RabbitMQ
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **Monitoring**: Prometheus, Grafana

## 📡 API Endpoints

### Основные endpoints
- `POST /v1/auth/register` - Регистрация пользователя
- `POST /v1/auth/login` - Вход в систему
- `POST /v1/chat/completions` - AI запросы
- `GET /v1/billing/balance` - Баланс пользователя
- `GET /v1/analytics/dashboard` - Аналитическая панель

### Swagger документация
- Development: http://localhost:3000/api
- Production: https://api.ai-aggregator.com/api

## 🔧 Разработка

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

### Команды разработки
```bash
# Установка зависимостей
npm install

# Запуск в режиме разработки
npm run start:dev

# Тестирование
npm run test
npm run test:e2e

# Сборка
npm run build
```

## 🚀 Развертывание

### Development
```bash
docker-compose up -d
```

### Staging
```bash
helm install ai-aggregator ./helm/ai-aggregator \
  --namespace ai-aggregator \
  --values ./helm/ai-aggregator/values-staging.yaml
```

### Production
```bash
helm install ai-aggregator ./helm/ai-aggregator \
  --namespace ai-aggregator \
  --values ./helm/ai-aggregator/values-production.yaml
```

## 📊 Мониторинг

### Health Checks
- API Gateway: http://localhost:3000/health
- Auth Service: http://localhost:3001/health
- Billing Service: http://localhost:3004/health
- Provider Orchestrator: http://localhost:3002/health
- Proxy Service: http://localhost:3003/health
- Analytics Service: http://localhost:3005/health

### Метрики
- Prometheus: http://localhost:9090
- Grafana: http://localhost:3001
- Kibana: http://localhost:5601

## 🔒 Безопасность

### Аутентификация
- JWT токены для пользователей
- API ключи для внешних интеграций
- Валидация всех входящих данных

### Rate Limiting
- Ограничение запросов по пользователю
- Защита от DDoS атак
- Приоритизация запросов

## 📈 Масштабирование

### Горизонтальное масштабирование
- Load balancing через API Gateway
- Auto-scaling на основе метрик
- Database sharding

### Оптимизация производительности
- Кэширование в Redis
- Connection pooling
- Асинхронная обработка через RabbitMQ

## 🤝 Вклад в проект

### Процесс разработки
1. Fork репозитория
2. Создайте feature branch
3. Внесите изменения
4. Создайте Pull Request

### Стандарты кода
- TypeScript с strict mode
- ESLint + Prettier
- Unit и E2E тесты
- Документация для всех API

## 📞 Поддержка

### Контакты
- GitHub Issues: https://github.com/teramisuslik/MVP/issues
- Email: support@ai-aggregator.com
- Discord: https://discord.gg/ai-aggregator

### Ресурсы
- [GitHub Repository](https://github.com/teramisuslik/MVP)
- [API Documentation](https://api.ai-aggregator.com/docs)
- [Status Page](https://status.ai-aggregator.com)

## 📄 Лицензия

MIT License - см. [LICENSE](../LICENSE) файл для деталей.

---

**AI Aggregator** - Масштабируемая платформа для агрегации AI провайдеров 🚀
