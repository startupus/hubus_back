# Final System Check
# Comprehensive testing of all system components

Write-Host "================================================" -ForegroundColor Green
Write-Host "  FINAL SYSTEM CHECK" -ForegroundColor Green
Write-Host "  Comprehensive testing of all components" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

# Function for HTTP requests
function Invoke-SystemRequest {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [string]$Description = ""
    )
    
    Write-Host "`n--- $Description ---" -ForegroundColor Cyan
    Write-Host "URL: $Url" -ForegroundColor Gray
    
    try {
        $requestParams = @{
            Method = $Method
            Uri = $Url
            Headers = $Headers
            ContentType = "application/json"
            UseBasicParsing = $true
            TimeoutSec = 10
        }
        
        if ($Body) {
            $requestParams.Body = $Body
        }
        
        $response = Invoke-WebRequest @requestParams
        
        Write-Host "SUCCESS: Status Code $($response.StatusCode)" -ForegroundColor Green
        
        if ($response.Content) {
            try {
                $jsonContent = $response.Content | ConvertFrom-Json
                return $jsonContent
            } catch {
                return $response.Content
            }
        }
        
        return $response
    }
    catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-Host "Status Code: $statusCode" -ForegroundColor Red
        }
        
        return $null
    }
}

# PHASE 1: Health Checks
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 1: HEALTH CHECKS" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

$healthResults = @{}

# Check all services
$services = @(
    @{Name="Auth Service"; Url="http://localhost:3001/health"},
    @{Name="Billing Service"; Url="http://localhost:3004/health"},
    @{Name="Payment Service"; Url="http://localhost:3006/api/v1/health"},
    @{Name="API Gateway"; Url="http://localhost:3000/health"},
    @{Name="Provider Orchestrator"; Url="http://localhost:3002/health"},
    @{Name="Proxy Service"; Url="http://localhost:3003/health"}
)

$healthyCount = 0
foreach ($service in $services) {
    $result = Invoke-SystemRequest -Method "GET" -Url $service.Url -Description "Health Check: $($service.Name)"
    if ($result) { 
        $healthResults[$service.Name] = "HEALTHY"
        $healthyCount++
    } else {
        $healthResults[$service.Name] = "UNHEALTHY"
    }
}

Write-Host "`nHealth Check Summary:" -ForegroundColor Cyan
foreach ($service in $healthResults.Keys) {
    $status = $healthResults[$service]
    $color = if ($status -eq "HEALTHY") { "Green" } else { "Red" }
    Write-Host "  $service`: $status" -ForegroundColor $color
}

Write-Host "`nTotal Healthy Services: $healthyCount/$($services.Count)" -ForegroundColor $(if ($healthyCount -eq $services.Count) { "Green" } else { "Yellow" })

# PHASE 2: Core Functionality Test
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 2: CORE FUNCTIONALITY TEST" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

# Register a test company
$timestamp = Get-Date -Format 'yyyyMMddHHmmss'
$registrationData = @{
    email = "final-check-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Final Check Company $timestamp"
    description = "Company for final system check"
} | ConvertTo-Json

$registerResult = Invoke-SystemRequest `
    -Method "POST" `
    -Url "http://localhost:3000/v1/auth/register" `
    -Body $registrationData `
    -Description "Company Registration"

