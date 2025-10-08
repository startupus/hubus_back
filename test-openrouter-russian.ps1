# Тестирование OpenRouter с русскими запросами
# Проверяем работу системы с обезличиванием и без

Write-Host "=== Тестирование OpenRouter с русскими запросами ===" -ForegroundColor Green

# Конфигурация
$PROXY_SERVICE_URL = "http://localhost:3003"
$API_GATEWAY_URL = "http://localhost:3000"
$TEST_USER_ID = "test-user-russian-$(Get-Date -Format 'yyyyMMdd-HHmmss')"

# Русский запрос с персональными данными
$RUSSIAN_REQUEST_WITH_PII = @{
    model = "openai/gpt-4o-mini"
    messages = @(
        @{
            role = "user"
            content = "Привет! Меня зовут Иван Петров, мой телефон +7 (495) 123-45-67, email: ivan.petrov@mail.ru. Я живу по адресу: Москва, улица Тверская, дом 15, квартира 42. Мой ИНН: 1234567890. Расскажи мне о погоде в Москве."
        }
    )
    temperature = 0.7
    max_tokens = 500
    userId = $TEST_USER_ID
} | ConvertTo-Json -Depth 3

# Русский запрос без персональных данных
$RUSSIAN_REQUEST_CLEAN = @{
    model = "openai/gpt-4o-mini"
    messages = @(
        @{
            role = "user"
            content = "Привет! Расскажи мне о погоде в Москве и дай несколько советов по планированию дня."
        }
    )
    temperature = 0.7
    max_tokens = 500
    userId = $TEST_USER_ID
} | ConvertTo-Json -Depth 3

Write-Host "`n1. Тестирование запроса БЕЗ обезличивания (чистый текст)" -ForegroundColor Yellow
Write-Host "Запрос: $($RUSSIAN_REQUEST_CLEAN)" -ForegroundColor Cyan

try {
    $response1 = Invoke-RestMethod -Uri "$PROXY_SERVICE_URL/proxy/openrouter/chat/completions" -Method POST -Body $RUSSIAN_REQUEST_CLEAN -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "✅ Успешно получен ответ БЕЗ обезличивания:" -ForegroundColor Green
    Write-Host "Ответ: $($response1.responseText)" -ForegroundColor White
    Write-Host "Входные токены: $($response1.inputTokens)" -ForegroundColor Magenta
    Write-Host "Выходные токены: $($response1.outputTokens)" -ForegroundColor Magenta
    Write-Host "Общие токены: $($response1.totalTokens)" -ForegroundColor Magenta
    Write-Host "Стоимость: $($response1.cost) $($response1.currency)" -ForegroundColor Magenta
    Write-Host "Провайдер: $($response1.provider)" -ForegroundColor Magenta
    Write-Host "Модель: $($response1.model)" -ForegroundColor Magenta
    Write-Host "Время ответа: $($response1.responseTime) мс" -ForegroundColor Magenta
    
    $CLEAN_COST = $response1.cost
    $CLEAN_TOKENS = $response1.totalTokens
} catch {
    Write-Host "❌ Ошибка при запросе БЕЗ обезличивания: $($_.Exception.Message)" -ForegroundColor Red
    $CLEAN_COST = 0
    $CLEAN_TOKENS = 0
}

Write-Host "`n2. Тестирование запроса С обезличиванием (с персональными данными)" -ForegroundColor Yellow
Write-Host "Запрос: $($RUSSIAN_REQUEST_WITH_PII)" -ForegroundColor Cyan

try {
    $response2 = Invoke-RestMethod -Uri "$PROXY_SERVICE_URL/proxy/openrouter/chat/completions" -Method POST -Body $RUSSIAN_REQUEST_WITH_PII -ContentType "application/json" -TimeoutSec 60
    
    Write-Host "✅ Успешно получен ответ С обезличиванием:" -ForegroundColor Green
    Write-Host "Ответ: $($response2.responseText)" -ForegroundColor White
    Write-Host "Входные токены: $($response2.inputTokens)" -ForegroundColor Magenta
    Write-Host "Выходные токены: $($response2.outputTokens)" -ForegroundColor Magenta
    Write-Host "Общие токены: $($response2.totalTokens)" -ForegroundColor Magenta
    Write-Host "Стоимость: $($response2.cost) $($response2.currency)" -ForegroundColor Magenta
    Write-Host "Провайдер: $($response2.provider)" -ForegroundColor Magenta
    Write-Host "Модель: $($response2.model)" -ForegroundColor Magenta
    Write-Host "Время ответа: $($response2.responseTime) мс" -ForegroundColor Magenta
    
    $ANONYMIZED_COST = $response2.cost
    $ANONYMIZED_TOKENS = $response2.totalTokens
} catch {
    Write-Host "❌ Ошибка при запросе С обезличиванием: $($_.Exception.Message)" -ForegroundColor Red
    $ANONYMIZED_COST = 0
    $ANONYMIZED_TOKENS = 0
}

