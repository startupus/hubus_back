# Тест обновления баланса
Write-Host "=== Тест обновления баланса ===" -ForegroundColor Green

# 1. Получаем текущий баланс
Write-Host "1. Получаем текущий баланс..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/813879da-56eb-49d2-a85d-d1ae92ac3f90" -Method GET
    Write-Host "Текущий баланс: $($balanceResponse.balance.balance) $($balanceResponse.balance.currency)" -ForegroundColor Cyan
} catch {
    Write-Host "Ошибка получения баланса: $_" -ForegroundColor Red
    exit 1
}

# 2. Отправляем событие биллинга
Write-Host "2. Отправляем событие биллинга..." -ForegroundColor Yellow
$billingEvent = @{
    eventType = "ai_usage"
    userId = "813879da-56eb-49d2-a85d-d1ae92ac3f90"
    service = "ai-chat"
    resource = "tokens"
    tokens = 100
    cost = 0.1
    provider = "openai"
    model = "gpt-3.5-turbo"
    timestamp = (Get-Date).ToUniversalTime().ToString("yyyy-MM-ddTHH:mm:ss.fffZ")
    metadata = @{
        service = "proxy-service"
        currency = "USD"
        requestId = "test-balance-update-$(Get-Date -Format 'yyyyMMdd-HHmmss-fff')"
    }
} | ConvertTo-Json

try {
    # Отправляем через RabbitMQ
    docker exec project-rabbitmq-1 rabbitmqadmin publish routing_key="billing.usage" payload="$billingEvent" properties="content_type=application/json"
    Write-Host "Событие биллинга отправлено в RabbitMQ" -ForegroundColor Green
} catch {
    Write-Host "Ошибка отправки события: $_" -ForegroundColor Red
}

# 3. Ждем обработки
Write-Host "3. Ждем обработки (5 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# 4. Проверяем обновленный баланс
Write-Host "4. Проверяем обновленный баланс..." -ForegroundColor Yellow
try {
    $newBalanceResponse = Invoke-RestMethod -Uri "http://localhost:3004/billing/balance/813879da-56eb-49d2-a85d-d1ae92ac3f90" -Method GET
    Write-Host "Новый баланс: $($newBalanceResponse.balance.balance) $($newBalanceResponse.balance.currency)" -ForegroundColor Cyan
    
    $oldBalance = [decimal]$balanceResponse.balance.balance
    $newBalance = [decimal]$newBalanceResponse.balance.balance
    $difference = $oldBalance - $newBalance
    
    if ($difference -gt 0) {
        Write-Host "✅ Баланс обновился! Списано: $difference" -ForegroundColor Green
    } else {
        Write-Host "❌ Баланс НЕ обновился!" -ForegroundColor Red
    }
} catch {
    Write-Host "Ошибка получения обновленного баланса: $_" -ForegroundColor Red
}

Write-Host "=== Тест завершен ===" -ForegroundColor Green
