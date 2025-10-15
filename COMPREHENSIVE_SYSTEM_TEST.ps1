# Комплексное тестирование всей системы
Write-Host "=== COMPREHENSIVE SYSTEM TEST ===" -ForegroundColor Cyan
Write-Host "Тестирование всех сценариев использования системы" -ForegroundColor Yellow
Write-Host ""

# Глобальные переменные
$global:testResults = @()
$global:testCount = 0
$global:passedTests = 0
$global:failedTests = 0

function Add-TestResult {
    param(
        [string]$TestName,
        [bool]$Passed,
        [string]$Details = "",
        [string]$Error = ""
    )
    
    $global:testCount++
    if ($Passed) { $global:passedTests++ } else { $global:failedTests++ }
    
    $result = @{
        TestName = $TestName
        Passed = $Passed
        Details = $Details
        Error = $Error
        Timestamp = Get-Date
    }
    
    $global:testResults += $result
    
    $color = if ($Passed) { "Green" } else { "Red" }
    $status = if ($Passed) { "PASS" } else { "FAIL" }
    
    Write-Host "[$status] $TestName" -ForegroundColor $color
    if ($Details) { Write-Host "  Details: $Details" -ForegroundColor Gray }
    if ($Error) { Write-Host "  Error: $Error" -ForegroundColor Red }
    Write-Host ""
}

# ===========================================
# СЦЕНАРИЙ 1: РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ
# ===========================================
Write-Host "=== СЦЕНАРИЙ 1: РЕГИСТРАЦИЯ НОВОГО ПОЛЬЗОВАТЕЛЯ ===" -ForegroundColor Magenta

$testEmail = "testuser$(Get-Date -Format 'yyyyMMddHHmmss')@example.com"
$testPassword = "TestPassword123!"

Write-Host "1.1. Регистрация пользователя через API Gateway..." -ForegroundColor Yellow
try {
    $registerBody = @{
        email = $testEmail
        password = $testPassword
        firstName = "Test"
        lastName = "User"
    } | ConvertTo-Json

    $registerResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    
    if ($registerResponse.success -and $registerResponse.token) {
        $global:testToken = $registerResponse.token
        $global:testUserId = $registerResponse.user.id
        Add-TestResult "Регистрация пользователя" $true "Пользователь создан: $($registerResponse.user.email)"
    } else {
        Add-TestResult "Регистрация пользователя" $false "Неожиданный ответ" ($registerResponse | ConvertTo-Json)
    }
} catch {
    Add-TestResult "Регистрация пользователя" $false "" $_.Exception.Message
}

Write-Host "1.2. Проверка синхронизации с billing-service..." -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 2  # Ждем синхронизации
    
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers @{ "Authorization" = "Bearer $global:testToken" }
    
    if ($balanceResponse.balance -and $balanceResponse.balance.balance -eq 100) {
        Add-TestResult "Синхронизация с billing-service" $true "Баланс создан: $($balanceResponse.balance.balance) $($balanceResponse.balance.currency)"
    } else {
        Add-TestResult "Синхронизация с billing-service" $false "Баланс не создан или неверный" ($balanceResponse | ConvertTo-Json)
    }
} catch {
    Add-TestResult "Синхронизация с billing-service" $false "" $_.Exception.Message
}

# ===========================================
# СЦЕНАРИЙ 2: АВТОРИЗАЦИЯ И ПОЛУЧЕНИЕ БАЛАНСА
# ===========================================
Write-Host "=== СЦЕНАРИЙ 2: АВТОРИЗАЦИЯ И ПОЛУЧЕНИЕ БАЛАНСА ===" -ForegroundColor Magenta