Write-Host "`n3. Сравнение результатов" -ForegroundColor Yellow
Write-Host "=" * 50 -ForegroundColor Gray

if ($CLEAN_COST -gt 0 -and $ANONYMIZED_COST -gt 0) {
    Write-Host "📊 Сравнение токенов:" -ForegroundColor Cyan
    Write-Host "  Без обезличивания: $CLEAN_TOKENS токенов" -ForegroundColor White
    Write-Host "  С обезличиванием:  $ANONYMIZED_TOKENS токенов" -ForegroundColor White
    $tokenDiff = $ANONYMIZED_TOKENS - $CLEAN_TOKENS
    $tokenDiffPercent = if ($CLEAN_TOKENS -gt 0) { [math]::Round(($tokenDiff / $CLEAN_TOKENS) * 100, 2) } else { 0 }
    Write-Host "  Разница: $tokenDiff токенов ($tokenDiffPercent%)" -ForegroundColor $(if ($tokenDiff -gt 0) { "Yellow" } else { "Green" })
    
    Write-Host "`n💰 Сравнение стоимости:" -ForegroundColor Cyan
    Write-Host "  Без обезличивания: $CLEAN_COST USD" -ForegroundColor White
    Write-Host "  С обезличиванием:  $ANONYMIZED_COST USD" -ForegroundColor White
    $costDiff = $ANONYMIZED_COST - $CLEAN_COST
    $costDiffPercent = if ($CLEAN_COST -gt 0) { [math]::Round(($costDiff / $CLEAN_COST) * 100, 2) } else { 0 }
    Write-Host "  Разница: $costDiff USD ($costDiffPercent%)" -ForegroundColor $(if ($costDiff -gt 0) { "Yellow" } else { "Green" })
    
    Write-Host "`n📈 Анализ:" -ForegroundColor Cyan
    if ($tokenDiff -gt 0) {
        Write-Host "  • Обезличивание увеличило количество токенов на $tokenDiff" -ForegroundColor Yellow
        Write-Host "  • Это связано с заменой персональных данных на плейсхолдеры" -ForegroundColor Yellow
    } else {
        Write-Host "  • Количество токенов не изменилось" -ForegroundColor Green
    }
    
    if ($costDiff -gt 0) {
        Write-Host "  • Обезличивание увеличило стоимость на $costDiff USD" -ForegroundColor Yellow
        Write-Host "  • Дополнительные токены привели к росту расходов" -ForegroundColor Yellow
    } else {
        Write-Host "  • Стоимость не изменилась" -ForegroundColor Green
    }
} else {
    Write-Host "❌ Не удалось сравнить результаты из-за ошибок в запросах" -ForegroundColor Red
}

Write-Host "`n4. Проверка биллинга" -ForegroundColor Yellow
Write-Host "Проверяем историю транзакций для пользователя: $TEST_USER_ID" -ForegroundColor Cyan

try {
    $billingResponse = Invoke-RestMethod -Uri "$API_GATEWAY_URL/v1/billing/transactions/$TEST_USER_ID" -Method GET -TimeoutSec 30
    Write-Host "✅ История транзакций получена:" -ForegroundColor Green
    Write-Host "Количество транзакций: $($billingResponse.transactions.Count)" -ForegroundColor White
    
    if ($billingResponse.transactions.Count -gt 0) {
        Write-Host "`nПоследние транзакции:" -ForegroundColor Cyan
        $billingResponse.transactions | Select-Object -First 3 | ForEach-Object {
            Write-Host "  • $($_.type): $($_.amount) $($_.currency) - $($_.description)" -ForegroundColor White
        }
    }
} catch {
    Write-Host "❌ Ошибка при получении истории транзакций: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Тестирование завершено ===" -ForegroundColor Green
Write-Host "Пользователь для тестирования: $TEST_USER_ID" -ForegroundColor Cyan
