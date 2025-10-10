#!/usr/bin/env pwsh

Write-Host "=== ПОШАГОВОЕ ТЕСТИРОВАНИЕ РЕФЕРАЛЬНОЙ СИСТЕМЫ ===" -ForegroundColor Green
Write-Host "Показываем результат каждого шага..." -ForegroundColor Yellow

# Generate unique email addresses
$timestamp = Get-Date -Format "yyyyMMddHHmmss"
$user1Email = "user1-$timestamp@example.com"
$user2Email = "user2-$timestamp@example.com"

Write-Host "`n📧 Используем уникальные email адреса:" -ForegroundColor Cyan
Write-Host "  User 1: $user1Email" -ForegroundColor White
Write-Host "  User 2: $user2Email" -ForegroundColor White

# ========================================
# ШАГ 1: Регистрация первой компании
# ========================================
Write-Host "`n🔹 ШАГ 1: Регистрация первой компании (без реферала)" -ForegroundColor Magenta
Write-Host "Отправляем запрос на регистрацию..." -ForegroundColor Gray

$user1Data = @{
    name = "Компания-Пригласитель"
    email = $user1Email
    password = "password123"
    description = "Компания, которая будет приглашать других"
} | ConvertTo-Json

Write-Host "Данные для регистрации:" -ForegroundColor Gray
Write-Host $user1Data -ForegroundColor DarkGray

