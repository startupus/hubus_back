# Test Simple Registration
Write-Host "Testing Simple Registration..." -ForegroundColor Green

$baseUrl = "http://localhost:3000"

# Test data
$testData = @{
    name = "Test Company"
    email = "test-$(Get-Random)@example.com"
    password = "password123"
    description = "Test company"
}

Write-Host "`n=== Testing Registration ===" -ForegroundColor Cyan
Write-Host "Test data: $($testData | ConvertTo-Json)" -ForegroundColor Yellow

try {
    $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body ($testData | ConvertTo-Json) -ContentType "application/json"
    Write-Host "Registration successful!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Yellow
} catch {
    Write-Host "Registration failed: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}

Write-Host "`n=== Test Completed ===" -ForegroundColor Green
