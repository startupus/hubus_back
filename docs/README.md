# AI Aggregator Platform Documentation

Welcome to the comprehensive documentation for the AI Aggregator Platform - a microservices-based system that provides unified access to multiple AI providers with advanced features.

## 📚 Documentation Index

### 🚀 Getting Started
- **[Main README](../README.md)** - Project overview, quick start, and basic usage
- **[API Documentation](./API.md)** - Complete API reference with examples
- **[Deployment Guide](./DEPLOYMENT.md)** - Production deployment instructions

### 🏗️ Architecture & Design
- **[Architecture Documentation](./ARCHITECTURE.md)** - System architecture and design patterns
- **[Service Documentation](./services/)** - Individual service documentation

### 🧪 Testing & Quality
- **[Testing Guide](./TESTING.md)** - Comprehensive testing documentation
- **[Testing Cleanup Report](../TESTING_CLEANUP_FINAL_REPORT.md)** - Testing system status

## 🎯 Quick Navigation

### For Developers
1. **Start Here**: [Main README](../README.md)
2. **API Reference**: [API Documentation](./API.md)
3. **Architecture**: [Architecture Documentation](./ARCHITECTURE.md)
4. **Testing**: [Testing Guide](./TESTING.md)

### For DevOps
1. **Deployment**: [Deployment Guide](./DEPLOYMENT.md)
2. **Architecture**: [Architecture Documentation](./ARCHITECTURE.md)
3. **Monitoring**: See deployment guide for monitoring setup

### For API Users
1. **API Reference**: [API Documentation](./API.md)
2. **Authentication**: See API documentation for auth flows
3. **Examples**: Code examples in API documentation

## 🔧 Service Documentation

### Core Services
- **[API Gateway](./services/api-gateway.md)** - Main entry point and request routing
- **[Auth Service](./services/auth-service.md)** - Authentication and user management
- **[Billing Service](./services/billing-service.md)** - Billing and transaction management

### Integration Services
- **[Provider Orchestrator](./services/provider-orchestrator.md)** - AI provider management
- **[Proxy Service](./services/proxy-service.md)** - AI provider integration
- **[Analytics Service](./services/analytics-service.md)** - Usage analytics and monitoring

## 📊 Key Features

### 🔐 Authentication & Security
- JWT-based authentication
- API key management
- Role-based access control
- Secure password handling

### 💰 Advanced Billing
- Pay-as-you-go billing
- Subscription plans with discounts
- Real-time balance tracking
- Referral commission system

### 🤖 AI Provider Integration
- Multi-provider support (OpenAI, OpenRouter, etc.)
- Intelligent provider selection
- Cost optimization
- Failover and retry logic

### 📈 Analytics & Monitoring
- Usage analytics
- Performance monitoring
- Cost tracking
- Health checks

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Docker & Docker Compose
- PostgreSQL 14+
- RabbitMQ

### Installation
```bash
# Clone repository
git clone <repository-url>
cd ai-aggregator-platform

# Install dependencies
npm install

# Start services
docker-compose up -d

# Verify installation
curl http://localhost:3000/health
```

### First API Call
```bash
# Register a company
curl -X POST http://localhost:3000/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My Company",
    "email": "company@example.com",
    "password": "securepassword"
  }'
```

## 📖 API Quick Reference

### Authentication
```http
POST /v1/auth/register    # Register company
POST /v1/auth/login       # Login company
POST /v1/auth/api-keys    # Create API key
```

### Billing
```http
GET  /v1/billing/balance      # Get balance
POST /v1/billing/balance      # Update balance
GET  /v1/billing/transactions # Get transactions
```

### AI Chat
```http
POST /v1/chat/completions  # Send chat request
GET  /v1/models           # Get available models
```

## 🧪 Testing

### Run Tests
```bash
# All tests
npm test

# Specific test types
npm run test:unit
npm run test:integration
npm run test:e2e

# With coverage
npm run test:coverage
```

### Test Structure
- **Unit Tests**: Individual component testing
- **Integration Tests**: Service interaction testing
- **E2E Tests**: Complete workflow testing

## 🔧 Configuration

### Environment Variables
```env
# Database
AUTH_DATABASE_URL=postgresql://user:pass@localhost:5432/auth
BILLING_DATABASE_URL=postgresql://user:pass@localhost:5432/billing

# JWT
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=1h

# RabbitMQ
RABBITMQ_URL=amqp://user:pass@localhost:5672

# AI Providers
OPENAI_API_KEY=your-openai-key
OPENROUTER_API_KEY=your-openrouter-key
```

## 📊 Monitoring

### Health Checks
- **API Gateway**: `http://localhost:3000/health`
- **Auth Service**: `http://localhost:3001/health`
- **Billing Service**: `http://localhost:3004/health`

### Metrics
- Request counts and response times
- Error rates and success rates
- Resource usage (CPU, memory, disk)
- Business metrics (usage, costs)

## 🚀 Deployment

### Docker (Recommended)
```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d
```

### Manual Deployment
See [Deployment Guide](./DEPLOYMENT.md) for detailed instructions.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

- **Documentation**: Check this documentation first
- **Issues**: Create an issue in the repository
- **Discussions**: Use GitHub discussions for questions

## 🔄 Changelog

### v1.0.0 (December 2024)
- Initial release with core functionality
- Multi-provider AI integration
- Advanced billing system
- Referral system
- API key management
- Provider preferences
- Comprehensive testing suite

---

**Last Updated**: December 2024  
**Documentation Version**: 1.0.0  
**Platform Version**: 1.0.0