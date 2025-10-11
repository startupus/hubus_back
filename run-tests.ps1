#!/usr/bin/env pwsh

# Обработка параметров
param(
    [string]$Type = "all",
    [switch]$Verbose,
    [switch]$Coverage,
    [switch]$Watch,
    [switch]$Help
)

Write-Host "🧪 AI Aggregator Test Suite" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan

# Проверяем, что Jest установлен
if (!(Get-Command "npx" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ npx не найден. Установите Node.js и npm." -ForegroundColor Red
    exit 1
}

# Параметры по умолчанию
$testType = $Type
$verbose = $Verbose
$coverage = $Coverage
$watch = $Watch

if ($Help) {
    Write-Host "Использование: .\run-tests.ps1 [параметры]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Параметры:" -ForegroundColor Yellow
    Write-Host "  -Type <тип>     Тип тестов: all, unit, integration, e2e, auth, billing, payment" -ForegroundColor White
    Write-Host "  -Verbose        Подробный вывод" -ForegroundColor White
    Write-Host "  -Coverage       Показать покрытие кода" -ForegroundColor White
    Write-Host "  -Watch          Режим наблюдения" -ForegroundColor White
    Write-Host "  -Help           Показать эту справку" -ForegroundColor White
    Write-Host ""
    Write-Host "Примеры:" -ForegroundColor Yellow
    Write-Host "  .\run-tests.ps1                    # Запустить все тесты" -ForegroundColor White
    Write-Host "  .\run-tests.ps1 -Type unit         # Только unit тесты" -ForegroundColor White
    Write-Host "  .\run-tests.ps1 -Coverage -Verbose # С покрытием и подробным выводом" -ForegroundColor White
    exit 0
}

$testType = $Type
$verbose = $Verbose
$coverage = $Coverage
$watch = $Watch

# Формируем команду Jest
$jestCmd = "npx jest"

switch ($testType) {
    "unit" { $jestCmd += " --testPathPattern=unit" }
    "integration" { $jestCmd += " --testPathPattern=integration" }
    "e2e" { $jestCmd += " --testPathPattern=e2e" }
    "auth" { $jestCmd += " --testPathPattern=auth" }
    "billing" { $jestCmd += " --testPathPattern=billing" }
    "payment" { $jestCmd += " --testPathPattern=payment" }
    "all" { }
    default {
        Write-Host "❌ Неизвестный тип тестов: $testType" -ForegroundColor Red
        Write-Host "Используйте -Help для справки" -ForegroundColor Yellow
        exit 1
    }
}

if ($verbose) {
    $jestCmd += " --verbose"
}

if ($coverage) {
    $jestCmd += " --coverage"
}

if ($watch) {
    $jestCmd += " --watch"
} else {
    $jestCmd += " --watchAll=false"
}

# Показываем информацию о запуске
Write-Host "Запуск тестов типа: $testType" -ForegroundColor Green
if ($coverage) { Write-Host "Покрытие кода: включено" -ForegroundColor Green }
if ($verbose) { Write-Host "Подробный вывод: включен" -ForegroundColor Green }
if ($watch) { Write-Host "Режим наблюдения: включен" -ForegroundColor Green }

Write-Host ""
Write-Host "Команда: $jestCmd" -ForegroundColor Gray
Write-Host ""

# Запускаем тесты
try {
    Invoke-Expression $jestCmd
    $exitCode = $LASTEXITCODE
    
    if ($exitCode -eq 0) {
        Write-Host ""
        Write-Host "✅ Тесты завершены успешно!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Некоторые тесты не прошли (код выхода: $exitCode)" -ForegroundColor Red
    }
    
    exit $exitCode
} catch {
    Write-Host ""
    Write-Host "❌ Ошибка при запуске тестов: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}