Write-Host "2.1. Авторизация пользователя..." -ForegroundColor Yellow
try {
    $loginBody = @{
        email = $testEmail
        password = $testPassword
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -Body $loginBody -ContentType "application/json"
    
    if ($loginResponse.success -and $loginResponse.token) {
        $global:testToken = $loginResponse.token
        Add-TestResult "Авторизация пользователя" $true "Токен получен"
    } else {
        Add-TestResult "Авторизация пользователя" $false "Неудачная авторизация" ($loginResponse | ConvertTo-Json)
    }
} catch {
    Add-TestResult "Авторизация пользователя" $false "" $_.Exception.Message
}

Write-Host "2.2. Получение баланса..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers @{ "Authorization" = "Bearer $global:testToken" }
    
    if ($balanceResponse.balance) {
        $global:initialBalance = [decimal]$balanceResponse.balance.balance
        Add-TestResult "Получение баланса" $true "Баланс: $($balanceResponse.balance.balance) $($balanceResponse.balance.currency)"
    } else {
        Add-TestResult "Получение баланса" $false "Баланс не получен" ($balanceResponse | ConvertTo-Json)
    }
} catch {
    Add-TestResult "Получение баланса" $false "" $_.Exception.Message
}

# ===========================================
# СЦЕНАРИЙ 3: ИСПОЛЬЗОВАНИЕ ИИ МОДЕЛИ (ПРЯМОЙ ВЫЗОВ)
# ===========================================
Write-Host "=== СЦЕНАРИЙ 3: ИСПОЛЬЗОВАНИЕ ИИ МОДЕЛИ ===" -ForegroundColor Magenta

Write-Host "3.1. Отправка запроса к ИИ модели..." -ForegroundColor Yellow
try {
    $aiRequest = @{
        model = "gpt-3.5-turbo"
        messages = @(
            @{
                role = "user"
                content = "Привет! Это тестовое сообщение."
            }
        )
        max_tokens = 50
        temperature = 0.7
    } | ConvertTo-Json

    $aiResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" -Method POST -Body $aiRequest -ContentType "application/json" -Headers @{ "Authorization" = "Bearer $global:testToken" }
    
    if ($aiResponse.choices -and $aiResponse.choices.Count -gt 0) {
        Add-TestResult "Запрос к ИИ модели" $true "Ответ получен: $($aiResponse.choices[0].message.content.Substring(0, [Math]::Min(50, $aiResponse.choices[0].message.content.Length)))..."
    } else {
        Add-TestResult "Запрос к ИИ модели" $false "Неожиданный ответ" ($aiResponse | ConvertTo-Json)
    }
} catch {
    Add-TestResult "Запрос к ИИ модели" $false "" $_.Exception.Message
}

Write-Host "3.2. Проверка списания средств..." -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 3  # Ждем обработки биллинга
    
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers @{ "Authorization" = "Bearer $global:testToken" }
    
    if ($balanceResponse.balance) {
        $finalBalance = [decimal]$balanceResponse.balance.balance
        $deducted = $global:initialBalance - $finalBalance
        
        if ($deducted -gt 0) {
            Add-TestResult "Списание средств" $true "Списано: $deducted USD (было: $($global:initialBalance), стало: $finalBalance)"
        } else {
            Add-TestResult "Списание средств" $false "Средства не списаны (баланс: $finalBalance)"
        }
    } else {
        Add-TestResult "Списание средств" $false "Не удалось получить баланс"
    }
} catch {
    Add-TestResult "Списание средств" $false "" $_.Exception.Message
}

# ===========================================
# СЦЕНАРИЙ 4: ПРЯМОЕ ТЕСТИРОВАНИЕ BILLING SERVICE
# ===========================================
Write-Host "=== СЦЕНАРИЙ 4: ПРЯМОЕ ТЕСТИРОВАНИЕ BILLING SERVICE ===" -ForegroundColor Magenta

Write-Host "4.1. Прямая отправка billing event..." -ForegroundColor Yellow
try {
    $billingEvent = @{
        companyId = $global:testUserId
        service = "ai-chat"
        resource = "tokens"
        quantity = 10
        metadata = @{
            provider = "openai"
            model = "gpt-3.5-turbo"
            tokens = 10
            currency = "USD"
            requestId = "test-direct-$(Get-Date -Format 'yyyyMMdd-HHmmss-fff')"
        }
    } | ConvertTo-Json

    $billingResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/usage/track" -Method POST -Body $billingEvent -ContentType "application/json"
    
    if ($billingResponse.success) {
        Add-TestResult "Прямая отправка billing event" $true "Событие обработано, стоимость: $($billingResponse.cost)"
    } else {
        Add-TestResult "Прямая отправка billing event" $false "Ошибка обработки" $billingResponse.message
    }
} catch {
    Add-TestResult "Прямая отправка billing event" $false "" $_.Exception.Message
}

