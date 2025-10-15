# Проверка баланса через SQL
Write-Host "=== CHECKING BALANCE VIA SQL ===" -ForegroundColor Cyan

$sql = "SELECT balance, currency FROM \"CompanyBalance\" WHERE \"companyId\" = 'd8de2f09-48f9-4a7e-8a2d-d4ccd3c7b706';"

try {
    $result = $sql | docker exec -i project-billing-service-1 npx prisma db execute --stdin
    Write-Host "SQL Result: $result" -ForegroundColor Green
} catch {
    Write-Host "Error: Failed to execute SQL: $_" -ForegroundColor Red
}

Write-Host "=== COMPLETED ===" -ForegroundColor Cyan
