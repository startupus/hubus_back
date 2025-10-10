# AI Aggregator Platform

## 🚀 Overview

AI Aggregator Platform is a comprehensive microservices-based system that provides unified access to multiple AI providers (OpenAI, OpenRouter, etc.) with advanced features including billing, referral systems, API key management, and provider preferences.

## ✨ Key Features

### 🔐 Authentication & Authorization
- **Company Registration & Login**: Secure company account management
- **JWT Authentication**: Token-based authentication system
- **API Key Management**: Generate and manage API keys for external integrations
- **Role-based Access Control**: Different access levels for different user types

### 💰 Advanced Billing System
- **Pay-as-you-go Billing**: Real-time token-based billing
- **Subscription Plans**: Monthly plans with token packages (10% discount)
- **Balance Management**: Real-time balance tracking and updates
- **Transaction History**: Complete audit trail of all financial operations
- **Referral System**: Commission-based referral program with unlimited referrals

### 🤖 AI Provider Integration
- **Multi-Provider Support**: OpenAI, OpenRouter, and other AI providers
- **Provider Preferences**: Company-specific provider selection for models
- **Intelligent Routing**: Automatic provider selection based on availability and cost
- **Model Management**: Support for various AI models across providers

### 📊 Analytics & Monitoring
- **Usage Analytics**: Detailed usage statistics and reporting
- **Performance Monitoring**: Real-time system performance metrics
- **Cost Tracking**: Comprehensive cost analysis and reporting
- **Audit Logs**: Complete system activity logging

## 🏗️ Architecture

### Microservices Structure
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   API Gateway   │────│  Auth Service   │    │ Billing Service │
│   (Port 3000)   │    │   (Port 3001)   │    │   (Port 3004)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
         ┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
         │Provider         │    │  Proxy Service  │    │Analytics Service│
         │Orchestrator     │    │   (Port 3003)   │    │   (Port 3005)   │
         │  (Port 3002)    │    └─────────────────┘    └─────────────────┘
         └─────────────────┘
```

### Technology Stack
- **Backend**: NestJS with TypeScript
- **Database**: PostgreSQL (separate database per service)
- **Message Queue**: RabbitMQ for async communication
- **Authentication**: JWT tokens
- **Containerization**: Docker & Docker Compose
- **Testing**: Jest with comprehensive test suite

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- Docker & Docker Compose
- PostgreSQL 14+
- RabbitMQ

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-aggregator-platform
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp env.example .env
# Edit .env with your configuration
```

4. **Start services with Docker**
```bash
docker-compose up -d
```

5. **Run database migrations**
```bash
npm run migrate
```

6. **Verify installation**
```bash
curl http://localhost:3000/health
```

## 📖 API Documentation

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
  }
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

### Billing Endpoints

#### Get Balance
```http
GET /v1/billing/balance
Authorization: Bearer <jwt-token>
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
  "temperature": 0.7
}
```

## 🔧 Configuration

### Environment Variables

#### API Gateway
```env
PORT=3000
AUTH_SERVICE_URL=http://auth-service:3001
BILLING_SERVICE_URL=http://billing-service:3004
PROVIDER_ORCHESTRATOR_URL=http://provider-orchestrator:3002
```

#### Auth Service
```env
PORT=3001
DATABASE_URL=postgresql://user:password@auth-db:5432/auth
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1h
```

#### Billing Service
```env
PORT=3004
DATABASE_URL=postgresql://user:password@billing-db:5432/billing
RABBITMQ_URL=amqp://user:password@rabbitmq:5672
```

## 🧪 Testing

### Run Tests
```bash
# Run all tests
npm test

# Run specific test suites
npm run test:unit
npm run test:integration
npm run test:e2e

# Run with coverage
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/           # Unit tests for individual services
├── integration/    # Integration tests between services
├── e2e/           # End-to-end tests
└── shared/        # Shared test utilities
```

## 📊 Monitoring & Analytics

### Health Checks
- **API Gateway**: `http://localhost:3000/health`
- **Auth Service**: `http://localhost:3001/health`
- **Billing Service**: `http://localhost:3004/health`

### Metrics
- **Usage Statistics**: Real-time token usage and costs
- **Performance Metrics**: Response times and throughput
- **Error Rates**: System error tracking and reporting

## 🔒 Security

### Authentication
- JWT-based authentication with configurable expiration
- API key authentication for external integrations
- Role-based access control

### Data Protection
- Password hashing with bcrypt
- Secure API key generation
- Input validation and sanitization
- SQL injection prevention

## 🚀 Deployment

### Docker Deployment
```bash
# Build and start all services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Production Considerations
- Use environment-specific configuration
- Set up proper database backups
- Configure monitoring and alerting
- Implement rate limiting
- Set up SSL/TLS certificates

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation in the `docs/` folder
- Review the API documentation

## 🔄 Changelog

### v1.0.0
- Initial release with core functionality
- Multi-provider AI integration
- Advanced billing system
- Referral system
- API key management
- Provider preferences
- Comprehensive testing suite

---

**Status**: ✅ **Production Ready**
**Last Updated**: December 2024
**Version**: 1.0.0