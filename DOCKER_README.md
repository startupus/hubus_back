# 🐳 AI Aggregator - Docker Deployment Guide

Полное руководство по развертыванию AI Aggregator в Docker-контейнерах.

## 📋 Требования

- **Docker Desktop** (Windows/Mac) или **Docker Engine** (Linux)
- **Docker Compose** v2.0+
- **Git** для клонирования репозитория
- **8GB RAM** минимум для всех сервисов
- **20GB** свободного места на диске

## 🚀 Быстрый старт

### 1. Клонирование и настройка

```bash
# Клонировать репозиторий
git clone <repository-url>
cd ai-aggregator

# Скопировать переменные окружения
cp env.example .env

# Отредактировать .env файл с вашими API ключами
# ЗАМЕНИТЕ следующие ключи на реальные:
# - OPENAI_API_KEY=sk-proj-your-openai-api-key-here
# - OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key-here
# - YANDEX_API_KEY=AQVN-your-yandex-api-key-here
# - YANDEX_FOLDER_ID=b1g-your-yandex-folder-id-here
```

### 2. Запуск всех сервисов

```powershell
# Windows PowerShell
.\docker-start.ps1

# Или вручную
docker-compose up -d
```

### 3. Проверка работы

```powershell
# Тестирование всех endpoints
.\docker-test-endpoints.ps1

# Или проверка статуса
docker-compose ps
```

## 🏗️ Архитектура Docker

### Сервисы

| Сервис | Порт | Описание |
|--------|------|----------|
| **API Gateway** | 3000 | Единая точка входа |
| **Auth Service** | 3001 | Аутентификация и авторизация |
| **Provider Orchestrator** | 3002 | Управление провайдерами |
| **Proxy Service** | 3003 | Прокси к AI провайдерам |
| **Billing Service** | 3004 | Биллинг и платежи |
| **Analytics Service** | 3005 | Аналитика и метрики |

### Базы данных

| База данных | Порт | Сервис |
|-------------|------|--------|
| **auth-db** | 5432 | Auth Service |
| **billing-db** | 5433 | Billing Service |
| **orchestrator-db** | 5434 | Provider Orchestrator |
| **analytics-db** | 5435 | Analytics Service |

### Инфраструктура

| Сервис | Порт | Описание |
|--------|------|----------|
| **Redis** | 6379 | Кэширование |
| **RabbitMQ** | 5672 | Очереди сообщений |
| **RabbitMQ Management** | 15672 | Веб-интерфейс |

## 🔧 Управление сервисами

### Основные команды

```bash
# Запуск всех сервисов
docker-compose up -d

# Остановка всех сервисов
docker-compose down

# Перезапуск конкретного сервиса
docker-compose restart billing-service

# Просмотр логов
docker-compose logs -f billing-service

# Просмотр статуса
docker-compose ps
```

### Скрипты PowerShell

```powershell
# Запуск всех сервисов
.\docker-start.ps1

# Остановка всех сервисов
.\docker-stop.ps1

# Тестирование endpoints
.\docker-test-endpoints.ps1
```

## 🐛 Отладка

### Проверка логов

```bash
# Логи конкретного сервиса
docker-compose logs -f billing-service

# Логи всех сервисов
docker-compose logs -f

# Последние 100 строк логов
docker-compose logs --tail=100
```

### Проверка здоровья сервисов

```bash
# Проверка статуса контейнеров
docker-compose ps

# Проверка ресурсов
docker stats

# Проверка сетей
docker network ls
```

### Вход в контейнер

```bash
# Вход в контейнер billing-service
docker-compose exec billing-service sh

# Выполнение команд в контейнере
docker-compose exec billing-service npm run test
```

## 🔒 Безопасность

### Переменные окружения

Все чувствительные данные хранятся в `.env` файле:

```env
# API ключи (ЗАМЕНИТЕ НА РЕАЛЬНЫЕ!)
OPENAI_API_KEY=sk-proj-your-openai-api-key-here
OPENROUTER_API_KEY=sk-or-v1-your-openrouter-api-key-here
YANDEX_API_KEY=AQVN-your-yandex-api-key-here

# JWT секрет (ИЗМЕНИТЕ В ПРОДАКШЕНЕ!)
JWT_SECRET=your-super-secret-jwt-key-here-change-in-production

# Пароли баз данных
POSTGRES_PASSWORD=password
```

### Сетевая безопасность

- Все сервисы работают в изолированной Docker сети `ai-aggregator`
- Внешние порты открыты только для необходимых сервисов
- Базы данных доступны только внутри Docker сети

## 📊 Мониторинг

### Health Checks

Все сервисы имеют health checks:

```bash
# Проверка здоровья сервиса
curl http://localhost:3004/health

# Проверка всех сервисов
docker-compose ps
```

### Логирование

Логи структурированы в JSON формате:

```json
{
  "timestamp": "2025-10-05T15:30:00.000Z",
  "level": "info",
  "service": "billing-service",
  "message": "Balance updated successfully",
  "userId": "user123",
  "amount": 100
}
```

### Метрики

- **Prometheus** (опционально): `/metrics` endpoint
- **Grafana** (опционально): Дашборды для мониторинга
- **RabbitMQ Management**: http://localhost:15672

## 🚀 Production Deployment

### Оптимизация для продакшена

1. **Измените переменные окружения**:
   ```env
   NODE_ENV=production
   JWT_SECRET=your-super-secure-jwt-secret
   ```

2. **Настройте реальные API ключи**:
   ```env
   OPENAI_API_KEY=sk-proj-your-real-openai-key
   OPENROUTER_API_KEY=sk-or-v1-your-real-openrouter-key
   ```

3. **Настройте мониторинг**:
   ```env
   PROMETHEUS_ENABLED=true
   GRAFANA_ENABLED=true
   ```

4. **Используйте внешние базы данных**:
   ```env
   AUTH_DATABASE_URL=postgresql://user:pass@your-db-host:5432/auth_db
   REDIS_URL=redis://your-redis-host:6379
   ```

### Масштабирование

```bash
# Запуск нескольких экземпляров сервиса
docker-compose up -d --scale billing-service=3

# Использование load balancer
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

## 🛠️ Разработка

### Локальная разработка

```bash
# Запуск только инфраструктуры
docker-compose up -d auth-db billing-db redis rabbitmq

# Запуск сервиса в dev режиме
cd services/billing-service
npm run start:dev
```

### Тестирование

```bash
# Запуск тестов в контейнере
docker-compose exec billing-service npm test

# Запуск тестов с покрытием
docker-compose exec billing-service npm run test:cov
```

## 📝 Troubleshooting

### Частые проблемы

1. **Сервис не запускается**:
   ```bash
   docker-compose logs billing-service
   ```

2. **База данных недоступна**:
   ```bash
   docker-compose ps
   # Проверьте, что auth-db, billing-db запущены
   ```

3. **Порты заняты**:
   ```bash
   netstat -an | findstr :3004
   # Остановите конфликтующие процессы
   ```

4. **Недостаточно памяти**:
   ```bash
   docker stats
   # Увеличьте лимиты памяти в Docker Desktop
   ```

### Очистка

```bash
# Остановка и удаление всех контейнеров
docker-compose down --volumes --remove-orphans

# Удаление всех образов
docker system prune -a

# Очистка томов
docker volume prune
```

## 📞 Поддержка

При возникновении проблем:

1. Проверьте логи: `docker-compose logs -f`
2. Проверьте статус: `docker-compose ps`
3. Проверьте ресурсы: `docker stats`
4. Создайте issue в репозитории с логами

---

**🎉 Готово! Ваш AI Aggregator запущен в Docker!**
