# Скрипт для проверки всех баз данных в Docker контейнерах

Write-Host "=== AI AGGREGATOR DATABASES STATUS ===" -ForegroundColor Green

# Auth Database
Write-Host "`n🔐 AUTH DATABASE (port 5432):" -ForegroundColor Yellow
docker exec project-auth-db-1 psql -U postgres -d auth_db -c "\dt"

Write-Host "`n📊 Users in Auth DB:"
docker exec project-auth-db-1 psql -U postgres -d auth_db -c "SELECT id, email, is_active, role, first_name, last_name, created_at FROM users;"

# Billing Database
Write-Host "`n💰 BILLING DATABASE (port 5433):" -ForegroundColor Yellow
docker exec project-billing-db-1 psql -U postgres -d billing_db -c "\dt"

# Orchestrator Database
Write-Host "`n🎯 ORCHESTRATOR DATABASE (port 5434):" -ForegroundColor Yellow
docker exec project-orchestrator-db-1 psql -U postgres -d orchestrator_db -c "\dt"

Write-Host "`n=== END OF REPORT ===" -ForegroundColor Green
