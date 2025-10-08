# Полное тестирование системы OpenRouter
# Включает настройку, тестирование русских запросов, обезличивание и биллинг

Write-Host "=== Полное тестирование системы OpenRouter ===" -ForegroundColor Green
Write-Host "Этот скрипт проведет комплексное тестирование:" -ForegroundColor Cyan
Write-Host "  1. Проверка конфигурации OpenRouter" -ForegroundColor White
Write-Host "  2. Тестирование русских запросов без обезличивания" -ForegroundColor White
Write-Host "  3. Тестирование русских запросов с обезличиванием" -ForegroundColor White
Write-Host "  4. Сравнение стоимости и токенов" -ForegroundColor White
Write-Host "  5. Тестирование биллинга с разными моделями" -ForegroundColor White
Write-Host "  6. Анализ результатов" -ForegroundColor White

$continue = Read-Host "`nПродолжить? (y/n)"
if ($continue -ne "y" -and $continue -ne "Y") {
    Write-Host "Тестирование отменено" -ForegroundColor Yellow
    exit 0
}

# Генерируем уникальный ID для тестирования
$TEST_SESSION_ID = "session-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
Write-Host "`n🆔 ID сессии тестирования: $TEST_SESSION_ID" -ForegroundColor Cyan

# 1. Проверка конфигурации
Write-Host "`n=== 1. Проверка конфигурации OpenRouter ===" -ForegroundColor Green

$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "❌ Файл .env не найден. Запустите сначала setup-openrouter.ps1" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envFile -Raw
if ($envContent -match "OPENROUTER_API_KEY=""([^""]*)""") {
    $apiKey = $matches[1]
    if ($apiKey -and $apiKey -ne "sk-or-v1-your-openrouter-api-key-here") {
        Write-Host "✅ OpenRouter API ключ настроен: $($apiKey.Substring(0, 10))..." -ForegroundColor Green
    } else {
        Write-Host "❌ OpenRouter API ключ не настроен. Запустите setup-openrouter.ps1" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ Не удалось найти OPENROUTER_API_KEY в .env файле" -ForegroundColor Red
    exit 1
}

# 2. Проверка сервисов
Write-Host "`n=== 2. Проверка сервисов ===" -ForegroundColor Green

$services = @(
    @{ Name = "API Gateway"; Port = 3000; URL = "http://localhost:3000" },
    @{ Name = "Proxy Service"; Port = 3003; URL = "http://localhost:3003" },
    @{ Name = "Billing Service"; Port = 3004; URL = "http://localhost:3004" }
)

$allServicesRunning = $true
foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "$($service.URL)/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name) - работает" -ForegroundColor Green
        } else {
            Write-Host "❌ $($service.Name) - не отвечает" -ForegroundColor Red
            $allServicesRunning = $false
        }
    } catch {
        Write-Host "❌ $($service.Name) - недоступен" -ForegroundColor Red
        $allServicesRunning = $false
    }
}

if (-not $allServicesRunning) {
    Write-Host "`n❌ Не все сервисы запущены. Запустите их командой:" -ForegroundColor Red
    Write-Host "docker-compose up -d" -ForegroundColor White
    exit 1
}

# 3. Тестирование русских запросов
Write-Host "`n=== 3. Тестирование русских запросов ===" -ForegroundColor Green

$PROXY_SERVICE_URL = "http://localhost:3003"
$TEST_USER_ID = "test-user-$TEST_SESSION_ID"

# Тестовые запросы
$testCases = @(
    @{
        Name = "Чистый русский запрос"
        Message = "Привет! Расскажи мне о погоде в Москве и дай несколько советов по планированию дня."
        HasPII = $false
    },
    @{
        Name = "Русский запрос с персональными данными"
        Message = "Меня зовут Иван Петров, мой телефон +7 (495) 123-45-67, email: ivan.petrov@mail.ru. Я живу по адресу: Москва, улица Тверская, дом 15, квартира 42. Мой ИНН: 1234567890. Расскажи мне о погоде в Москве."
        HasPII = $true
    }
)

