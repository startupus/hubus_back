# Тестирование полного функционала компаний
# Этот скрипт проверяет все возможности компаний: регистрацию, логин, создание API ключей, запросы к AI, статистику

Write-Host "=== Тестирование функционала компаний ===" -ForegroundColor Cyan
Write-Host ""

$baseUrl = "http://localhost:3000"
$companyEmail = "test-company-$(Get-Date -Format 'HHmmss')@example.com"
$companyPassword = "SecurePassword123!"
$companyName = "Test Company $(Get-Date -Format 'HHmmss')"

# 1. Регистрация компании
Write-Host "1. Регистрация компании..." -ForegroundColor Yellow
$registerBody = @{
    name = $companyName
    email = $companyEmail
    password = $companyPassword
    description = "Test company for functionality testing"
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri "$baseUrl/v1/companies/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "✅ Компания зарегистрирована успешно" -ForegroundColor Green
    Write-Host "Company ID: $($registerResponse.company.id)" -ForegroundColor Gray
    Write-Host "Access Token: $($registerResponse.accessToken.Substring(0, 20))..." -ForegroundColor Gray
    
    $companyId = $registerResponse.company.id
    $accessToken = $registerResponse.accessToken
} catch {
    Write-Host "❌ Ошибка регистрации компании: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 2. Логин компании
Write-Host "2. Логин компании..." -ForegroundColor Yellow
$loginBody = @{
    email = $companyEmail
    password = $companyPassword
} | ConvertTo-Json

try {
    $loginResponse = Invoke-RestMethod -Uri "$baseUrl/v1/companies/login" -Method POST -Body $loginBody -ContentType "application/json"
    Write-Host "✅ Компания вошла в систему успешно" -ForegroundColor Green
    Write-Host "New Access Token: $($loginResponse.accessToken.Substring(0, 20))..." -ForegroundColor Gray
    
    $accessToken = $loginResponse.accessToken
} catch {
    Write-Host "❌ Ошибка логина компании: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 3. Создание API ключа для компании
Write-Host "3. Создание API ключа для компании..." -ForegroundColor Yellow
$apiKeyBody = @{
    name = "Test API Key"
    description = "API key for testing"
    permissions = @("chat:read", "chat:write")
} | ConvertTo-Json

try {
    $apiKeyResponse = Invoke-RestMethod -Uri "$baseUrl/v1/companies/$companyId/api-keys" -Method POST -Body $apiKeyBody -ContentType "application/json" -Headers @{Authorization = "Bearer $accessToken"}
    Write-Host "✅ API ключ создан успешно" -ForegroundColor Green
    Write-Host "API Key: $($apiKeyResponse.key.Substring(0, 30))..." -ForegroundColor Gray
    
    $apiKey = $apiKeyResponse.key
} catch {
    Write-Host "❌ Ошибка создания API ключа: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# 4. Получение списка API ключей компании
Write-Host "4. Получение списка API ключей компании..." -ForegroundColor Yellow
try {
    $apiKeysResponse = Invoke-RestMethod -Uri "$baseUrl/v1/companies/$companyId/api-keys" -Method GET -Headers @{Authorization = "Bearer $accessToken"}
    Write-Host "✅ Список API ключей получен" -ForegroundColor Green
    Write-Host "Количество ключей: $($apiKeysResponse.length)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Ошибка получения API ключей: $_" -ForegroundColor Red
}

Write-Host ""

# 5. Создание пользователя в компании
Write-Host "5. Создание пользователя в компании..." -ForegroundColor Yellow
$userBody = @{
    email = "employee-$(Get-Date -Format 'HHmmss')@example.com"
    password = "EmployeePass123!"
    firstName = "John"
    lastName = "Doe"
    position = "Developer"
    department = "Engineering"
} | ConvertTo-Json

try {
    $userResponse = Invoke-RestMethod -Uri "$baseUrl/v1/companies/$companyId/users" -Method POST -Body $userBody -ContentType "application/json" -Headers @{Authorization = "Bearer $accessToken"}
    Write-Host "✅ Пользователь создан успешно" -ForegroundColor Green
    Write-Host "User ID: $($userResponse.id)" -ForegroundColor Gray
    Write-Host "Email: $($userResponse.email)" -ForegroundColor Gray
    
    $userId = $userResponse.id
} catch {
    Write-Host "❌ Ошибка создания пользователя: $_" -ForegroundColor Red
}

Write-Host ""

# 6. Получение списка пользователей компании
Write-Host "6. Получение списка пользователей компании..." -ForegroundColor Yellow
try {
    $usersResponse = Invoke-RestMethod -Uri "$baseUrl/v1/companies/$companyId/users" -Method GET -Headers @{Authorization = "Bearer $accessToken"}
    Write-Host "✅ Список пользователей получен" -ForegroundColor Green
    Write-Host "Количество пользователей: $($usersResponse.length)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Ошибка получения пользователей: $_" -ForegroundColor Red
}

Write-Host ""

# 7. Запрос к AI от имени компании
Write-Host "7. Запрос к AI от имени компании..." -ForegroundColor Yellow
$chatBody = @{
    model = "gpt-4o-mini"
    messages = @(
        @{
            role = "user"
            content = "Привет! Это тестовый запрос от компании."
        }
    )
} | ConvertTo-Json -Depth 10

try {
    $chatResponse = Invoke-RestMethod -Uri "$baseUrl/v1/chat/completions?provider=openai" -Method POST -Body $chatBody -ContentType "application/json" -Headers @{Authorization = "Bearer $accessToken"}
    Write-Host "✅ Запрос к AI выполнен успешно" -ForegroundColor Green
    Write-Host "Ответ: $($chatResponse.choices[0].message.content.Substring(0, [Math]::Min(100, $chatResponse.choices[0].message.content.Length)))..." -ForegroundColor Gray
    Write-Host "Использовано токенов: $($chatResponse.usage.total_tokens)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Ошибка запроса к AI: $_" -ForegroundColor Red
}

Write-Host ""

# 8. Проверка баланса компании
Write-Host "8. Проверка баланса компании..." -ForegroundColor Yellow
try {
    $balanceResponse = Invoke-RestMethod -Uri "$baseUrl/v1/billing/company/$companyId/balance" -Method GET
    Write-Host "✅ Баланс компании получен" -ForegroundColor Green
    Write-Host "Баланс: $($balanceResponse.balance.balance) $($balanceResponse.balance.currency)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Ошибка получения баланса: $_" -ForegroundColor Red
}

Write-Host ""

# 9. Получение транзакций компании
Write-Host "9. Получение транзакций компании..." -ForegroundColor Yellow
try {
    $transactionsResponse = Invoke-RestMethod -Uri "$baseUrl/v1/billing/company/$companyId/transactions?limit=10" -Method GET
    Write-Host "✅ Транзакции компании получены" -ForegroundColor Green
    Write-Host "Количество транзакций: $($transactionsResponse.transactions.length)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Ошибка получения транзакций: $_" -ForegroundColor Red
}

Write-Host ""

# 10. Получение статистики по пользователям компании
Write-Host "10. Получение статистики по пользователям компании..." -ForegroundColor Yellow
try {
    $statisticsResponse = Invoke-RestMethod -Uri "$baseUrl/v1/billing/company/$companyId/users/statistics" -Method GET
    Write-Host "✅ Статистика по пользователям получена" -ForegroundColor Green
    Write-Host "Всего пользователей: $($statisticsResponse.statistics.totals.totalUsers)" -ForegroundColor Gray
    Write-Host "Всего запросов: $($statisticsResponse.statistics.totals.totalRequests)" -ForegroundColor Gray
    Write-Host "Общая стоимость: $($statisticsResponse.statistics.totals.totalCost)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Ошибка получения статистики: $_" -ForegroundColor Red
}

Write-Host ""

# 11. Получение отчета по биллингу компании
Write-Host "11. Получение отчета по биллингу компании..." -ForegroundColor Yellow
try {
    $reportResponse = Invoke-RestMethod -Uri "$baseUrl/v1/billing/company/$companyId/report" -Method GET
    Write-Host "✅ Отчет по биллингу получен" -ForegroundColor Green
    Write-Host "Период: $($reportResponse.report.period.start) - $($reportResponse.report.period.end)" -ForegroundColor Gray
    Write-Host "Общее использование: $($reportResponse.report.totalUsage)" -ForegroundColor Gray
    Write-Host "Общая стоимость: $($reportResponse.report.totalCost)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Ошибка получения отчета: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Тестирование завершено ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Итоговая информация:" -ForegroundColor White
Write-Host "Company ID: $companyId" -ForegroundColor Gray
Write-Host "Company Email: $companyEmail" -ForegroundColor Gray
Write-Host "Access Token: $($accessToken.Substring(0, 30))..." -ForegroundColor Gray
if ($userId) {
    Write-Host "Employee User ID: $userId" -ForegroundColor Gray
}

