# Test AI request for referral system
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJmYjIwZmE3Yi04ZjBmLTQ0OGQtYmExNy1iZDgyY2FkY2QwNGEiLCJlbWFpbCI6InJlZmVycmFsQGV4YW1wbGUuY29tIiwiaWF0IjoxNzM2ODI1MjQ5LCJleHAiOjE3MzY4Mjg4NDl9.4QqJ8QqJ8QqJ8QqJ8QqJ8QqJ8QqJ8QqJ8QqJ8QqJ8Q"
}

$body = @{
    model = "gpt-3.5-turbo"
    messages = @(
        @{
            role = "user"
            content = "Hello, this is a test request for referral system"
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
