# 🚀 AI Aggregator API Documentation

## 📋 Overview

This document provides comprehensive documentation for all API endpoints in the AI Aggregator microservices system.

## 🔗 Base URLs

- **API Gateway**: `http://localhost:3000`
- **Auth Service**: `http://localhost:3001`
- **Provider Orchestrator**: `http://localhost:3002`
- **Proxy Service**: `http://localhost:3003`
- **Billing Service**: `http://localhost:3004`
- **Analytics Service**: `http://localhost:3005`

---

## 🔐 Authentication Service

### Base URL: `http://localhost:3001`

#### Register User
```http
POST /auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "isVerified": true
  },
  "tokens": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### Login User
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "user-id",
    "email": "user@example.com"
  },
  "tokens": {
    "accessToken": "jwt-token",
    "refreshToken": "refresh-token"
  }
}
```

#### Create API Key
```http
POST /auth/api-keys
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "name": "My API Key"
}
```

**Response:**
```json
{
  "success": true,
  "message": "API key created successfully",
  "apiKey": {
    "id": "key-id",
    "name": "My API Key",
    "key": "ak-xxxxxxxxxxxxxxxx",
    "expiresAt": "2025-10-05T15:00:00.000Z",
    "createdAt": "2024-10-05T15:00:00.000Z"
  }
}
```

#### Get API Keys
```http
GET /auth/api-keys
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "apiKeys": [
    {
      "id": "key-id",
      "name": "My API Key",
      "createdAt": "2024-10-05T15:00:00.000Z",
      "expiresAt": "2025-10-05T15:00:00.000Z",
      "lastUsedAt": "2024-10-05T15:00:00.000Z"
    }
  ]
}
```

#### Revoke API Key
```http
POST /auth/api-keys/:keyId/revoke
Authorization: Bearer <access-token>
```

**Response:**
```json
{
  "success": true,
  "message": "API key revoked successfully"
}
```

---

## 🎯 Provider Orchestrator Service

### Base URL: `http://localhost:3002`

#### Get Available Providers
```http
GET /orchestrator/providers
```

**Response:**
```json
{
  "providers": [
    {
      "id": "openai",
      "name": "OpenAI",
      "status": "operational",
      "models": ["gpt-4", "gpt-3.5-turbo"],
      "costPerToken": 0.00003,
      "maxTokens": 4096,
      "responseTime": 2000,
      "successRate": 0.98,
      "isActive": true,
      "priority": 1
    },
    {
      "id": "openrouter",
      "name": "OpenRouter",
      "status": "operational",
      "models": ["gpt-4", "claude-3"],
      "costPerToken": 0.000015,
      "maxTokens": 8192,
      "responseTime": 1500,
      "successRate": 0.95,
      "isActive": true,
      "priority": 2
    }
  ]
}
```

#### Get Available Models
```http
GET /orchestrator/models
```

**Response:**
```json
{
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "provider": "openai",
      "status": "available",
      "costPerToken": 0.00003,
      "maxTokens": 8192,
      "description": "Most capable GPT-4 model"
    },
    {
      "id": "gpt-3.5-turbo",
      "name": "GPT-3.5 Turbo",
      "provider": "openai",
      "status": "available",
      "costPerToken": 0.000002,
      "maxTokens": 4096,
      "description": "Fast and efficient model"
    }
  ]
}
```

#### Route Request
```http
POST /orchestrator/route-request
Content-Type: application/json

{
  "userId": "user123",
  "model": "gpt-3.5-turbo",
  "prompt": "Hello, how are you?"
}
```

**Response:**
```json
{
  "response": "AI response from provider",
  "provider": "openai",
  "model": "gpt-3.5-turbo",
  "cost": 0.05
}
```

#### Get Provider Status
```http
GET /orchestrator/provider-status/:providerId
```

**Response:**
```json
{
  "providerName": "openai",
  "status": "operational",
  "lastChecked": "2024-10-05T15:00:00.000Z",
  "message": "Provider is operational"
}
```

---

## 🔄 Proxy Service

### Base URL: `http://localhost:3003`

#### Get Available Models
```http
GET /proxy/models
```

