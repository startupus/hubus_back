#!/usr/bin/env pwsh

# Скрипт для инициализации цен в стиле OpenRouter
# Создает правила ценообразования для различных провайдеров и моделей

Write-Host "=== Инициализация цен OpenRouter ===" -ForegroundColor Green

# 1. Проверяем, что billing-service запущен
Write-Host "`n1. Проверка статуса billing-service..." -ForegroundColor Yellow
$billingStatus = docker-compose ps billing-service --format "table {{.Service}}\t{{.Status}}"
Write-Host $billingStatus

# 2. Создаем правила ценообразования для OpenAI
Write-Host "`n2. Создание правил ценообразования для OpenAI..." -ForegroundColor Yellow

$openaiModels = @(
    @{ model = "gpt-3.5-turbo"; price = 0.0005; providerType = "FOREIGN" },
    @{ model = "gpt-3.5-turbo-16k"; price = 0.003; providerType = "FOREIGN" },
    @{ model = "gpt-4"; price = 0.03; providerType = "FOREIGN" },
    @{ model = "gpt-4-32k"; price = 0.06; providerType = "FOREIGN" },
    @{ model = "gpt-4-turbo"; price = 0.01; providerType = "FOREIGN" },
    @{ model = "gpt-4o"; price = 0.005; providerType = "FOREIGN" },
    @{ model = "gpt-4o-mini"; price = 0.00015; providerType = "FOREIGN" }
)

