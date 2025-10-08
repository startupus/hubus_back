# Настройка OpenRouter API ключа
# Этот скрипт поможет настроить ваш OpenRouter API ключ

Write-Host "=== Настройка OpenRouter API ключа ===" -ForegroundColor Green

# Проверяем существование .env файла
$envFile = ".env"
if (-not (Test-Path $envFile)) {
    Write-Host "Создаем .env файл из примера..." -ForegroundColor Yellow
    Copy-Item "env.example" $envFile
    Write-Host "✅ Файл .env создан" -ForegroundColor Green
}

# Читаем текущий .env файл
$envContent = Get-Content $envFile -Raw

# Проверяем текущий ключ OpenRouter
$currentKey = ""
if ($envContent -match "OPENROUTER_API_KEY=""([^""]*)""") {
    $currentKey = $matches[1]
}

if ($currentKey -and $currentKey -ne "sk-or-v1-your-openrouter-api-key-here") {
    Write-Host "Текущий OpenRouter API ключ: $($currentKey.Substring(0, 10))..." -ForegroundColor Cyan
    $update = Read-Host "Хотите обновить ключ? (y/n)"
    if ($update -ne "y" -and $update -ne "Y") {
        Write-Host "Ключ не изменен" -ForegroundColor Yellow
        exit 0
    }
}

Write-Host "`nДля получения OpenRouter API ключа:" -ForegroundColor Yellow
Write-Host "1. Перейдите на https://openrouter.ai/" -ForegroundColor White
Write-Host "2. Зарегистрируйтесь или войдите в аккаунт" -ForegroundColor White
Write-Host "3. Перейдите в раздел 'Keys' в вашем профиле" -ForegroundColor White
Write-Host "4. Создайте новый API ключ" -ForegroundColor White
Write-Host "5. Скопируйте ключ (формат: sk-or-v1-...)" -ForegroundColor White

Write-Host "`nВведите ваш OpenRouter API ключ:" -ForegroundColor Cyan
$newKey = Read-Host "API Key"

if (-not $newKey -or $newKey -eq "") {
    Write-Host "❌ API ключ не введен" -ForegroundColor Red
    exit 1
}

if (-not $newKey.StartsWith("sk-or-v1-")) {
    Write-Host "⚠️ Предупреждение: API ключ не соответствует ожидаемому формату (sk-or-v1-...)" -ForegroundColor Yellow
    $continue = Read-Host "Продолжить? (y/n)"
    if ($continue -ne "y" -and $continue -ne "Y") {
        Write-Host "Настройка отменена" -ForegroundColor Yellow
        exit 0
    }
}

# Обновляем .env файл
$newEnvContent = $envContent -replace "OPENROUTER_API_KEY=""[^""]*""", "OPENROUTER_API_KEY=""$newKey"""
Set-Content $envFile $newEnvContent -Encoding UTF8

Write-Host "✅ OpenRouter API ключ обновлен в .env файле" -ForegroundColor Green

# Проверяем, что сервисы запущены
Write-Host "`nПроверяем статус сервисов..." -ForegroundColor Yellow

$services = @(
    @{ Name = "API Gateway"; Port = 3000 },
    @{ Name = "Proxy Service"; Port = 3003 },
    @{ Name = "Billing Service"; Port = 3004 }
)

$allRunning = $true
foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "✅ $($service.Name) (порт $($service.Port)) - работает" -ForegroundColor Green
        } else {
            Write-Host "❌ $($service.Name) (порт $($service.Port)) - не отвечает" -ForegroundColor Red
            $allRunning = $false
        }
    } catch {
        Write-Host "❌ $($service.Name) (порт $($service.Port)) - недоступен" -ForegroundColor Red
        $allRunning = $false
    }
}

if (-not $allRunning) {
    Write-Host "`n⚠️ Некоторые сервисы не запущены. Запустите их командой:" -ForegroundColor Yellow
    Write-Host "docker-compose up -d" -ForegroundColor White
    Write-Host "`nИли используйте скрипт:" -ForegroundColor Yellow
    Write-Host "./docker-start.ps1" -ForegroundColor White
} else {
    Write-Host "`n✅ Все сервисы работают!" -ForegroundColor Green
    
    # Тестируем подключение к OpenRouter
    Write-Host "`nТестируем подключение к OpenRouter..." -ForegroundColor Yellow
    
    $testRequest = @{
        model = "openai/gpt-4o-mini"
        messages = @(
            @{
                role = "user"
                content = "Привет! Это тестовое сообщение для проверки подключения к OpenRouter."
            }
        )
        temperature = 0.7
        max_tokens = 50
        userId = "test-setup-$(Get-Date -Format 'yyyyMMdd-HHmmss')"
    } | ConvertTo-Json -Depth 3
    
    try {
        $testResponse = Invoke-RestMethod -Uri "http://localhost:3003/proxy/openrouter/chat/completions" -Method POST -Body $testRequest -ContentType "application/json" -TimeoutSec 30
        
        Write-Host "✅ Подключение к OpenRouter успешно!" -ForegroundColor Green
        Write-Host "Тестовый ответ: $($testResponse.responseText)" -ForegroundColor White
        Write-Host "Стоимость: $($testResponse.cost) $($testResponse.currency)" -ForegroundColor Magenta
        Write-Host "Токены: $($testResponse.totalTokens)" -ForegroundColor Magenta
        
    } catch {
        Write-Host "❌ Ошибка при тестировании OpenRouter: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Проверьте:" -ForegroundColor Yellow
        Write-Host "  • Правильность API ключа" -ForegroundColor White
        Write-Host "  • Наличие средств на аккаунте OpenRouter" -ForegroundColor White
        Write-Host "  • Доступность сервиса OpenRouter" -ForegroundColor White
    }
}

Write-Host "`n=== Настройка завершена ===" -ForegroundColor Green
Write-Host "Теперь вы можете использовать скрипты:" -ForegroundColor Cyan
Write-Host "  • ./test-openrouter-russian.ps1 - тестирование русских запросов" -ForegroundColor White
Write-Host "  • ./test-billing-models.ps1 - тестирование биллинга с разными моделями" -ForegroundColor White