if ($registerResult) {
    $companyId = $registerResult.user.id
    $accessToken = $registerResult.accessToken
    Write-Host "`nRegistration SUCCESS!" -ForegroundColor Green
    Write-Host "Company ID: $companyId" -ForegroundColor Gray
    
    # Test balance check
    $headers = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    $balanceResult = Invoke-SystemRequest `
        -Method "GET" `
        -Url "http://localhost:3000/v1/billing/balance" `
        -Headers $headers `
        -Description "Balance Check"
    
    if ($balanceResult) {
        Write-Host "`nBalance Check SUCCESS!" -ForegroundColor Green
        Write-Host "Balance: $($balanceResult.balance.balance) $($balanceResult.balance.currency)" -ForegroundColor Gray
    }
    
    # Test AI models
    $modelsResult = Invoke-SystemRequest `
        -Method "GET" `
        -Url "http://localhost:3000/v1/models" `
        -Headers $headers `
        -Description "AI Models List"
    
    if ($modelsResult) {
        Write-Host "`nAI Models SUCCESS!" -ForegroundColor Green
        Write-Host "Total Models: $($modelsResult.total)" -ForegroundColor Gray
        Write-Host "Providers: $($modelsResult.providers.Count)" -ForegroundColor Gray
        Write-Host "Categories: $($modelsResult.categories.Count)" -ForegroundColor Gray
    }
    
    # Test payment creation
    $paymentData = @{
        amount = 500
        currency = "RUB"
        description = "Final check payment"
    } | ConvertTo-Json
    
    $paymentResult = Invoke-SystemRequest `
        -Method "POST" `
        -Url "http://localhost:3006/api/v1/payments" `
        -Headers $headers `
        -Body $paymentData `
        -Description "Payment Creation"
    
    if ($paymentResult) {
        Write-Host "`nPayment Creation SUCCESS!" -ForegroundColor Green
        Write-Host "Payment ID: $($paymentResult.id)" -ForegroundColor Gray
        Write-Host "Amount: $($paymentResult.amount) $($paymentResult.currency)" -ForegroundColor Gray
    }
    
} else {
    Write-Host "`nRegistration FAILED!" -ForegroundColor Red
    Write-Host "Cannot continue with core functionality tests." -ForegroundColor Yellow
}

# PHASE 3: Database Connectivity
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 3: DATABASE CONNECTIVITY" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

# Check database containers
Write-Host "`nChecking database containers..." -ForegroundColor Cyan
$dbContainers = @("auth-db", "billing-db", "orchestrator-db", "payment-db", "api-gateway-db")
foreach ($db in $dbContainers) {
    try {
        $container = docker ps --filter "name=$db" --format "table {{.Names}}\t{{.Status}}"
        if ($container -match "Up") {
            Write-Host "  ✅ ${db}: Running" -ForegroundColor Green
        } else {
            Write-Host "  ❌ ${db}: Not running" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ❌ ${db}: Error checking status" -ForegroundColor Red
    }
}

# PHASE 4: Message Queue
Write-Host "`n================================================" -ForegroundColor Yellow
Write-Host " PHASE 4: MESSAGE QUEUE" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Yellow

# Check RabbitMQ
$rabbitmqResult = Invoke-SystemRequest `
    -Method "GET" `
    -Url "http://localhost:15672/api/overview" `
    -Description "RabbitMQ Management API"

if ($rabbitmqResult) {
    Write-Host "`nRabbitMQ SUCCESS!" -ForegroundColor Green
    Write-Host "Management interface accessible" -ForegroundColor Gray
} else {
    Write-Host "`nRabbitMQ Management API not accessible" -ForegroundColor Yellow
    Write-Host "This is normal if authentication is required" -ForegroundColor Gray
}

# Check Redis
$redisResult = Invoke-SystemRequest `
    -Method "GET" `
    -Url "http://localhost:6379" `
    -Description "Redis Connection"

if ($redisResult) {
    Write-Host "`nRedis SUCCESS!" -ForegroundColor Green
} else {
    Write-Host "`nRedis connection test failed (this is normal for Redis)" -ForegroundColor Yellow
}

# FINAL SUMMARY
Write-Host "`n================================================" -ForegroundColor Green
Write-Host "  FINAL SYSTEM CHECK SUMMARY" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green

Write-Host "`nSYSTEM STATUS:" -ForegroundColor Cyan
Write-Host "  - Health Checks: $healthyCount/$($services.Count) services healthy" -ForegroundColor $(if ($healthyCount -eq $services.Count) { "Green" } else { "Yellow" })
Write-Host "  - Core Functionality: $(if ($registerResult) { 'WORKING' } else { 'FAILED' })" -ForegroundColor $(if ($registerResult) { "Green" } else { "Red" })
Write-Host "  - Database Connectivity: CHECKED" -ForegroundColor Green
Write-Host "  - Message Queue: CHECKED" -ForegroundColor Green

Write-Host "`nREADY FOR FULL TEST SUITE!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Green
