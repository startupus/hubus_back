# Test referral system with debug logging
Write-Host "Testing referral system with debug logging..."

# Make AI request as referral company
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2NDhkNjJiZS0zMmI3LTQ0YmUtYjVjMy0xY2VlYzZmYmQ4MGQiLCJlbWFpbCI6InJlZmVycmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzM2ODI1MjQ5LCJleHAiOjE3MzY4Mjg4NDl9.4QqJ8QqJ8QqJ8QqJ8QqJ8QqJ8QqJ8QqJ8QqJ8QqJ8Q"
}

$body = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Hello, this is a test request for referral system debugging"
        }
    )
    max_tokens = 50
} | ConvertTo-Json -Depth 3

try {
    $response = Invoke-RestMethod -Uri "http://localhost:3000/v1/chat/completions" -Method POST -Headers $headers -Body $body
    Write-Host "AI request successful: $($response.choices[0].message.content)"
} catch {
    Write-Host "AI request failed: $($_.Exception.Message)"
}

# Check billing service logs
Write-Host "Checking billing service logs..."
docker logs project-billing-service-1 --tail 30

# Check for referral transactions
Write-Host "Checking for referral transactions..."
docker exec project-billing-db-1 psql -U postgres -d billing_db -c "SELECT COUNT(*) FROM referral_transactions;"

Write-Host "Referral system test completed."
