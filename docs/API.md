# API Documentation

## 🔗 Base URLs

- **API Gateway**: `http://localhost:3000`
- **Auth Service**: `http://localhost:3001`
- **Billing Service**: `http://localhost:3004`

## 🔐 Authentication

All API endpoints (except health checks and registration) require authentication using JWT tokens or API keys.

### JWT Authentication
```http
Authorization: Bearer <jwt-token>
```

### API Key Authentication
```http
X-API-Key: <api-key>
# OR
?api_key=<api-key>
```

## 📋 API Endpoints

### Authentication Service

#### Register Company
```http
POST /v1/auth/register
Content-Type: application/json

{
  "name": "Company Name",
  "email": "company@example.com",
  "password": "securepassword",
  "description": "Company description",
  "website": "https://company.com",
  "phone": "+1234567890",
  "address": {
    "city": "New York",
    "country": "USA"
  },
  "referralLink": "https://example.com/ref/ABC123" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "message": "Company registered successfully",
  "company": {
    "id": "company-id",
    "name": "Company Name",
    "email": "company@example.com",
    "isActive": true,
    "isVerified": true,
    "role": "company",
    "createdAt": "2024-12-01T00:00:00.000Z"
  },
  "accessToken": "jwt-token"
}
```

#### Login Company
```http
POST /v1/auth/login
Content-Type: application/json

{
  "email": "company@example.com",
  "password": "securepassword"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "accessToken": "jwt-token",
  "company": {
    "id": "company-id",
    "name": "Company Name",
    "email": "company@example.com",
    "isActive": true,
    "isVerified": true,
    "role": "company"
  }
}
```

#### Create API Key
```http
POST /v1/auth/api-keys
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "My API Key",
  "description": "API key for external integration",
  "expiresAt": "2025-12-01T00:00:00.000Z" // Optional
}
```

**Response:**
```json
{
  "success": true,
  "apiKey": {
    "id": "api-key-id",
    "name": "My API Key",
    "key": "ak_xxxxxxxxxxxxxxxx",
    "isActive": true,
    "expiresAt": "2025-12-01T00:00:00.000Z",
    "createdAt": "2024-12-01T00:00:00.000Z"
  }
}
```

#### List API Keys
```http
GET /v1/auth/api-keys
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "apiKeys": [
    {
      "id": "api-key-id",
      "name": "My API Key",
      "key": "ak_xxxxxxxxxxxxxxxx",
      "isActive": true,
      "expiresAt": "2025-12-01T00:00:00.000Z",
      "createdAt": "2024-12-01T00:00:00.000Z"
    }
  ]
}
```

### Billing Service

