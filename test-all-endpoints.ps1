# Полное тестирование всех endpoints
Write-Host "`n=== ПОЛНОЕ ТЕСТИРОВАНИЕ ВСЕХ ENDPOINTS ===" -ForegroundColor Green

# Получение токена
Write-Host "`n1. Аутентификация..." -ForegroundColor Yellow
$body = @{
    email = "testuser2@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/auth/login" -Method POST -Body $body -ContentType "application/json"
    $loginData = $response.Content | ConvertFrom-Json
    $token = $loginData.accessToken
    Write-Host "   ✅ Login успешен" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Ошибка login: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Тестирование Models endpoints
Write-Host "`n2. Models Endpoints..." -ForegroundColor Yellow

# GET /v1/models
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/models" -Headers @{"Authorization"="Bearer $token"} -Method GET
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ GET /v1/models: $($response.StatusCode) - Models: $($data.models.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GET /v1/models: $($_.Exception.Message)" -ForegroundColor Red
}

# GET /v1/models/providers
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/models/providers" -Headers @{"Authorization"="Bearer $token"} -Method GET
    Write-Host "   ✅ GET /v1/models/providers: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GET /v1/models/providers: $($_.Exception.Message)" -ForegroundColor Red
}

# GET /v1/models/categories
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/models/categories" -Headers @{"Authorization"="Bearer $token"} -Method GET
    Write-Host "   ✅ GET /v1/models/categories: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GET /v1/models/categories: $($_.Exception.Message)" -ForegroundColor Red
}

# Тестирование API Keys endpoints
Write-Host "`n3. API Keys Endpoints..." -ForegroundColor Yellow

# GET /v1/auth/api-keys
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/auth/api-keys" -Headers @{"Authorization"="Bearer $token"} -Method GET
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ GET /v1/auth/api-keys: $($response.StatusCode) - Keys: $($data.apiKeys.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GET /v1/auth/api-keys: $($_.Exception.Message)" -ForegroundColor Red
}

# POST /v1/auth/api-keys
try {
    $body = @{
        name = "Test API Key $(Get-Date -Format 'yyyyMMddHHmmss')"
        description = "Test key"
        permissions = @("read", "write")
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/auth/api-keys" -Headers @{"Authorization"="Bearer $token"} -Method POST -Body $body -ContentType "application/json"
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ POST /v1/auth/api-keys: $($response.StatusCode) - Key created: $($data.apiKey.name)" -ForegroundColor Green
    $createdKeyId = $data.apiKey.id
} catch {
    Write-Host "   ❌ POST /v1/auth/api-keys: $($_.Exception.Message)" -ForegroundColor Red
}

# Тестирование Billing endpoints
Write-Host "`n4. Billing Endpoints..." -ForegroundColor Yellow

# GET /v1/billing/balance
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/billing/balance" -Headers @{"Authorization"="Bearer $token"} -Method GET
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ GET /v1/billing/balance: $($response.StatusCode) - Balance: $($data.balance)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GET /v1/billing/balance: $($_.Exception.Message)" -ForegroundColor Red
}

# GET /v1/billing/transactions
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/billing/transactions" -Headers @{"Authorization"="Bearer $token"} -Method GET
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ GET /v1/billing/transactions: $($response.StatusCode) - Transactions: $($data.transactions.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GET /v1/billing/transactions: $($_.Exception.Message)" -ForegroundColor Red
}

# GET /v1/billing/usage
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/billing/usage" -Headers @{"Authorization"="Bearer $token"} -Method GET
    Write-Host "   ✅ GET /v1/billing/usage: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GET /v1/billing/usage: $($_.Exception.Message)" -ForegroundColor Red
}

# Тестирование Chat endpoints
Write-Host "`n5. Chat Endpoints..." -ForegroundColor Yellow

# POST /v1/chat/completions
try {
    $body = @{
        model = "gpt-3.5-turbo"
        messages = @(
            @{
                role = "user"
                content = "Hello, this is a test!"
            }
        )
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/chat/completions" -Headers @{"Authorization"="Bearer $token"} -Method POST -Body $body -ContentType "application/json"
    Write-Host "   ✅ POST /v1/chat/completions: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ POST /v1/chat/completions: $($_.Exception.Message)" -ForegroundColor Red
}

# Тестирование History endpoints
Write-Host "`n6. History Endpoints..." -ForegroundColor Yellow

# GET /v1/history
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/history" -Headers @{"Authorization"="Bearer $token"} -Method GET
    $data = $response.Content | ConvertFrom-Json
    Write-Host "   ✅ GET /v1/history: $($response.StatusCode) - Records: $($data.items.Count)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GET /v1/history: $($_.Exception.Message)" -ForegroundColor Red
}

# Тестирование Analytics endpoints
Write-Host "`n7. Analytics Endpoints..." -ForegroundColor Yellow

# GET /v1/analytics/metrics
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/analytics/metrics" -Headers @{"Authorization"="Bearer $token"} -Method GET
    Write-Host "   ✅ GET /v1/analytics/metrics: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GET /v1/analytics/metrics: $($_.Exception.Message)" -ForegroundColor Red
}

# Тестирование FSB endpoints
Write-Host "`n8. FSB Endpoints..." -ForegroundColor Yellow

# GET /v1/fsb/statistics
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/fsb/statistics" -Headers @{"Authorization"="Bearer $token"} -Method GET
    Write-Host "   ✅ GET /v1/fsb/statistics: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GET /v1/fsb/statistics: $($_.Exception.Message)" -ForegroundColor Red
}

# Тестирование Anonymization endpoints
Write-Host "`n9. Anonymization Endpoints..." -ForegroundColor Yellow

# POST /v1/anonymization/anonymize
try {
    $body = @{
        text = "My name is John Smith and my email is john@example.com"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/anonymization/anonymize" -Headers @{"Authorization"="Bearer $token"} -Method POST -Body $body -ContentType "application/json"
    Write-Host "   ✅ POST /v1/anonymization/anonymize: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ POST /v1/anonymization/anonymize: $($_.Exception.Message)" -ForegroundColor Red
}

# Тестирование AI Certification endpoints
Write-Host "`n10. AI Certification Endpoints..." -ForegroundColor Yellow

# POST /v1/ai-certification/requests
try {
    $body = @{
        projectName = "Test AI Project"
        aiModelUsed = "gpt-3.5-turbo"
        description = "Test certification request"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/ai-certification/requests" -Headers @{"Authorization"="Bearer $token"} -Method POST -Body $body -ContentType "application/json"
    Write-Host "   ✅ POST /v1/ai-certification/requests: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ POST /v1/ai-certification/requests: $($_.Exception.Message)" -ForegroundColor Red
}

# GET /v1/ai-certification/requests
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/ai-certification/requests" -Headers @{"Authorization"="Bearer $token"} -Method GET
    Write-Host "   ✅ GET /v1/ai-certification/requests: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "   ❌ GET /v1/ai-certification/requests: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===" -ForegroundColor Green

