# AI Aggregator Test Runner
# Comprehensive test execution script for all services

param(
    [string]$TestType = "all",
    [string]$Service = "all",
    [switch]$Coverage = $false,
    [switch]$Watch = $false,
    [switch]$Verbose = $false,
    [switch]$Debug = $false,
    [switch]$Help = $false
)

Write-Host "=== AI Aggregator Test Runner ===" -ForegroundColor Cyan
Write-Host ""

if ($Help) {
    Write-Host "Usage: .\test-runner-fixed.ps1 [options]" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "  -TestType <type>    Test type: all, unit, integration, e2e (default: all)" -ForegroundColor White
    Write-Host "  -Service <service>  Service: all, auth, billing, api-gateway (default: all)" -ForegroundColor White
    Write-Host "  -Coverage          Generate coverage report" -ForegroundColor White
    Write-Host "  -Watch             Watch mode for development" -ForegroundColor White
    Write-Host "  -Verbose           Verbose output" -ForegroundColor White
    Write-Host "  -Debug             Debug mode with detailed output" -ForegroundColor White
    Write-Host "  -Help              Show this help message" -ForegroundColor White
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor Yellow
    Write-Host "  .\test-runner-fixed.ps1                           # Run all tests" -ForegroundColor White
    Write-Host "  .\test-runner-fixed.ps1 -TestType unit           # Run only unit tests" -ForegroundColor White
    Write-Host "  .\test-runner-fixed.ps1 -Service auth            # Run tests for auth service" -ForegroundColor White
    Write-Host "  .\test-runner-fixed.ps1 -Coverage -Verbose       # Run with coverage and verbose output" -ForegroundColor White
    Write-Host "  .\test-runner-fixed.ps1 -Watch                   # Run in watch mode" -ForegroundColor White
    exit 0
}

# Validate parameters
$validTestTypes = @("all", "unit", "integration", "e2e")
$validServices = @("all", "auth", "billing", "api-gateway", "provider-orchestrator", "proxy-service")

if ($validTestTypes -notcontains $TestType) {
    Write-Host "ERROR: Invalid test type '$TestType'. Valid types: $($validTestTypes -join ', ')" -ForegroundColor Red
    exit 1
}

if ($validServices -notcontains $Service) {
    Write-Host "ERROR: Invalid service '$Service'. Valid services: $($validServices -join ', ')" -ForegroundColor Red
    exit 1
}

# Build Jest command
$jestCommand = "npx jest"

# Add test path pattern based on test type
switch ($TestType) {
    "unit" { $jestCommand += " --testPathPattern=unit" }
    "integration" { $jestCommand += " --testPathPattern=integration" }
    "e2e" { $jestCommand += " --testPathPattern=e2e" }
}

# Add service filter
if ($Service -ne "all") {
    $jestCommand += " --testPathPattern=$Service"
}

# Add options
if ($Coverage) {
    $jestCommand += " --coverage"
    Write-Host "Coverage report will be generated" -ForegroundColor Green
}

if ($Watch) {
    $jestCommand += " --watch"
    Write-Host "Running in watch mode" -ForegroundColor Green
}

if ($Verbose) {
    $jestCommand += " --verbose"
    Write-Host "Verbose output enabled" -ForegroundColor Green
}

if ($Debug) {
    $jestCommand += " --detectOpenHandles --forceExit"
    Write-Host "Debug mode enabled" -ForegroundColor Green
}

# Display configuration
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Test Type: $TestType" -ForegroundColor White
Write-Host "  Service: $Service" -ForegroundColor White
Write-Host "  Coverage: $Coverage" -ForegroundColor White
Write-Host "  Watch: $Watch" -ForegroundColor White
Write-Host "  Verbose: $Verbose" -ForegroundColor White
Write-Host "  Debug: $Debug" -ForegroundColor White
Write-Host ""

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check if Jest is available
try {
    $jestVersion = npx jest --version 2>$null
    Write-Host "Using Jest version: $jestVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Jest not found. Installing..." -ForegroundColor Red
    npm install --save-dev jest ts-jest @types/jest
}

Write-Host ""
Write-Host "Running tests..." -ForegroundColor Cyan
Write-Host "Command: $jestCommand" -ForegroundColor Gray
Write-Host ""

# Execute tests
try {
    Invoke-Expression $jestCommand
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "All tests passed successfully!" -ForegroundColor Green
        
        if ($Coverage) {
            Write-Host ""
            Write-Host "Coverage report generated in ./coverage/" -ForegroundColor Green
            Write-Host "   Open coverage/lcov-report/index.html in your browser" -ForegroundColor Gray
        }
    } else {
        Write-Host ""
        Write-Host "Some tests failed. Check the output above for details." -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "Error running tests: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Test Runner Complete ===" -ForegroundColor Cyan
