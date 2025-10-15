# Создание тестового пользователя
Write-Host "=== CREATING TEST USER ===" -ForegroundColor Cyan

$registerBody = @{
    email = "test@example.com"
    password = "password123"
    companyName = "Test Company"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/auth/register" -Method POST -Body $registerBody -ContentType "application/json"
    Write-Host "Success: User registered" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor White
} catch {
    Write-Host "Error: Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Response: $($_.Exception.Response)" -ForegroundColor Red
}

Write-Host "=== TEST COMPLETED ===" -ForegroundColor Cyan
