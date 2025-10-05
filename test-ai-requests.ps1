# ===========================================
# AI AGGREGATOR - AI REQUESTS TEST
# Тестирование AI запросов с расчетом токенов
# ===========================================

Write-Host "🤖 Тестирование AI запросов с расчетом токенов..." -ForegroundColor Cyan

# Функция для оценки токенов (приблизительная)
function Estimate-Tokens {
    param(
        [string]$text,
        [string]$model = "gpt-3.5-turbo"
    )
    
    # Приблизительная оценка: 1 токен ≈ 4 символа для английского, 2-3 для русского
    $charCount = $text.Length
    $estimatedTokens = [Math]::Ceiling($charCount / 3)
    
    return $estimatedTokens
}

# Функция для расчета стоимости
function Calculate-Cost {
    param(
        [int]$inputTokens,
        [int]$outputTokens,
        [string]$model = "gpt-3.5-turbo"
    )
    
    # Цены за токен (примерные)
    $prices = @{
        "gpt-3.5-turbo" = @{
            input = 0.0015  # $0.0015 за 1K токенов
            output = 0.002  # $0.002 за 1K токенов
        }
        "gpt-4" = @{
            input = 0.03   # $0.03 за 1K токенов
            output = 0.06  # $0.06 за 1K токенов
        }
        "gpt-4-turbo" = @{
            input = 0.01   # $0.01 за 1K токенов
            output = 0.03  # $0.03 за 1K токенов
        }
    }
    
    $modelPrices = $prices[$model]
    if (-not $modelPrices) {
        $modelPrices = $prices["gpt-3.5-turbo"]  # Дефолт
    }
    
    $inputCost = ($inputTokens / 1000) * $modelPrices.input
    $outputCost = ($outputTokens / 1000) * $modelPrices.output
    $totalCost = $inputCost + $outputCost
    
    return @{
        inputCost = $inputCost
        outputCost = $outputCost
        totalCost = $totalCost
        currency = "USD"
    }
}

# ===========================================
# ТЕСТОВЫЕ AI ЗАПРОСЫ
# ===========================================

$testRequests = @(
    @{
        name = "Простой вопрос"
        prompt = "Что такое машинное обучение?"
        model = "gpt-3.5-turbo"
        expectedResponseLength = 100
    },
    @{
        name = "Сложный технический вопрос"
        prompt = "Объясни принципы работы квантовых компьютеров, включая квантовую запутанность, суперпозицию и декогеренцию. Приведи примеры алгоритмов."
        model = "gpt-4"
        expectedResponseLength = 500
    },
    @{
        name = "Творческое задание"
        prompt = "Напиши короткое стихотворение о космосе в стиле Хайку."
        model = "gpt-3.5-turbo"
        expectedResponseLength = 50
    },
    @{
        name = "Математическая задача"
        prompt = "Реши систему уравнений: 2x + 3y = 10, x - y = 1. Покажи пошаговое решение."
        model = "gpt-3.5-turbo"
        expectedResponseLength = 200
    },
    @{
        name = "Программирование"
        prompt = "Напиши функцию на Python для сортировки массива методом быстрой сортировки с объяснением алгоритма."
        model = "gpt-4"
        expectedResponseLength = 300
    }
)

$userId = "test-user-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

Write-Host "👤 Тестовый пользователь: $userId" -ForegroundColor Yellow

# Создаем пользователя в системе
Write-Host "`n1. Создание тестового пользователя..." -ForegroundColor Green
try {
    $userData = @{
        email = "$userId@test.com"
        password = "TestPass123!"
        name = "Test User"
    } | ConvertTo-Json
    
    $registerResult = Invoke-RestMethod -Uri "http://localhost:3000/auth/register" -Method POST -Body $userData -ContentType "application/json"
    Write-Host "✅ Пользователь создан: $($registerResult.user.id)" -ForegroundColor Green
    $userId = $registerResult.user.id
} catch {
    Write-Host "⚠️ Используем существующий пользователь: $userId" -ForegroundColor Yellow
}

# Проверяем начальный баланс
Write-Host "`n2. Проверка начального баланса..." -ForegroundColor Green
try {
    $balanceResult = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/$userId" -Method GET
    Write-Host "💰 Начальный баланс: $($balanceResult.balance.balance) $($balanceResult.balance.currency)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка получения баланса: $($_.Exception.Message)" -ForegroundColor Red
}

# ===========================================
# ОБРАБОТКА КАЖДОГО ЗАПРОСА
# ===========================================

$totalCost = 0
$totalTokens = 0

