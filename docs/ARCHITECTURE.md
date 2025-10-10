# Architecture Documentation

## 🏗️ System Overview

The AI Aggregator Platform is a microservices-based system designed to provide unified access to multiple AI providers with advanced features including billing, authentication, and analytics.

## 🎯 Design Principles

### Microservices Architecture
- **Service Independence**: Each service has its own database and can be deployed independently
- **Loose Coupling**: Services communicate through well-defined APIs
- **High Cohesion**: Each service has a single, well-defined responsibility
- **Fault Isolation**: Failure in one service doesn't affect others

### Domain-Driven Design
- **Bounded Contexts**: Clear boundaries between different business domains
- **Aggregates**: Consistent data models within each service
- **Events**: Asynchronous communication between services

## 🏛️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        Client Applications                      │
│  Web App  │  Mobile App  │  API Clients  │  Third-party Apps  │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                        API Gateway                              │
│                    (Port 3000)                                 │
│  • Authentication & Authorization                              │
│  • Rate Limiting & Throttling                                  │
│  • Request Routing & Load Balancing                            │
│  • API Versioning & Documentation                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Auth Service   │  │Provider         │  │ Billing Service │
│   (Port 3001)   │  │Orchestrator     │  │   (Port 3004)   │
│                 │  │  (Port 3002)    │  │                 │
│ • User Mgmt     │  │                 │  │ • Balance Mgmt  │
│ • JWT Tokens    │  │ • Provider      │  │ • Transactions  │
│ • API Keys      │  │   Selection     │  │ • Pricing       │
│ • Permissions   │  │ • Load Balancing│  │ • Referrals     │
└─────────────────┘  │ • Failover      │  └─────────────────┘
                     └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                      Proxy Service                              │
│                     (Port 3003)                                │
│  • AI Provider Integration                                     │
│  • Request/Response Transformation                             │
│  • Error Handling & Retry Logic                                │
│  • Cost Calculation & Billing                                  │
└─────────────────────────────────────────────────────────────────┘
                                │
                ┌───────────────┼───────────────┐
                ▼               ▼               ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   OpenAI API    │  │ OpenRouter API  │  │  Other AI APIs  │
│                 │  │                 │  │                 │
│ • GPT-4         │  │ • Multiple      │  │ • Claude        │
│ • GPT-3.5       │  │   Models        │  │ • Gemini        │
│ • Embeddings    │  │ • Cost          │  │ • Custom        │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## 🔧 Service Details

### API Gateway Service
**Port**: 3000  
**Database**: None (stateless)  
**Responsibilities**:
- Single entry point for all client requests
- Authentication and authorization
- Rate limiting and throttling
- Request routing and load balancing
- API versioning and documentation

**Key Components**:
- `AuthController`: Handles authentication requests
- `BillingController`: Proxies billing requests
- `ChatController`: Handles AI chat requests
- `HealthController`: Provides health check endpoints

### Auth Service
**Port**: 3001  
**Database**: PostgreSQL (auth_service)  
**Responsibilities**:
- User/company registration and authentication
- JWT token management
- API key generation and validation
- User permissions and roles
- Referral system management

**Key Components**:
- `CompanyService`: Company registration and management
- `ApiKeysService`: API key generation and validation
- `ReferralService`: Referral system logic
- `ProviderPreferencesService`: Provider preference management

