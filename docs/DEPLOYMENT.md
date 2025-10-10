# Deployment Guide

## 🚀 Quick Start

### Prerequisites

- **Docker**: 20.10+ and Docker Compose 2.0+
- **Node.js**: 18+ (for development)
- **PostgreSQL**: 14+ (if not using Docker)
- **RabbitMQ**: 3.8+ (if not using Docker)

### Environment Setup

1. **Clone the repository**
```bash
git clone <repository-url>
cd ai-aggregator-platform
```

2. **Copy environment configuration**
```bash
cp env.example .env
```

3. **Configure environment variables**
Edit `.env` file with your settings:

```env
# Database Configuration
AUTH_DATABASE_URL=postgresql://user:password@auth-db:5432/auth
BILLING_DATABASE_URL=postgresql://user:password@billing-db:5432/billing

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=1h

# RabbitMQ Configuration
RABBITMQ_URL=amqp://user:password@rabbitmq:5672

# Service URLs
AUTH_SERVICE_URL=http://auth-service:3001
BILLING_SERVICE_URL=http://billing-service:3004
PROVIDER_ORCHESTRATOR_URL=http://provider-orchestrator:3002

# AI Provider API Keys
OPENAI_API_KEY=your-openai-api-key
OPENROUTER_API_KEY=your-openrouter-api-key
```

## 🐳 Docker Deployment

### Development Environment

1. **Start all services**
```bash
docker-compose up -d
```

2. **Check service status**
```bash
docker-compose ps
```

3. **View logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f api-gateway
```

4. **Stop services**
```bash
docker-compose down
```

### Production Environment

1. **Use production Docker Compose**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

2. **Scale services as needed**
```bash
docker-compose up -d --scale api-gateway=3
docker-compose up -d --scale proxy-service=5
```

## 🏗️ Manual Deployment

### 1. Database Setup

#### PostgreSQL Installation
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS
brew install postgresql
brew services start postgresql

# Windows
# Download from https://www.postgresql.org/download/windows/
```

#### Create Databases
```sql
-- Connect to PostgreSQL
psql -U postgres

-- Create databases
CREATE DATABASE auth_service;
CREATE DATABASE billing_service;

-- Create users
CREATE USER auth_user WITH PASSWORD 'auth_password';
CREATE USER billing_user WITH PASSWORD 'billing_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE auth_service TO auth_user;
GRANT ALL PRIVILEGES ON DATABASE billing_service TO billing_user;
```

### 2. RabbitMQ Setup

#### Installation
```bash
# Ubuntu/Debian
sudo apt install rabbitmq-server

# macOS
brew install rabbitmq
brew services start rabbitmq

# Windows
# Download from https://www.rabbitmq.com/download.html
```

#### Configuration
```bash
# Enable management plugin
sudo rabbitmq-plugins enable rabbitmq_management

# Create user
sudo rabbitmqctl add_user admin password
sudo rabbitmqctl set_user_tags admin administrator
sudo rabbitmqctl set_permissions -p / admin ".*" ".*" ".*"
```

### 3. Service Deployment

#### Install Dependencies
```bash
# Install root dependencies
npm install

# Install service dependencies
cd services/auth-service && npm install
cd services/billing-service && npm install
cd services/api-gateway && npm install
```

#### Build Services
```bash
# Build all services
npm run build

# Build specific service
cd services/auth-service && npm run build
```

#### Run Database Migrations
```bash
# Auth service migrations
cd services/auth-service && npm run migrate

# Billing service migrations
cd services/billing-service && npm run migrate
```

#### Start Services
```bash
# Start in development mode
npm run dev

# Start in production mode
npm run start:prod
```

## 🔧 Configuration

### Environment Variables

#### API Gateway
```env
PORT=3000
NODE_ENV=production
AUTH_SERVICE_URL=http://localhost:3001
BILLING_SERVICE_URL=http://localhost:3004
PROVIDER_ORCHESTRATOR_URL=http://localhost:3002
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

#### Auth Service
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://auth_user:auth_password@localhost:5432/auth_service
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=12
```

#### Billing Service
```env
PORT=3004
NODE_ENV=production
DATABASE_URL=postgresql://billing_user:billing_password@localhost:5432/billing_service
RABBITMQ_URL=amqp://admin:password@localhost:5672
BILLING_CURRENCY=USD
DEFAULT_BALANCE=100.0
```

### Security Configuration

#### JWT Configuration
```env
# Use a strong, random secret
JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters

# Set appropriate expiration time
JWT_EXPIRES_IN=1h

# For production, consider shorter expiration
JWT_REFRESH_EXPIRES_IN=7d
```

#### Database Security
```env
# Use strong passwords
DATABASE_PASSWORD=strong-random-password

# Enable SSL in production
DATABASE_SSL=true
DATABASE_SSL_REJECT_UNAUTHORIZED=true
```

