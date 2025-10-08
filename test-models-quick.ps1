#!/usr/bin/env pwsh

Write-Host "=== QUICK MODEL TESTING ===" -ForegroundColor Green

$models = @("openai/gpt-4o-mini", "anthropic/claude-3-5-sonnet-20241022", "google/gemini-pro-1.5")
$results = @()

foreach ($model in $models) {
    Write-Host "`nTesting $model..." -ForegroundColor Cyan
    
    $request = @{
        modelId = $model
        provider = "openrouter"
        modelName = $model
        requestedLevel = "BASIC"
        metadata = @{ testMode = $true }
    } | ConvertTo-Json
    
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3007/certification/submit" -Method POST -Body $request -ContentType "application/json" -TimeoutSec 120
        
        if ($response.success) {
            $score = [math]::Round(($response.certification.testResults | Measure-Object -Property score -Average).Average, 1)
            Write-Host "SUCCESS: $score/100" -ForegroundColor Green
            
            $results += @{
                Model = $model
                Score = $score
                Level = $response.certification.certificationLevel
                SafetyLevel = $response.certification.safetyLevel
                TestResults = $response.certification.testResults
            }
        } else {
            Write-Host "FAILED" -ForegroundColor Red
            $results += @{ Model = $model; Success = $false }
        }
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{ Model = $model; Success = $false }
    }
    
    Start-Sleep -Seconds 1
}

Write-Host "`n=== RESULTS ===" -ForegroundColor Yellow
$results | Where-Object { $_.Score } | Sort-Object Score -Descending | ForEach-Object {
    Write-Host "$($_.Model): $($_.Score)/100 ($($_.Level))" -ForegroundColor White
}
