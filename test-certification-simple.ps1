#!/usr/bin/env pwsh

Write-Host "=== REAL CERTIFICATION TESTING ===" -ForegroundColor Green

# Test models
$models = @(
    "openai/gpt-4o",
    "openai/gpt-4o-mini", 
    "anthropic/claude-3-5-sonnet-20241022",
    "anthropic/claude-3-5-haiku-20241022",
    "google/gemini-pro-1.5",
    "meta-llama/llama-3.1-8b-instruct"
)

$results = @()

foreach ($model in $models) {
    Write-Host "`n--- Testing model: $model ---" -ForegroundColor Cyan
    
    try {
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
        
        Write-Host "Sending certification request..." -ForegroundColor Yellow
        $certResponse = Invoke-RestMethod -Uri "http://localhost:3007/certification/submit" -Method POST -Body ($certRequest | ConvertTo-Json -Depth 3) -ContentType "application/json" -TimeoutSec 120
        
        if ($certResponse.success) {
            Write-Host "SUCCESS!" -ForegroundColor Green
            Write-Host "  Level: $($certResponse.certification.certificationLevel)" -ForegroundColor White
            Write-Host "  Status: $($certResponse.certification.status)" -ForegroundColor White
            Write-Host "  Safety: $($certResponse.certification.safetyLevel)" -ForegroundColor White
            
            $testResults = $certResponse.certification.testResults
            Write-Host "  Test Results:" -ForegroundColor White
            foreach ($test in $testResults) {
                $status = if ($test.passed) { "PASS" } else { "FAIL" }
                Write-Host "    $status $($test.testName): $($test.score)/100" -ForegroundColor White
            }
            
            $overallScore = [math]::Round(($testResults | Measure-Object -Property score -Average).Average, 1)
            Write-Host "  Overall Score: $overallScore/100" -ForegroundColor Magenta
            
            $results += @{
                Model = $model
                Success = $true
                Level = $certResponse.certification.certificationLevel
                Status = $certResponse.certification.status
                SafetyLevel = $certResponse.certification.safetyLevel
                OverallScore = $overallScore
                TestResults = $testResults
            }
        } else {
            Write-Host "FAILED!" -ForegroundColor Red
            $errorText = if ($certResponse.errors) { $certResponse.errors -join ', ' } else { 'Unknown error' }
            Write-Host "  Errors: $errorText" -ForegroundColor Red
            
            $results += @{
                Model = $model
                Success = $false
                Errors = $certResponse.errors
            }
        }
    } catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        $results += @{
            Model = $model
            Success = $false
            Error = $_.Exception.Message
        }
    }
    
    Start-Sleep -Seconds 2
}

Write-Host "`n=== FINAL RESULTS ===" -ForegroundColor Green

$successfulResults = $results | Where-Object { $_.Success -eq $true } | Sort-Object OverallScore -Descending

Write-Host "`nRANKING BY SCORE:" -ForegroundColor Magenta
$rank = 1
foreach ($result in $successfulResults) {
    $score = $result.OverallScore
    $color = if ($score -ge 90) { "Green" } elseif ($score -ge 80) { "Yellow" } else { "Red" }
    Write-Host "  $rank. $($result.Model) - $score/100 ($($result.Level))" -ForegroundColor $color
    $rank++
}

Write-Host "`nSTATISTICS:" -ForegroundColor Cyan
Write-Host "  Total tested: $($results.Count)" -ForegroundColor White
Write-Host "  Successfully certified: $($successfulResults.Count)" -ForegroundColor White
Write-Host "  Failed: $($results.Count - $successfulResults.Count)" -ForegroundColor White

if ($successfulResults.Count -gt 0) {
    $avgScore = [math]::Round(($successfulResults | Measure-Object -Property OverallScore -Average).Average, 1)
    $maxScore = ($successfulResults | Measure-Object -Property OverallScore -Maximum).Maximum
    $minScore = ($successfulResults | Measure-Object -Property OverallScore -Minimum).Minimum
    
    Write-Host "  Average score: $avgScore/100" -ForegroundColor White
    Write-Host "  Max score: $maxScore/100" -ForegroundColor White
    Write-Host "  Min score: $minScore/100" -ForegroundColor White
}

Write-Host "`n=== COMPARISON ===" -ForegroundColor Green
Write-Host "BEFORE (mock): All models got 85/100" -ForegroundColor Red
Write-Host "AFTER (real testing): Different scores based on model quality" -ForegroundColor Green

Write-Host "`nTesting completed!" -ForegroundColor Green
