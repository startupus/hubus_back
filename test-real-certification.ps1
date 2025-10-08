#!/usr/bin/env pwsh

Write-Host "=== ТЕСТИРОВАНИЕ РЕАЛЬНОЙ СЕРТИФИКАЦИИ МОДЕЛЕЙ OPENROUTER ===" -ForegroundColor Green
Write-Host "Время: $(Get-Date)" -ForegroundColor Gray

# Список моделей для тестирования
$models = @(
    "openai/gpt-4o",
    "openai/gpt-4o-mini", 
    "anthropic/claude-3-5-sonnet-20241022",
    "anthropic/claude-3-5-haiku-20241022",
    "google/gemini-pro-1.5",
    "meta-llama/llama-3.1-8b-instruct"
)

Write-Host "`n=== Получение списка доступных моделей ===" -ForegroundColor Yellow
try {
    $availableModels = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/models?provider=openrouter" -Method GET -TimeoutSec 30
    Write-Host "✅ Получено моделей: $($availableModels.models.Count)" -ForegroundColor Green
} catch {
    Write-Host "❌ Ошибка получения моделей: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "`n=== ТЕСТИРОВАНИЕ КАЖДОЙ МОДЕЛИ ===" -ForegroundColor Green

$results = @()

foreach ($model in $models) {
    Write-Host "`n--- Тестирование модели: $model ---" -ForegroundColor Cyan
    
    try {
        # Отправляем запрос на сертификацию
        $certRequest = @{
            modelId = $model
            provider = "openrouter"
            modelName = $model
            requestedLevel = "ADVANCED"
            metadata = @{
                testMode = $true
                timestamp = (Get-Date).ToString("yyyy-MM-ddTHH:mm:ssZ")
            }
        }
        
        Write-Host "📤 Отправка запроса на сертификацию..." -ForegroundColor Yellow
        $certResponse = Invoke-RestMethod -Uri "http://localhost:3007/certification/submit" -Method POST -Body ($certRequest | ConvertTo-Json -Depth 3) -ContentType "application/json" -TimeoutSec 120
        
        if ($certResponse.success) {
            Write-Host "✅ Сертификация успешна!" -ForegroundColor Green
            Write-Host "   Уровень: $($certResponse.certification.certificationLevel)" -ForegroundColor White
            Write-Host "   Статус: $($certResponse.certification.status)" -ForegroundColor White
            Write-Host "   Безопасность: $($certResponse.certification.safetyLevel)" -ForegroundColor White
            
            # Анализируем результаты тестов
            $testResults = $certResponse.certification.testResults
            Write-Host "   Результаты тестов:" -ForegroundColor White
            foreach ($test in $testResults) {
                $status = if ($test.passed) { "✅" } else { "❌" }
                Write-Host "     $status $($test.testName): $($test.score)/100 - $($test.details)" -ForegroundColor White
            }
            
            # Вычисляем общий балл
            $overallScore = [math]::Round(($testResults | Measure-Object -Property score -Average).Average, 1)
            Write-Host "   📊 Общий балл: $overallScore/100" -ForegroundColor Magenta
            
            $results += @{
                Model = $model
                Success = $true
                Level = $certResponse.certification.certificationLevel
                Status = $certResponse.certification.status
                SafetyLevel = $certResponse.certification.safetyLevel
                OverallScore = $overallScore
                TestResults = $testResults
                Warnings = $certResponse.warnings
                Recommendations = $certResponse.recommendations
            }
        } else {
            Write-Host "❌ Сертификация не пройдена!" -ForegroundColor Red
            $errorText = if ($certResponse.errors) { $certResponse.errors -join ', ' } else { 'Неизвестная ошибка' }
            Write-Host "   Ошибки: $errorText" -ForegroundColor Red
            if ($certResponse.warnings) {
                $warningText = $certResponse.warnings -join ', '
                Write-Host "   Предупреждения: $warningText" -ForegroundColor Yellow
            }
            
            $results += @{
                Model = $model
                Success = $false
                Errors = $certResponse.errors
                Warnings = $certResponse.warnings
                Recommendations = $certResponse.recommendations
            }
        }
    } catch {
        Write-Host "❌ Ошибка тестирования модели $model : $($_.Exception.Message)" -ForegroundColor Red
        $results += @{
            Model = $model
            Success = $false
            Error = $_.Exception.Message
        }
    }
    
    # Пауза между тестами
    Start-Sleep -Seconds 2
}

Write-Host "`n=== ИТОГОВЫЕ РЕЗУЛЬТАТЫ ===" -ForegroundColor Green

# Сортируем результаты по общему баллу
$successfulResults = $results | Where-Object { $_.Success -eq $true } | Sort-Object OverallScore -Descending

Write-Host "`n🏆 РЕЙТИНГ МОДЕЛЕЙ (по общему баллу):" -ForegroundColor Magenta
$rank = 1
foreach ($result in $successfulResults) {
    $score = $result.OverallScore
    $color = if ($score -ge 90) { "Green" } elseif ($score -ge 80) { "Yellow" } else { "Red" }
    Write-Host "   $rank. $($result.Model) - $score/100 ($($result.Level))" -ForegroundColor $color
    $rank++
}

Write-Host "`n📊 ДЕТАЛЬНАЯ СТАТИСТИКА:" -ForegroundColor Cyan
Write-Host "   Всего протестировано: $($results.Count)" -ForegroundColor White
Write-Host "   Успешно сертифицировано: $($successfulResults.Count)" -ForegroundColor White
Write-Host "   Не прошли сертификацию: $($results.Count - $successfulResults.Count)" -ForegroundColor White

if ($successfulResults.Count -gt 0) {
    $avgScore = [math]::Round(($successfulResults | Measure-Object -Property OverallScore -Average).Average, 1)
    $maxScore = ($successfulResults | Measure-Object -Property OverallScore -Maximum).Maximum
    $minScore = ($successfulResults | Measure-Object -Property OverallScore -Minimum).Minimum
    
    Write-Host "   Средний балл: $avgScore/100" -ForegroundColor White
    Write-Host "   Максимальный балл: $maxScore/100" -ForegroundColor White
    Write-Host "   Минимальный балл: $minScore/100" -ForegroundColor White
}

Write-Host "`n🔍 АНАЛИЗ ПО ТЕСТАМ:" -ForegroundColor Cyan
$testTypes = @("Safety Test", "Accuracy Test", "PII Handling Test", "Language Support Test", "Bias Detection Test")

foreach ($testType in $testTypes) {
    $testScores = @()
    foreach ($result in $successfulResults) {
        $test = $result.TestResults | Where-Object { $_.testName -eq $testType }
        if ($test) {
            $testScores += $test.score
        }
    }
    
    if ($testScores.Count -gt 0) {
        $avgTestScore = [math]::Round(($testScores | Measure-Object -Average).Average, 1)
        Write-Host "   $testType : $avgTestScore/100 (средний)" -ForegroundColor White
    }
}

Write-Host "`n=== СРАВНЕНИЕ С ПРЕДЫДУЩИМИ РЕЗУЛЬТАТАМИ ===" -ForegroundColor Green
Write-Host "ДО (заглушка): Все модели получали 85/100" -ForegroundColor Red
Write-Host "ПОСЛЕ (реальное тестирование): Различные баллы в зависимости от качества модели" -ForegroundColor Green

Write-Host "`n✅ Тестирование завершено!" -ForegroundColor Green
Write-Host "Время завершения: $(Get-Date)" -ForegroundColor Gray