# Auth Service

## 🚀 Overview

The Auth Service handles user authentication, authorization, API key management, and referral system functionality. It provides secure user management with JWT tokens and API keys for external integrations.

## 🔧 Configuration

### Environment Variables
```env
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://auth_user:auth_password@localhost:5432/auth_service
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=1h
BCRYPT_ROUNDS=12
AUTH_SERVICE_URL=http://auth-service:3001
```

### Dependencies
- **PostgreSQL**: User data storage
- **Billing Service**: User synchronization
- **JWT**: Token generation and validation

## 📋 API Endpoints

### Company Management

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

### API Key Management

#### Create API Key
```http
POST /v1/auth/api-keys
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "My API Key",
  "description": "API key for external integration",
  "expiresAt": "2025-12-01T00:00:00.000Z"
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

#### Update API Key
```http
PUT /v1/auth/api-keys/:id
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "Updated API Key Name",
  "description": "Updated description",
  "isActive": true
}
```

#### Delete API Key
```http
DELETE /v1/auth/api-keys/:id
Authorization: Bearer <jwt-token>
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

## 🗄️ Database Schema

### Companies Table
```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  role VARCHAR(50) DEFAULT 'company',
  description TEXT,
  website VARCHAR(255),
  phone VARCHAR(50),
  address JSONB,
  city VARCHAR(100),
  country VARCHAR(100),
  industry VARCHAR(100),
  department VARCHAR(100),
  position VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  parent_company_id UUID REFERENCES companies(id),
  billing_mode VARCHAR(20) DEFAULT 'SELF_PAID',
  referral_code VARCHAR(50) UNIQUE,
  referred_by UUID REFERENCES companies(id),
  referral_code_id UUID REFERENCES referral_codes(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_login_at TIMESTAMP
);
```

### API Keys Table
```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  key VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Referral Codes Table
```sql
CREATE TABLE referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  code VARCHAR(50) UNIQUE NOT NULL,
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### Provider Preferences Table
```sql
CREATE TABLE company_provider_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  model VARCHAR(100) NOT NULL,
  provider VARCHAR(100) NOT NULL,
  priority INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(company_id, model)
);
```

## 🔒 Security Features

### Password Security
```typescript
// Password hashing with bcrypt
const saltRounds = 12;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Password validation
const isValidPassword = await bcrypt.compare(password, hashedPassword);
```

### JWT Token Management
```typescript
// Token generation
const payload = {
  companyId: company.id,
  email: company.email,
  role: company.role,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1 hour
};

const token = jwt.sign(payload, process.env.JWT_SECRET);

// Token validation
const decoded = jwt.verify(token, process.env.JWT_SECRET);
```

### API Key Security
```typescript
// API key generation
const generateApiKey = (): string => {
  const prefix = 'ak_';
  const randomBytes = crypto.randomBytes(32);
  const key = randomBytes.toString('hex');
  return prefix + key;
};

// API key validation
const validateApiKey = async (key: string): Promise<boolean> => {
  const apiKey = await prisma.apiKey.findUnique({
    where: { key },
    include: { company: true }
  });
  
  if (!apiKey || !apiKey.isActive) {
    return false;
  }
  
  if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
    return false;
  }
  
  return true;
};
```

## 🔄 Business Logic

### Company Registration Flow
1. **Validate Input**: Check email format, password strength
2. **Check Duplicates**: Ensure email doesn't exist
3. **Hash Password**: Secure password storage
4. **Create Company**: Save to database
5. **Generate Referral Code**: Create unique referral code
6. **Sync with Billing**: Create billing account
7. **Generate JWT**: Return access token

### Login Flow
1. **Validate Credentials**: Check email and password
2. **Verify Account**: Ensure account is active
3. **Update Last Login**: Track login time
4. **Generate JWT**: Return access token
5. **Log Activity**: Record login attempt

### API Key Management Flow
1. **Validate Request**: Check permissions
2. **Generate Key**: Create unique API key
3. **Store Key**: Save to database
4. **Return Key**: Provide key to user
5. **Track Usage**: Monitor key usage

