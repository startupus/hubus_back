# Test External API
$apiKey = "ak_i8ff5703s9g"
$baseUrl = "http://localhost"

Write-Host "Testing External API with key: $($apiKey.Substring(0, 10))..." -ForegroundColor Yellow

# Test 1: Get Models
Write-Host "`n1. Testing GET /api/v1/models" -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/models" -Method Get -Headers $headers
    Write-Host "Success! Models count: $($response.data.Count)" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 2 | Out-File -FilePath "test-models-response.json"
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response: $errorBody" -ForegroundColor Red
    }
}

# Test 2: Chat Completion
Write-Host "`n2. Testing POST /api/v1/chat/completions" -ForegroundColor Cyan
try {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }
    $body = @{
        model = "openai/gpt-3.5-turbo"
        messages = @(
            @{
                role = "user"
                content = "Привет! Ответь одним словом: работает?"
            }
        )
    } | ConvertTo-Json -Depth 5
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/v1/chat/completions" -Method Post -Headers $headers -Body $body
    Write-Host "Success! Response: $($response.choices[0].message.content)" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3 | Out-File -FilePath "test-chat-response.json"
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorBody = $reader.ReadToEnd()
        Write-Host "Response: $errorBody" -ForegroundColor Red
    }
}

Write-Host "`nTest completed!" -ForegroundColor Yellow



