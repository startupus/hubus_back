# Полное тестирование Auth Service
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

Write-Host "=== Полное тестирование Auth Service ===" -ForegroundColor Green

# 1. Вход в систему
Write-Host "`n1. Вход в систему..." -ForegroundColor Yellow

$loginData = @{
    email = "newuser2@example.com"
    password = "password123"
} | ConvertTo-Json -Depth 10

try {
    $loginResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/login" -Method POST -Body $loginData -ContentType "application/json; charset=utf-8"
    Write-Host "✅ Вход успешен:" -ForegroundColor Green
    Write-Host "Status: $($loginResponse.success)"
    Write-Host "User ID: $($loginResponse.user.id)"
    Write-Host "Email: $($loginResponse.user.email)"
    Write-Host "Token: $($loginResponse.token.Substring(0, 20))..."
    
    # 2. Создание API ключа
    Write-Host "`n2. Создание API ключа..." -ForegroundColor Yellow
    
    $apiKeyData = @{
        name = "Test API Key"
    } | ConvertTo-Json -Depth 10
    
    $headers = @{
        "Authorization" = "Bearer $($loginResponse.token)"
        "Content-Type" = "application/json; charset=utf-8"
    }
    
    try {
        $apiKeyResponse = Invoke-RestMethod -Uri "http://localhost:3001/auth/api-keys" -Method POST -Body $apiKeyData -Headers $headers
        Write-Host "✅ API ключ создан:" -ForegroundColor Green
        Write-Host "Status: $($apiKeyResponse.success)"
        Write-Host "API Key: $($apiKeyResponse.apiKey.key.Substring(0, 20))..."
        Write-Host "Name: $($apiKeyResponse.apiKey.name)"
        Write-Host "User ID: $($apiKeyResponse.apiKey.userId)"
        
        # Сохраняем данные для дальнейшего использования
        $global:accessToken = $loginResponse.token
        $global:apiKey = $apiKeyResponse.apiKey.key
        $global:userId = $loginResponse.user.id
        
    } catch {
        Write-Host "❌ Ошибка создания API ключа:" -ForegroundColor Red
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
        Write-Host "Error: $($_.Exception.Message)"
        
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Red
        }
    }
    
} catch {
    Write-Host "❌ Ошибка входа:" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Error: $($_.Exception.Message)"
}

# 3. Тестирование других сервисов с полученными данными
if ($global:accessToken -and $global:apiKey) {
    Write-Host "`n3. Тестирование других сервисов..." -ForegroundColor Yellow
    
    # Тестирование Analytics Service
    Write-Host "`n3.1. Тестирование Analytics Service..." -ForegroundColor Cyan
    
    $analyticsData = @{
        eventName = "test_event"
        eventType = "ai_interaction"
        service = "test-service"
        properties = @{
            test = "value"
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $analyticsResponse = Invoke-RestMethod -Uri "http://localhost:3005/analytics/events/track" -Method POST -Body $analyticsData -ContentType "application/json; charset=utf-8"
        Write-Host "✅ Analytics событие отслежено:" -ForegroundColor Green
        Write-Host "Status: $($analyticsResponse.success)"
        Write-Host "Event ID: $($analyticsResponse.eventId)"
    } catch {
        Write-Host "❌ Ошибка Analytics:" -ForegroundColor Red
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
        Write-Host "Error: $($_.Exception.Message)"
    }
    
    # Тестирование Proxy Service
    Write-Host "`n3.2. Тестирование Proxy Service..." -ForegroundColor Cyan
    
    $proxyData = @{
        userId = $global:userId
        provider = "openai"
        model = "gpt-3.5-turbo"
        messages = @(
            @{
                role = "user"
                content = "Hello"
            }
        )
    } | ConvertTo-Json -Depth 10
    
    try {
        $proxyResponse = Invoke-RestMethod -Uri "http://localhost:3003/proxy/request" -Method POST -Body $proxyData -ContentType "application/json; charset=utf-8"
        Write-Host "✅ Proxy запрос выполнен:" -ForegroundColor Green
        Write-Host "Status: $($proxyResponse.success)"
        Write-Host "Response: $($proxyResponse.responseText.Substring(0, [Math]::Min(50, $proxyResponse.responseText.Length)))..."
    } catch {
        Write-Host "❌ Ошибка Proxy:" -ForegroundColor Red
        Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
        Write-Host "Error: $($_.Exception.Message)"
    }
}

Write-Host "`n=== Тестирование завершено ===" -ForegroundColor Green
