# test-basic-status.ps1
Write-Host "=== ПРОВЕРКА СТАТУСА СЕРВИСОВ ===" -ForegroundColor Yellow

# 1. Статус Docker
Write-Host "`n1. DOCKER СТАТУС:" -ForegroundColor Cyan
docker-compose ps

# 2. Health checks
Write-Host "`n2. HEALTH CHECKS:" -ForegroundColor Cyan

# API Gateway
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  API Gateway: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  API Gateway: ERROR" -ForegroundColor Red
}

# Auth Service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  Auth Service: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  Auth Service: ERROR" -ForegroundColor Red
}

# Billing Service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3004/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  Billing Service: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  Billing Service: ERROR" -ForegroundColor Red
}

# Analytics Service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3005/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  Analytics Service: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  Analytics Service: ERROR" -ForegroundColor Red
}

# Payment Service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3006/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  Payment Service: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  Payment Service: ERROR" -ForegroundColor Red
}

# Provider Orchestrator
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3002/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  Provider Orchestrator: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  Provider Orchestrator: ERROR" -ForegroundColor Red
}

# Proxy Service
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3003/health" -UseBasicParsing -TimeoutSec 3
    Write-Host "  Proxy Service: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "  Proxy Service: ERROR" -ForegroundColor Red
}

Write-Host "`n=== ПРОВЕРКА ЗАВЕРШЕНА ===" -ForegroundColor Yellow
