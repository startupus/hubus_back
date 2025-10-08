# Тестирование биллинга с разными моделями OpenRouter
# Сравниваем стоимость запросов к разным моделям

Write-Host "=== Тестирование биллинга с разными моделями OpenRouter ===" -ForegroundColor Green

# Конфигурация
$PROXY_SERVICE_URL = "http://localhost:3003"
$API_GATEWAY_URL = "http://localhost:3000"
$TEST_USER_ID = "test-billing-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Тестовые модели с их ожидаемыми ценами
$MODELS = @(
    @{
        id = "openai/gpt-4o-mini"
        name = "GPT-4o Mini"
        expectedInputPrice = 0.00000015
        expectedOutputPrice = 0.0000006
    },
    @{
        id = "anthropic/claude-3-5-haiku-20241022"
        name = "Claude 3.5 Haiku"
        expectedInputPrice = 0.0000008
        expectedOutputPrice = 0.000004
    },
    @{
        id = "meta-llama/llama-3.1-8b-instruct"
        name = "Llama 3.1 8B"
        expectedInputPrice = 0.0000002
        expectedOutputPrice = 0.0000002
    }
)

# Стандартный тестовый запрос
$TEST_MESSAGE = "Привет! Расскажи мне кратко о преимуществах искусственного интеллекта в современном мире."

$results = @()

Write-Host "`nТестируем $($MODELS.Count) моделей..." -ForegroundColor Yellow

foreach ($model in $MODELS) {
    Write-Host "`n--- Тестирование модели: $($model.name) ---" -ForegroundColor Cyan
    
    $request = @{
        model = $model.id
        messages = @(
            @{
                role = "user"
                content = $TEST_MESSAGE
            }
        )
        temperature = 0.7
        max_tokens = 200
        userId = $TEST_USER_ID
    } | ConvertTo-Json -Depth 3
    
    try {
        Write-Host "Отправляем запрос к $($model.name)..." -ForegroundColor White
        
        $startTime = Get-Date
        $response = Invoke-RestMethod -Uri "$PROXY_SERVICE_URL/proxy/openrouter/chat/completions" -Method POST -Body $request -ContentType "application/json" -TimeoutSec 60
        $endTime = Get-Date
        $actualResponseTime = ($endTime - $startTime).TotalMilliseconds
        
        Write-Host "✅ Успешно получен ответ от $($model.name):" -ForegroundColor Green
        Write-Host "  Ответ: $($response.responseText.Substring(0, [Math]::Min(100, $response.responseText.Length)))..." -ForegroundColor White
        Write-Host "  Входные токены: $($response.inputTokens)" -ForegroundColor Magenta
        Write-Host "  Выходные токены: $($response.outputTokens)" -ForegroundColor Magenta
        Write-Host "  Общие токены: $($response.totalTokens)" -ForegroundColor Magenta
        Write-Host "  Стоимость: $($response.cost) $($response.currency)" -ForegroundColor Magenta
        Write-Host "  Время ответа: $($response.responseTime) мс" -ForegroundColor Magenta
        Write-Host "  Фактическое время: $([math]::Round($actualResponseTime, 0)) мс" -ForegroundColor Magenta
        
        # Рассчитываем ожидаемую стоимость
        $expectedCost = ($response.inputTokens * $model.expectedInputPrice) + ($response.outputTokens * $model.expectedOutputPrice)
        $costDifference = $response.cost - $expectedCost
        $costDifferencePercent = if ($expectedCost -gt 0) { [math]::Round(($costDifference / $expectedCost) * 100, 2) } else { 0 }
        
        Write-Host "  Ожидаемая стоимость: $([math]::Round($expectedCost, 6)) USD" -ForegroundColor Yellow
        Write-Host "  Разница: $([math]::Round($costDifference, 6)) USD ($costDifferencePercent%)" -ForegroundColor $(if ([math]::Abs($costDifferencePercent) -lt 10) { "Green" } else { "Red" })
        
        # Сохраняем результат
        $results += @{
            Model = $model.name
            ModelId = $model.id
            InputTokens = $response.inputTokens
            OutputTokens = $response.outputTokens
            TotalTokens = $response.totalTokens
            ActualCost = $response.cost
            ExpectedCost = $expectedCost
            CostDifference = $costDifference
            CostDifferencePercent = $costDifferencePercent
            ResponseTime = $response.responseTime
            ActualResponseTime = $actualResponseTime
            Success = $true
        }
        
    } catch {
        Write-Host "❌ Ошибка при запросе к $($model.name): $($_.Exception.Message)" -ForegroundColor Red
        
        $results += @{
            Model = $model.name
            ModelId = $model.id
            Success = $false
            Error = $_.Exception.Message
        }
    }
    
    # Пауза между запросами
    Start-Sleep -Seconds 2
}