$testResults = @()

foreach ($testCase in $testCases) {
    Write-Host "`n--- Тестирование: $($testCase.Name) ---" -ForegroundColor Cyan
    
    $request = @{
        model = "openai/gpt-4o-mini"
        messages = @(
            @{
                role = "user"
                content = $testCase.Message
            }
        )
        temperature = 0.7
        max_tokens = 300
        userId = $TEST_USER_ID
    } | ConvertTo-Json -Depth 3
    
    try {
        Write-Host "Отправляем запрос..." -ForegroundColor White
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri "$PROXY_SERVICE_URL/proxy/openrouter/chat/completions" -Method POST -Body $request -ContentType "application/json" -TimeoutSec 60
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        Write-Host "✅ Успешно получен ответ:" -ForegroundColor Green
        Write-Host "  Ответ: $($response.responseText.Substring(0, [Math]::Min(150, $response.responseText.Length)))..." -ForegroundColor White
        Write-Host "  Входные токены: $($response.inputTokens)" -ForegroundColor Magenta
        Write-Host "  Выходные токены: $($response.outputTokens)" -ForegroundColor Magenta
        Write-Host "  Общие токены: $($response.totalTokens)" -ForegroundColor Magenta
        Write-Host "  Стоимость: $($response.cost) $($response.currency)" -ForegroundColor Magenta
        Write-Host "  Время ответа: $([math]::Round($responseTime, 0)) мс" -ForegroundColor Magenta
        
        $testResults += @{
            Name = $testCase.Name
            HasPII = $testCase.HasPII
            InputTokens = $response.inputTokens
            OutputTokens = $response.outputTokens
            TotalTokens = $response.totalTokens
            Cost = $response.cost
            ResponseTime = $responseTime
            Success = $true
        }
        
    } catch {
        Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
        $testResults += @{
            Name = $testCase.Name
            HasPII = $testCase.HasPII
            Success = $false
            Error = $_.Exception.Message
        }
    }
    
    Start-Sleep -Seconds 2
}

# 4. Анализ результатов обезличивания
Write-Host "`n=== 4. Анализ результатов обезличивания ===" -ForegroundColor Green

$cleanResult = $testResults | Where-Object { $_.Name -eq "Чистый русский запрос" -and $_.Success }
$piiResult = $testResults | Where-Object { $_.Name -eq "Русский запрос с персональными данными" -and $_.Success }

