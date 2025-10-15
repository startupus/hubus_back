# Test authentication
Write-Host "Testing authentication..."

# Test 1: Check if user exists
Write-Host "1. Checking if user exists..."
$user = docker exec project-auth-db-1 psql -U postgres -d auth_db -c "SELECT id, email FROM companies WHERE email = 'referral@example.com';"
Write-Host "User: $user"

# Test 2: Try to login
Write-Host "2. Trying to login..."
$loginData = @{
    email = "referral@example.com"
    password = "password123"
} | ConvertTo-Json

$headers = @{
    "Content-Type" = "application/json"
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/v1/auth/login" -Method POST -Headers $headers -Body $loginData
    Write-Host "Login successful: $($response.token.Substring(0,20))..."
} catch {
    Write-Host "Login failed: $($_.Exception.Message)"
    Write-Host "Response: $($_.Exception.Response)"
}

Write-Host "Authentication test completed."
