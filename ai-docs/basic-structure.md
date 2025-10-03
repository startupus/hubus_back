# Basic Project Structure

## Overview

This is a microservices-based AI provider aggregation platform built with NestJS, TypeScript, and containerized using Docker. The project follows a distributed architecture pattern where each service is independently deployable and maintains its own database.

## Root Directory Structure

```
MVP/
├── services/           # Microservices directory
├── docker-compose.yml  # Container orchestration
├── package.json        # Root package configuration
├── env.example         # Environment variables template
└── README.md          # Project documentation
```

## Services Architecture

The platform consists of six main microservices, each serving a specific business domain:

### 1. API Gateway (`services/api-gateway/`)
**Purpose**: Single entry point for all client requests
**Port**: 3000
**Key Responsibilities**:
- Request routing and load balancing
- Authentication and authorization
- Rate limiting and throttling
- Request/response transformation
- Health monitoring

**Key Modules**:
- `AuthModule` - Authentication endpoints
- `ChatModule` - AI chat completions
- `BillingModule` - Billing and balance management
- `AnalyticsModule` - Usage analytics
- `HealthModule` - Service health checks

### 2. Auth Service (`services/auth-service/`)
**Purpose**: User authentication and authorization
**Ports**: 3001 (HTTP), 50051 (gRPC)
**Database**: PostgreSQL (auth_db)
**Key Responsibilities**:
- User registration and login
- JWT token management
- API key generation and validation
- User profile management
- Security and access control

**Key Modules**:
- `AuthModule` - Core authentication logic
- `ApiKeyModule` - API key management
- `UserModule` - User profile operations
- `SecurityModule` - Security utilities
- `GrpcModule` - gRPC communication

### 3. Provider Orchestrator (`services/provider-orchestrator/`)
**Purpose**: AI provider management and request routing
**Port**: 3002
**Database**: PostgreSQL (orchestrator_db)
**Key Responsibilities**:
- Provider configuration management
- Request routing to appropriate providers
- Load balancing across providers
- Provider health monitoring
- Model availability tracking

**Key Modules**:
- `OrchestratorModule` - Core orchestration logic

### 4. Proxy Service (`services/proxy-service/`)
**Purpose**: External AI provider integration
**Port**: 3003
**Key Responsibilities**:
- Communication with external AI providers (OpenAI, OpenRouter, etc.)
- Request/response transformation
- Error handling and retries
- Rate limiting per provider
- Response caching

**Key Modules**:
- `ProxyModule` - Provider integration logic

### 5. Billing Service (`services/billing-service/`)
**Purpose**: Billing and cost management
**Port**: 3004
**Database**: PostgreSQL (billing_db)
**Key Responsibilities**:
- User balance management
- Cost calculation and tracking
- Transaction history
- Usage analytics
- Payment processing

**Key Modules**:
- `BillingModule` - Billing operations

### 6. Analytics Service (`services/analytics-service/`)
**Purpose**: Usage analytics and monitoring
**Port**: 3005
**Key Responsibilities**:
- Usage metrics collection
- Performance monitoring
- Error tracking
- Business intelligence
- Reporting and dashboards

**Key Modules**:
- `AnalyticsModule` - Analytics processing

### 7. Shared Package (`services/shared/`)
**Purpose**: Common libraries and types
**Key Responsibilities**:
- Shared TypeScript types and interfaces
- Common DTOs and validation schemas
- Utility functions
- Constants and configuration
- gRPC contracts

**Key Exports**:
- `types/` - Common type definitions
- `dto/` - Data transfer objects
- `utils/` - Utility functions
- `constants/` - Application constants
- `interfaces/` - Configuration interfaces

## Infrastructure Components

### Databases
- **auth-db**: PostgreSQL for user authentication data
- **billing-db**: PostgreSQL for billing and transaction data
- **orchestrator-db**: PostgreSQL for provider configuration
- **redis**: Caching and session storage
- **rabbitmq**: Message queue for asynchronous communication

### Communication Patterns
- **HTTP**: Client-to-API Gateway communication
- **gRPC**: Synchronous inter-service communication
- **RabbitMQ**: Asynchronous message processing
- **Redis**: Caching and session management

## Key Configuration Files

### Service Configuration
Each service contains:
- `src/app.module.ts` - Main application module
- `src/config/configuration.ts` - Service-specific configuration
- `src/config/validation.schema.ts` - Environment variable validation
- `Dockerfile` - Container build instructions
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration

### Shared Configuration
- `docker-compose.yml` - Multi-container orchestration
- `env.example` - Environment variables template
- `package.json` - Root-level dependencies

## Data Flow

1. **Client Request** → API Gateway
2. **Authentication** → Auth Service (gRPC)
3. **Request Routing** → Provider Orchestrator
4. **AI Processing** → Proxy Service → External Providers
5. **Billing** → Billing Service (asynchronous)
6. **Analytics** → Analytics Service (asynchronous)
7. **Response** → Client via API Gateway

## Development Principles

- **Database per Service**: Each service maintains its own database
- **API-First Design**: All services expose well-defined APIs
- **Event-Driven Architecture**: Asynchronous communication via message queues
- **Containerization**: All services are containerized with Docker
- **Type Safety**: Strict TypeScript configuration across all services
- **Configuration Management**: Environment-based configuration with validation
