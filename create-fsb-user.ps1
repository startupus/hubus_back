#!/usr/bin/env pwsh

# Скрипт для создания пользователя ФСБ
# Создает специального пользователя с ролью 'fsb' для доступа к истории запросов

Write-Host "=== Создание пользователя ФСБ ===" -ForegroundColor Green

# 1. Проверяем, что auth-service запущен
Write-Host "`n1. Проверка статуса auth-service..." -ForegroundColor Yellow
$authStatus = docker-compose ps auth-service --format "table {{.Service}}\t{{.Status}}"
Write-Host $authStatus

# 2. Создаем пользователя ФСБ через API
Write-Host "`n2. Создание пользователя ФСБ..." -ForegroundColor Yellow

$fsbUserData = @{
    email = "fsb@internal.gov"
    password = "FSB_Secure_Password_2024!"
    firstName = "ФСБ"
    lastName = "Служба"
    role = "fsb"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/auth/register" -Method POST -Body $fsbUserData -ContentType "application/json"
    Write-Host "✅ Пользователь ФСБ создан успешно" -ForegroundColor Green
    Write-Host "Email: fsb@internal.gov" -ForegroundColor Cyan
    Write-Host "Role: fsb" -ForegroundColor Cyan
} catch {
    if ($_.Exception.Response.StatusCode -eq 409) {
        Write-Host "⚠️ Пользователь ФСБ уже существует" -ForegroundColor Yellow
    } else {
        Write-Host "❌ Ошибка при создании пользователя ФСБ: $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "Попробуйте запустить auth-service: docker-compose up auth-service -d" -ForegroundColor Yellow
        exit 1
    }
}

# 3. Получаем токен для ФСБ
Write-Host "`n3. Получение токена для ФСБ..." -ForegroundColor Yellow

$loginData = @{
    email = "fsb@internal.gov"
    password = "FSB_Secure_Password_2024!"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $fsbToken = $loginResponse.access_token
    Write-Host "✅ Токен ФСБ получен успешно" -ForegroundColor Green
    Write-Host "Токен: $($fsbToken.Substring(0, 20))..." -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка при получении токена: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Сохраняем токен в файл для тестирования
$tokenFile = "fsb-token.txt"
$fsbToken | Out-File -FilePath $tokenFile -Encoding UTF8
Write-Host "`n4. Токен сохранен в файл: $tokenFile" -ForegroundColor Green

# 5. Тестируем доступ к ФСБ эндпоинтам
Write-Host "`n5. Тестирование доступа к ФСБ эндпоинтам..." -ForegroundColor Yellow

$headers = @{
    "Authorization" = "Bearer $fsbToken"
    "Content-Type" = "application/json"
}

try {
    # Тест получения настроек обезличивания
    $anonymizationSettings = Invoke-RestMethod -Uri "http://localhost:3000/fsb/anonymization/settings" -Method GET -Headers $headers
    Write-Host "✅ Доступ к настройкам обезличивания: OK" -ForegroundColor Green
    Write-Host "Текущие настройки: $($anonymizationSettings.data | ConvertTo-Json -Compress)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка доступа к настройкам обезличивания: $($_.Exception.Message)" -ForegroundColor Red
}

try {
    # Тест получения статистики системы
    $systemStats = Invoke-RestMethod -Uri "http://localhost:3000/fsb/statistics" -Method GET -Headers $headers
    Write-Host "✅ Доступ к статистике системы: OK" -ForegroundColor Green
    Write-Host "Всего запросов: $($systemStats.data.totalRequests)" -ForegroundColor Cyan
    Write-Host "Всего пользователей: $($systemStats.data.totalUsers)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка доступа к статистике: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Создаем скрипт для тестирования ФСБ
$testScript = @"
#!/usr/bin/env pwsh

# Тест ФСБ функциональности
Write-Host "=== Тест ФСБ функциональности ===" -ForegroundColor Green

`$fsbToken = Get-Content "fsb-token.txt" -Raw
`$headers = @{
    "Authorization" = "Bearer `$fsbToken"
    "Content-Type" = "application/json"
}

# 1. Поиск по запросам
Write-Host "`n1. Поиск по запросам..." -ForegroundColor Yellow
try {
    `$searchResults = Invoke-RestMethod -Uri "http://localhost:3000/fsb/search/requests?limit=5" -Method GET -Headers `$headers
    Write-Host "✅ Найдено запросов: `$(`$searchResults.pagination.total)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка поиска: `$(`$_.Exception.Message)" -ForegroundColor Red
}

# 2. Поиск по пользователям
Write-Host "`n2. Поиск по пользователям..." -ForegroundColor Yellow
try {
    `$userResults = Invoke-RestMethod -Uri "http://localhost:3000/fsb/search/users?limit=5" -Method GET -Headers `$headers
    Write-Host "✅ Найдено пользователей: `$(`$userResults.pagination.total)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка поиска пользователей: `$(`$_.Exception.Message)" -ForegroundColor Red
}

# 3. Тест управления настройками обезличивания
Write-Host "`n3. Тест управления настройками обезличивания..." -ForegroundColor Yellow

# 3.1. Создание настроек для OpenAI GPT-3.5-turbo
try {
    `$openaiSettings = @{
        provider = "openai"
        model = "gpt-3.5-turbo"
        enabled = `$true
        preserveMetadata = `$true
    } | ConvertTo-Json

    `$openaiResponse = Invoke-RestMethod -Uri "http://localhost:3000/fsb/anonymization/settings" -Method POST -Body `$openaiSettings -Headers `$headers
    Write-Host "✅ Настройки для OpenAI GPT-3.5-turbo созданы" -ForegroundColor Green
    Write-Host "ID: `$(`$openaiResponse.data.id)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка создания настроек OpenAI: `$(`$_.Exception.Message)" -ForegroundColor Red
}

# 3.2. Создание настроек для OpenRouter
try {
    `$openrouterSettings = @{
        provider = "openrouter"
        model = "gpt-4"
        enabled = `$false
        preserveMetadata = `$true
    } | ConvertTo-Json

    `$openrouterResponse = Invoke-RestMethod -Uri "http://localhost:3000/fsb/anonymization/settings" -Method POST -Body `$openrouterSettings -Headers `$headers
    Write-Host "✅ Настройки для OpenRouter GPT-4 созданы" -ForegroundColor Green
    Write-Host "ID: `$(`$openrouterResponse.data.id)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка создания настроек OpenRouter: `$(`$_.Exception.Message)" -ForegroundColor Red
}

# 3.3. Получение всех настроек
try {
    `$allSettings = Invoke-RestMethod -Uri "http://localhost:3000/fsb/anonymization/settings" -Method GET -Headers `$headers
    Write-Host "✅ Получены все настройки обезличивания" -ForegroundColor Green
    Write-Host "Всего настроек: `$(`$allSettings.pagination.total)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка получения настроек: `$(`$_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Тест завершен ===" -ForegroundColor Green
"@

$testScript | Out-File -FilePath "test-fsb-functionality.ps1" -Encoding UTF8
Write-Host "`n6. Создан скрипт для тестирования: test-fsb-functionality.ps1" -ForegroundColor Green

Write-Host "`n=== Создание пользователя ФСБ завершено ===" -ForegroundColor Green
Write-Host "Для тестирования запустите: ./test-fsb-functionality.ps1" -ForegroundColor Cyan
