# Комплексный тест всех HTTP endpoints
# Регистрация → Авторизация → Отправка запросов к ИИ → Аналитика

Write-Host "=== КОМПЛЕКСНОЕ ТЕСТИРОВАНИЕ ВСЕХ HTTP ENDPOINTS ===" -ForegroundColor Green
Write-Host "`nТестируем полный цикл: Регистрация → Авторизация → ИИ → Аналитика" -ForegroundColor Yellow

# Переменные для хранения данных между тестами
$global:testUserId = $null
$global:testToken = $null
$global:testApiKey = $null

# Функция для форматированного вывода результатов
function Write-TestResult {
    param(
        [string]$TestName,
        [string]$Request,
        [string]$Expected,
        [string]$Actual,
        [bool]$Success
    )
    
    Write-Host "`n--- $TestName ---" -ForegroundColor Cyan
    Write-Host "Запрос: $Request" -ForegroundColor Gray
    Write-Host "Ожидаемый результат: $Expected" -ForegroundColor Gray
    if ($Success) {
        Write-Host "Полученный результат: $Actual" -ForegroundColor Green
    } else {
        Write-Host "Полученный результат: ОШИБКА - $Actual" -ForegroundColor Red
    }
}

# 1. HEALTH CHECKS
Write-Host "`n=== 1. HEALTH CHECKS ===" -ForegroundColor Green

$services = @(
    @{ Name = "API Gateway"; Port = 3000; Path = "/health" },
    @{ Name = "Auth Service"; Port = 3001; Path = "/health" },
    @{ Name = "Provider Orchestrator"; Port = 3002; Path = "/health" },
    @{ Name = "Proxy Service"; Port = 3003; Path = "/health" },
    @{ Name = "Billing Service"; Port = 3004; Path = "/health" },
    @{ Name = "Analytics Service"; Port = 3005; Path = "/health" }
)

foreach ($service in $services) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$($service.Port)$($service.Path)" -UseBasicParsing -TimeoutSec 5
        Write-TestResult -TestName "$($service.Name) Health" -Request "GET http://localhost:$($service.Port)$($service.Path)" -Expected "HTTP 200" -Actual "HTTP $($response.StatusCode)" -Success $true
    } catch {
        Write-TestResult -TestName "$($service.Name) Health" -Request "GET http://localhost:$($service.Port)$($service.Path)" -Expected "HTTP 200" -Actual $_.Exception.Message -Success $false
    }
}

# 2. AUTH SERVICE - REGISTRATION
Write-Host "`n=== 2. AUTH SERVICE - REGISTRATION ===" -ForegroundColor Green

$registerData = @{
    email = "testuser$(Get-Random)@example.com"
    password = "password123"
    firstName = "Test"
    lastName = "User"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/auth/register" -Method POST -Body $registerData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    $global:testUserId = $result.user.id
    Write-TestResult -TestName "User Registration" -Request "POST http://localhost:3001/auth/register" -Expected "HTTP 201, User created" -Actual "HTTP $($response.StatusCode), User ID: $($global:testUserId)" -Success $true
} catch {
    Write-TestResult -TestName "User Registration" -Request "POST http://localhost:3001/auth/register" -Expected "HTTP 201, User created" -Actual $_.Exception.Message -Success $false
}

# 3. AUTH SERVICE - LOGIN
Write-Host "`n=== 3. AUTH SERVICE - LOGIN ===" -ForegroundColor Green

$loginData = @{
    email = "testuser@example.com"
    password = "password123"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/auth/login" -Method POST -Body $loginData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    $global:testToken = $result.accessToken
    Write-TestResult -TestName "User Login" -Request "POST http://localhost:3001/auth/login" -Expected "HTTP 200, Token received" -Actual "HTTP $($response.StatusCode), Token: $($global:testToken.Substring(0,20))..." -Success $true
} catch {
    Write-TestResult -TestName "User Login" -Request "POST http://localhost:3001/auth/login" -Expected "HTTP 200, Token received" -Actual $_.Exception.Message -Success $false
}

# 4. AUTH SERVICE - CREATE API KEY
Write-Host "`n=== 4. AUTH SERVICE - CREATE API KEY ===" -ForegroundColor Green

$apiKeyData = @{
    userId = $global:testUserId
    name = "Test API Key"
    description = "API Key for testing"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/auth/api-keys" -Method POST -Body $apiKeyData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    $global:testApiKey = $result.apiKey.key
    Write-TestResult -TestName "Create API Key" -Request "POST http://localhost:3001/auth/api-keys" -Expected "HTTP 201, API Key created" -Actual "HTTP $($response.StatusCode), API Key: $($global:testApiKey.Substring(0,20))..." -Success $true
} catch {
    Write-TestResult -TestName "Create API Key" -Request "POST http://localhost:3001/auth/api-keys" -Expected "HTTP 201, API Key created" -Actual $_.Exception.Message -Success $false
}

# 5. PROVIDER ORCHESTRATOR - GET PROVIDERS
Write-Host "`n=== 5. PROVIDER ORCHESTRATOR - GET PROVIDERS ===" -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/orchestrator/providers" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-TestResult -TestName "Get Providers" -Request "GET http://localhost:3002/orchestrator/providers" -Expected "HTTP 200, Providers list" -Actual "HTTP $($response.StatusCode), Found $($result.providers.Count) providers" -Success $true
} catch {
    Write-TestResult -TestName "Get Providers" -Request "GET http://localhost:3002/orchestrator/providers" -Expected "HTTP 200, Providers list" -Actual $_.Exception.Message -Success $false
}

