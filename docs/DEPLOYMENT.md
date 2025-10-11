# Развертывание

## Предварительные требования

### Системные требования
- **OS**: Linux, macOS, Windows (с WSL2)
- **RAM**: Минимум 8GB, рекомендуется 16GB
- **CPU**: 4+ ядра
- **Диск**: 20GB свободного места

### Программное обеспечение
- **Docker**: 20.10+
- **Docker Compose**: 2.0+
- **Node.js**: 18+ (для разработки)
- **Git**: 2.30+

## Быстрый старт

### 1. Клонирование репозитория

```bash
git clone https://github.com/your-org/ai-aggregator.git
cd ai-aggregator
```

### 2. Настройка окружения

Создайте файл `.env` в корне проекта:

```bash
# Основные настройки
NODE_ENV=development
LOG_LEVEL=info

# JWT
JWT_SECRET=your-super-secret-jwt-key-here

# Базы данных
AUTH_DATABASE_URL=postgresql://postgres:password@auth-db:5432/auth_db
BILLING_DATABASE_URL=postgresql://postgres:password@billing-db:5432/billing_db
PAYMENT_DATABASE_URL=postgresql://postgres:password@payment-db:5432/payment_db
ORCHESTRATOR_DATABASE_URL=postgresql://postgres:password@orchestrator-db:5432/orchestrator_db
ANALYTICS_DATABASE_URL=postgresql://postgres:password@analytics-db:5432/analytics_db

# Redis
REDIS_URL=redis://redis:6379

# RabbitMQ
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

# Платежи
YOOKASSA_SHOP_ID=your_shop_id
YOOKASSA_SECRET_KEY=your_secret_key
CBR_API_URL=https://www.cbr-xml-daily.ru/daily_json.js

# Frontend
FRONTEND_URL=http://localhost:3000
```

### 3. Запуск сервисов

```bash
# Запуск всех сервисов
docker-compose up -d

# Проверка статуса
docker-compose ps

# Просмотр логов
docker-compose logs -f
```

### 4. Проверка работоспособности

```bash
# Health checks
curl http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3004/health
curl http://localhost:3006/health
```

## Конфигурация сервисов

### API Gateway

```yaml
# docker-compose.yml
api-gateway:
  environment:
    - NODE_ENV=development
    - HOST=0.0.0.0
    - PORT=3000
    - AUTH_SERVICE_URL=http://auth-service:3001
    - BILLING_SERVICE_URL=http://billing-service:3004
    - ORCHESTRATOR_SERVICE_URL=http://provider-orchestrator:3002
    - JWT_SECRET=your-super-secret-jwt-key-here
    - REDIS_URL=redis://redis:6379
```

### Auth Service

```yaml
auth-service:
  environment:
    - NODE_ENV=development
    - HOST=0.0.0.0
    - PORT=3001
    - DATABASE_URL=postgresql://postgres:password@auth-db:5432/auth_db
    - JWT_SECRET=your-super-secret-jwt-key-here
    - BILLING_SERVICE_URL=http://billing-service:3004
    - REDIS_URL=redis://redis:6379
```

### Billing Service

```yaml
billing-service:
  environment:
    - NODE_ENV=development
    - HOST=0.0.0.0
    - PORT=3004
    - DATABASE_URL=postgresql://postgres:password@billing-db:5432/billing_db
    - REDIS_URL=redis://redis:6379
    - RABBITMQ_URL=amqp://user:password@rabbitmq:5672
```

## Production развертывание

### 1. Подготовка сервера

```bash
# Обновление системы
sudo apt update && sudo apt upgrade -y

# Установка Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Установка Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Настройка Production окружения

Создайте `docker-compose.prod.yml`:

```yaml
version: '3.8'

services:
  api-gateway:
    build:
      context: .
      dockerfile: ./services/api-gateway/Dockerfile
    ports:
      - "80:3000"
    environment:
      - NODE_ENV=production
      - HOST=0.0.0.0
      - PORT=3000
    restart: unless-stopped
    depends_on:
      - auth-service
      - billing-service
      - provider-orchestrator

  # ... остальные сервисы

  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - api-gateway
    restart: unless-stopped