#### API Security
```env
# Enable CORS for your domain
CORS_ORIGIN=https://yourdomain.com

# Set up rate limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Enable request logging
LOG_LEVEL=info
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints

- **API Gateway**: `http://localhost:3000/health`
- **Auth Service**: `http://localhost:3001/health`
- **Billing Service**: `http://localhost:3004/health`

### Health Check Response
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
    "database": "connected"
  }
}
```

### Monitoring Setup

#### Prometheus Metrics
```yaml
# prometheus.yml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'ai-aggregator'
    static_configs:
      - targets: ['localhost:3000', 'localhost:3001', 'localhost:3004']
```

#### Grafana Dashboard
Import the provided Grafana dashboard configuration for comprehensive monitoring.

## 🔒 SSL/TLS Configuration

### Using Let's Encrypt
```bash
# Install certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Configure nginx
server {
    listen 443 ssl;
    server_name yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Using Self-Signed Certificates
```bash
# Generate private key
openssl genrsa -out private.key 2048

# Generate certificate
openssl req -new -x509 -key private.key -out certificate.crt -days 365
```

## 🚀 Production Deployment

### Using Docker Swarm

1. **Initialize Swarm**
```bash
docker swarm init
```

2. **Deploy Stack**
```bash
docker stack deploy -c docker-compose.swarm.yml ai-aggregator
```

3. **Scale Services**
```bash
docker service scale ai-aggregator_api-gateway=3
docker service scale ai-aggregator_proxy-service=5
```

### Using Kubernetes

1. **Create Namespace**
```bash
kubectl create namespace ai-aggregator
```

2. **Apply Configurations**
```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/deployments.yaml
kubectl apply -f k8s/services.yaml
kubectl apply -f k8s/ingress.yaml
```

3. **Check Status**
```bash
kubectl get pods -n ai-aggregator
kubectl get services -n ai-aggregator
```

## 🔄 Backup & Recovery

### Database Backup

#### PostgreSQL Backup
```bash
# Backup auth database
pg_dump -h localhost -U auth_user auth_service > auth_backup.sql

# Backup billing database
pg_dump -h localhost -U billing_user billing_service > billing_backup.sql

# Restore from backup
psql -h localhost -U auth_user auth_service < auth_backup.sql
psql -h localhost -U billing_user billing_service < billing_backup.sql
```

#### Automated Backup Script
```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup databases
pg_dump -h localhost -U auth_user auth_service > $BACKUP_DIR/auth_$DATE.sql
pg_dump -h localhost -U billing_user billing_service > $BACKUP_DIR/billing_$DATE.sql

# Compress backups
gzip $BACKUP_DIR/auth_$DATE.sql
gzip $BACKUP_DIR/billing_$DATE.sql

# Remove old backups (keep last 7 days)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
```

### Application Backup

#### Docker Volumes Backup
```bash
# Backup volumes
docker run --rm -v ai-aggregator_auth_data:/data -v $(pwd):/backup alpine tar czf /backup/auth_data.tar.gz -C /data .
docker run --rm -v ai-aggregator_billing_data:/data -v $(pwd):/backup alpine tar czf /backup/billing_data.tar.gz -C /data .
```

## 🚨 Troubleshooting

### Common Issues

#### Service Won't Start
```bash
# Check logs
docker-compose logs service-name

# Check port conflicts
netstat -tulpn | grep :3000

# Check disk space
df -h
```

#### Database Connection Issues
```bash
# Test database connection
psql -h localhost -U auth_user -d auth_service -c "SELECT 1;"

# Check database status
sudo systemctl status postgresql
```

#### RabbitMQ Issues
```bash
# Check RabbitMQ status
sudo systemctl status rabbitmq-server

# Check queues
sudo rabbitmqctl list_queues
```

### Performance Issues

#### High Memory Usage
```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart
```

#### Slow Database Queries
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

## 📈 Scaling

### Horizontal Scaling

#### Load Balancer Configuration
```nginx
upstream api_gateway {
    server api-gateway-1:3000;
    server api-gateway-2:3000;
    server api-gateway-3:3000;
}

server {
    listen 80;
    location / {
        proxy_pass http://api_gateway;
    }
}
```

#### Database Scaling
- **Read Replicas**: Set up read replicas for read-heavy operations
- **Connection Pooling**: Use PgBouncer for connection pooling
- **Partitioning**: Partition large tables by date or user

### Vertical Scaling

#### Resource Limits
```yaml
# docker-compose.yml
services:
  api-gateway:
    deploy:
      resources:
        limits:
          memory: 1G
          cpus: '0.5'
        reservations:
          memory: 512M
          cpus: '0.25'
```

## 🔐 Security Checklist

- [ ] Change default passwords
- [ ] Enable SSL/TLS
- [ ] Configure firewall rules
- [ ] Set up rate limiting
- [ ] Enable request logging
- [ ] Configure CORS properly
- [ ] Use strong JWT secrets
- [ ] Enable database SSL
- [ ] Set up monitoring and alerting
- [ ] Regular security updates
- [ ] Backup encryption
- [ ] Access control and permissions

---

**Last Updated**: December 2024
**Deployment Version**: 1.0.0