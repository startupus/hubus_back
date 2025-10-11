# Simple Payment Flow Testing
# Testing basic payment scenarios step by step

Write-Host "=== SIMPLE PAYMENT FLOW TESTING ===" -ForegroundColor Green
Write-Host "Testing basic payment scenarios" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green

# Function for HTTP requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Url,
        [hashtable]$Headers = @{},
        [string]$Body = $null
    )
    
    try {
        $requestParams = @{
            Method = $Method
            Uri = $Url
            Headers = $Headers
            ContentType = "application/json"
        }
        
        if ($Body) {
            $requestParams.Body = $Body
        }
        
        $response = Invoke-RestMethod @requestParams
        return $response
    }
    catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $responseBody = $reader.ReadToEnd()
            Write-Host "Response Body: $responseBody" -ForegroundColor Red
        }
        return $null
    }
}

# Test 1: Check API Gateway
Write-Host "`n=== TEST 1: API GATEWAY CHECK ===" -ForegroundColor Cyan
Write-Host "Checking if API Gateway is accessible..." -ForegroundColor White

try {
    $gatewayResponse = Invoke-ApiRequest -Method "GET" -Url "http://localhost:3000/health"
    if ($gatewayResponse) {
        Write-Host "SUCCESS: API Gateway is accessible" -ForegroundColor Green
        Write-Host "  Response: $($gatewayResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "ERROR: API Gateway not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: API Gateway check failed" -ForegroundColor Red
}

# Test 2: Check Auth Service directly
Write-Host "`n=== TEST 2: AUTH SERVICE DIRECT CHECK ===" -ForegroundColor Cyan
Write-Host "Checking Auth Service directly..." -ForegroundColor White

try {
    $authResponse = Invoke-ApiRequest -Method "GET" -Url "http://localhost:3001/health"
    if ($authResponse) {
        Write-Host "SUCCESS: Auth Service is accessible" -ForegroundColor Green
        Write-Host "  Response: $($authResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "ERROR: Auth Service not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Auth Service check failed" -ForegroundColor Red
}

# Test 3: Check Billing Service directly
Write-Host "`n=== TEST 3: BILLING SERVICE DIRECT CHECK ===" -ForegroundColor Cyan
Write-Host "Checking Billing Service directly..." -ForegroundColor White

try {
    $billingResponse = Invoke-ApiRequest -Method "GET" -Url "http://localhost:3004/health"
    if ($billingResponse) {
        Write-Host "SUCCESS: Billing Service is accessible" -ForegroundColor Green
        Write-Host "  Response: $($billingResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "ERROR: Billing Service not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Billing Service check failed" -ForegroundColor Red
}

# Test 4: Check Payment Service directly
Write-Host "`n=== TEST 4: PAYMENT SERVICE DIRECT CHECK ===" -ForegroundColor Cyan
Write-Host "Checking Payment Service directly..." -ForegroundColor White

try {
    $paymentResponse = Invoke-ApiRequest -Method "GET" -Url "http://localhost:3006/api/v1/health"
    if ($paymentResponse) {
        Write-Host "SUCCESS: Payment Service is accessible" -ForegroundColor Green
        Write-Host "  Response: $($paymentResponse | ConvertTo-Json -Compress)" -ForegroundColor Gray
    } else {
        Write-Host "ERROR: Payment Service not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Payment Service check failed" -ForegroundColor Red
}

# Test 5: Try registration through API Gateway
Write-Host "`n=== TEST 5: REGISTRATION THROUGH API GATEWAY ===" -ForegroundColor Cyan
Write-Host "Trying registration through API Gateway..." -ForegroundColor White

$timestamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$companyData = @{
    email = "test-$timestamp@example.com"
    password = "TestPassword123!"
    name = "Test Company $timestamp"
    description = "Test company for payment testing"
    website = "https://test-$timestamp.example.com"
    phone = "+7-999-123-45-67"
} | ConvertTo-Json

Write-Host "Sending registration request through API Gateway..." -ForegroundColor Gray
Write-Host "Data: $companyData" -ForegroundColor Gray

try {
    $registerResponse = Invoke-ApiRequest -Method "POST" -Url "http://localhost:3000/v1/auth/register" -Body $companyData
    if ($registerResponse) {
        Write-Host "SUCCESS: Registration through API Gateway worked" -ForegroundColor Green
        Write-Host "  Company ID: $($registerResponse.company.id)" -ForegroundColor Gray
        Write-Host "  Email: $($registerResponse.company.email)" -ForegroundColor Gray
        Write-Host "  Access Token: $($registerResponse.accessToken.Substring(0, 20))..." -ForegroundColor Gray
        
        $companyId = $registerResponse.company.id
        $accessToken = $registerResponse.accessToken
    } else {
        Write-Host "ERROR: Registration through API Gateway failed" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Registration through API Gateway failed with exception" -ForegroundColor Red
}

# Test 6: Try registration directly to Auth Service
Write-Host "`n=== TEST 6: REGISTRATION DIRECT TO AUTH SERVICE ===" -ForegroundColor Cyan
Write-Host "Trying registration directly to Auth Service..." -ForegroundColor White

$timestamp2 = Get-Date -Format 'yyyyMMdd-HHmmss'
$companyData2 = @{
    email = "test-direct-$timestamp2@example.com"
    password = "TestPassword123!"
    name = "Test Direct Company $timestamp2"
    description = "Test company for direct auth testing"
    website = "https://test-direct-$timestamp2.example.com"
    phone = "+7-999-123-45-67"
} | ConvertTo-Json

Write-Host "Sending registration request directly to Auth Service..." -ForegroundColor Gray
Write-Host "Data: $companyData2" -ForegroundColor Gray

try {
    $registerResponse2 = Invoke-ApiRequest -Method "POST" -Url "http://localhost:3001/api/v1/auth/register" -Body $companyData2
    if ($registerResponse2) {
        Write-Host "SUCCESS: Direct registration to Auth Service worked" -ForegroundColor Green
        Write-Host "  Company ID: $($registerResponse2.company.id)" -ForegroundColor Gray
        Write-Host "  Email: $($registerResponse2.company.email)" -ForegroundColor Gray
        Write-Host "  Access Token: $($registerResponse2.accessToken.Substring(0, 20))..." -ForegroundColor Gray
        
        $companyId = $registerResponse2.company.id
        $accessToken = $registerResponse2.accessToken
    } else {
        Write-Host "ERROR: Direct registration to Auth Service failed" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: Direct registration to Auth Service failed with exception" -ForegroundColor Red
}

# Test 7: Check balance if we have a token
if ($accessToken) {
    Write-Host "`n=== TEST 7: CHECK BALANCE ===" -ForegroundColor Cyan
    Write-Host "Checking company balance..." -ForegroundColor White
    
    $balanceHeaders = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    try {
        $balanceResponse = Invoke-ApiRequest -Method "GET" -Url "http://localhost:3004/api/v1/billing/balance" -Headers $balanceHeaders
        if ($balanceResponse) {
            Write-Host "SUCCESS: Balance retrieved" -ForegroundColor Green
            Write-Host "  Balance: $($balanceResponse.balance) rubles" -ForegroundColor Gray
        } else {
            Write-Host "ERROR: Failed to get balance" -ForegroundColor Red
        }
    } catch {
        Write-Host "ERROR: Balance check failed with exception" -ForegroundColor Red
    }
} else {
    Write-Host "`n=== TEST 7: SKIP BALANCE CHECK ===" -ForegroundColor Yellow
    Write-Host "No access token available, skipping balance check" -ForegroundColor Yellow
}

# Test 8: Try payment creation if we have a token
if ($accessToken) {
    Write-Host "`n=== TEST 8: PAYMENT CREATION ===" -ForegroundColor Cyan
    Write-Host "Trying to create a payment..." -ForegroundColor White
    
    $paymentData = @{
        amount = 1000
        currency = "RUB"
        description = "Test payment"
    } | ConvertTo-Json
    
    $paymentHeaders = @{
        "Authorization" = "Bearer $accessToken"
    }
    
    try {
        $paymentResponse = Invoke-ApiRequest -Method "POST" -Url "http://localhost:3006/api/v1/payments" -Headers $paymentHeaders -Body $paymentData
        if ($paymentResponse) {
            Write-Host "SUCCESS: Payment created" -ForegroundColor Green
            Write-Host "  Payment ID: $($paymentResponse.id)" -ForegroundColor Gray
            Write-Host "  Amount: $($paymentResponse.amount) $($paymentResponse.currency)" -ForegroundColor Gray
            Write-Host "  Status: $($paymentResponse.status)" -ForegroundColor Gray
        } else {
            Write-Host "ERROR: Payment creation failed" -ForegroundColor Red
        }
    } catch {
        Write-Host "ERROR: Payment creation failed with exception" -ForegroundColor Red
    }
} else {
    Write-Host "`n=== TEST 8: SKIP PAYMENT CREATION ===" -ForegroundColor Yellow
    Write-Host "No access token available, skipping payment creation" -ForegroundColor Yellow
}

# Test 9: Check RabbitMQ
Write-Host "`n=== TEST 9: RABBITMQ CHECK ===" -ForegroundColor Cyan
Write-Host "Checking RabbitMQ management interface..." -ForegroundColor White

try {
    $rabbitResponse = Invoke-ApiRequest -Method "GET" -Url "http://localhost:15672/api/overview" -Headers @{"Authorization" = "Basic " + [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes("guest:guest"))}
    if ($rabbitResponse) {
        Write-Host "SUCCESS: RabbitMQ is accessible" -ForegroundColor Green
        Write-Host "  Management API: Available" -ForegroundColor Gray
        Write-Host "  RabbitMQ Version: $($rabbitResponse.rabbitmq_version)" -ForegroundColor Gray
    } else {
        Write-Host "ERROR: RabbitMQ not accessible" -ForegroundColor Red
    }
} catch {
    Write-Host "ERROR: RabbitMQ check failed" -ForegroundColor Red
}

# Summary
Write-Host "`n=== TEST SUMMARY ===" -ForegroundColor Green
Write-Host "===================" -ForegroundColor Green
Write-Host "Basic connectivity tests completed" -ForegroundColor White
Write-Host "Check the results above to see which services are working" -ForegroundColor White
