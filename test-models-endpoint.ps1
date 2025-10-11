# Test Models Endpoint
Write-Host "=== TESTING MODELS ENDPOINT ===" -ForegroundColor Green

# Test 1: Without authentication
Write-Host "`nTest 1: Without authentication" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/models" -Method GET -UseBasicParsing
    Write-Host "  SUCCESS: Status Code $($response.StatusCode)" -ForegroundColor Green
    Write-Host "  Content: $($response.Content)" -ForegroundColor Gray
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "  Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Test 2: With authentication
Write-Host "`nTest 2: With authentication" -ForegroundColor Cyan
$headers = @{
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJiYjQ1YTQ0ZS0xMDBhLTRhYmItOWE0OC04M2VkNzNiOGRiYTAiLCJlbWFpbCI6ImNvbXByZWhlbnNpdmUtdGVzdC0yMDI1MTAxMTIxMDcyOUBleGFtcGxlLmNvbSIsInJvbGUiOiJjb21wYW55IiwidHlwZSI6ImNvbXBhbnkiLCJpYXQiOjE3NjAyMDYwNDksImV4cCI6MTc2MDI5MjQ0OSwiYXVkIjoiYWktYWdncmVnYXRvci11c2VycyIsImlzcyI6ImFpLWFnZ3JlZ2F0b3IifQ.-uedMYEo45TGNq7EMZrCea1fxzy4jsX9aL7NmLLulKo"
}

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/models" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "  SUCCESS: Status Code $($response.StatusCode)" -ForegroundColor Green
    
    $jsonContent = $response.Content | ConvertFrom-Json
    Write-Host "  Total models: $($jsonContent.total)" -ForegroundColor Gray
    Write-Host "  Providers: $($jsonContent.providers.Count)" -ForegroundColor Gray
    Write-Host "  Categories: $($jsonContent.categories.Count)" -ForegroundColor Gray
    
    Write-Host "`n  First few models:" -ForegroundColor Gray
    $jsonContent.models | Select-Object -First 3 | ForEach-Object {
        Write-Host "    - $($_.name) ($($_.provider))" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        Write-Host "  Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    }
}

# Test 3: Providers endpoint
Write-Host "`nTest 3: Providers endpoint" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/models/providers" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "  SUCCESS: Status Code $($response.StatusCode)" -ForegroundColor Green
    
    $jsonContent = $response.Content | ConvertFrom-Json
    Write-Host "  Total providers: $($jsonContent.providers.Count)" -ForegroundColor Gray
    
    Write-Host "`n  Providers:" -ForegroundColor Gray
    $jsonContent.providers | ForEach-Object {
        Write-Host "    - $($_.name) ($($_.id))" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# Test 4: Categories endpoint
Write-Host "`nTest 4: Categories endpoint" -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/v1/models/categories" -Method GET -Headers $headers -UseBasicParsing
    Write-Host "  SUCCESS: Status Code $($response.StatusCode)" -ForegroundColor Green
    
    $jsonContent = $response.Content | ConvertFrom-Json
    Write-Host "  Total categories: $($jsonContent.categories.Count)" -ForegroundColor Gray
    
    Write-Host "`n  Categories:" -ForegroundColor Gray
    $jsonContent.categories | ForEach-Object {
        Write-Host "    - $($_.name) ($($_.id)) $($_.icon)" -ForegroundColor Gray
    }
} catch {
    Write-Host "  ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n=== TESTING COMPLETED ===" -ForegroundColor Green