**Database Schema**:
```sql
-- Companies table
CREATE TABLE companies (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  role VARCHAR(50) DEFAULT 'company',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys table
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  company_id UUID REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  key VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Billing Service
**Port**: 3004  
**Database**: PostgreSQL (billing_service)  
**Responsibilities**:
- Balance management and tracking
- Transaction processing and history
- Pricing plan management
- Referral commission processing
- Payment processing

**Key Components**:
- `BillingService`: Core billing logic
- `PricingService`: Pricing plan management
- `ReferralService`: Referral commission processing
- `SubscriptionService`: Subscription management

**Database Schema**:
```sql
-- Company Balances table
CREATE TABLE company_balances (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  balance DECIMAL(10,2) DEFAULT 100.0,
  currency VARCHAR(3) DEFAULT 'USD',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  type VARCHAR(20) NOT NULL, -- DEBIT, CREDIT
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  description TEXT,
  provider VARCHAR(50),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Provider Orchestrator Service
**Port**: 3002  
**Database**: PostgreSQL (orchestrator_service)  
**Responsibilities**:
- Provider selection and routing
- Load balancing across providers
- Failover and retry logic
- Provider health monitoring
- Cost optimization

**Key Components**:
- `ProviderService`: Provider management
- `RoutingService`: Request routing logic
- `HealthService`: Provider health monitoring
- `CostService`: Cost optimization

### Proxy Service
**Port**: 3003  
**Database**: None (stateless)  
**Responsibilities**:
- AI provider integration
- Request/response transformation
- Error handling and retry logic
- Cost calculation and billing
- Response caching

**Key Components**:
- `OpenAiProxyService`: OpenAI integration
- `OpenRouterProxyService`: OpenRouter integration
- `BillingService`: Cost calculation
- `CacheService`: Response caching

## 🔄 Communication Patterns

### Synchronous Communication (HTTP)
Used for:
- Authentication requests
- Balance checks
- Configuration retrieval
- Health checks

**Example**:
```typescript
// API Gateway → Auth Service
const authResponse = await httpService.post('http://auth-service:3001/v1/auth/validate', {
  token: jwtToken
});
```

### Asynchronous Communication (RabbitMQ)
Used for:
- Billing transactions
- Analytics events
- Notification delivery
- Background processing

**Example**:
```typescript
// Proxy Service → Billing Service
await this.rabbitMQService.publish('billing.transaction', {
  userId: 'company-id',
  amount: 10.0,
  type: 'DEBIT',
  description: 'AI request'
});
```

## 🗄️ Data Architecture

### Database per Service
Each service has its own database to ensure:
- **Data Isolation**: Services can't directly access each other's data
- **Independent Scaling**: Each database can be scaled independently
- **Technology Freedom**: Each service can use different database technologies
- **Fault Isolation**: Database failures are contained to individual services

### Data Consistency
- **Eventual Consistency**: Data is eventually consistent across services
- **Saga Pattern**: Complex transactions are handled using the Saga pattern
- **Event Sourcing**: Critical business events are stored for audit and replay

### Data Flow
```
Client Request → API Gateway → Service A → Database A
                     ↓
                Service B → Database B
                     ↓
                Service C → Database C
```

## 🔒 Security Architecture

### Authentication Flow
```
1. Client sends credentials to API Gateway
2. API Gateway forwards to Auth Service
3. Auth Service validates credentials
4. Auth Service returns JWT token
5. API Gateway returns token to client
6. Client includes token in subsequent requests
```

### Authorization
- **JWT Tokens**: Stateless authentication
- **API Keys**: For external integrations
- **Role-based Access**: Different permissions for different user types
- **Resource-level Permissions**: Fine-grained access control

### Data Protection
- **Encryption at Rest**: Database encryption
- **Encryption in Transit**: TLS/SSL for all communications
- **Password Hashing**: bcrypt for password storage
- **Input Validation**: Comprehensive input sanitization

## 📊 Monitoring & Observability

### Health Checks
Each service exposes health check endpoints:
- **Liveness**: Is the service running?
- **Readiness**: Is the service ready to handle requests?
- **Dependencies**: Are external dependencies available?

### Metrics
- **Business Metrics**: Request counts, response times, error rates
- **System Metrics**: CPU, memory, disk usage
- **Custom Metrics**: Business-specific measurements

### Logging
- **Structured Logging**: JSON format for easy parsing
- **Correlation IDs**: Track requests across services
- **Log Levels**: DEBUG, INFO, WARN, ERROR
- **Centralized Logging**: All logs sent to central system

### Tracing
- **Distributed Tracing**: Track requests across service boundaries
- **Performance Analysis**: Identify bottlenecks and slow operations
- **Error Tracking**: Detailed error information and stack traces

## 🚀 Deployment Architecture

### Containerization
- **Docker**: All services containerized
- **Docker Compose**: Local development and testing
- **Kubernetes**: Production deployment
- **Multi-stage Builds**: Optimized container images

### Service Discovery
- **DNS-based**: Services discover each other via DNS
- **Load Balancing**: Distribute traffic across service instances
- **Health Checks**: Automatic removal of unhealthy instances

### Configuration Management
- **Environment Variables**: Service-specific configuration
- **Config Maps**: Kubernetes configuration management
- **Secrets Management**: Secure storage of sensitive data

## 🔄 Scalability Patterns

### Horizontal Scaling
- **Stateless Services**: Easy to scale horizontally
- **Load Balancing**: Distribute traffic across instances
- **Auto-scaling**: Automatic scaling based on metrics

### Vertical Scaling
- **Resource Limits**: Set appropriate resource limits
- **Performance Tuning**: Optimize for specific workloads
- **Caching**: Reduce database load with caching

### Database Scaling
- **Read Replicas**: Distribute read load
- **Sharding**: Partition data across multiple databases
- **Connection Pooling**: Efficient database connections

## 🛡️ Fault Tolerance

### Circuit Breaker Pattern
```typescript
class CircuitBreaker {
  private failureCount = 0;
  private lastFailureTime = 0;
  private state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

### Retry Pattern
```typescript
async function retry<T>(
  fn: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }
}
```

### Bulkhead Pattern
- **Resource Isolation**: Separate resources for different operations
- **Thread Pools**: Dedicated thread pools for different tasks
- **Connection Pools**: Separate connection pools for different services

## 📈 Performance Considerations

### Caching Strategy
- **Application Cache**: In-memory caching for frequently accessed data
- **Database Cache**: Query result caching
- **CDN**: Static content delivery
- **Redis**: Distributed caching

### Database Optimization
- **Indexing**: Proper database indexes
- **Query Optimization**: Efficient database queries
- **Connection Pooling**: Reuse database connections
- **Read Replicas**: Distribute read load

### Network Optimization
- **HTTP/2**: Multiplexed connections
- **Compression**: Gzip compression for responses
- **Keep-Alive**: Reuse TCP connections
- **CDN**: Content delivery network

## 🔧 Development Guidelines

### Service Development
- **Single Responsibility**: Each service has one clear purpose
- **API First**: Design APIs before implementation
- **Backward Compatibility**: Maintain API compatibility
- **Versioning**: Use semantic versioning

### Code Organization
- **Domain-driven Design**: Organize code by business domains
- **Clean Architecture**: Separate concerns and dependencies
- **SOLID Principles**: Follow object-oriented design principles
- **Test-driven Development**: Write tests before implementation

### Documentation
- **API Documentation**: Comprehensive API documentation
- **Architecture Decision Records**: Document important decisions
- **Runbooks**: Operational procedures
- **Code Comments**: Clear and helpful code comments

---

**Last Updated**: December 2024
**Architecture Version**: 1.0.0
