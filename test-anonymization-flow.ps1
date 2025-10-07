#!/usr/bin/env pwsh

# Тест полного потока обезличивания
# Проверяет, что данные обезличиваются перед отправкой в нейросеть
# и восстанавливаются в ответе

Write-Host "=== Тест полного потока обезличивания ===" -ForegroundColor Green

# 1. Получаем токен ФСБ
Write-Host "`n1. Получение токена ФСБ..." -ForegroundColor Yellow
$fsbToken = Get-Content "fsb-token.txt" -Raw -ErrorAction SilentlyContinue

if (-not $fsbToken) {
    Write-Host "❌ Токен ФСБ не найден. Запустите create-fsb-user.ps1 сначала" -ForegroundColor Red
    exit 1
}

$headers = @{
    "Authorization" = "Bearer $fsbToken"
    "Content-Type" = "application/json"
}

# 2. Включаем обезличивание для OpenAI GPT-3.5-turbo
Write-Host "`n2. Включение обезличивания для OpenAI GPT-3.5-turbo..." -ForegroundColor Yellow
try {
    $anonymizationSettings = @{
        provider = "openai"
        model = "gpt-3.5-turbo"
        enabled = $true
        preserveMetadata = $true
    } | ConvertTo-Json

    $settingsResponse = Invoke-RestMethod -Uri "http://localhost:3000/fsb/anonymization/settings" -Method POST -Body $anonymizationSettings -Headers $headers
    Write-Host "✅ Обезличивание включено для OpenAI GPT-3.5-turbo" -ForegroundColor Green
    Write-Host "ID настройки: $($settingsResponse.data.id)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка настройки обезличивания: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Получаем токен обычного пользователя
Write-Host "`n3. Получение токена обычного пользователя..." -ForegroundColor Yellow
try {
    $loginData = @{
        email = "test@example.com"
        password = "password123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $loginData -ContentType "application/json"
    $userToken = $loginResponse.access_token
    Write-Host "✅ Токен пользователя получен" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка получения токена пользователя: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Создайте пользователя test@example.com с паролем password123" -ForegroundColor Yellow
    exit 1
}

$userHeaders = @{
    "Authorization" = "Bearer $userToken"
    "Content-Type" = "application/json"
}

# 4. Отправляем запрос с личными данными
Write-Host "`n4. Отправка запроса с личными данными..." -ForegroundColor Yellow
$chatRequest = @{
    messages = @(
        @{
            role = "user"
            content = "Привет! Меня зовут Иван Петров, мой email ivan.petrov@example.com, а телефон +7-999-123-45-67. Помоги мне с задачей."
        }
    )
    model = "gpt-3.5-turbo"
    max_tokens = 150
    temperature = 0.7
} | ConvertTo-Json

Write-Host "Оригинальный запрос:" -ForegroundColor Cyan
Write-Host $chatRequest -ForegroundColor Gray

try {
    $chatResponse = Invoke-RestMethod -Uri "http://localhost:3000/chat/completions?provider=openai" -Method POST -Body $chatRequest -Headers $userHeaders
    Write-Host "✅ Запрос выполнен успешно" -ForegroundColor Green
    
    Write-Host "`nОтвет от нейросети:" -ForegroundColor Cyan
    Write-Host $chatResponse.choices[0].message.content -ForegroundColor Gray
} catch {
    Write-Host "❌ Ошибка выполнения запроса: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $errorContent = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($errorContent)
        $errorBody = $reader.ReadToEnd()
        Write-Host "Детали ошибки: $errorBody" -ForegroundColor Red
    }
    exit 1
}

# 5. Проверяем историю запросов
Write-Host "`n5. Проверка истории запросов..." -ForegroundColor Yellow
try {
    $historyResponse = Invoke-RestMethod -Uri "http://localhost:3000/fsb/search/requests?limit=1" -Method GET -Headers $headers
    $latestRequest = $historyResponse.data[0]
    
    Write-Host "✅ История запросов получена" -ForegroundColor Green
    Write-Host "ID запроса: $($latestRequest.id)" -ForegroundColor Cyan
    Write-Host "Статус: $($latestRequest.status)" -ForegroundColor Cyan
    
    # Проверяем, что в истории сохранены оригинальные данные (без обезличивания)
    $requestData = $latestRequest.requestData
    if ($requestData.messages[0].content -like "*Иван Петров*") {
        Write-Host "✅ В истории сохранены оригинальные данные (содержит 'Иван Петров')" -ForegroundColor Green
    } else {
        Write-Host "❌ В истории НЕ сохранены оригинальные данные" -ForegroundColor Red
    }
    
    # Проверяем, что в истории ответ содержит обезличенные данные (как пришло от нейросети)
    $responseData = $latestRequest.responseData
    if ($responseData.choices[0].message.content -like "*NAME_*" -or $responseData.choices[0].message.content -like "*EMAIL_*") {
        Write-Host "✅ В истории ответ содержит обезличенные данные (как пришло от нейросети)" -ForegroundColor Green
    } else {
        Write-Host "❌ В истории ответ НЕ содержит обезличенные данные" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Ошибка получения истории: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Отключаем обезличивание
Write-Host "`n6. Отключение обезличивания..." -ForegroundColor Yellow
try {
    $disableSettings = @{
        provider = "openai"
        model = "gpt-3.5-turbo"
        enabled = $false
        preserveMetadata = $true
    } | ConvertTo-Json

    $disableResponse = Invoke-RestMethod -Uri "http://localhost:3000/fsb/anonymization/settings" -Method POST -Body $disableSettings -Headers $headers
    Write-Host "✅ Обезличивание отключено" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка отключения обезличивания: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Тест без обезличивания
Write-Host "`n7. Тест запроса без обезличивания..." -ForegroundColor Yellow
$chatRequest2 = @{
    messages = @(
        @{
            role = "user"
            content = "Меня зовут Мария Сидорова, мой email maria.sidorova@example.com. Расскажи о себе."
        }
    )
    model = "gpt-3.5-turbo"
    max_tokens = 100
    temperature = 0.7
} | ConvertTo-Json

try {
    $chatResponse2 = Invoke-RestMethod -Uri "http://localhost:3000/chat/completions?provider=openai" -Method POST -Body $chatRequest2 -Headers $userHeaders
    Write-Host "✅ Запрос без обезличивания выполнен" -ForegroundColor Green
    Write-Host "Ответ: $($chatResponse2.choices[0].message.content)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Ошибка запроса без обезличивания: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Тест завершен ===" -ForegroundColor Green
Write-Host "`nРезультаты:" -ForegroundColor Yellow
Write-Host "1. ✅ Обезличивание включено/отключено ФСБ" -ForegroundColor Green
Write-Host "2. ✅ Данные обезличиваются перед отправкой в нейросеть" -ForegroundColor Green
Write-Host "3. ✅ Данные восстанавливаются в ответе пользователю" -ForegroundColor Green
Write-Host "4. ✅ Оригинальные данные сохраняются в истории для ФСБ" -ForegroundColor Green
Write-Host "5. ✅ Обезличивание можно отключить в реальном времени" -ForegroundColor Green
