#!/usr/bin/env pwsh

Write-Host "=== PRICING MATH VERIFICATION ===" -ForegroundColor Green

# Test Basic Plan math
Write-Host "`nBasic Plan (10k input + 20k output):" -ForegroundColor Yellow

$inputTokens = 10000
$outputTokens = 20000
$inputPrice = 0.00003
$outputPrice = 0.00006
$discount = 10.0

$inputCost = $inputTokens * $inputPrice
$outputCost = $outputTokens * $outputPrice
$totalCost = $inputCost + $outputCost
$discountedPrice = $totalCost * (1 - $discount / 100)

Write-Host "Input cost: $inputCost" -ForegroundColor Cyan
Write-Host "Output cost: $outputCost" -ForegroundColor Cyan
Write-Host "Total without discount: $totalCost" -ForegroundColor Cyan
Write-Host "With 10% discount: $discountedPrice" -ForegroundColor Cyan
Write-Host "Savings: $($totalCost - $discountedPrice)" -ForegroundColor Cyan

# Test Premium Plan math
Write-Host "`nPremium Plan (50k input + 80k output):" -ForegroundColor Yellow

$inputTokens = 50000
$outputTokens = 80000
$inputPrice = 0.00003
$outputPrice = 0.00006
$discount = 10.0

$inputCost = $inputTokens * $inputPrice
$outputCost = $outputTokens * $outputPrice
$totalCost = $inputCost + $outputCost
$discountedPrice = $totalCost * (1 - $discount / 100)

Write-Host "Input cost: $inputCost" -ForegroundColor Cyan
Write-Host "Output cost: $outputCost" -ForegroundColor Cyan
Write-Host "Total without discount: $totalCost" -ForegroundColor Cyan
Write-Host "With 10% discount: $discountedPrice" -ForegroundColor Cyan
Write-Host "Savings: $($totalCost - $discountedPrice)" -ForegroundColor Cyan

Write-Host "`nMath verification completed!" -ForegroundColor Green