**Response:**
```json
{
  "success": true,
  "message": "Models retrieved successfully",
  "models": [
    {
      "id": "gpt-4",
      "name": "GPT-4",
      "provider": "openai",
      "category": "chat",
      "description": "Most capable GPT-4 model",
      "max_tokens": 8192,
      "cost_per_1k_tokens": 0.03
    }
  ]
}
```

#### Proxy OpenAI Request
```http
POST /proxy/openai/chat/completions
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ],
  "temperature": 0.7,
  "max_tokens": 100
}
```

**Response:**
```json
{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "created": 1699123456,
  "model": "gpt-3.5-turbo",
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

#### Proxy OpenRouter Request
```http
POST /proxy/openrouter/chat/completions
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

**Response:**
```json
{
  "id": "chatcmpl-1234567890",
  "object": "chat.completion",
  "created": 1699123456,
  "model": "gpt-3.5-turbo",
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

#### Validate Request
```http
POST /proxy/validate-request
Content-Type: application/json

{
  "userId": "user123",
  "provider": "openai",
  "model": "gpt-3.5-turbo",
  "prompt": "Hello"
}
```

**Response:**
```json
{
  "valid": true,
  "message": "Request is valid",
  "estimatedCost": 0.05,
  "estimatedTokens": 30
}
```

---

## 💰 Billing Service

### Base URL: `http://localhost:3004`

#### Get User Balance
```http
GET /billing/balance/:userId
```

**Response:**
```json
{
  "success": true,
  "message": "Balance retrieved successfully",
  "balance": {
    "id": "balance-id",
    "userId": "user123",
    "balance": "167.708",
    "currency": "USD",
    "creditLimit": null,
    "lastUpdated": "2024-10-05T15:00:00.000Z"
  }
}
```

#### Track Usage
```http
POST /billing/usage/track
Content-Type: application/json

{
  "userId": "user123",
  "service": "ai-chat",
  "resource": "gpt-3.5-turbo",
  "quantity": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usage tracked successfully",
  "usageEvent": {
    "id": "usage-event-id",
    "userId": "user123",
    "service": "ai-chat",
    "resource": "gpt-3.5-turbo",
    "quantity": 50,
    "unit": "request",
    "cost": 1.5,
    "currency": "USD",
    "timestamp": "2024-10-05T15:00:00.000Z"
  }
}
```

#### Get Billing Report
```http
GET /billing/report/:userId
```

**Response:**
```json
{
  "success": true,
  "message": "Billing report generated successfully",
  "report": {
    "userId": "user123",
    "period": {
      "start": "2024-09-05T15:00:00.000Z",
      "end": "2024-10-05T15:00:00.000Z"
    },
    "totalUsage": 300,
    "totalCost": 15.0,
    "currency": "USD",
    "transactions": [
      {
        "id": "txn-id",
        "type": "DEBIT",
        "amount": 1.5,
        "description": "AI Chat Usage",
        "timestamp": "2024-10-05T15:00:00.000Z"
      }
    ]
  }
}
```

---

## 📊 Analytics Service

### Base URL: `http://localhost:3005`

#### Track Event
```http
POST /analytics/events/track
Content-Type: application/json

{
  "eventType": "ai_interaction",
  "userId": "user123",
  "metadata": {
    "model": "gpt-3.5-turbo",
    "tokens": 50,
    "cost": 0.05
  }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Event tracked successfully",
  "eventId": "event-1234567890",
  "eventType": "ai_interaction"
}
```

#### Get Analytics Dashboard
```http
GET /analytics/dashboard
```

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalRequests": 1250,
      "totalUsers": 50,
      "totalCost": 125.75,
      "averageResponseTime": 1.5,
      "successRate": 98.5,
      "uptime": 99.9
    },
    "charts": [
      {
        "id": "usage_over_time",
        "type": "line",
        "title": "Usage Over Time",
        "data": [
          {
            "date": "2024-10-01",
            "requests": 100,
            "cost": 5.0
          }
        ]
      }
    ],
    "recentActivity": [
      {
        "timestamp": "2024-10-05T15:00:00.000Z",
        "event": "api_request",
        "details": "GPT-4 completion request",
        "cost": 0.05
      }
    ],
    "topModels": [
      {
        "model": "gpt-4",
        "requests": 800,
        "cost": 100.50
      },
      {
        "model": "gpt-3.5-turbo",
        "requests": 450,
        "cost": 25.25
      }
    ]
  }
}
```

---

## 🌐 API Gateway

### Base URL: `http://localhost:3000`

