# Скрипт для инициализации российских нейросетей по умолчанию
# Запускать после запуска analytics-service

Write-Host "🚀 Инициализация российских нейросетей по умолчанию..." -ForegroundColor Green

# URL analytics-service
$analyticsUrl = "http://localhost:3005"

# Проверяем доступность analytics-service
Write-Host "📡 Проверяем доступность analytics-service..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$analyticsUrl/health" -Method GET -TimeoutSec 10
    Write-Host "✅ Analytics-service доступен" -ForegroundColor Green
} catch {
    Write-Host "❌ Analytics-service недоступен. Убедитесь, что сервис запущен на порту 3005" -ForegroundColor Red
    exit 1
}

# Инициализируем российские нейросети
Write-Host "🇷🇺 Инициализируем российские нейросети..." -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$analyticsUrl/neural-networks/russian-defaults" -Method GET -TimeoutSec 10
    Write-Host "✅ Российские нейросети инициализированы:" -ForegroundColor Green
    
    foreach ($neural in $response.data) {
        Write-Host "  • $($neural.provider)/$($neural.model) - $($neural.description)" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ Ошибка при инициализации российских нейросетей: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Создаем тестовые данные статистики
Write-Host "📊 Создаем тестовые данные статистики..." -ForegroundColor Yellow

$testStats = @(
    @{
        provider = "yandex"
        model = "yandex-gpt"
        requests = 150
        tokens = 50000
        cost = 5.0
        responseTime = 1200
        success = $true
    },
    @{
        provider = "sber"
        model = "gigachat"
        requests = 120
        tokens = 45000
        cost = 4.5
        responseTime = 1100
        success = $true
    },
    @{
        provider = "openai"
        model = "gpt-3.5-turbo"
        requests = 300
        tokens = 100000
        cost = 20.0
        responseTime = 800
        success = $true
    },
    @{
        provider = "anthropic"
        model = "claude-3-sonnet"
        requests = 80
        tokens = 30000
        cost = 15.0
        responseTime = 1500
        success = $true
    }
)

foreach ($stat in $testStats) {
    try {
        $body = @{
            provider = $stat.provider
            model = $stat.model
            requests = $stat.requests
            tokens = $stat.tokens
            cost = $stat.cost
            responseTime = $stat.responseTime
            success = $stat.success
        } | ConvertTo-Json

        # Обновляем статистику (это внутренний API, поэтому используем прямой вызов)
        Write-Host "  • Обновляем статистику для $($stat.provider)/$($stat.model)..." -ForegroundColor Gray
        
        # В реальном приложении здесь был бы вызов API для обновления статистики
        # Пока просто логируем
        Write-Host "    - Запросов: $($stat.requests)" -ForegroundColor Gray
        Write-Host "    - Токенов: $($stat.tokens)" -ForegroundColor Gray
        Write-Host "    - Стоимость: $($stat.cost)" -ForegroundColor Gray
        Write-Host "    - Время ответа: $($stat.responseTime)ms" -ForegroundColor Gray
        
    } catch {
        Write-Host "⚠️ Ошибка при обновлении статистики для $($stat.provider)/$($stat.model): $($_.Exception.Message)" -ForegroundColor Yellow
    }
}

Write-Host "✅ Инициализация завершена!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Доступные эндпоинты:" -ForegroundColor Cyan
Write-Host "  • GET /chat/recommendations - Получить рекомендации нейросетей" -ForegroundColor White
Write-Host "  • GET /chat/popular - Получить популярные нейросети" -ForegroundColor White
Write-Host "  • GET /neural-networks/russian-defaults - Российские по умолчанию" -ForegroundColor White
Write-Host ""
Write-Host "🧪 Тестирование рекомендаций:" -ForegroundColor Cyan
Write-Host "  curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:3000/chat/recommendations" -ForegroundColor White
Write-Host "  curl -H 'Authorization: Bearer YOUR_TOKEN' http://localhost:3000/chat/popular" -ForegroundColor White
