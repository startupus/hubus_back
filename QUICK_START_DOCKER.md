# 🚀 Быстрый старт в Docker

## Шаг 1: Проверка требований

Убедитесь, что установлены:
- ✅ Docker Desktop (запущен)
- ✅ Минимум 8GB свободной RAM
- ✅ Минимум 10GB свободного места

## Шаг 2: Настройка переменных окружения

Создайте файл `.env` в корне проекта:

```powershell
# Windows PowerShell
Copy-Item env.example .env
```

Откройте `.env` и при необходимости укажите ваши API ключи:
- `OPENAI_API_KEY` - для OpenAI
- `OPENROUTER_API_KEY` - для OpenRouter
- `GITHUB_API_KEY` - для GitHub
- `YANDEX_API_KEY` и `YANDEX_FOLDER_ID` - для YandexGPT

> 💡 Для локальной разработки можно использовать mock значения.

## Шаг 3: Запуск

### Windows (PowerShell):

```powershell
.\docker-start.ps1
```

### Или вручную:

```bash
# Собрать и запустить
docker-compose up -d --build

# Просмотр логов
docker-compose logs -f
```

## Шаг 4: Проверка

Откройте в браузере:
- 🌐 **Frontend**: http://localhost:80
- 🔌 **API Gateway**: http://localhost:3000/health
- 📊 **RabbitMQ**: http://localhost:15672 (guest/guest)

Проверьте статус:
```bash
docker-compose ps
```

## Полезные команды

```bash
# Остановить все
docker-compose down

# Перезапустить сервис
docker-compose restart api-gateway

# Логи сервиса
docker-compose logs -f api-gateway

# Полная пересборка
docker-compose down -v
docker-compose build --no-cache
docker-compose up -d
```

## Решение проблем

**Сервисы не запускаются?**
```bash
docker-compose logs [service-name]
```

**Не хватает памяти?**
- Увеличьте лимит RAM в Docker Desktop (Settings → Resources)

**Порты заняты?**
```powershell
netstat -ano | findstr :3000
```

## Подробная документация

См. [DOCKER_START.md](./DOCKER_START.md) для полной документации.