foreach ($model in $openaiModels) {
    try {
        $pricingRule = @{
            name = "OpenAI $($model.model)"
            service = "ai"
            resource = "chat_completion"
            provider = "openai"
            model = $model.model
            providerType = $model.providerType
            type = "PER_TOKEN"
            price = $model.price
            currency = "USD"
            priority = 100
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://localhost:3002/billing/pricing-rules" -Method POST -Body $pricingRule -ContentType "application/json"
        Write-Host "✅ Создано правило для $($model.model): $($model.price) USD за токен" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка создания правила для $($model.model): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 3. Создаем правила ценообразования для Anthropic
Write-Host "`n3. Создание правил ценообразования для Anthropic..." -ForegroundColor Yellow

$anthropicModels = @(
    @{ model = "claude-3-haiku"; price = 0.00025; providerType = "FOREIGN" },
    @{ model = "claude-3-sonnet"; price = 0.003; providerType = "FOREIGN" },
    @{ model = "claude-3-opus"; price = 0.015; providerType = "FOREIGN" },
    @{ model = "claude-3-5-sonnet"; price = 0.003; providerType = "FOREIGN" }
)

foreach ($model in $anthropicModels) {
    try {
        $pricingRule = @{
            name = "Anthropic $($model.model)"
            service = "ai"
            resource = "chat_completion"
            provider = "anthropic"
            model = $model.model
            providerType = $model.providerType
            type = "PER_TOKEN"
            price = $model.price
            currency = "USD"
            priority = 100
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://localhost:3002/billing/pricing-rules" -Method POST -Body $pricingRule -ContentType "application/json"
        Write-Host "✅ Создано правило для $($model.model): $($model.price) USD за токен" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка создания правила для $($model.model): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 4. Создаем правила ценообразования для отечественных провайдеров
Write-Host "`n4. Создание правил ценообразования для отечественных провайдеров..." -ForegroundColor Yellow

$domesticModels = @(
    @{ provider = "yandex"; model = "yandex-gpt"; price = 0.0001; providerType = "DOMESTIC" },
    @{ provider = "sber"; model = "gigachat"; price = 0.0002; providerType = "DOMESTIC" },
    @{ provider = "sber"; model = "kandinsky"; price = 0.01; providerType = "DOMESTIC" },
    @{ provider = "rugpt"; model = "rugpt-3"; price = 0.00005; providerType = "DOMESTIC" }
)

foreach ($model in $domesticModels) {
    try {
        $pricingRule = @{
            name = "$($model.provider) $($model.model)"
            service = "ai"
            resource = "chat_completion"
            provider = $model.provider
            model = $model.model
            providerType = $model.providerType
            type = "PER_TOKEN"
            price = $model.price
            currency = "RUB"
            priority = 100
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://localhost:3002/billing/pricing-rules" -Method POST -Body $pricingRule -ContentType "application/json"
        Write-Host "✅ Создано правило для $($model.provider)/$($model.model): $($model.price) RUB за токен" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка создания правила для $($model.provider)/$($model.model): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 5. Создаем правила ценообразования для OpenRouter
Write-Host "`n5. Создание правил ценообразования для OpenRouter..." -ForegroundColor Yellow

$openrouterModels = @(
    @{ model = "meta-llama/llama-3-8b-instruct"; price = 0.0002; providerType = "FOREIGN" },
    @{ model = "meta-llama/llama-3-70b-instruct"; price = 0.0009; providerType = "FOREIGN" },
    @{ model = "mistralai/mistral-7b-instruct"; price = 0.0002; providerType = "FOREIGN" },
    @{ model = "mistralai/mixtral-8x7b-instruct"; price = 0.00027; providerType = "FOREIGN" },
    @{ model = "google/gemini-pro"; price = 0.0005; providerType = "FOREIGN" },
    @{ model = "google/gemini-pro-vision"; price = 0.0005; providerType = "FOREIGN" }
)

foreach ($model in $openrouterModels) {
    try {
        $pricingRule = @{
            name = "OpenRouter $($model.model)"
            service = "ai"
            resource = "chat_completion"
            provider = "openrouter"
            model = $model.model
            providerType = $model.providerType
            type = "PER_TOKEN"
            price = $model.price
            currency = "USD"
            priority = 100
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://localhost:3002/billing/pricing-rules" -Method POST -Body $pricingRule -ContentType "application/json"
        Write-Host "✅ Создано правило для $($model.model): $($model.price) USD за токен" -ForegroundColor Green
    } catch {
        Write-Host "❌ Ошибка создания правила для $($model.model): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 6. Создаем скидки для отечественных провайдеров
Write-Host "`n6. Создание скидок для отечественных провайдеров..." -ForegroundColor Yellow

try {
    $domesticDiscount = @{
        name = "Скидка для отечественных провайдеров"
        code = "DOMESTIC_10"
        type = "PERCENTAGE"
        value = 10
        currency = "RUB"
        isGlobal = $true
        isActive = $true
        validFrom = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
        validTo = (Get-Date).AddYears(1).ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "http://localhost:3002/billing/discount-rules" -Method POST -Body $domesticDiscount -ContentType "application/json"
    Write-Host "✅ Создана скидка 10% для отечественных провайдеров" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка создания скидки: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Тестируем расчет стоимости
Write-Host "`n7. Тестирование расчета стоимости..." -ForegroundColor Yellow

$testCases = @(
    @{ provider = "openai"; model = "gpt-3.5-turbo"; tokens = 1000; expectedType = "FOREIGN" },
    @{ provider = "yandex"; model = "yandex-gpt"; tokens = 1000; expectedType = "DOMESTIC" },
    @{ provider = "anthropic"; model = "claude-3-sonnet"; tokens = 1000; expectedType = "FOREIGN" }
)

foreach ($test in $testCases) {
    try {
        $costRequest = @{
            service = "ai"
            resource = "chat_completion"
            quantity = $test.tokens
            metadata = @{
                provider = $test.provider
                model = $test.model
                tokens = @{ total = $test.tokens }
            }
        } | ConvertTo-Json

        $response = Invoke-RestMethod -Uri "http://localhost:3002/billing/calculate-cost" -Method POST -Body $costRequest -ContentType "application/json"
        
        if ($response.success) {
            Write-Host "✅ $($test.provider)/$($test.model): $($response.cost) $($response.currency) (тип: $($response.providerType))" -ForegroundColor Green
        } else {
            Write-Host "❌ $($test.provider)/$($test.model): $($response.error)" -ForegroundColor Red
        }
    } catch {
        Write-Host "❌ Ошибка тестирования $($test.provider)/$($test.model): $($_.Exception.Message)" -ForegroundColor Red
    }
}

Write-Host "`n=== Инициализация цен завершена ===" -ForegroundColor Green
Write-Host "`nСозданы правила ценообразования для:" -ForegroundColor Yellow
Write-Host "- OpenAI (GPT-3.5, GPT-4, GPT-4o)" -ForegroundColor Cyan
Write-Host "- Anthropic (Claude-3)" -ForegroundColor Cyan
Write-Host "- Отечественные провайдеры (Yandex, Sber, RuGPT)" -ForegroundColor Cyan
Write-Host "- OpenRouter модели" -ForegroundColor Cyan
Write-Host "`nОсобенности:" -ForegroundColor Yellow
Write-Host "- Цены в стиле OpenRouter (за токен)" -ForegroundColor Cyan
Write-Host "- Классификация на отечественные/зарубежные" -ForegroundColor Cyan
Write-Host "- Разные налоги для разных типов провайдеров" -ForegroundColor Cyan
Write-Host "- Скидки для отечественных провайдеров" -ForegroundColor Cyan
