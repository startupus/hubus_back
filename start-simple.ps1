# ===========================================
# PROSTOY ZAPUSK BEZ SBORKI
# Ispolzuet uzhe sobrannye obrazy
# ===========================================

Write-Host "Bystryj zapusk AI Aggregator..." -ForegroundColor Cyan

# Proverka Docker
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker ne ustanovlen!" -ForegroundColor Red
    exit 1
}

# Perehod v kornevuyu direktoriyu
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

# Ostanovit sushchestvuyushchie kontejnery
Write-Host "Ostanovka sushchestvuyushchih kontejnerov..." -ForegroundColor Yellow
docker compose down --remove-orphans 2>&1 | Out-Null

# Zapustit vse servisy (obhodim problemu s bake)
Write-Host "Zapusk vseh servisov..." -ForegroundColor Green
$env:COMPOSE_DOCKER_CLI_BUILD = "0"
$env:DOCKER_BUILDKIT = "0"
docker compose up -d --no-build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nOK: Proekt zapushchen!" -ForegroundColor Green
    Write-Host "Frontend: http://localhost:80" -ForegroundColor Cyan
    Write-Host "API Gateway: http://localhost:3000" -ForegroundColor Cyan
    Write-Host "`nStatus: docker compose ps" -ForegroundColor Yellow
} else {
    Write-Host "`nERROR: Oshibka zapuska. Poprobujte: .\start.ps1 -Build" -ForegroundColor Red
}
