# ⚡ Быстрый запуск AI Aggregator

## 🚀 За 5 минут

### 1. Установите Docker Desktop
- Скачайте с [docker.com](https://www.docker.com/products/docker-desktop/)
- Установите и запустите

### 2. Клонируйте и запустите
```bash
# Клонируем проект
git clone https://github.com/teramisuslik/MVP.git
cd MVP

# Запускаем все сервисы
docker-compose up -d

# Ждем 3 минуты
Start-Sleep -Seconds 180

# Проверяем
docker-compose ps
```

### 3. Тестируем
```bash
# Автоматический тест (Windows)
.\test-complete-system.ps1

# Или проверяем вручную
curl http://localhost:3000/health
curl http://localhost:3000/v1/models
```

## ✅ Готово!

**Доступные сервисы:**
- API Gateway: http://localhost:3000
- Auth Service: http://localhost:3001
- Models (БЕЗ auth): http://localhost:3000/v1/models

**Ожидаемый результат:**
- 21/21 тестов пройдено ✅
- 100% Success Rate 🎯

---

*Подробная инструкция: [README_DEPLOYMENT.md](README_DEPLOYMENT.md)*
