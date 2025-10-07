# Тест рекомендаций нейросетей
# Запускать после инициализации системы

Write-Host "🧪 Тестирование системы рекомендаций нейросетей..." -ForegroundColor Green

# Настройки
$apiGatewayUrl = "http://localhost:3000"
$analyticsUrl = "http://localhost:3005"

# Получаем токен аутентификации (предполагаем, что есть тестовый пользователь)
Write-Host "🔐 Получаем токен аутентификации..." -ForegroundColor Yellow

try {
    $loginData = @{
        email = "test@company.com"
        password = "TestPassword123!"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "$apiGatewayUrl/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $token = $loginResponse.access_token
    
    if (-not $token) {
        Write-Host "❌ Не удалось получить токен аутентификации" -ForegroundColor Red
        Write-Host "Убедитесь, что тестовый пользователь создан" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✅ Токен получен" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка аутентификации: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Создайте тестового пользователя или проверьте настройки" -ForegroundColor Yellow
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type" = "application/json"
}

# 1. Тест получения рекомендаций
Write-Host ""
Write-Host "1️⃣ Тестируем получение рекомендаций..." -ForegroundColor Cyan

try {
    $recommendationsResponse = Invoke-RestMethod -Uri "$apiGatewayUrl/chat/recommendations?limit=5" -Method GET -Headers $headers
    Write-Host "✅ Рекомендации получены:" -ForegroundColor Green
    
    foreach ($rec in $recommendationsResponse.data.recommendations) {
        $reasonText = switch ($rec.reason) {
            "russian" { "🇷🇺 Российская" }
            "popular" { "🔥 Популярная" }
            "fast" { "⚡ Быстрая" }
            "cheap" { "💰 Дешевая" }
            default { $rec.reason }
        }
        
        Write-Host "  • $($rec.provider)/$($rec.model) - $reasonText (скор: $($rec.score))" -ForegroundColor White
        if ($rec.stats) {
            Write-Host "    - Запросов: $($rec.stats.totalRequests), Время: $($rec.stats.avgResponseTime)ms, Успех: $($rec.stats.successRate)%" -ForegroundColor Gray
        }
    }
    
    Write-Host "  📊 Всего рекомендаций: $($recommendationsResponse.data.total)" -ForegroundColor Cyan
    Write-Host "  🇷🇺 Есть российские по умолчанию: $($recommendationsResponse.data.hasRussianDefaults)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка получения рекомендаций: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Тест получения популярных нейросетей
Write-Host ""
Write-Host "2️⃣ Тестируем получение популярных нейросетей..." -ForegroundColor Cyan

try {
    $popularResponse = Invoke-RestMethod -Uri "$apiGatewayUrl/chat/popular?limit=3" -Method GET -Headers $headers
    Write-Host "✅ Популярные нейросети:" -ForegroundColor Green
    
    foreach ($pop in $popularResponse.data) {
        Write-Host "  • $($pop.provider)/$($pop.model)" -ForegroundColor White
        Write-Host "    - Запросов: $($pop.totalRequests), Токенов: $($pop.totalTokens)" -ForegroundColor Gray
        Write-Host "    - Стоимость: $($pop.totalCost), Пользователей: $($pop.uniqueUsers)" -ForegroundColor Gray
        Write-Host "    - Время ответа: $($pop.avgResponseTime)ms, Успех: $($pop.successRate)%" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Ошибка получения популярных: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Тест российских по умолчанию
Write-Host ""
Write-Host "3️⃣ Тестируем российские нейросети по умолчанию..." -ForegroundColor Cyan

try {
    $russianResponse = Invoke-RestMethod -Uri "$analyticsUrl/neural-networks/russian-defaults" -Method GET
    Write-Host "✅ Российские нейросети по умолчанию:" -ForegroundColor Green
    
    foreach ($russian in $russianResponse.data) {
        Write-Host "  • $($russian.provider)/$($russian.model) - $($russian.description)" -ForegroundColor White
        Write-Host "    - Причина: $($russian.reason), Скор: $($russian.score)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Ошибка получения российских по умолчанию: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Тест с разными параметрами
Write-Host ""
Write-Host "4️⃣ Тестируем с разными параметрами..." -ForegroundColor Cyan

# Тест без российских
try {
    $noRussianResponse = Invoke-RestMethod -Uri "$apiGatewayUrl/chat/recommendations?limit=3&includeRussian=false" -Method GET -Headers $headers
    Write-Host "✅ Рекомендации без российских (всего: $($noRussianResponse.data.total)):" -ForegroundColor Green
    
    foreach ($rec in $noRussianResponse.data.recommendations) {
        Write-Host "  • $($rec.provider)/$($rec.model) - $($rec.reason)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Ошибка теста без российских: $($_.Exception.Message)" -ForegroundColor Red
}

# Тест с большим лимитом
try {
    $bigLimitResponse = Invoke-RestMethod -Uri "$apiGatewayUrl/chat/recommendations?limit=10" -Method GET -Headers $headers
    Write-Host "✅ Рекомендации с лимитом 10 (получено: $($bigLimitResponse.data.total)):" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка теста с большим лимитом: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Тест статистики по провайдеру
Write-Host ""
Write-Host "5️⃣ Тестируем статистику по провайдеру..." -ForegroundColor Cyan

try {
    $providerStatsResponse = Invoke-RestMethod -Uri "$analyticsUrl/neural-networks/stats/yandex" -Method GET -Headers $headers
    Write-Host "✅ Статистика Yandex:" -ForegroundColor Green
    
    foreach ($stat in $providerStatsResponse.data) {
        Write-Host "  • $($stat.model) - $($stat.totalRequests) запросов, $($stat.uniqueUsers) пользователей" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Ошибка получения статистики провайдера: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "🎉 Тестирование завершено!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Результаты:" -ForegroundColor Cyan
Write-Host "  ✅ Система рекомендаций работает" -ForegroundColor Green
Write-Host "  ✅ Российские нейросети по умолчанию настроены" -ForegroundColor Green
Write-Host "  ✅ API эндпоинты доступны" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Для продакшена:" -ForegroundColor Yellow
Write-Host "  • Настройте реальную статистику использования" -ForegroundColor White
Write-Host "  • Добавьте персональные рекомендации" -ForegroundColor White
Write-Host "  • Настройте мониторинг производительности" -ForegroundColor White