Write-Host "4.2. Проверка обновления баланса после прямого billing..." -ForegroundColor Yellow
try {
    Start-Sleep -Seconds 2
    
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/balance" -Method GET -Headers @{ "Authorization" = "Bearer $global:testToken" }
    
    if ($balanceResponse.balance) {
        $currentBalance = [decimal]$balanceResponse.balance.balance
        Add-TestResult "Обновление баланса после прямого billing" $true "Текущий баланс: $currentBalance USD"
    } else {
        Add-TestResult "Обновление баланса после прямого billing" $false "Не удалось получить баланс"
    }
} catch {
    Add-TestResult "Обновление баланса после прямого billing" $false "" $_.Exception.Message
}

# ===========================================
# СЦЕНАРИЙ 5: ПРОВЕРКА ИСТОРИИ ТРАНЗАКЦИЙ
# ===========================================
Write-Host "=== СЦЕНАРИЙ 5: ПРОВЕРКА ИСТОРИИ ТРАНЗАКЦИЙ ===" -ForegroundColor Magenta

Write-Host "5.1. Получение истории транзакций..." -ForegroundColor Yellow
try {
    $transactionsResponse = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/transactions" -Method GET -Headers @{ "Authorization" = "Bearer $global:testToken" }
    
    if ($transactionsResponse.transactions -and $transactionsResponse.transactions.Count -gt 0) {
        Add-TestResult "Получение истории транзакций" $true "Найдено транзакций: $($transactionsResponse.transactions.Count)"
    } else {
        Add-TestResult "Получение истории транзакций" $false "Транзакции не найдены"
    }
} catch {
    Add-TestResult "Получение истории транзакций" $false "" $_.Exception.Message
}

# ===========================================
# СЦЕНАРИЙ 6: ПРОВЕРКА HEALTH CHECK'ОВ
# ===========================================
Write-Host "=== СЦЕНАРИЙ 6: ПРОВЕРКА HEALTH CHECK'ОВ ===" -ForegroundColor Magenta

$services = @(
    @{ Name = "API Gateway"; Url = "http://localhost:3000/health" },
    @{ Name = "Auth Service"; Url = "http://localhost:3001/health" },
    @{ Name = "Billing Service"; Url = "http://localhost:3004/health" },
    @{ Name = "Provider Orchestrator"; Url = "http://localhost:3002/health" },
    @{ Name = "Proxy Service"; Url = "http://localhost:3003/health" }
)

foreach ($service in $services) {
    Write-Host "6.$($services.IndexOf($service) + 1). Проверка $($service.Name)..." -ForegroundColor Yellow
    try {
        $healthResponse = Invoke-RestMethod -Uri $service.Url -Method GET
        Add-TestResult "Health Check: $($service.Name)" $true "Сервис работает"
    } catch {
        Add-TestResult "Health Check: $($service.Name)" $false "" $_.Exception.Message
    }
}

# ===========================================
# ИТОГОВЫЙ ОТЧЕТ
# ===========================================
Write-Host "=== ИТОГОВЫЙ ОТЧЕТ ===" -ForegroundColor Cyan
Write-Host "Всего тестов: $global:testCount" -ForegroundColor White
Write-Host "Пройдено: $global:passedTests" -ForegroundColor Green
Write-Host "Провалено: $global:failedTests" -ForegroundColor Red
Write-Host "Успешность: $([Math]::Round(($global:passedTests / $global:testCount) * 100, 2))%" -ForegroundColor Yellow

Write-Host "`n=== ДЕТАЛЬНЫЕ РЕЗУЛЬТАТЫ ===" -ForegroundColor Cyan
foreach ($result in $global:testResults) {
    $color = if ($result.Passed) { "Green" } else { "Red" }
    $status = if ($result.Passed) { "✓" } else { "✗" }
    Write-Host "$status $($result.TestName)" -ForegroundColor $color
    if ($result.Details) { Write-Host "  $($result.Details)" -ForegroundColor Gray }
    if ($result.Error) { Write-Host "  Ошибка: $($result.Error)" -ForegroundColor Red }
}

Write-Host "`n=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===" -ForegroundColor Cyan
