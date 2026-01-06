# Скрипт для запуска всего проекта одной командой
# Использование: .\start.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  AI Aggregator - Запуск проекта" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Проверка наличия Docker
Write-Host "Проверка Docker..." -ForegroundColor Yellow
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ОШИБКА: Docker не установлен или не найден в PATH" -ForegroundColor Red
    exit 1
}

# Проверка наличия Docker Compose
Write-Host "Проверка Docker Compose..." -ForegroundColor Yellow
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ОШИБКА: Docker Compose не установлен" -ForegroundColor Red
    exit 1
}

# Проверка, что Docker запущен
Write-Host "Проверка, что Docker запущен..." -ForegroundColor Yellow
try {
    docker ps | Out-Null
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ОШИБКА: Docker не запущен. Запустите Docker Desktop." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "ОШИБКА: Docker не запущен. Запустите Docker Desktop." -ForegroundColor Red
    exit 1
}

Write-Host "Docker найден: $(docker --version)" -ForegroundColor Green
Write-Host "Docker Compose найден: $(docker compose version)" -ForegroundColor Green
Write-Host ""

# Остановка существующих контейнеров (если есть)
Write-Host "Остановка существующих контейнеров..." -ForegroundColor Yellow
docker compose down 2>&1 | Out-Null

# Очистка старых образов (опционально, закомментировано для ускорения)
# Write-Host "Очистка старых образов..." -ForegroundColor Yellow
# docker compose down --rmi all 2>&1 | Out-Null

Write-Host ""
Write-Host "Сборка и запуск контейнеров..." -ForegroundColor Yellow
Write-Host "Это может занять несколько минут при первом запуске..." -ForegroundColor Yellow
Write-Host ""

# Создание .env файла, если его нет
if (-not (Test-Path ".env")) {
    Write-Host "Создание .env файла из env.example..." -ForegroundColor Yellow
    if (Test-Path "env.example") {
        Copy-Item "env.example" ".env"
        Write-Host "✅ Файл .env создан. При необходимости отредактируйте его." -ForegroundColor Green
    }
}

# Запуск проекта
Write-Host "Сборка и запуск контейнеров (это может занять несколько минут)..." -ForegroundColor Yellow
$result = docker compose up --build -d 2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host "  Проект успешно запущен!" -ForegroundColor Green
    Write-Host "=========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Сервисы доступны по адресам:" -ForegroundColor Cyan
    Write-Host "  - Frontend:        http://localhost:80" -ForegroundColor White
    Write-Host "  - API Gateway:    http://localhost:3000" -ForegroundColor White
    Write-Host "  - Auth Service:   http://localhost:3001" -ForegroundColor White
    Write-Host "  - Orchestrator:    http://localhost:3002" -ForegroundColor White
    Write-Host "  - Proxy Service:  http://localhost:3003" -ForegroundColor White
    Write-Host "  - Billing Service: http://localhost:3004" -ForegroundColor White
    Write-Host "  - Analytics:       http://localhost:3005" -ForegroundColor White
    Write-Host "  - Payment Service: http://localhost:3006" -ForegroundColor White
    Write-Host "  - Certification:   http://localhost:3007" -ForegroundColor White
    Write-Host "  - Anonymization:   http://localhost:3008" -ForegroundColor White
    Write-Host "  - Redis Service:   http://localhost:3009" -ForegroundColor White
    Write-Host ""
    Write-Host "RabbitMQ Management: http://localhost:15672" -ForegroundColor Cyan
    Write-Host "  (guest/guest)" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Проверка статуса контейнеров..." -ForegroundColor Yellow
    Write-Host ""
    
    # Ожидание запуска контейнеров
    Write-Host "Ожидание запуска сервисов (30 секунд)..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Показать статус контейнеров
    Write-Host ""
    Write-Host "Статус контейнеров:" -ForegroundColor Cyan
    docker compose ps
    
    # Проверка здоровья сервисов
    Write-Host ""
    Write-Host "Проверка здоровья сервисов..." -ForegroundColor Yellow
    $services = @(
        @{Name="API Gateway"; Url="http://localhost:3000/health"},
        @{Name="Auth Service"; Url="http://localhost:3001/health"},
        @{Name="Billing Service"; Url="http://localhost:3004/health"}
    )
    
    foreach ($service in $services) {
        try {
            $response = Invoke-WebRequest -Uri $service.Url -Method GET -TimeoutSec 3 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                Write-Host "  ✅ $($service.Name): OK" -ForegroundColor Green
            } else {
                Write-Host "  ⚠️  $($service.Name): Status $($response.StatusCode)" -ForegroundColor Yellow
            }
        } catch {
            Write-Host "  ⏳ $($service.Name): Запускается..." -ForegroundColor Gray
        }
    }
    
    Write-Host ""
    Write-Host "Для просмотра логов используйте:" -ForegroundColor Cyan
    Write-Host "  docker compose logs -f [service-name]" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Для остановки проекта используйте:" -ForegroundColor Cyan
    Write-Host "  docker compose down" -ForegroundColor Gray
    Write-Host "  или" -ForegroundColor Gray
    Write-Host "  .\stop.ps1" -ForegroundColor Gray
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host "  ОШИБКА при запуске проекта!" -ForegroundColor Red
    Write-Host "=========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Вывод ошибки:" -ForegroundColor Yellow
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "Попробуйте:" -ForegroundColor Yellow
    Write-Host "  1. Проверить логи: docker compose logs" -ForegroundColor Gray
    Write-Host "  2. Пересобрать: docker compose build --no-cache" -ForegroundColor Gray
    Write-Host "  3. Проверить доступность портов" -ForegroundColor Gray
    Write-Host ""
    exit 1
}
