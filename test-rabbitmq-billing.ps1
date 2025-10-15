# Test token separation through RabbitMQ
Write-Host "=== TOKEN SEPARATION TEST VIA RABBITMQ ===" -ForegroundColor Cyan

# Test data for RabbitMQ message
$billingMessage = @{
    userId = "1d9ea449-dc1f-47a3-9ba9-6f8e52ac9aac"
    service = "ai-chat"
    resource = "tokens"
    tokens = 80
    inputTokens = 50
    outputTokens = 30
    cost = 0.05
    provider = "openai"
    model = "gpt-3.5-turbo"
    timestamp = "2025-10-15T18:15:00.000Z"
    metadata = @{
        currency = "USD"
    }
} | ConvertTo-Json -Depth 3

Write-Host "Sending message to RabbitMQ with token separation:" -ForegroundColor Yellow
Write-Host "Input tokens: 50" -ForegroundColor Green
Write-Host "Output tokens: 30" -ForegroundColor Green
Write-Host "Total tokens: 80" -ForegroundColor Green

# Send message to RabbitMQ through API Gateway
$token = Get-Content token.txt
$headers = @{
    'Authorization' = "Bearer $token"
    'Content-Type' = 'application/json'
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/v1/billing/usage" -Method POST -Headers $headers -Body $billingMessage
    Write-Host "Successfully sent to RabbitMQ!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 3
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Red
    }
}