# Скрипт для тестирования отправки аудио через External API
# Использует синтезированный base64 аудио для теста

$apiKey = "ak_f8102e585cef62a1c4b990cfd1c55d3ccec91dcc2982fdfdc5b0e350699cc847"
$baseUrl = "http://localhost:3000/api/v1"

Write-Host "🎵 Тестирование отправки аудио через External API" -ForegroundColor Cyan
Write-Host ""

# Создаем простой тестовый аудио файл в формате WAV (минимальный заголовок + тишина)
# Это минимальный валидный WAV файл (44 байта)
$wavHeader = [byte[]]@(
    0x52, 0x49, 0x46, 0x46,  # "RIFF"
    0x24, 0x00, 0x00, 0x00,  # размер файла - 8
    0x57, 0x41, 0x56, 0x45,  # "WAVE"
    0x66, 0x6D, 0x74, 0x20,  # "fmt "
    0x10, 0x00, 0x00, 0x00,  # размер fmt chunk
    0x01, 0x00,              # аудио формат (PCM)
    0x01, 0x00,              # количество каналов (моно)
    0x44, 0xAC, 0x00, 0x00,  # sample rate (44100)
    0x88, 0x58, 0x01, 0x00,  # byte rate
    0x02, 0x00,              # block align
    0x10, 0x00,              # bits per sample
    0x64, 0x61, 0x74, 0x61,  # "data"
    0x00, 0x00, 0x00, 0x00   # размер данных
)

# Конвертируем в base64
$audioBase64 = [Convert]::ToBase64String($wavHeader)

Write-Host "📦 Создан тестовый аудио файл (WAV, 44 байта)" -ForegroundColor Green
Write-Host "🔐 API Key: $($apiKey.Substring(0, 20))..." -ForegroundColor Yellow
Write-Host ""

# Формируем JSON запрос вручную
$jsonRequest = @"
{
  "model": "mistralai/voxtral-small-24b-2507",
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "text",
          "text": "Транскрибируй это аудио на русском языке. Это тестовый файл."
        },
        {
          "type": "input_audio",
          "input_audio": {
            "data": "$audioBase64",
            "format": "wav"
          }
        }
      ]
    }
  ]
}
"@

Write-Host "📤 Отправка запроса..." -ForegroundColor Cyan
Write-Host "   Model: mistralai/voxtral-small-24b-2507" -ForegroundColor Gray
Write-Host "   Audio format: WAV" -ForegroundColor Gray
Write-Host "   Audio size: $($wavHeader.Length) bytes" -ForegroundColor Gray
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $apiKey"
        "Content-Type" = "application/json"
    }

    $response = Invoke-RestMethod -Uri "$baseUrl/chat/completions" `
        -Method POST `
        -Headers $headers `
        -Body $jsonRequest `
        -ContentType "application/json" `
        -TimeoutSec 300

    Write-Host "✅ Запрос успешно выполнен!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Ответ от нейросети:" -ForegroundColor Cyan
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    
    if ($response.choices -and $response.choices.Count -gt 0) {
        $content = $response.choices[0].message.content
        Write-Host $content -ForegroundColor White
    } else {
        Write-Host ($response | ConvertTo-Json -Depth 5) -ForegroundColor White
    }
    
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "📊 Статистика:" -ForegroundColor Cyan
    if ($response.usage) {
        Write-Host "   Prompt tokens: $($response.usage.prompt_tokens)" -ForegroundColor Gray
        Write-Host "   Completion tokens: $($response.usage.completion_tokens)" -ForegroundColor Gray
        Write-Host "   Total tokens: $($response.usage.total_tokens)" -ForegroundColor Gray
    }
    if ($response.processing_time_ms) {
        Write-Host "   Processing time: $($response.processing_time_ms) ms" -ForegroundColor Gray
    }
    Write-Host ""
    
    Write-Host "🎉 Тест завершен успешно!" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Ошибка при отправке запроса:" -ForegroundColor Red
    Write-Host ""
    
    if ($_.Exception.Response) {
        $statusCode = $_.Exception.Response.StatusCode.value__
        $statusDescription = $_.Exception.Response.StatusDescription
        
        Write-Host "   Status Code: $statusCode" -ForegroundColor Red
        Write-Host "   Status: $statusDescription" -ForegroundColor Red
        
        try {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            $reader.Close()
            
            Write-Host "   Response Body:" -ForegroundColor Yellow
            Write-Host $responseBody -ForegroundColor White
        } catch {
            Write-Host "   Не удалось прочитать тело ответа" -ForegroundColor Yellow
        }
    } else {
        Write-Host "   $($_.Exception.Message)" -ForegroundColor Red
    }
    
    Write-Host ""
    Write-Host "💡 Проверьте:" -ForegroundColor Yellow
    Write-Host "   1. Запущены ли контейнеры (docker-compose ps)" -ForegroundColor Gray
    Write-Host "   2. Правильный ли API ключ" -ForegroundColor Gray
    Write-Host "   3. Доступен ли OpenRouter API ключ в .env" -ForegroundColor Gray
    Write-Host "   4. Логи сервисов: docker-compose logs api-gateway proxy-service" -ForegroundColor Gray
    
    exit 1
}