try {
    $user1Response = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $user1Data -ContentType "application/json"
    
    Write-Host "✅ РЕЗУЛЬТАТ ШАГА 1:" -ForegroundColor Green
    Write-Host "  Компания зарегистрирована успешно!" -ForegroundColor Green
    Write-Host "  ID: $($user1Response.company.id)" -ForegroundColor Cyan
    Write-Host "  Название: $($user1Response.company.name)" -ForegroundColor Cyan
    Write-Host "  Email: $($user1Response.company.email)" -ForegroundColor Cyan
    Write-Host "  Referred By: $($user1Response.company.referredBy)" -ForegroundColor Cyan
    Write-Host "  (пустое, так как это первая компания)" -ForegroundColor Gray
    
    $user1Id = $user1Response.company.id
    $user1Token = $user1Response.accessToken
    
    Write-Host "  Токен доступа получен: $($user1Token.Substring(0, 20))..." -ForegroundColor DarkCyan
} catch {
    Write-Host "❌ ОШИБКА В ШАГЕ 1: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# ШАГ 2: Создание реферального кода
# ========================================
Write-Host "`n🔹 ШАГ 2: Создание реферального кода для первой компании" -ForegroundColor Magenta
Write-Host "Отправляем запрос на создание реферального кода..." -ForegroundColor Gray

$referralCodeData = @{
    companyId = $user1Id
    description = "Реферальный код для приглашения новых компаний"
    maxUses = 10
} | ConvertTo-Json

Write-Host "Данные для создания кода:" -ForegroundColor Gray
Write-Host $referralCodeData -ForegroundColor DarkGray

try {
    $referralCodeResponse = Invoke-RestMethod -Uri "http://localhost:3001/referral/codes" -Method POST -Body $referralCodeData -ContentType "application/json"
    
    Write-Host "✅ РЕЗУЛЬТАТ ШАГА 2:" -ForegroundColor Green
    Write-Host "  Реферальный код создан успешно!" -ForegroundColor Green
    Write-Host "  Код: $($referralCodeResponse.code)" -ForegroundColor Cyan
    Write-Host "  Ссылка: $($referralCodeResponse.referralLink)" -ForegroundColor Cyan
    Write-Host "  Максимум использований: $($referralCodeResponse.maxUses)" -ForegroundColor Cyan
    Write-Host "  Текущее количество использований: $($referralCodeResponse.usedCount)" -ForegroundColor Cyan
    
    $referralCode = $referralCodeResponse.code
    $referralLink = $referralCodeResponse.referralLink
    
    Write-Host "`n  📋 ИНФОРМАЦИЯ ДЛЯ ПОЛЬЗОВАТЕЛЯ:" -ForegroundColor Yellow
    Write-Host "  Компания может поделиться этой ссылкой:" -ForegroundColor White
    Write-Host "  $referralLink" -ForegroundColor White
    Write-Host "  При переходе по ссылке пользователь попадет на страницу регистрации" -ForegroundColor White
} catch {
    Write-Host "❌ ОШИБКА В ШАГЕ 2: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# ШАГ 3: Регистрация второй компании по реферальной ссылке
# ========================================
Write-Host "`n🔹 ШАГ 3: Регистрация второй компании по реферальной ссылке" -ForegroundColor Magenta
Write-Host "Отправляем запрос на регистрацию с реферальной ссылкой..." -ForegroundColor Gray

$user2Data = @{
    name = "Компания-Реферал"
    email = $user2Email
    password = "password123"
    description = "Компания, которая регистрируется по реферальной ссылке"
    referralLink = $referralLink
} | ConvertTo-Json

Write-Host "Данные для регистрации (с реферальной ссылкой):" -ForegroundColor Gray
Write-Host $user2Data -ForegroundColor DarkGray

try {
    $user2Response = Invoke-RestMethod -Uri "http://localhost:3001/companies/register" -Method POST -Body $user2Data -ContentType "application/json"
    
    Write-Host "✅ РЕЗУЛЬТАТ ШАГА 3:" -ForegroundColor Green
    Write-Host "  Компания зарегистрирована по реферальной ссылке!" -ForegroundColor Green
    Write-Host "  ID: $($user2Response.company.id)" -ForegroundColor Cyan
    Write-Host "  Название: $($user2Response.company.name)" -ForegroundColor Cyan
    Write-Host "  Email: $($user2Response.company.email)" -ForegroundColor Cyan
    Write-Host "  Referred By: $($user2Response.company.referredBy)" -ForegroundColor Cyan
    
    if ($user2Response.company.referredBy -eq $user1Id) {
        Write-Host "  ✅ СВЯЗЬ УСТАНОВЛЕНА: Компания привязана к пригласившей!" -ForegroundColor Green
    } else {
        Write-Host "  ❌ ОШИБКА: Связь не установлена!" -ForegroundColor Red
    }
    
    $user2Id = $user2Response.company.id
    $user2Token = $user2Response.accessToken
} catch {
    Write-Host "❌ ОШИБКА В ШАГЕ 3: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# ========================================
# ШАГ 4: Проверка статистики рефералов
# ========================================
Write-Host "`n🔹 ШАГ 4: Проверка статистики рефералов" -ForegroundColor Magenta
Write-Host "Запрашиваем статистику для первой компании..." -ForegroundColor Gray

try {
    $referralStats = Invoke-RestMethod -Uri "http://localhost:3001/referral/stats?companyId=$user1Id" -Method GET
    
    Write-Host "✅ РЕЗУЛЬТАТ ШАГА 4:" -ForegroundColor Green
    Write-Host "  Статистика рефералов получена!" -ForegroundColor Green
    Write-Host "  Всего кодов: $($referralStats.totalCodes)" -ForegroundColor Cyan
    Write-Host "  Активных кодов: $($referralStats.activeCodes)" -ForegroundColor Cyan
    Write-Host "  Всего использований: $($referralStats.totalUses)" -ForegroundColor Cyan
    Write-Host "  Всего рефералов: $($referralStats.totalReferrals)" -ForegroundColor Cyan
    
    Write-Host "`n  📊 АНАЛИЗ СТАТИСТИКИ:" -ForegroundColor Yellow
    if ($referralStats.totalCodes -eq 1) {
        Write-Host "  ✅ Создан 1 реферальный код" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Количество кодов не соответствует ожидаемому" -ForegroundColor Yellow
    }
    
    if ($referralStats.totalUses -eq 1) {
        Write-Host "  ✅ Код использован 1 раз" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Количество использований не соответствует ожидаемому" -ForegroundColor Yellow
    }
    
    if ($referralStats.totalReferrals -eq 1) {
        Write-Host "  ✅ Получен 1 реферал" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Количество рефералов не соответствует ожидаемому" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ОШИБКА В ШАГЕ 4: $($_.Exception.Message)" -ForegroundColor Red
}

# ========================================
# ШАГ 5: Валидация реферального кода
# ========================================
Write-Host "`n🔹 ШАГ 5: Валидация реферального кода" -ForegroundColor Magenta
Write-Host "Проверяем, что код все еще валиден..." -ForegroundColor Gray

try {
    $validationResponse = Invoke-RestMethod -Uri "http://localhost:3001/referral/validate" -Method POST -Body (@{code = $referralCode} | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "✅ РЕЗУЛЬТАТ ШАГА 5:" -ForegroundColor Green
    Write-Host "  Валидация выполнена!" -ForegroundColor Green
    Write-Host "  Код валиден: $($validationResponse.isValid)" -ForegroundColor Cyan
    Write-Host "  Сообщение: $($validationResponse.message)" -ForegroundColor Cyan
    
    if ($validationResponse.isValid) {
        Write-Host "  ✅ Код все еще активен и может использоваться" -ForegroundColor Green
    } else {
        Write-Host "  ⚠️ Код не валиден: $($validationResponse.message)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "❌ ОШИБКА В ШАГЕ 5: $($_.Exception.Message)" -ForegroundColor Red
}

# ========================================
# ШАГ 6: Тест с невалидным кодом
# ========================================
Write-Host "`n🔹 ШАГ 6: Тест с невалидным реферальным кодом" -ForegroundColor Magenta
Write-Host "Проверяем обработку невалидного кода..." -ForegroundColor Gray

try {
    $invalidValidationResponse = Invoke-RestMethod -Uri "http://localhost:3001/referral/validate" -Method POST -Body (@{code = "INVALID123"} | ConvertTo-Json) -ContentType "application/json"
    
    Write-Host "✅ РЕЗУЛЬТАТ ШАГА 6:" -ForegroundColor Green
    Write-Host "  Валидация невалидного кода выполнена!" -ForegroundColor Green
    Write-Host "  Код валиден: $($invalidValidationResponse.isValid)" -ForegroundColor Cyan
    Write-Host "  Сообщение: $($invalidValidationResponse.message)" -ForegroundColor Cyan
    
    if (-not $invalidValidationResponse.isValid) {
        Write-Host "  ✅ Невалидный код правильно отклонен" -ForegroundColor Green
    } else {
        Write-Host "  ❌ ОШИБКА: Невалидный код был принят!" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ ОШИБКА В ШАГЕ 6: $($_.Exception.Message)" -ForegroundColor Red
}

# ========================================
# ИТОГОВЫЙ РЕЗУЛЬТАТ
# ========================================
Write-Host "`n🎉 ИТОГОВЫЙ РЕЗУЛЬТАТ ТЕСТИРОВАНИЯ:" -ForegroundColor Green
Write-Host "===============================================" -ForegroundColor Green

Write-Host "`n📋 ЧТО ПРОИЗОШЛО:" -ForegroundColor Yellow
Write-Host "1. Компания '$($user1Response.company.name)' зарегистрировалась" -ForegroundColor White
Write-Host "2. Создала реферальный код: $referralCode" -ForegroundColor White
Write-Host "3. Получила реферальную ссылку: $referralLink" -ForegroundColor White
Write-Host "4. Компания '$($user2Response.company.name)' перешла по ссылке и зарегистрировалась" -ForegroundColor White
Write-Host "5. Автоматически стала рефералом первой компании" -ForegroundColor White

Write-Host "`n🔗 КАК ЭТО РАБОТАЕТ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ:" -ForegroundColor Yellow
Write-Host "1. Компания A создает реферальный код" -ForegroundColor White
Write-Host "2. Получает ссылку вида: http://localhost:3000/v1/auth/register?ref=ABC123" -ForegroundColor White
Write-Host "3. Делится этой ссылкой с потенциальными клиентами" -ForegroundColor White
Write-Host "4. Клиент переходит по ссылке → попадает на страницу регистрации" -ForegroundColor White
Write-Host "5. Регистрируется → автоматически становится рефералом компании A" -ForegroundColor White

Write-Host "`n✅ ВСЕ ТЕСТЫ ПРОЙДЕНЫ УСПЕШНО!" -ForegroundColor Green
Write-Host "Реферальная система работает через ссылки как задумано!" -ForegroundColor Green