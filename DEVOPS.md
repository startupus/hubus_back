# AI Aggregator - DevOps Процессы

Этот документ описывает лучшие практики и процессы для разработки и развертывания AI Aggregator системы.

## 🚀 Быстрый старт

### Полная пересборка системы
```powershell
# Пересборка всех контейнеров с нуля
.\rebuild-all.ps1

# Пересборка без тестов
.\rebuild-all.ps1 -SkipTests

# Пересборка с сохранением volumes
.\rebuild-all.ps1 -KeepVolumes

# Подробный вывод
.\rebuild-all.ps1 -Verbose
```

### Пересборка конкретного сервиса
```powershell
# Пересборка analytics-service
.\rebuild-service.ps1 -ServiceName analytics-service

# Пересборка с очисткой кэша
.\rebuild-service.ps1 -ServiceName analytics-service -NoCache

# Пересборка без перезапуска
.\rebuild-service.ps1 -ServiceName analytics-service -Restart:$false
```

### Мониторинг системы
```powershell
# Общий статус
.\monitor-system.ps1

# Режим мониторинга (обновление каждые 10 сек)
.\monitor-system.ps1 -Watch

# Просмотр логов
.\monitor-system.ps1 -Logs

# Логи конкретного сервиса
.\monitor-system.ps1 -Logs -Service analytics-service -LogLines 100
```

## 📋 Ручные команды

### Остановка и очистка
```bash
# Остановка всех контейнеров
docker compose down

# Остановка с удалением volumes
docker compose down -v

# Очистка Docker кэша
docker system prune -f

# Очистка всех неиспользуемых ресурсов
docker system prune -a -f
```

### Пересборка
```bash
# Пересборка всех сервисов
docker compose build --no-cache

# Пересборка конкретного сервиса
docker compose build --no-cache analytics-service

# Пересборка и запуск
docker compose up --build -d
```

### Запуск и управление
```bash
# Запуск всех сервисов
docker compose up -d

# Запуск конкретного сервиса
docker compose up -d analytics-service

# Перезапуск сервиса
docker compose restart analytics-service

# Остановка сервиса
docker compose stop analytics-service
```

### Мониторинг и логи
```bash
# Статус контейнеров
docker compose ps

# Логи всех сервисов
docker compose logs

# Логи конкретного сервиса
docker compose logs analytics-service

# Логи в реальном времени
docker compose logs -f analytics-service

# Последние 100 строк логов
docker compose logs --tail=100 analytics-service
```

## 🔧 Конфигурация

### Environment переменные
Основные переменные окружения настраиваются в `docker-compose.yml`:

```yaml
environment:
  - NODE_ENV=development
  - LOG_LEVEL=info
  - LOG_FORMAT=json
  - DATABASE_URL=postgresql://...
```

### Volumes
Система использует следующие volumes:
- `auth_db_data` - данные auth-service
- `billing_db_data` - данные billing-service
- `orchestrator_db_data` - данные provider-orchestrator
- `analytics_db_data` - данные analytics-service
- `analytics_logs` - логи analytics-service
- `redis_data` - данные Redis
- `rabbitmq_data` - данные RabbitMQ

## 🐛 Отладка

### Проблемы с пересборкой
1. **Кэш Docker**: Используйте `--no-cache` флаг
2. **Зависимости**: Убедитесь, что shared пакет пересобран
3. **Volumes**: При необходимости очистите volumes

### Проблемы с запуском
1. **Порты**: Проверьте, что порты не заняты
2. **База данных**: Убедитесь, что БД запущена
3. **Зависимости**: Проверьте порядок запуска сервисов

### Проблемы с логированием
1. **JSON логи**: Проверьте `LOG_FORMAT=json`
2. **Уровень логов**: Проверьте `LOG_LEVEL=info`
3. **Volumes**: Убедитесь, что volume для логов смонтирован

## 📊 Мониторинг

### Health Checks
Все сервисы предоставляют health endpoints:
- API Gateway: `http://localhost:3000/health`
- Auth Service: `http://localhost:3001/health`
- Provider Orchestrator: `http://localhost:3002/health`
- Proxy Service: `http://localhost:3003/health`
- Billing Service: `http://localhost:3004/health`
- Analytics Service: `http://localhost:3005/health`

### Логирование
- **Формат**: JSON для структурированного логирования
- **Уровни**: error, warn, info, debug
- **Ротация**: Daily rotating files
- **Корреляция**: Request ID для трассировки

### Метрики
- **Uptime**: Время работы сервиса
- **Memory**: Использование памяти
- **Database**: Статус подключения к БД
- **Dependencies**: Статус зависимостей

## 🔄 CI/CD Процесс

### Рекомендуемый workflow:
1. **Разработка**: Изменения в исходном коде
2. **Тестирование**: Локальные тесты
3. **Пересборка**: `.\rebuild-all.ps1`
4. **Тестирование**: Проверка health endpoints
5. **Деплой**: Запуск в production

### Автоматизация:
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy
        run: |
          docker compose down
          docker compose build --no-cache
          docker compose up -d
```

## 🚨 Troubleshooting

### Частые проблемы:

1. **"Port already in use"**
   ```bash
   # Найти процесс, использующий порт
   netstat -ano | findstr :3000
   # Завершить процесс
   taskkill /PID <PID> /F
   ```

2. **"Database connection failed"**
   ```bash
   # Проверить статус БД
   docker compose ps
   # Перезапустить БД
   docker compose restart auth-db
   ```

3. **"Module not found"**
   ```bash
   # Пересобрать shared пакет
   docker compose build --no-cache shared
   # Пересобрать зависимый сервис
   docker compose build --no-cache analytics-service
   ```

4. **"Permission denied"**
   ```bash
   # Проверить права доступа к volumes
   docker volume ls
   # Очистить volumes при необходимости
   docker compose down -v
   ```

## 📚 Дополнительные ресурсы

- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Winston Logging](https://github.com/winstonjs/winston)
- [Prisma Documentation](https://www.prisma.io/docs/)
