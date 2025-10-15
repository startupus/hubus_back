# Test token separation through billing service
Write-Host "=== TOKEN SEPARATION TEST ===" -ForegroundColor Cyan

$token = Get-Content token.txt
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

# Test data with token separation
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
        timestamp = "2025-10-15T18:15:00.000Z"
        currency = "USD"
    }
} | ConvertTo-Json -Depth 3

Write-Host "Sending request with token separation:" -ForegroundColor Yellow
Write-Host "Input tokens: 50" -ForegroundColor Green
Write-Host "Output tokens: 30" -ForegroundColor Green

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3004/billing/usage/track" -Method POST -Headers $headers -Body $body
    Write-Host "Success!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}