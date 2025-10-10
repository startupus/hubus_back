# API Gateway Service

## 🚀 Overview

The API Gateway is the main entry point for all client requests. It handles authentication, authorization, rate limiting, and request routing to appropriate microservices.

## 🔧 Configuration

### Environment Variables
```env
PORT=3000
NODE_ENV=production
AUTH_SERVICE_URL=http://auth-service:3001
BILLING_SERVICE_URL=http://billing-service:3004
PROVIDER_ORCHESTRATOR_URL=http://provider-orchestrator:3002
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
CORS_ORIGIN=https://yourdomain.com
```

### Dependencies
- **Auth Service**: User authentication and authorization
- **Billing Service**: Balance checks and transaction processing
- **Provider Orchestrator**: AI provider selection and routing

## 📋 API Endpoints

### Authentication Endpoints

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
  "referralLink": "https://example.com/ref/ABC123"
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

### Billing Endpoints

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
  "operation": "CREDIT"
}
```

### AI Chat Endpoints

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
    }
  ]
}
```

### Health Check

#### Service Health
```http
GET /health
```

**Response:**
```json
{
  "service": "api-gateway",
  "status": "healthy",
  "timestamp": "2024-12-01T00:00:00.000Z",
  "uptime": 3600,
  "version": "1.0.0",
  "dependencies": {
    "auth-service": "healthy",
    "billing-service": "healthy",
    "provider-orchestrator": "healthy"
  }
}
```

## 🔒 Security Features

### Authentication
- **JWT Token Validation**: Validates JWT tokens from Auth Service
- **API Key Support**: Supports API key authentication
- **Token Refresh**: Handles token refresh logic

### Authorization
- **Role-based Access**: Different access levels for different user types
- **Resource Permissions**: Fine-grained access control
- **Rate Limiting**: Prevents abuse and ensures fair usage

### Rate Limiting
```typescript
// Rate limiting configuration
const rateLimitConfig = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
};
```

## 🚀 Performance Features

### Caching
- **Response Caching**: Cache frequently requested data
- **Token Caching**: Cache JWT token validation results
- **Model Caching**: Cache available models list

### Load Balancing
- **Round Robin**: Distribute requests across service instances
- **Health Checks**: Remove unhealthy instances from rotation
- **Circuit Breaker**: Prevent cascading failures

### Compression
- **Gzip Compression**: Compress responses to reduce bandwidth
- **Content Negotiation**: Support different compression formats

## 🔧 Middleware

### Request Processing Pipeline
1. **CORS**: Handle cross-origin requests
2. **Rate Limiting**: Apply rate limits
3. **Authentication**: Validate JWT tokens
4. **Authorization**: Check permissions
5. **Request Logging**: Log incoming requests
6. **Body Parsing**: Parse request bodies
7. **Validation**: Validate request data
8. **Routing**: Route to appropriate service

### Error Handling
```typescript
// Global error handler
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', error);
  
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: 'An internal error occurred',
      timestamp: new Date().toISOString()
    }
  });
});
```

## 📊 Monitoring

### Metrics
- **Request Count**: Total number of requests
- **Response Time**: Average response time
- **Error Rate**: Percentage of failed requests
- **Active Connections**: Number of active connections

### Logging
```typescript
// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  });
  
  next();
});
```

### Health Checks
- **Liveness**: Is the service running?
- **Readiness**: Is the service ready to handle requests?
- **Dependencies**: Are external services available?

## 🔄 Service Communication

### HTTP Client Configuration
```typescript
// HTTP client for service communication
const httpClient = axios.create({
  timeout: 5000,
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'api-gateway/1.0.0'
  }
});

// Request interceptor
httpClient.interceptors.request.use((config) => {
  config.metadata = { startTime: Date.now() };
  return config;
});

// Response interceptor
httpClient.interceptors.response.use(
  (response) => {
    const duration = Date.now() - response.config.metadata.startTime;
    logger.info('Service call completed', {
      service: response.config.baseURL,
      duration: `${duration}ms`,
      status: response.status
    });
    return response;
  },
  (error) => {
    logger.error('Service call failed', {
      service: error.config?.baseURL,
      error: error.message,
      status: error.response?.status
    });
    return Promise.reject(error);
  }
);
```

## 🧪 Testing

### Unit Tests
```typescript
describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        }
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    authService = module.get<AuthService>(AuthService);
  });

  it('should register a company', async () => {
    const companyData = {
      name: 'Test Company',
      email: 'test@example.com',
      password: 'password123'
    };

    const mockResponse = {
      success: true,
      company: { id: 'company-id', ...companyData },
      accessToken: 'jwt-token'
    };

    jest.spyOn(authService, 'registerCompany').mockResolvedValue(mockResponse);

    const result = await controller.registerCompany(companyData);

    expect(result).toEqual(mockResponse);
    expect(authService.registerCompany).toHaveBeenCalledWith(companyData);
  });
});
```

### Integration Tests
```typescript
describe('API Gateway Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(AuthService)
    .useValue(mockAuthService)
    .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('should handle complete auth flow', async () => {
    // Register
    const registerResponse = await request(app.getHttpServer())
      .post('/v1/auth/register')
      .send({
        name: 'Test Company',
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(201);

    const { accessToken } = registerResponse.body;

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/v1/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      })
      .expect(200);

    expect(loginResponse.body.accessToken).toBeDefined();
  });
});
```

## 🚀 Deployment

### Docker Configuration
```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY dist/ ./dist/

EXPOSE 3000

CMD ["node", "dist/main.js"]
```

### Docker Compose
```yaml
api-gateway:
  build: ./services/api-gateway
  ports:
    - "3000:3000"
  environment:
    - PORT=3000
    - AUTH_SERVICE_URL=http://auth-service:3001
    - BILLING_SERVICE_URL=http://billing-service:3004
    - PROVIDER_ORCHESTRATOR_URL=http://provider-orchestrator:3002
  depends_on:
    - auth-service
    - billing-service
    - provider-orchestrator
```

## 🔧 Troubleshooting

### Common Issues

#### Service Unavailable
```bash
# Check service status
curl http://localhost:3000/health

# Check logs
docker-compose logs api-gateway
```

#### Authentication Errors
```bash
# Verify JWT token
echo "your-jwt-token" | base64 -d

# Check auth service
curl http://localhost:3001/health
```

#### Rate Limiting
```bash
# Check rate limit headers
curl -I http://localhost:3000/v1/auth/login

# Reset rate limits (if needed)
docker-compose restart api-gateway
```

### Performance Issues

#### High Response Times
- Check service dependencies
- Verify network connectivity
- Review database performance
- Check for memory leaks

#### High Error Rates
- Check service health
- Verify configuration
- Review error logs
- Check resource limits

---

**Last Updated**: December 2024
**Service Version**: 1.0.0