#### Get Balance
```http
GET /v1/billing/balance
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "balance": {
    "id": "balance-id",
    "userId": "company-id",
    "balance": 100.0,
    "currency": "USD",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

#### Update Balance
```http
POST /v1/billing/balance
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "amount": 100.0,
  "operation": "CREDIT" // or "DEBIT"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Balance updated successfully",
  "balance": {
    "id": "balance-id",
    "userId": "company-id",
    "balance": 200.0,
    "currency": "USD",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

#### Get Transactions
```http
GET /v1/billing/transactions?limit=50&offset=0
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "transaction-id",
      "userId": "company-id",
      "type": "DEBIT",
      "amount": 10.0,
      "currency": "USD",
      "description": "AI request",
      "provider": "openai",
      "metadata": {
        "model": "gpt-4",
        "tokens": 100
      },
      "createdAt": "2024-12-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 100,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

#### Create Transaction
```http
POST /v1/billing/transactions
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "type": "DEBIT",
  "amount": 10.0,
  "currency": "USD",
  "description": "AI request",
  "provider": "openai",
  "metadata": {
    "model": "gpt-4",
    "tokens": 100
  }
}
```

**Response:**
```json
{
  "success": true,
  "transaction": {
    "id": "transaction-id",
    "userId": "company-id",
    "type": "DEBIT",
    "amount": 10.0,
    "currency": "USD",
    "description": "AI request",
    "provider": "openai",
    "metadata": {
      "model": "gpt-4",
      "tokens": 100
    },
    "createdAt": "2024-12-01T00:00:00.000Z"
  }
}
```

### AI Chat Service

#### Send Chat Request
```http
POST /v1/chat/completions
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "model": "gpt-4",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "max_tokens": 1000,
  "temperature": 0.7,
  "stream": false
}
```

**Response:**
```json
{
  "id": "chatcmpl-123",
  "object": "chat.completion",
  "created": 1677652288,
  "model": "gpt-4",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! I'm doing well, thank you for asking. How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 10,
    "completion_tokens": 20,
    "total_tokens": 30
  }
}
```

#### Get Available Models
```http
GET /v1/models
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "provider": "openai",
      "description": "Most capable GPT-4 model",
      "pricing": {
        "input": 0.03,
        "output": 0.06
      }
    },
    {
      "id": "gpt-3.5-turbo",
      "name": "GPT-3.5 Turbo",
      "provider": "openai",
      "description": "Fast and efficient GPT-3.5 model",
      "pricing": {
        "input": 0.001,
        "output": 0.002
      }
    }
  ]
}
```

### Referral System

#### Get Referral Stats
```http
GET /v1/referrals/stats
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalReferrals": 10,
    "activeReferrals": 8,
    "totalCommission": 150.0,
    "referralCode": "ABC123",
    "referralLink": "https://example.com/ref/ABC123"
  }
}
```

#### Get Referral History
```http
GET /v1/referrals/history
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "referrals": [
    {
      "id": "referral-id",
      "referredCompany": {
        "id": "company-id",
        "name": "Referred Company",
        "email": "referred@example.com"
      },
      "commissionAmount": 15.0,
      "status": "ACTIVE",
      "createdAt": "2024-12-01T00:00:00.000Z"
    }
  ]
}
```

### Provider Preferences

#### Set Provider Preference
```http
POST /v1/provider-preferences
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "model": "gpt-4",
  "provider": "openai",
  "priority": 1
}
```

**Response:**
```json
{
  "success": true,
  "preference": {
    "id": "preference-id",
    "companyId": "company-id",
    "model": "gpt-4",
    "provider": "openai",
    "priority": 1,
    "createdAt": "2024-12-01T00:00:00.000Z"
  }
}
```

#### Get Provider Preferences
```http
GET /v1/provider-preferences
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "success": true,
  "preferences": [
    {
      "id": "preference-id",
      "model": "gpt-4",
      "provider": "openai",
      "priority": 1,
      "createdAt": "2024-12-01T00:00:00.000Z"
    }
  ]
}
```

## 📊 Error Responses

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "email",
      "reason": "Invalid email format"
    }
  }
}
```

### Common Error Codes

- `VALIDATION_ERROR`: Input validation failed
- `UNAUTHORIZED`: Authentication required
- `FORBIDDEN`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `CONFLICT`: Resource already exists
- `INSUFFICIENT_BALANCE`: Not enough balance for operation
- `RATE_LIMITED`: Too many requests
- `INTERNAL_ERROR`: Server error

## 🔄 Rate Limiting

- **Authentication endpoints**: 10 requests per minute
- **Billing endpoints**: 100 requests per minute
- **AI Chat endpoints**: 1000 requests per minute
- **General endpoints**: 100 requests per minute

## 📝 Pagination

List endpoints support pagination:

```
GET /v1/endpoint?limit=50&offset=0
```

**Parameters:**
- `limit`: Number of items per page (default: 50, max: 100)
- `offset`: Number of items to skip (default: 0)

## 🔍 Filtering and Sorting

Many list endpoints support filtering and sorting:

```
GET /v1/endpoint?filter[status]=active&sort=createdAt&order=desc
```

**Parameters:**
- `filter[field]`: Filter by specific field value
- `sort`: Field to sort by
- `order`: Sort order (asc/desc)

## 📱 SDKs and Examples

### JavaScript/Node.js
```javascript
const response = await fetch('http://localhost:3000/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer your-jwt-token',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-4',
    messages: [{ role: 'user', content: 'Hello!' }]
  })
});

const data = await response.json();
console.log(data.choices[0].message.content);
```

### Python
```python
import requests

response = requests.post(
    'http://localhost:3000/v1/chat/completions',
    headers={
        'Authorization': 'Bearer your-jwt-token',
        'Content-Type': 'application/json'
    },
    json={
        'model': 'gpt-4',
        'messages': [{'role': 'user', 'content': 'Hello!'}]
    }
)

data = response.json()
print(data['choices'][0]['message']['content'])
```

### cURL
```bash
curl -X POST http://localhost:3000/v1/chat/completions \
  -H "Authorization: Bearer your-jwt-token" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-4",
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

---

**Last Updated**: December 2024
**API Version**: v1