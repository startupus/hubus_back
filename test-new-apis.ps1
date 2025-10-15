# Тест новых API
Write-Host "=== Тестирование новых API ==="

# 1. Тест API подписок (без аутентификации)
Write-Host "`n1. Тестирование API подписок..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/subscription/plans" -Method GET -UseBasicParsing
    Write-Host "✓ API подписок работает: $($response.StatusCode)"
    $plans = $response.Content | ConvertFrom-Json
    Write-Host "  Найдено планов: $($plans.data.Count)"
    foreach ($plan in $plans.data) {
        Write-Host "  - $($plan.name): $($plan.price) $($plan.currency)"
    }
} catch {
    Write-Host "✗ Ошибка API подписок: $($_.Exception.Message)"
}

# 2. Тест API рефералов (с аутентификацией)
Write-Host "`n2. Тестирование API рефералов..."
try {
    # Получаем токен
    $loginData = @{
        email = "test@example.com"
        password = "password123"
    } | ConvertTo-Json

    $loginResponse = Invoke-WebRequest -Uri "http://localhost:3000/v1/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    $loginResult = $loginResponse.Content | ConvertFrom-Json
    $token = $loginResult.accessToken

    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }

    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/referral/earnings" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✓ API рефералов работает: $($response.StatusCode)"
    $earnings = $response.Content | ConvertFrom-Json
    Write-Host "  Реферальные доходы получены"
} catch {
    Write-Host "✗ Ошибка API рефералов: $($_.Exception.Message)"
}

# 3. Тест API сотрудников (с аутентификацией)
Write-Host "`n3. Тестирование API сотрудников..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/employee" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "✓ API сотрудников работает: $($response.StatusCode)"
    $employees = $response.Content | ConvertFrom-Json
    Write-Host "  Сотрудники получены"
} catch {
    Write-Host "✗ Ошибка API сотрудников: $($_.Exception.Message)"
}

Write-Host "`n=== Тестирование завершено ==="