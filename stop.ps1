# Скрипт для остановки проекта
# Использование: .\stop.ps1

Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "  AI Aggregator - Остановка проекта" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Остановка контейнеров..." -ForegroundColor Yellow
docker compose down

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Проект успешно остановлен!" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "Ошибка при остановке проекта" -ForegroundColor Red
    Write-Host ""
    exit 1
}