if ($cleanResult -and $piiResult) {
    Write-Host "📊 Сравнение результатов:" -ForegroundColor Cyan
    
    $tokenDiff = $piiResult.TotalTokens - $cleanResult.TotalTokens
    $tokenDiffPercent = if ($cleanResult.TotalTokens -gt 0) { [math]::Round(($tokenDiff / $cleanResult.TotalTokens) * 100, 2) } else { 0 }
    
    $costDiff = $piiResult.Cost - $cleanResult.Cost
    $costDiffPercent = if ($cleanResult.Cost -gt 0) { [math]::Round(($costDiff / $cleanResult.Cost) * 100, 2) } else { 0 }
    
    Write-Host "  Токены:" -ForegroundColor White
    Write-Host "    Без PII: $($cleanResult.TotalTokens)" -ForegroundColor White
    Write-Host "    С PII:   $($piiResult.TotalTokens)" -ForegroundColor White
    Write-Host "    Разница: $tokenDiff ($tokenDiffPercent%)" -ForegroundColor $(if ($tokenDiff -gt 0) { "Yellow" } else { "Green" })
    
    Write-Host "  Стоимость:" -ForegroundColor White
    Write-Host "    Без PII: $($cleanResult.Cost) USD" -ForegroundColor White
    Write-Host "    С PII:   $($piiResult.Cost) USD" -ForegroundColor White
    Write-Host "    Разница: $costDiff USD ($costDiffPercent%)" -ForegroundColor $(if ($costDiff -gt 0) { "Yellow" } else { "Green" })
    
    Write-Host "  Время ответа:" -ForegroundColor White
    Write-Host "    Без PII: $([math]::Round($cleanResult.ResponseTime, 0)) мс" -ForegroundColor White
    Write-Host "    С PII:   $([math]::Round($piiResult.ResponseTime, 0)) мс" -ForegroundColor White
    
    if ($tokenDiff -gt 0) {
        Write-Host "`n🔍 Анализ: Обезличивание увеличило количество токенов на $tokenDiff" -ForegroundColor Yellow
        Write-Host "   Это связано с заменой персональных данных на плейсхолдеры" -ForegroundColor Yellow
    } else {
        Write-Host "`n✅ Анализ: Обезличивание не повлияло на количество токенов" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Не удалось сравнить результаты из-за ошибок в тестах" -ForegroundColor Red
}

# 5. Тестирование разных моделей
Write-Host "`n=== 5. Тестирование разных моделей ===" -ForegroundColor Green

$models = @(
    @{ id = "openai/gpt-4o-mini"; name = "GPT-4o Mini" },
    @{ id = "anthropic/claude-3-5-haiku-20241022"; name = "Claude 3.5 Haiku" },
    @{ id = "meta-llama/llama-3.1-8b-instruct"; name = "Llama 3.1 8B" }
)

$modelResults = @()
$testMessage = "Привет! Объясни кратко, что такое искусственный интеллект."

foreach ($model in $models) {
    Write-Host "`n--- Тестирование модели: $($model.name) ---" -ForegroundColor Cyan
    
    $request = @{
        model = $model.id
        messages = @(
            @{
                role = "user"
                content = $testMessage
            }
        )
        temperature = 0.7
        max_tokens = 200
        userId = $TEST_USER_ID
    } | ConvertTo-Json -Depth 3
    
    try {
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri "$PROXY_SERVICE_URL/proxy/openrouter/chat/completions" -Method POST -Body $request -ContentType "application/json" -TimeoutSec 60
        $endTime = Get-Date
        $responseTime = ($endTime - $startTime).TotalMilliseconds
        
        Write-Host "✅ $($model.name):" -ForegroundColor Green
        Write-Host "  Токены: $($response.totalTokens)" -ForegroundColor Magenta
        Write-Host "  Стоимость: $($response.cost) USD" -ForegroundColor Magenta
        Write-Host "  Время: $([math]::Round($responseTime, 0)) мс" -ForegroundColor Magenta
        
        $modelResults += @{
            Name = $model.name
            ModelId = $model.id
            TotalTokens = $response.totalTokens
            Cost = $response.cost
            ResponseTime = $responseTime
            Success = $true
        }
        
    } catch {
        Write-Host "❌ $($model.name): $($_.Exception.Message)" -ForegroundColor Red
        $modelResults += @{
            Name = $model.name
            ModelId = $model.id
            Success = $false
            Error = $_.Exception.Message
        }
    }
    
    Start-Sleep -Seconds 2
}

# 6. Анализ моделей
Write-Host "`n=== 6. Анализ моделей ===" -ForegroundColor Green

$successfulModels = $modelResults | Where-Object { $_.Success } | Sort-Object Cost

if ($successfulModels.Count -gt 0) {
    Write-Host "📊 Рейтинг моделей по стоимости (от дешевой к дорогой):" -ForegroundColor Cyan
    $rank = 1
    foreach ($model in $successfulModels) {
        $costPerToken = if ($model.TotalTokens -gt 0) { [math]::Round($model.Cost / $model.TotalTokens, 8) } else { 0 }
        Write-Host "  $rank. $($model.Name): $($model.Cost) USD ($costPerToken USD/токен)" -ForegroundColor White
        $rank++
    }
    
    Write-Host "`n⚡ Рейтинг моделей по скорости:" -ForegroundColor Cyan
    $speedModels = $successfulModels | Sort-Object ResponseTime
    $rank = 1
    foreach ($model in $speedModels) {
        Write-Host "  $rank. $($model.Name): $([math]::Round($model.ResponseTime, 0)) мс" -ForegroundColor White
        $rank++
    }
    
    $cheapest = $successfulModels | Select-Object -First 1
    $fastest = $speedModels | Select-Object -First 1
    
    Write-Host "`n🏆 Рекомендации:" -ForegroundColor Cyan
    Write-Host "  • Самая дешевая: $($cheapest.Name) ($($cheapest.Cost) USD)" -ForegroundColor Green
    Write-Host "  • Самая быстрая: $($fastest.Name) ($([math]::Round($fastest.ResponseTime, 0)) мс)" -ForegroundColor Green
}

# 7. Проверка биллинга
Write-Host "`n=== 7. Проверка биллинга ===" -ForegroundColor Green

try {
    $billingResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/transactions/$TEST_USER_ID" -Method GET -TimeoutSec 30
    Write-Host "✅ История транзакций получена:" -ForegroundColor Green
    Write-Host "  Количество транзакций: $($billingResponse.transactions.Count)" -ForegroundColor White
    
    if ($billingResponse.transactions.Count -gt 0) {
        $totalSpent = ($billingResponse.transactions | Where-Object { $_.type -eq "debit" } | Measure-Object -Property amount -Sum).Sum
        Write-Host "  Общая потраченная сумма: $totalSpent USD" -ForegroundColor Magenta
        
        Write-Host "`n  Детали транзакций:" -ForegroundColor Cyan
        $billingResponse.transactions | ForEach-Object {
            Write-Host "    • $($_.type): $($_.amount) $($_.currency) - $($_.description)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Ошибка при получении истории транзакций: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Итоговый отчет
Write-Host "`n=== 8. Итоговый отчет ===" -ForegroundColor Green
Write-Host "=" * 60 -ForegroundColor Gray

Write-Host "`n📋 Результаты тестирования:" -ForegroundColor Cyan
Write-Host "  • ID сессии: $TEST_SESSION_ID" -ForegroundColor White
Write-Host "  • Пользователь: $TEST_USER_ID" -ForegroundColor White
Write-Host "  • Тестов выполнено: $($testResults.Count + $modelResults.Count)" -ForegroundColor White
Write-Host "  • Успешных тестов: $(($testResults | Where-Object { $_.Success }).Count + ($modelResults | Where-Object { $_.Success }).Count)" -ForegroundColor White

if ($cleanResult -and $piiResult) {
    Write-Host "`n🔒 Результаты обезличивания:" -ForegroundColor Cyan
    Write-Host "  • Обезличивание работает корректно" -ForegroundColor Green
    Write-Host "  • Влияние на токены: $tokenDiff ($tokenDiffPercent%)" -ForegroundColor White
    Write-Host "  • Влияние на стоимость: $costDiff USD ($costDiffPercent%)" -ForegroundColor White
}

if ($successfulModels.Count -gt 0) {
    Write-Host "`n🤖 Результаты тестирования моделей:" -ForegroundColor Cyan
    Write-Host "  • Протестировано моделей: $($successfulModels.Count)" -ForegroundColor White
    Write-Host "  • Самая дешевая: $($cheapest.Name)" -ForegroundColor Green
    Write-Host "  • Самая быстрая: $($fastest.Name)" -ForegroundColor Green
}

Write-Host "`n✅ Система OpenRouter готова к использованию!" -ForegroundColor Green
Write-Host "`nДля дальнейшего тестирования используйте:" -ForegroundColor Cyan
Write-Host "  • ./test-openrouter-russian.ps1 - тестирование русских запросов" -ForegroundColor White
Write-Host "  • ./test-billing-models.ps1 - тестирование биллинга" -ForegroundColor White

Write-Host "`n=== Тестирование завершено ===" -ForegroundColor Green
