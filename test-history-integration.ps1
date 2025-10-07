#!/usr/bin/env pwsh

# Тест интеграции истории запросов
# Проверяет полный поток: api-gateway -> analytics-service через RabbitMQ

Write-Host "=== Тест интеграции истории запросов ===" -ForegroundColor Green

# 1. Проверяем, что сервисы запущены
Write-Host "`n1. Проверка статуса сервисов..." -ForegroundColor Yellow

$services = @("api-gateway", "analytics-service", "rabbitmq")
foreach ($service in $services) {
    $status = docker-compose ps $service --format "table {{.Service}}\t{{.Status}}"
    Write-Host $status
}

# 2. Тестируем создание запроса к ИИ
Write-Host "`n2. Тестирование создания запроса к ИИ..." -ForegroundColor Yellow

$testRequest = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Привет! Это тестовый запрос для проверки истории."
        }
    )
    max_tokens = 100
    temperature = 0.7
} | ConvertTo-Json -Depth 3

Write-Host "Отправляем тестовый запрос..."
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/chat/completions?provider=openai" -Method POST -Body $testRequest -ContentType "application/json" -Headers @{
        "Authorization" = "Bearer test-token"
    }
    Write-Host "✅ Запрос успешно отправлен" -ForegroundColor Green
    Write-Host "Ответ: $($response.choices[0].message.content)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка при отправке запроса: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Проверяем логи api-gateway
Write-Host "`n3. Проверка логов api-gateway..." -ForegroundColor Yellow
Write-Host "Ищем события RabbitMQ в логах..."
docker-compose logs --tail=20 api-gateway | Select-String -Pattern "analytics|rabbitmq|event"

# 4. Проверяем логи analytics-service
Write-Host "`n4. Проверка логов analytics-service..." -ForegroundColor Yellow
Write-Host "Ищем обработку событий в логах..."
docker-compose logs --tail=20 analytics-service | Select-String -Pattern "analytics|event|processed"

# 5. Проверяем базу данных analytics-service
Write-Host "`n5. Проверка базы данных analytics-service..." -ForegroundColor Yellow
Write-Host "Проверяем таблицу analytics_events..."

$dbQuery = @"
SELECT 
    event_type,
    event_name,
    service,
    properties->>'provider' as provider,
    properties->>'model' as model,
    properties->>'tokensUsed' as tokens_used,
    created_at
FROM analytics_events 
WHERE event_type = 'ai_interaction' 
ORDER BY created_at DESC 
LIMIT 5;
"@

try {
    $dbResult = docker-compose exec -T analytics-service psql $env:ANALYTICS_DATABASE_URL -c $dbQuery
    Write-Host "✅ Данные в analytics_events:" -ForegroundColor Green
    Write-Host $dbResult
} catch {
    Write-Host "❌ Ошибка при проверке БД: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Проверяем базу данных api-gateway
Write-Host "`n6. Проверка базы данных api-gateway..." -ForegroundColor Yellow
Write-Host "Проверяем таблицу request_history..."

$dbQuery2 = @"
SELECT 
    request_type,
    provider,
    model,
    tokens_used,
    cost,
    status,
    created_at
FROM request_history 
ORDER BY created_at DESC 
LIMIT 5;
"@

try {
    $dbResult2 = docker-compose exec -T api-gateway psql $env:DATABASE_URL -c $dbQuery2
    Write-Host "✅ Данные в request_history:" -ForegroundColor Green
    Write-Host $dbResult2
} catch {
    Write-Host "❌ Ошибка при проверке БД: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Тест завершен ===" -ForegroundColor Green
