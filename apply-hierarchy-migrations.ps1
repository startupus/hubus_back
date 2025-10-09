# Apply Hierarchical Company Migrations
# This script applies database migrations for the hierarchical company system

Write-Host "=== Applying Hierarchical Company Migrations ===" -ForegroundColor Cyan
Write-Host ""

# Database connection details from docker-compose
$authDbHost = "localhost"
$authDbPort = "5432"
$authDbName = "auth_db"
$authDbUser = "user"
$authDbPassword = "password"

$billingDbHost = "localhost"
$billingDbPort = "5433"
$billingDbName = "billing_db"
$billingDbUser = "user"
$billingDbPassword = "password"

# Check if PostgreSQL client is available
try {
    $psqlVersion = & psql --version 2>&1
    Write-Host "[INFO] PostgreSQL client found: $psqlVersion" -ForegroundColor Green
} catch {
    Write-Host "[ERROR] PostgreSQL client (psql) not found. Please install PostgreSQL client tools." -ForegroundColor Red
    Write-Host "You can install it from: https://www.postgresql.org/download/windows/" -ForegroundColor Yellow
    exit 1
}

Write-Host ""

# Apply Auth Service Migration
Write-Host "1. Applying Auth Service migration..." -ForegroundColor Yellow
$env:PGPASSWORD = $authDbPassword

try {
    $authMigrationResult = & psql -h $authDbHost -p $authDbPort -U $authDbUser -d $authDbName -f "migrations/001_add_company_hierarchy_auth.sql" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Auth Service migration applied successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Auth Service migration failed:" -ForegroundColor Red
        Write-Host $authMigrationResult -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Failed to apply Auth Service migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Apply Billing Service Migration
Write-Host "2. Applying Billing Service migration..." -ForegroundColor Yellow
$env:PGPASSWORD = $billingDbPassword

try {
    $billingMigrationResult = & psql -h $billingDbHost -p $billingDbPort -U $billingDbUser -d $billingDbName -f "migrations/002_add_company_hierarchy_billing.sql" 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "[OK] Billing Service migration applied successfully" -ForegroundColor Green
    } else {
        Write-Host "[ERROR] Billing Service migration failed:" -ForegroundColor Red
        Write-Host $billingMigrationResult -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "[ERROR] Failed to apply Billing Service migration: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Generate Prisma Client
Write-Host "3. Generating Prisma clients..." -ForegroundColor Yellow

Write-Host "   Auth Service..." -ForegroundColor Gray
try {
    Push-Location services/auth-service
    & npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Auth Service Prisma client generated" -ForegroundColor Green
    }
    Pop-Location
} catch {
    Write-Host "   [ERROR] Failed to generate Auth Service Prisma client: $_" -ForegroundColor Red
    Pop-Location
}

Write-Host "   Billing Service..." -ForegroundColor Gray
try {
    Push-Location services/billing-service
    & npx prisma generate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   [OK] Billing Service Prisma client generated" -ForegroundColor Green
    }
    Pop-Location
} catch {
    Write-Host "   [ERROR] Failed to generate Billing Service Prisma client: $_" -ForegroundColor Red
    Pop-Location
}

Write-Host ""
Write-Host "=== Migration Complete ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor White
Write-Host "1. Rebuild services: docker-compose build auth-service billing-service" -ForegroundColor Gray
Write-Host "2. Restart services: docker-compose up -d auth-service billing-service" -ForegroundColor Gray
Write-Host "3. Test the system: .\test-hierarchical-system.ps1" -ForegroundColor Gray
Write-Host ""