Write-Host "`n=== Сводка результатов ===" -ForegroundColor Green
Write-Host "=" * 80 -ForegroundColor Gray

# Сортируем результаты по стоимости
$successfulResults = $results | Where-Object { $_.Success -eq $true } | Sort-Object ActualCost

Write-Host "`n📊 Сравнение стоимости (от дешевой к дорогой):" -ForegroundColor Cyan
$rank = 1
foreach ($result in $successfulResults) {
    $costPerToken = if ($result.TotalTokens -gt 0) { [math]::Round($result.ActualCost / $result.TotalTokens, 8) } else { 0 }
    Write-Host "  $rank. $($result.Model): $($result.ActualCost) USD ($costPerToken USD/токен)" -ForegroundColor White
    $rank++
}

Write-Host "`n⚡ Сравнение скорости ответа:" -ForegroundColor Cyan
$speedResults = $successfulResults | Sort-Object ActualResponseTime
$rank = 1
foreach ($result in $speedResults) {
    Write-Host "  $rank. $($result.Model): $([math]::Round($result.ActualResponseTime, 0)) мс" -ForegroundColor White
    $rank++
}

Write-Host "`n🎯 Анализ точности ценообразования:" -ForegroundColor Cyan
foreach ($result in $successfulResults) {
    $accuracy = if ([math]::Abs($result.CostDifferencePercent) -lt 5) { "✅ Отлично" } 
                elseif ([math]::Abs($result.CostDifferencePercent) -lt 15) { "⚠️ Приемлемо" } 
                else { "❌ Требует проверки" }
    
    Write-Host "  $($result.Model): $accuracy (разница: $($result.CostDifferencePercent)%)" -ForegroundColor White
}

Write-Host "`n💰 Рекомендации по выбору модели:" -ForegroundColor Cyan
$cheapest = $successfulResults | Select-Object -First 1
$fastest = $speedResults | Select-Object -First 1
$mostAccurate = $successfulResults | Where-Object { [math]::Abs($_.CostDifferencePercent) -lt 5 } | Select-Object -First 1

Write-Host "  • Самая дешевая: $($cheapest.Model) ($($cheapest.ActualCost) USD)" -ForegroundColor Green
Write-Host "  • Самая быстрая: $($fastest.Model) ($([math]::Round($fastest.ActualResponseTime, 0)) мс)" -ForegroundColor Green
if ($mostAccurate) {
    Write-Host "  • Самая точная по ценообразованию: $($mostAccurate.Model)" -ForegroundColor Green
}

Write-Host "`n4. Проверка биллинга" -ForegroundColor Yellow
Write-Host "Проверяем историю транзакций для пользователя: $TEST_USER_ID" -ForegroundColor Cyan

try {
    $billingResponse = Invoke-RestMethod -Uri "$API_GATEWAY_URL/v1/billing/transactions/$TEST_USER_ID" -Method GET -TimeoutSec 30
    Write-Host "✅ История транзакций получена:" -ForegroundColor Green
    Write-Host "Количество транзакций: $($billingResponse.transactions.Count)" -ForegroundColor White
    
    if ($billingResponse.transactions.Count -gt 0) {
        $totalSpent = ($billingResponse.transactions | Where-Object { $_.type -eq "debit" } | Measure-Object -Property amount -Sum).Sum
        Write-Host "Общая потраченная сумма: $totalSpent USD" -ForegroundColor Magenta
        
        Write-Host "`nДетали транзакций:" -ForegroundColor Cyan
        $billingResponse.transactions | ForEach-Object {
            Write-Host "  • $($_.type): $($_.amount) $($_.currency) - $($_.description) ($($_.timestamp))" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Ошибка при получении истории транзакций: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Тестирование биллинга завершено ===" -ForegroundColor Green
Write-Host "Пользователь для тестирования: $TEST_USER_ID" -ForegroundColor Cyan