```

### 3. Настройка Nginx

Создайте `nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream api_gateway {
        server api-gateway:3000;
    }

    server {
        listen 443 ssl;
        server_name your-domain.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        location / {
            proxy_pass http://api_gateway;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### 4. SSL сертификаты

```bash
# Создание самоподписанного сертификата (для тестирования)
openssl req -x509 -newkey rsa:4096 -keyout ssl/key.pem -out ssl/cert.pem -days 365 -nodes

# Или использование Let's Encrypt
certbot --nginx -d your-domain.com
```

### 5. Запуск в Production

```bash
# Запуск в production режиме
docker-compose -f docker-compose.prod.yml up -d

# Проверка статуса
docker-compose -f docker-compose.prod.yml ps

# Просмотр логов
docker-compose -f docker-compose.prod.yml logs -f
```

## Мониторинг и логирование

### 1. Настройка Prometheus

```yaml
# docker-compose.monitoring.yml
version: '3.8'

services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'

  grafana:
    image: grafana/grafana
    ports:
      - "3001:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
```

### 2. Настройка Grafana

```bash
# Создание дашборда
curl -X POST \
  http://localhost:3001/api/dashboards/db \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <your-token>' \
  -d @grafana-dashboard.json
```

### 3. Логирование

```yaml
# docker-compose.logging.yml
version: '3.8'

services:
  elasticsearch:
    image: elasticsearch:7.14.0
    environment:
      - discovery.type=single-node
    ports:
      - "9200:9200"

  kibana:
    image: kibana:7.14.0
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch

  logstash:
    image: logstash:7.14.0
    volumes:
      - ./logstash.conf:/usr/share/logstash/pipeline/logstash.conf
    depends_on:
      - elasticsearch
```

## Бэкапы и восстановление

### 1. Бэкап баз данных

```bash
#!/bin/bash
# backup.sh

# Создание бэкапа всех БД
docker-compose exec -T auth-db pg_dump -U postgres auth_db > backup/auth_db_$(date +%Y%m%d_%H%M%S).sql
docker-compose exec -T billing-db pg_dump -U postgres billing_db > backup/billing_db_$(date +%Y%m%d_%H%M%S).sql
docker-compose exec -T payment-db pg_dump -U postgres payment_db > backup/payment_db_$(date +%Y%m%d_%H%M%S).sql

# Сжатие бэкапов
gzip backup/*.sql
```

### 2. Восстановление из бэкапа

```bash
#!/bin/bash
# restore.sh

# Восстановление БД
gunzip -c backup/auth_db_20231201_120000.sql.gz | docker-compose exec -T auth-db psql -U postgres -d auth_db
gunzip -c backup/billing_db_20231201_120000.sql.gz | docker-compose exec -T billing-db psql -U postgres -d billing_db
gunzip -c backup/payment_db_20231201_120000.sql.gz | docker-compose exec -T payment-db psql -U postgres -d payment_db
```

### 3. Автоматические бэкапы

```bash
# Добавление в crontab
0 2 * * * /path/to/ai-aggregator/backup.sh
```

## Обновление системы

### 1. Rolling update

```bash
# Обновление сервиса по одному
docker-compose up -d --no-deps auth-service
docker-compose up -d --no-deps billing-service
# ... остальные сервисы
```

### 2. Blue-Green развертывание

```bash
# Создание новой версии
docker-compose -f docker-compose.blue.yml up -d

# Переключение трафика
# (настройка load balancer)

# Удаление старой версии
docker-compose -f docker-compose.green.yml down
```

## Troubleshooting

### Частые проблемы

#### 1. Сервис не запускается

```bash
# Проверка логов
docker-compose logs service-name

# Проверка статуса
docker-compose ps

# Перезапуск сервиса
docker-compose restart service-name
```

#### 2. База данных недоступна

```bash
# Проверка подключения к БД
docker-compose exec auth-db psql -U postgres -c "SELECT 1;"

# Проверка переменных окружения
docker-compose exec auth-service env | grep DATABASE
```

#### 3. Проблемы с памятью

```bash
# Проверка использования памяти
docker stats

# Очистка неиспользуемых ресурсов
docker system prune -a
```

#### 4. Проблемы с сетью

```bash
# Проверка сети Docker
docker network ls
docker network inspect ai-aggregator_default

# Тестирование подключения между сервисами
docker-compose exec api-gateway curl http://auth-service:3001/health
```

### Полезные команды

```bash
# Просмотр всех контейнеров
docker-compose ps -a

# Просмотр логов конкретного сервиса
docker-compose logs -f --tail=100 service-name

# Выполнение команд в контейнере
docker-compose exec service-name bash

# Пересборка образов
docker-compose build --no-cache

# Очистка всех данных
docker-compose down -v
docker system prune -a
```