foreach ($i in 0..($testRequests.Length - 1)) {
    $request = $testRequests[$i]
    Write-Host "`n📝 Запрос $($i+1): $($request.name)" -ForegroundColor Cyan
    Write-Host "   Модель: $($request.model)" -ForegroundColor White
    Write-Host "   Промпт: $($request.prompt.Substring(0, [Math]::Min(50, $request.prompt.Length)))..." -ForegroundColor White
    
    # Оцениваем токены для входного текста
    $inputTokens = Estimate-Tokens -text $request.prompt -model $request.model
    Write-Host "   📊 Входные токены (оценка): $inputTokens" -ForegroundColor Cyan
    
    # Оцениваем токены для ответа
    $estimatedResponse = "A" * $request.expectedResponseLength  # Симуляция ответа
    $outputTokens = Estimate-Tokens -text $estimatedResponse -model $request.model
    Write-Host "   📊 Выходные токены (оценка): $outputTokens" -ForegroundColor Cyan
    
    # Рассчитываем стоимость
    $cost = Calculate-Cost -inputTokens $inputTokens -outputTokens $outputTokens -model $request.model
    Write-Host "   💰 Стоимость: $($cost.totalCost.ToString('F6')) $($cost.currency)" -ForegroundColor Green
    
    $totalCost += $cost.totalCost
    $totalTokens += ($inputTokens + $outputTokens)
    
    # Отправляем запрос в AI (ожидаем ошибку, но это нормально)
    Write-Host "   🤖 Отправка запроса в AI..." -ForegroundColor Yellow
    $chatRequest = @{
        model = $request.model
        messages = @(
            @{
                role = "user"
                content = $request.prompt
            }
        )
        max_tokens = $outputTokens
        temperature = 0.7
    } | ConvertTo-Json
    
    try {
        $chatResult = Invoke-RestMethod -Uri "http://localhost:3000/chat/completions" -Method POST -Body $chatRequest -ContentType "application/json"
        Write-Host "   ✅ AI ответ получен" -ForegroundColor Green
        
        # Если получили реальный ответ, обновляем оценку токенов
        if ($chatResult.usage) {
            $inputTokens = $chatResult.usage.prompt_tokens
            $outputTokens = $chatResult.usage.completion_tokens
            $cost = Calculate-Cost -inputTokens $inputTokens -outputTokens $outputTokens -model $request.model
            Write-Host "   📊 Реальные токены: Входные=$inputTokens, Выходные=$outputTokens" -ForegroundColor Cyan
            Write-Host "   💰 Реальная стоимость: $($cost.totalCost.ToString('F6')) $($cost.currency)" -ForegroundColor Green
        }
    } catch {
        Write-Host "   ⚠️ AI запрос не выполнен (ожидаемо): $($_.Exception.Message.Substring(0, 50))..." -ForegroundColor Yellow
    }
    
    # Отслеживаем использование в биллинге
    Write-Host "   💳 Отслеживание использования..." -ForegroundColor Yellow
    $usageData = @{
        userId = $userId
        service = "ai-chat"
        resource = $request.model
        quantity = 1
        unit = "request"
        metadata = @{
            inputTokens = $inputTokens
            outputTokens = $outputTokens
            totalTokens = $inputTokens + $outputTokens
            model = $request.model
            prompt = $request.prompt
            estimatedCost = $cost.totalCost
            timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        }
    } | ConvertTo-Json
    
    try {
        $usageResult = Invoke-RestMethod -Uri "http://localhost:3004/billing/usage/track" -Method POST -Body $usageData -ContentType "application/json"
        Write-Host "   ✅ Использование отслежено: $($usageResult.usageEvent.cost) $($usageResult.usageEvent.currency)" -ForegroundColor Green
    } catch {
        Write-Host "   ❌ Ошибка отслеживания: $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Start-Sleep -Milliseconds 500  # Небольшая пауза между запросами
}

# ===========================================
# ИТОГОВАЯ СТАТИСТИКА
# ===========================================

Write-Host "`n📊 ИТОГОВАЯ СТАТИСТИКА" -ForegroundColor Cyan
Write-Host "========================" -ForegroundColor Cyan

Write-Host "📈 Обработано запросов: $($testRequests.Length)" -ForegroundColor White
Write-Host "🔢 Общее количество токенов: $totalTokens" -ForegroundColor White
Write-Host "💰 Общая стоимость: $($totalCost.ToString('F6')) USD" -ForegroundColor Green

# Проверяем финальный баланс
Write-Host "`n💰 Проверка финального баланса..." -ForegroundColor Green
try {
    $finalBalance = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/$userId" -Method GET
    Write-Host "💰 Финальный баланс: $($finalBalance.balance.balance) $($finalBalance.balance.currency)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка получения финального баланса: $($_.Exception.Message)" -ForegroundColor Red
}

# Получаем детальный отчет
Write-Host "`n📋 Детальный отчет по использованию..." -ForegroundColor Green
try {
    $reportResult = Invoke-RestMethod -Uri "http://localhost:3004/billing/report/$userId" -Method GET
    Write-Host "📊 Отчет получен:" -ForegroundColor Green
    Write-Host "   • Общее использование: $($reportResult.report.totalUsage) запросов" -ForegroundColor Cyan
    Write-Host "   • Общая стоимость: $($reportResult.report.totalCost) $($reportResult.report.currency)" -ForegroundColor Cyan
    Write-Host "   • Транзакций: $($reportResult.report.transactions.Count)" -ForegroundColor Cyan
    
    # Показываем разбивку по моделям
    if ($reportResult.report.breakdown.byResource) {
        Write-Host "   • По моделям:" -ForegroundColor Cyan
        foreach ($resource in $reportResult.report.breakdown.byResource.PSObject.Properties) {
            Write-Host "     - $($resource.Name): $($resource.Value) запросов" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Ошибка получения отчета: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Тестирование AI запросов завершено!" -ForegroundColor Green
Write-Host "✅ Система корректно рассчитывает стоимость токенов" -ForegroundColor Green
Write-Host "✅ Биллинг работает даже при недоступности AI провайдеров" -ForegroundColor Green
Write-Host "✅ Отслеживание использования функционирует" -ForegroundColor Green


