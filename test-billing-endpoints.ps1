# Тестирование Billing Service endpoints
Write-Host "🧪 Тестирование Billing Service endpoints..." -ForegroundColor Green

# 1. Тест получения баланса
Write-Host "`n1. Тестирование GET /billing/balance/user123" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/user123" -Method GET
    Write-Host "✅ Успешно: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

# 2. Тест обновления баланса
Write-Host "`n2. Тестирование POST /billing/balance/update" -ForegroundColor Yellow
try {
    $body = @{
        userId = "user123"
        amount = 100.50
        operation = "add"
        description = "Test balance update"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/update" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Успешно: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Тест создания транзакции
Write-Host "`n3. Тестирование POST /billing/transactions" -ForegroundColor Yellow
try {
    $body = @{
        userId = "user123"
        type = "CREDIT"
        amount = 50.00
        description = "Test transaction"
        currency = "USD"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3004/billing/transactions" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Успешно: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Тест расчета стоимости
Write-Host "`n4. Тестирование POST /billing/calculate-cost" -ForegroundColor Yellow
try {
    $body = @{
        userId = "user123"
        service = "ai-chat"
        resource = "gpt-4"
        quantity = 1
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3004/billing/calculate-cost" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Успешно: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Тест обработки платежа
Write-Host "`n5. Тестирование POST /billing/payment" -ForegroundColor Yellow
try {
    $body = @{
        userId = "user123"
        amount = 200.00
        description = "Test payment"
        currency = "USD"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3004/billing/payment" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Успешно: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

# 6. Тест отслеживания использования
Write-Host "`n6. Тестирование POST /billing/usage/track" -ForegroundColor Yellow
try {
    $body = @{
        userId = "user123"
        service = "ai-chat"
        resource = "gpt-4"
        quantity = 1
        unit = "request"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "http://localhost:3004/billing/usage/track" -Method POST -Body $body -ContentType "application/json"
    Write-Host "✅ Успешно: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Тест получения истории транзакций
Write-Host "`n7. Тестирование GET /billing/transactions/user123" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3004/billing/transactions/user123" -Method GET
    Write-Host "✅ Успешно: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Тест получения отчета
Write-Host "`n8. Тестирование GET /billing/report/user123" -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3004/billing/report/user123?startDate=2024-01-01&endDate=2024-12-31" -Method GET
    Write-Host "✅ Успешно: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n🎉 Тестирование завершено!" -ForegroundColor Green

