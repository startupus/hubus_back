# ===========================================
# AI Aggregator - Единый скрипт запуска
# Запуск проекта одной командой
# ===========================================

param(
    [switch]$NoBuild,
    [switch]$NoCache
)

$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Aggregator - Запуск проекта" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка Docker
Write-Host "[1/7] Проверка Docker..." -ForegroundColor Yellow
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker не установлен!" -ForegroundColor Red
    exit 1
}

try {
    docker ps | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Docker не запущен. Запустите Docker Desktop." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ERROR: Docker не запущен. Запустите Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "  OK: Docker $(docker --version)" -ForegroundColor Green
Write-Host "  OK: Docker Compose $(docker compose version)" -ForegroundColor Green
Write-Host ""

# Создание .env файла
Write-Host "[2/7] Проверка .env файла..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "  OK: .env файл создан из env.example" -ForegroundColor Green
    } else {
        Write-Host "  WARN: env.example не найден, продолжаем без .env" -ForegroundColor Yellow
    }
} else {
    Write-Host "  OK: .env файл существует" -ForegroundColor Green
}
Write-Host ""

# Остановка существующих контейнеров
Write-Host "[3/7] Остановка существующих контейнеров..." -ForegroundColor Yellow
docker compose down --remove-orphans 2>&1 | Out-Null
Write-Host "  OK: Контейнеры остановлены" -ForegroundColor Green
Write-Host ""

# Сборка образов
if (-not $NoBuild) {
    Write-Host "[4/7] Сборка Docker образов..." -ForegroundColor Yellow
    Write-Host "  Это может занять 5-10 минут при первом запуске..." -ForegroundColor Gray
    
    $buildArgs = @("compose", "build")
    if ($NoCache) {
        $buildArgs += "--no-cache"
    }
    
    $env:COMPOSE_DOCKER_CLI_BUILD = "0"
    $env:DOCKER_BUILDKIT = "0"
    
    docker $buildArgs 2>&1 | ForEach-Object {
        if ($_ -match "Step \d+/\d+") {
            Write-Host "  $_" -ForegroundColor Gray
        }
    }
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "  ERROR: Ошибка сборки образов" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "  OK: Образы собраны" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "[4/7] Пропуск сборки (используются существующие образы)..." -ForegroundColor Yellow
    Write-Host ""
}

# Запуск контейнеров
Write-Host "[5/7] Запуск контейнеров..." -ForegroundColor Yellow
$env:COMPOSE_DOCKER_CLI_BUILD = "0"
$env:DOCKER_BUILDKIT = "0"

if ($NoBuild) {
    docker compose up -d 2>&1 | Out-Null
} else {
    docker compose up -d 2>&1 | Out-Null
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "  ERROR: Ошибка запуска контейнеров" -ForegroundColor Red
    Write-Host "  Попробуйте: docker compose logs" -ForegroundColor Yellow
    exit 1
}

Write-Host "  OK: Контейнеры запущены" -ForegroundColor Green
Write-Host ""

# Ожидание запуска
Write-Host "[6/7] Ожидание запуска сервисов (30 секунд)..." -ForegroundColor Yellow
Start-Sleep -Seconds 30
Write-Host "  OK: Ожидание завершено" -ForegroundColor Green
Write-Host ""

# Проверка статуса
Write-Host "[7/7] Проверка статуса..." -ForegroundColor Yellow
docker compose ps
Write-Host ""

# Итоговая информация
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Проект успешно запущен!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Доступные сервисы:" -ForegroundColor Cyan
Write-Host "  Frontend:        http://localhost:80" -ForegroundColor White
Write-Host "  API Gateway:     http://localhost:3000" -ForegroundColor White
Write-Host "  Auth Service:    http://localhost:3001" -ForegroundColor White
Write-Host "  Orchestrator:    http://localhost:3002" -ForegroundColor White
Write-Host "  Proxy Service:   http://localhost:3003" -ForegroundColor White
Write-Host "  Billing Service: http://localhost:3004" -ForegroundColor White
Write-Host "  Analytics:        http://localhost:3005" -ForegroundColor White
Write-Host "  Payment Service: http://localhost:3006" -ForegroundColor White
Write-Host "  Certification:   http://localhost:3007" -ForegroundColor White
Write-Host "  Anonymization:   http://localhost:3008" -ForegroundColor White
Write-Host "  Redis Service:   http://localhost:3009" -ForegroundColor White
Write-Host ""
Write-Host "RabbitMQ Management: http://localhost:15672 (guest/guest)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Полезные команды:" -ForegroundColor Cyan
Write-Host "  Логи:            docker compose logs -f [service-name]" -ForegroundColor Gray
Write-Host "  Остановить:      docker compose down" -ForegroundColor Gray
Write-Host "  Статус:          docker compose ps" -ForegroundColor Gray
Write-Host "  Перезапуск:      docker compose restart [service-name]" -ForegroundColor Gray
Write-Host ""

