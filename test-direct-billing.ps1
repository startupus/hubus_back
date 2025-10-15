# Тест разделения токенов напрямую через billing service
Write-Host "=== ТЕСТ РАЗДЕЛЕНИЯ ТОКЕНОВ ===" -ForegroundColor Cyan

$token = Get-Content token.txt
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

# Тестовые данные с разделением токенов
$body = @{
    companyId = "1d9ea449-dc1f-47a3-9ba9-6f8e52ac9aac"
    service = "ai-chat"
    resource = "tokens"
    quantity = 1
    inputTokens = 50
    outputTokens = 30
    unit = "tokens"
    metadata = @{
        provider = "openai"
        model = "gpt-3.5-turbo"
        timestamp = "2025-10-15T18:05:00.000Z"
        currency = "USD"
    }
} | ConvertTo-Json -Depth 3

Write-Host "Отправляем запрос с разделением токенов:" -ForegroundColor Yellow
Write-Host "Входящие токены: 50" -ForegroundColor Green
Write-Host "Исходящие токены: 30" -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3004/billing/usage/track" -Method POST -Headers $headers -Body $body
    Write-Host "Успешно!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Ошибка: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}
