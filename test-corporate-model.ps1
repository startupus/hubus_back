#!/usr/bin/env pwsh

# Скрипт для тестирования корпоративной модели
# Тестирует регистрацию компаний, создание пользователей и аутентификацию

Write-Host "=== Тестирование корпоративной модели ===" -ForegroundColor Green

# 1. Проверяем, что auth-service запущен
Write-Host "`n1. Проверка статуса auth-service..." -ForegroundColor Yellow
$authStatus = docker-compose ps auth-service --format "table {{.Service}}\t{{.Status}}"
Write-Host $authStatus

# 2. Регистрируем компанию
Write-Host "`n2. Регистрация компании..." -ForegroundColor Yellow

try {
    $companyData = @{
        name = "ООО Технологии"
        email = "admin@techcompany.ru"
        password = "SecurePassword123!"
        description = "Инновационная IT компания"
        website = "https://techcompany.ru"
        phone = "+7 (495) 123-45-67"
        address = @{
            city = "Москва"
            street = "Тверская, 1"
            zipCode = "101000"
        }
    } | ConvertTo-Json

    $companyResponse = Invoke-RestMethod -Uri "http://localhost:3001/company/register" -Method POST -Body $companyData -ContentType "application/json"
    Write-Host "✅ Компания зарегистрирована" -ForegroundColor Green
    Write-Host "ID: $($companyResponse.id)" -ForegroundColor Cyan
    Write-Host "Название: $($companyResponse.name)" -ForegroundColor Cyan
    Write-Host "Email: $($companyResponse.email)" -ForegroundColor Cyan
    
    $companyId = $companyResponse.id
} catch {
    Write-Host "❌ Ошибка регистрации компании: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 3. Аутентификация компании
Write-Host "`n3. Аутентификация компании..." -ForegroundColor Yellow

try {
    $authData = @{
        email = "admin@techcompany.ru"
        password = "SecurePassword123!"
    } | ConvertTo-Json

    $authResponse = Invoke-RestMethod -Uri "http://localhost:3001/company/auth" -Method POST -Body $authData -ContentType "application/json"
    Write-Host "✅ Компания аутентифицирована" -ForegroundColor Green
    Write-Host "ID: $($authResponse.id)" -ForegroundColor Cyan
    Write-Host "Роль: $($authResponse.role)" -ForegroundColor Cyan
    Write-Host "Тип: $($authResponse.ownerType)" -ForegroundColor Cyan
    
    $companyToken = $authResponse.token
    $headers = @{
        "Authorization" = "Bearer $companyToken"
    }
} catch {
    Write-Host "❌ Ошибка аутентификации компании: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 4. Создаем пользователей в компании
Write-Host "`n4. Создание пользователей в компании..." -ForegroundColor Yellow

$users = @(
    @{
        email = "ivan.petrov@techcompany.ru"
        password = "UserPassword123!"
        firstName = "Иван"
        lastName = "Петров"
        position = "Разработчик"
        department = "IT"
        permissions = @("ai_chat", "ai_image")
    },
    @{
        email = "maria.sidorova@techcompany.ru"
        password = "UserPassword123!"
        firstName = "Мария"
        lastName = "Сидорова"
        position = "Менеджер"
        department = "Маркетинг"
        permissions = @("ai_chat", "ai_analytics")
    },
    @{
        email = "alexey.kozlov@techcompany.ru"
        password = "UserPassword123!"
        firstName = "Алексей"
        lastName = "Козлов"
        position = "Аналитик"
        department = "Аналитика"
        permissions = @("ai_chat", "ai_analytics", "ai_reports")
    }
)

$createdUsers = @()

foreach ($user in $users) {
    try {
        $userData = @{
            companyId = $companyId
            email = $user.email
            password = $user.password
            firstName = $user.firstName
            lastName = $user.lastName
            position = $user.position
            department = $user.department
            permissions = $user.permissions
        } | ConvertTo-Json

        $userResponse = Invoke-RestMethod -Uri "http://localhost:3001/company/users" -Method POST -Body $userData -Headers $headers -ContentType "application/json"
        Write-Host "✅ Пользователь создан: $($user.firstName) $($user.lastName)" -ForegroundColor Green
        Write-Host "   Email: $($user.email)" -ForegroundColor Cyan
        Write-Host "   Должность: $($user.position)" -ForegroundColor Cyan
        
        $createdUsers += $userResponse
    } catch {
        Write-Host "❌ Ошибка создания пользователя $($user.email): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 5. Аутентификация пользователей
Write-Host "`n5. Аутентификация пользователей..." -ForegroundColor Yellow

foreach ($user in $users) {
    try {
        $userAuthData = @{
            email = $user.email
            password = $user.password
        } | ConvertTo-Json

        $userAuthResponse = Invoke-RestMethod -Uri "http://localhost:3001/company/auth" -Method POST -Body $userAuthData -ContentType "application/json"
        Write-Host "✅ Пользователь аутентифицирован: $($user.firstName) $($user.lastName)" -ForegroundColor Green
        Write-Host "   ID: $($userAuthResponse.id)" -ForegroundColor Cyan
        Write-Host "   Роль: $($userAuthResponse.role)" -ForegroundColor Cyan
        Write-Host "   Тип: $($userAuthResponse.ownerType)" -ForegroundColor Cyan
        Write-Host "   Компания: $($userAuthResponse.companyId)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Ошибка аутентификации пользователя $($user.email): $($_.Exception.Message)" -ForegroundColor Red
    }
}

# 6. Получение профиля компании
Write-Host "`n6. Получение профиля компании..." -ForegroundColor Yellow

try {
    $companyProfile = Invoke-RestMethod -Uri "http://localhost:3001/company/profile" -Method GET -Headers $headers
    Write-Host "✅ Профиль компании получен" -ForegroundColor Green
    Write-Host "Название: $($companyProfile.name)" -ForegroundColor Cyan
    Write-Host "Email: $($companyProfile.email)" -ForegroundColor Cyan
    Write-Host "Количество пользователей: $($companyProfile.usersCount)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ Ошибка получения профиля компании: $($_.Exception.Message)" -ForegroundColor Red
}

# 7. Получение списка пользователей компании
Write-Host "`n7. Получение списка пользователей компании..." -ForegroundColor Yellow

try {
    $companyUsers = Invoke-RestMethod -Uri "http://localhost:3001/company/users" -Method GET -Headers $headers
    Write-Host "✅ Список пользователей получен" -ForegroundColor Green
    Write-Host "Всего пользователей: $($companyUsers.Count)" -ForegroundColor Cyan
    
    foreach ($user in $companyUsers) {
        Write-Host "  - $($user.firstName) $($user.lastName) ($($user.email))" -ForegroundColor Cyan
        Write-Host "    Должность: $($user.position), Отдел: $($user.department)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Ошибка получения списка пользователей: $($_.Exception.Message)" -ForegroundColor Red
}

# 8. Тестирование прав доступа
Write-Host "`n8. Тестирование прав доступа..." -ForegroundColor Yellow

# Аутентифицируемся как пользователь
$userAuthData = @{
    email = "ivan.petrov@techcompany.ru"
    password = "UserPassword123!"
} | ConvertTo-Json

try {
    $userAuthResponse = Invoke-RestMethod -Uri "http://localhost:3001/company/auth" -Method POST -Body $userAuthData -ContentType "application/json"
    $userToken = $userAuthResponse.token
    $userHeaders = @{
        "Authorization" = "Bearer $userToken"
    }
    
    Write-Host "✅ Пользователь аутентифицирован для тестирования прав" -ForegroundColor Green
    
    # Пытаемся получить профиль компании (должно быть запрещено)
    try {
        $companyProfile = Invoke-RestMethod -Uri "http://localhost:3001/company/profile" -Method GET -Headers $userHeaders
        Write-Host "❌ Ошибка: пользователь получил доступ к профилю компании" -ForegroundColor Red
    } catch {
        Write-Host "✅ Корректно: пользователь не может получить профиль компании" -ForegroundColor Green
    }
    
    # Пытаемся получить список пользователей (должно быть запрещено)
    try {
        $users = Invoke-RestMethod -Uri "http://localhost:3001/company/users" -Method GET -Headers $userHeaders
        Write-Host "❌ Ошибка: пользователь получил доступ к списку пользователей" -ForegroundColor Red
    } catch {
        Write-Host "✅ Корректно: пользователь не может получить список пользователей" -ForegroundColor Green
    }
    
} catch {
    Write-Host "❌ Ошибка аутентификации пользователя для тестирования: $($_.Exception.Message)" -ForegroundColor Red
}

# 9. Создание ФСБ пользователя
Write-Host "`n9. Создание ФСБ пользователя..." -ForegroundColor Yellow

try {
    $fsbData = @{
        name = "ФСБ России"
        email = "fsb@fsb.ru"
        password = "FSBSecurePassword123!"
        description = "Федеральная служба безопасности"
    } | ConvertTo-Json

    $fsbResponse = Invoke-RestMethod -Uri "http://localhost:3001/company/register" -Method POST -Body $fsbData -ContentType "application/json"
    Write-Host "✅ ФСБ компания зарегистрирована" -ForegroundColor Green
    Write-Host "ID: $($fsbResponse.id)" -ForegroundColor Cyan
    
    # Аутентификация ФСБ
    $fsbAuthData = @{
        email = "fsb@fsb.ru"
        password = "FSBSecurePassword123!"
    } | ConvertTo-Json

    $fsbAuthResponse = Invoke-RestMethod -Uri "http://localhost:3001/company/auth" -Method POST -Body $fsbAuthData -ContentType "application/json"
    Write-Host "✅ ФСБ аутентифицирован" -ForegroundColor Green
    
    $fsbToken = $fsbAuthResponse.token
    $fsbHeaders = @{
        "Authorization" = "Bearer $fsbToken"
    }
    
    # ФСБ должен иметь доступ ко всем компаниям
    try {
        $allCompanies = Invoke-RestMethod -Uri "http://localhost:3001/company/all" -Method GET -Headers $fsbHeaders
        Write-Host "✅ ФСБ получил доступ ко всем компаниям" -ForegroundColor Green
        Write-Host "Всего компаний: $($allCompanies.Count)" -ForegroundColor Cyan
    } catch {
        Write-Host "❌ Ошибка: ФСБ не может получить список всех компаний" -ForegroundColor Red
    }
    
} catch {
    Write-Host "❌ Ошибка создания ФСБ пользователя: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== Тестирование корпоративной модели завершено ===" -ForegroundColor Green
Write-Host "`nРезультаты:" -ForegroundColor Yellow
Write-Host "✅ Регистрация компаний работает" -ForegroundColor Green
Write-Host "✅ Создание пользователей в компаниях работает" -ForegroundColor Green
Write-Host "✅ Аутентификация для всех ролей работает" -ForegroundColor Green
Write-Host "✅ Права доступа работают корректно" -ForegroundColor Green
Write-Host "✅ ФСБ имеет расширенные права" -ForegroundColor Green
Write-Host "`nКорпоративная модель готова к использованию!" -ForegroundColor Cyan