### Referral System Flow
1. **Generate Referral Code**: Create unique code
2. **Track Referrals**: Monitor referral usage
3. **Calculate Commissions**: Process referral bonuses
4. **Update Statistics**: Maintain referral stats

## 📊 Monitoring

### Metrics
- **User Registrations**: New user signups
- **Login Attempts**: Authentication attempts
- **API Key Usage**: API key activity
- **Referral Activity**: Referral system usage

### Logging
```typescript
// Authentication logging
logger.info('User login attempt', {
  email: loginData.email,
  ip: req.ip,
  userAgent: req.get('User-Agent'),
  timestamp: new Date().toISOString()
});

// API key usage logging
logger.info('API key used', {
  keyId: apiKey.id,
  companyId: apiKey.companyId,
  endpoint: req.path,
  timestamp: new Date().toISOString()
});
```

### Health Checks
```typescript
@Get('health')
async getHealth() {
  const dbStatus = await this.checkDatabaseConnection();
  const billingStatus = await this.checkBillingService();
  
  return {
    service: 'auth-service',
    status: dbStatus && billingStatus ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    dependencies: {
      database: dbStatus ? 'connected' : 'disconnected',
      billingService: billingStatus ? 'available' : 'unavailable'
    }
  };
}
```

## 🧪 Testing

### Unit Tests
```typescript
describe('CompanyService', () => {
  let service: CompanyService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CompanyService,
        {
          provide: PrismaService,
          useValue: mockPrismaService
        }
      ],
    }).compile();

    service = module.get<CompanyService>(CompanyService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  it('should register a company', async () => {
    const companyData = {
      name: 'Test Company',
      email: 'test@example.com',
      password: 'password123'
    };

    const mockCompany = {
      id: 'company-id',
      ...companyData,
      passwordHash: 'hashed-password'
    };

    jest.spyOn(prismaService.company, 'create').mockResolvedValue(mockCompany);

    const result = await service.registerCompany(companyData);

    expect(result).toBeDefined();
    expect(result.company.name).toBe(companyData.name);
  });
});
```

### Integration Tests
```typescript
describe('Auth Integration', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
    .overrideProvider(PrismaService)
    .useValue(mockPrismaService)
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

EXPOSE 3001

CMD ["node", "dist/main.js"]
```

### Docker Compose
```yaml
auth-service:
  build: ./services/auth-service
  ports:
    - "3001:3001"
  environment:
    - PORT=3001
    - DATABASE_URL=postgresql://auth_user:auth_password@auth-db:5432/auth_service
    - JWT_SECRET=your-jwt-secret
    - JWT_EXPIRES_IN=1h
  depends_on:
    - auth-db
    - billing-service

auth-db:
  image: postgres:14
  environment:
    - POSTGRES_DB=auth_service
    - POSTGRES_USER=auth_user
    - POSTGRES_PASSWORD=auth_password
  volumes:
    - auth_data:/var/lib/postgresql/data
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Check database status
docker-compose logs auth-db

# Test database connection
psql -h localhost -U auth_user -d auth_service -c "SELECT 1;"
```

#### JWT Token Issues
```bash
# Verify JWT secret
echo $JWT_SECRET

# Check token expiration
echo "your-jwt-token" | base64 -d
```

#### API Key Issues
```bash
# Check API key format
echo "ak_xxxxxxxxxxxxxxxx" | grep -E "^ak_[a-f0-9]{64}$"

# Verify API key in database
psql -h localhost -U auth_user -d auth_service -c "SELECT * FROM api_keys WHERE key = 'your-api-key';"
```

### Performance Issues

#### Slow Database Queries
```sql
-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Check table sizes
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

#### Memory Issues
```bash
# Check memory usage
docker stats auth-service

# Check for memory leaks
docker-compose logs auth-service | grep -i memory
```

---

**Last Updated**: December 2024
**Service Version**: 1.0.0