# 6. PROXY SERVICE - GET MODELS
Write-Host "`n=== 6. PROXY SERVICE - GET MODELS ===" -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003/proxy/models" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-TestResult -TestName "Get Models" -Request "GET http://localhost:3003/proxy/models" -Expected "HTTP 200, Models list" -Actual "HTTP $($response.StatusCode), Found $($result.models.Count) models" -Success $true
} catch {
    Write-TestResult -TestName "Get Models" -Request "GET http://localhost:3003/proxy/models" -Expected "HTTP 200, Models list" -Actual $_.Exception.Message -Success $false
}

# 7. PROXY SERVICE - PROXY REQUEST
Write-Host "`n=== 7. PROXY SERVICE - PROXY REQUEST ===" -ForegroundColor Green

$proxyData = @{
    userId = $global:testUserId
    provider = "openai"
    model = "gpt-4"
    prompt = "Hello, how are you?"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003/proxy/request" -Method POST -Body $proxyData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-TestResult -TestName "Proxy Request" -Request "POST http://localhost:3003/proxy/request" -Expected "HTTP 200, AI response" -Actual "HTTP $($response.StatusCode), Response: $($result.responseText.Substring(0,50))..." -Success $true
} catch {
    Write-TestResult -TestName "Proxy Request" -Request "POST http://localhost:3003/proxy/request" -Expected "HTTP 200, AI response" -Actual $_.Exception.Message -Success $false
}

# 8. BILLING SERVICE - GET BALANCE
Write-Host "`n=== 8. BILLING SERVICE - GET BALANCE ===" -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3004/billing/balance/$($global:testUserId)" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-TestResult -TestName "Get Balance" -Request "GET http://localhost:3004/billing/balance/$($global:testUserId)" -Expected "HTTP 200, User balance" -Actual "HTTP $($response.StatusCode), Balance: $($result.balance.balance) $($result.balance.currency)" -Success $true
} catch {
    Write-TestResult -TestName "Get Balance" -Request "GET http://localhost:3004/billing/balance/$($global:testUserId)" -Expected "HTTP 200, User balance" -Actual $_.Exception.Message -Success $false
}

# 9. BILLING SERVICE - CREATE TRANSACTION
Write-Host "`n=== 9. BILLING SERVICE - CREATE TRANSACTION ===" -ForegroundColor Green

$transactionData = @{
    userId = $global:testUserId
    type = "debit"
    amount = 0.05
    description = "AI request payment"
    provider = "openai"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3004/billing/transactions" -Method POST -Body $transactionData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-TestResult -TestName "Create Transaction" -Request "POST http://localhost:3004/billing/transactions" -Expected "HTTP 201, Transaction created" -Actual "HTTP $($response.StatusCode), Transaction ID: $($result.transaction.id)" -Success $true
} catch {
    Write-TestResult -TestName "Create Transaction" -Request "POST http://localhost:3004/billing/transactions" -Expected "HTTP 201, Transaction created" -Actual $_.Exception.Message -Success $false
}

# 10. ANALYTICS SERVICE - TRACK EVENT
Write-Host "`n=== 10. ANALYTICS SERVICE - TRACK EVENT ===" -ForegroundColor Green

$eventData = @{
    userId = $global:testUserId
    eventName = "ai_request_completed"
    eventType = "user_action"
    service = "proxy-service"
    properties = @{
        provider = "openai"
        model = "gpt-4"
        cost = 0.05
    }
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/analytics/events/track" -Method POST -Body $eventData -ContentType "application/json" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-TestResult -TestName "Track Event" -Request "POST http://localhost:3005/analytics/events/track" -Expected "HTTP 200, Event tracked" -Actual "HTTP $($response.StatusCode), Event ID: $($result.eventId)" -Success $true
} catch {
    Write-TestResult -TestName "Track Event" -Request "POST http://localhost:3005/analytics/events/track" -Expected "HTTP 200, Event tracked" -Actual $_.Exception.Message -Success $false
}

# 11. ANALYTICS SERVICE - GET DASHBOARD
Write-Host "`n=== 11. ANALYTICS SERVICE - GET DASHBOARD ===" -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/analytics/dashboard" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-TestResult -TestName "Get Dashboard" -Request "GET http://localhost:3005/analytics/dashboard" -Expected "HTTP 200, Dashboard data" -Actual "HTTP $($response.StatusCode), Total requests: $($result.totalRequests)" -Success $true
} catch {
    Write-TestResult -TestName "Get Dashboard" -Request "GET http://localhost:3005/analytics/dashboard" -Expected "HTTP 200, Dashboard data" -Actual $_.Exception.Message -Success $false
}

# 12. ANALYTICS SERVICE - GET USER ANALYTICS
Write-Host "`n=== 12. ANALYTICS SERVICE - GET USER ANALYTICS ===" -ForegroundColor Green

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/analytics/users/$($global:testUserId)/analytics" -UseBasicParsing
    $result = $response.Content | ConvertFrom-Json
    Write-TestResult -TestName "Get User Analytics" -Request "GET http://localhost:3005/analytics/users/$($global:testUserId)/analytics" -Expected "HTTP 200, User analytics" -Actual "HTTP $($response.StatusCode), User requests: $($result.totalRequests)" -Success $true
} catch {
    Write-TestResult -TestName "Get User Analytics" -Request "GET http://localhost:3005/analytics/users/$($global:testUserId)/analytics" -Expected "HTTP 200, User analytics" -Actual $_.Exception.Message -Success $false
}

Write-Host "`n=== ТЕСТИРОВАНИЕ ЗАВЕРШЕНО ===" -ForegroundColor Green
Write-Host "`nПроверьте результаты выше для оценки состояния системы." -ForegroundColor Yellow
