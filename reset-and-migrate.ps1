# Reset and Migrate to Hierarchical System
# This script recreates databases with new schema

Write-Host "=== Reset and Migrate to Hierarchical System ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "WARNING: This will delete all existing data!" -ForegroundColor Yellow
Write-Host "Press Ctrl+C to cancel or any key to continue..." -ForegroundColor Yellow
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Write-Host ""

# Stop services
Write-Host "1. Stopping services..." -ForegroundColor Yellow
docker-compose stop auth-service billing-service api-gateway

# Remove database volumes
Write-Host "2. Removing database volumes..." -ForegroundColor Yellow
docker-compose stop auth-db billing-db
docker-compose rm -f auth-db billing-db
docker volume rm project_auth-db-data project_billing-db-data -ErrorAction SilentlyContinue

# Start databases
Write-Host "3. Starting fresh databases..." -ForegroundColor Yellow
docker-compose up -d auth-db billing-db

# Wait for databases to be ready
Write-Host "4. Waiting for databases to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Generate Prisma clients
Write-Host "5. Generating Prisma clients..." -ForegroundColor Yellow

Write-Host "   Auth Service..." -ForegroundColor Gray
Push-Location services/auth-service
& npx prisma generate | Out-Null
Pop-Location

Write-Host "   Billing Service..." -ForegroundColor Gray
Push-Location services/billing-service
& npx prisma generate | Out-Null
Pop-Location

# Push schema to database (Prisma will create tables)
Write-Host "6. Pushing schema to databases..." -ForegroundColor Yellow

Write-Host "   Auth Service..." -ForegroundColor Gray
Push-Location services/auth-service
$env:AUTH_DATABASE_URL = "postgresql://postgres:password@localhost:5432/auth_db"
& npx prisma db push --accept-data-loss
Pop-Location

Write-Host "   Billing Service..." -ForegroundColor Gray
Push-Location services/billing-service  
$env:BILLING_DATABASE_URL = "postgresql://postgres:password@localhost:5433/billing_db"
& npx prisma db push --accept-data-loss
Pop-Location

# Initialize pricing data
Write-Host "7. Initializing pricing data..." -ForegroundColor Yellow
Get-Content services/billing-service/init-pricing-data.sql | docker exec -i project-billing-db-1 psql -U postgres -d billing_db

Write-Host ""
Write-Host "=== Migration Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Build services: docker-compose build auth-service billing-service api-gateway" -ForegroundColor Gray
Write-Host "2. Start services: docker-compose up -d auth-service billing-service api-gateway" -ForegroundColor Gray
Write-Host "3. Test system: .\test-hierarchical-system.ps1" -ForegroundColor Gray
Write-Host ""

