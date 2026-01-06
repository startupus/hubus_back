# 🚀 Быстрый запуск проекта

## Одна команда для запуска всего проекта

### Windows PowerShell:

```powershell
.\start-project.ps1
```

### Альтернативные варианты:

```powershell
# Без пересборки (использует существующие образы)
.\start-project.ps1 -NoBuild

# Пересборка без кэша (полная пересборка)
.\start-project.ps1 -NoCache
```

## Что было исправлено

1. ✅ **Dockerfile для payment-service** - исправлен путь к main файлу
2. ✅ **Зависимости в docker-compose.yml** - добавлены правильные зависимости между сервисами
3. ✅ **Скрипт запуска** - создан улучшенный скрипт `start-project.ps1` с проверками и обработкой ошибок

## Требования

- Docker Desktop установлен и запущен
- Минимум 8GB RAM свободной памяти
- Минимум 10GB свободного места на диске

## После запуска

Проект будет доступен по следующим адресам:

- **Frontend**: http://localhost:80
- **API Gateway**: http://localhost:3000
- **Auth Service**: http://localhost:3001
- **Provider Orchestrator**: http://localhost:3002
- **Proxy Service**: http://localhost:3003
- **Billing Service**: http://localhost:3004
- **Analytics Service**: http://localhost:3005
- **Payment Service**: http://localhost:3006
- **Certification Service**: http://localhost:3007
- **Anonymization Service**: http://localhost:3008
- **Redis Service**: http://localhost:3009
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)

## Управление

```powershell
# Остановить все контейнеры
docker compose down

# Просмотр логов
docker compose logs -f api-gateway

# Статус контейнеров
docker compose ps

# Перезапустить сервис
docker compose restart api-gateway
```

## Решение проблем

### Ошибка сборки

```powershell
# Полная пересборка без кэша
.\start-project.ps1 -NoCache
```

### Порты заняты

```powershell
# Проверить, какие процессы используют порты
netstat -ano | findstr :3000

# Остановить процесс (замените <PID> на номер процесса)
taskkill /PID <PID> /F
```

### Недостаточно памяти

1. Увеличьте лимит RAM в Docker Desktop (Settings → Resources → Memory)
2. Закройте другие приложения
3. Перезапустите Docker Desktop

### Контейнеры не запускаются

```powershell
# Проверить логи
docker compose logs

# Перезапустить конкретный сервис
docker compose restart [service-name]

# Пересобрать конкретный сервис
docker compose build --no-cache [service-name]
docker compose up -d [service-name]
```