#### AI Chat Completion
```http
POST /chat/completions
Content-Type: application/json

{
  "model": "gpt-3.5-turbo",
  "messages": [
    {
      "role": "user",
      "content": "Hello, how are you?"
    }
  ]
}
```

**Response:**
```json
{
  "id": "mock-1234567890",
  "object": "chat.completion",
  "created": 1699123456,
  "model": "gpt-3.5-turbo",
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

#### Get User Balance (via Gateway)
```http
GET /billing/balance/:userId
```

**Response:**
```json
{
  "userId": "user123",
  "balance": 100.0,
  "currency": "USD",
  "lastUpdated": "2024-10-05T15:00:00.000Z"
}
```

#### Track Usage (via Gateway)
```http
POST /billing/usage/track
Content-Type: application/json

{
  "userId": "user123",
  "service": "ai-chat",
  "resource": "gpt-3.5-turbo",
  "quantity": 50
}
```

**Response:**
```json
{
  "success": true,
  "message": "Usage tracked successfully",
  "usageEvent": {
    "id": "usage-1234567890",
    "userId": "user123",
    "service": "ai-chat",
    "resource": "gpt-3.5-turbo",
    "quantity": 50,
    "timestamp": "2024-10-05T15:00:00.000Z"
  }
}
```

#### Get Billing Report (via Gateway)
```http
GET /billing/report/:userId
```

**Response:**
```json
{
  "success": true,
  "message": "Billing report generated successfully",
  "report": {
    "userId": "user123",
    "period": {
      "start": "2024-09-05T15:00:00.000Z",
      "end": "2024-10-05T15:00:00.000Z"
    },
    "totalUsage": 100,
    "totalCost": 5.0,
    "currency": "USD",
    "transactions": []
  }
}
```

---

## 🏥 Health Checks

All services provide health check endpoints:

```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2024-10-05T15:00:00.000Z",
  "service": "service-name",
  "version": "1.0.0",
  "uptime": 3600,
  "dependencies": {
    "database": {
      "status": "healthy",
      "responseTime": 12
    },
    "redis": {
      "status": "healthy",
      "responseTime": 5
    },
    "rabbitmq": {
      "status": "healthy",
      "responseTime": 8
    }
  }
}
```

---

## 🔒 Authentication

### API Key Authentication
```http
Authorization: Bearer <api-key>
```

### JWT Token Authentication
```http
Authorization: Bearer <jwt-token>
```

---

## 📝 Error Responses

### 400 Bad Request
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 401 Unauthorized
```json
{
  "statusCode": 401,
  "message": "Unauthorized",
  "error": "Unauthorized"
}
```

### 404 Not Found
```json
{
  "statusCode": 404,
  "message": "Resource not found",
  "error": "Not Found"
}
```

### 500 Internal Server Error
```json
{
  "statusCode": 500,
  "message": "Internal server error",
  "error": "Internal Server Error"
}
```

---

## 🚀 Rate Limiting

- **Default**: 100 requests per minute per IP
- **Authenticated users**: 1000 requests per minute
- **API Keys**: 10000 requests per minute

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1699123456
```

---

## 📊 Monitoring

### Metrics Endpoint
```http
GET /metrics
```

### Health Status
```http
GET /health/status
```

### System Overview
```http
GET /monitoring/overview
```

---

## 🔧 Development

### Local Development
```bash
# Start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f [service-name]
```

### Testing
```bash
# Run all tests
npm test

# Run integration tests
npm run test:integration

# Run performance tests
npm run test:performance
```

---

## 📞 Support

For API support and questions:
- **Documentation**: This file
- **Issues**: GitHub Issues
- **Email**: support@ai-aggregator.com

---

**Last Updated**: 2024-10-05
**Version**: 1.0.0
